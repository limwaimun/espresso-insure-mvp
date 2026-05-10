/**
 * Layer B — section index extraction.
 *
 * Reads a policy PDF from Supabase Storage, calls Claude with the
 * section-index tool definition, validates the result, and writes
 * rows to policy_sections (text_content + token_count left null;
 * Layer C populates those during chunking).
 *
 * Idempotent: counts existing policy_sections rows. If any exist
 * and !force, skips. With force=true, deletes existing rows then
 * inserts fresh.
 *
 * Cost per call (claude-haiku-4-5): roughly $0.10–$0.15 per policy
 * (most cost is input — re-reading the PDF). Output is small (~500
 * tokens for a 10-section index).
 */

import Anthropic from '@anthropic-ai/sdk'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  PolicySectionsSchema,
  PARSE_SECTIONS_TOOL_DEFINITION,
  SECTIONS_SCHEMA_VERSION,
  type PolicySectionsResult,
  type SectionEntry,
} from './sections-schema'

const PARSE_MODEL = 'claude-haiku-4-5'
const MAX_TOKENS = 2048
const POLICY_DOCUMENTS_BUCKET = 'policy-documents'
const PDF_SIZE_LIMIT_BYTES = 32 * 1024 * 1024

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are scanning a Singapore insurance policy document to identify its structural sections.

Your job: produce a section index — a list of section_kind classifications with their page ranges. Use the submit_policy_sections tool.

For each major section in the document:

1. Classify into one of these section_kind values:
   - schedule: Policy Schedule, Cover Page Schedule (the "policy facts" page)
   - definitions: Definitions and Interpretation
   - summary: Summary of Cover, Plan Summary, Key Features
   - benefits: Benefits, Schedule of Benefits, What is Covered
   - surgical_schedule: Surgical Schedule, TOSP Categories (specific to IS plans / health insurance)
   - exclusions: General Exclusions, Specific Exclusions, What is Not Covered
   - premiums: Premiums, Premium Payment, Renewal Premiums
   - claims: How to Claim, Claims Procedure, Claim Forms
   - conditions: General Conditions, Policy Conditions, Terms and Conditions
   - free_look: Free Look Period, Cooling-off, Cancellation Right
   - termination: Termination, Surrender, Lapse, End of Cover
   - signatures: Signature page, Authorisation block
   - cover: Cover page (the very first decorative page, before content)
   - welcome: Welcome letter, Introductory letter from insurer
   - toc: Table of Contents
   - other: Use ONLY if no specific category fits. Common 'other' cases: nominations/beneficiaries, regulatory disclosures (MAS, MOH), contact info, glossary supplements.

2. Capture section_label as it appears in the document (e.g. "Section 3 — Definitions and Interpretation"). If no heading text is visible, set to null.

3. Capture page_start and page_end based on the document's actual page numbering. Page numbers in headers/footers are preferred; if absent, count from page 1 of the PDF.

4. Aim for 5–15 total sections per policy. Don't over-fragment.

5. If a section spans non-contiguous pages (e.g. interrupted by appendix), create separate entries.

6. The same section_kind can appear multiple times (e.g. two 'benefits' sections — one inpatient, one outpatient).

7. Be conservative on coverage. If you're unsure whether a region is its own section or part of an adjacent one, default to keeping it merged.

Don't extract section content. Only the index.

Output: call submit_policy_sections exactly once.`

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ParseSectionsResult {
  ok: true
  policyId: string
  sections: SectionEntry[]
  sectionsCount: number
  extractionConfidence: 'low' | 'medium' | 'high'
  notesOnStructure: string | null
  inputTokens: number
  outputTokens: number
  costUsd: number
  model: string
  schemaVersion: number
  elapsedMs: number
  forced: boolean
}

export interface ParseSectionsError {
  ok: false
  policyId: string
  error: string
  stage:
    | 'fetch_policy'
    | 'fetch_pdf'
    | 'pdf_too_large'
    | 'already_parsed'
    | 'claude_call'
    | 'validation'
    | 'persist'
  retryable: boolean
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

const COST_PER_INPUT_TOKEN = 1 / 1_000_000
const COST_PER_OUTPUT_TOKEN = 5 / 1_000_000

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function parsePolicySections(
  policyId: string,
  options: { force?: boolean } = {},
): Promise<ParseSectionsResult | ParseSectionsError> {
  const supabase = createServiceRoleClient()

  // 1. Load policy + verify it exists
  const { data: policy, error: policyErr } = await supabase
    .from('policies')
    .select('id, fa_id')
    .eq('id', policyId)
    .single()

  if (policyErr || !policy) {
    return {
      ok: false,
      policyId,
      stage: 'fetch_policy',
      error: `Policy not found: ${policyErr?.message ?? 'no row'}`,
      retryable: false,
    }
  }

  // 2. Idempotency check — count existing sections rows
  const { count: existingCount, error: countErr } = await supabase
    .from('policy_sections')
    .select('id', { count: 'exact', head: true })
    .eq('policy_id', policyId)

  if (countErr) {
    return {
      ok: false,
      policyId,
      stage: 'fetch_policy',
      error: `Could not count existing sections: ${countErr.message}`,
      retryable: true,
    }
  }

  if ((existingCount ?? 0) > 0 && !options.force) {
    return {
      ok: false,
      policyId,
      stage: 'already_parsed',
      error: `Sections already extracted (${existingCount} rows). Pass force:true to re-parse.`,
      retryable: false,
    }
  }

  // 3. Fetch the most recent policy_documents row
  const { data: docs, error: docsErr } = await supabase
    .from('policy_documents')
    .select('file_path, file_name, file_size')
    .eq('policy_id', policyId)
    .order('uploaded_at', { ascending: false })
    .limit(1)

  if (docsErr || !docs || docs.length === 0) {
    return {
      ok: false,
      policyId,
      stage: 'fetch_pdf',
      error: 'No policy_documents row found for policy',
      retryable: false,
    }
  }

  const filePath = docs[0].file_path
  const fileSize = docs[0].file_size ?? 0

  if (fileSize > PDF_SIZE_LIMIT_BYTES) {
    return {
      ok: false,
      policyId,
      stage: 'pdf_too_large',
      error: `PDF size ${fileSize} exceeds ${PDF_SIZE_LIMIT_BYTES}`,
      retryable: false,
    }
  }

  // 4. Download PDF
  const { data: pdfBlob, error: dlErr } = await supabase.storage
    .from(POLICY_DOCUMENTS_BUCKET)
    .download(filePath)

  if (dlErr || !pdfBlob) {
    return {
      ok: false,
      policyId,
      stage: 'fetch_pdf',
      error: `Storage download failed: ${dlErr?.message ?? 'no data'}`,
      retryable: true,
    }
  }

  const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer())

  // 5. Call Claude
  const startedAt = Date.now()
  let response
  try {
    response = await anthropic.messages.create({
      model: PARSE_MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools: [PARSE_SECTIONS_TOOL_DEFINITION],
      tool_choice: { type: 'tool', name: 'submit_policy_sections' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBuffer.toString('base64'),
              },
            },
            {
              type: 'text',
              text:
                'Identify the structural sections of this Singapore insurance policy ' +
                'document. Use the submit_policy_sections tool.',
            },
          ],
        },
      ],
    })
  } catch (err) {
    return {
      ok: false,
      policyId,
      stage: 'claude_call',
      error: `Claude API error: ${(err as Error).message}`,
      retryable: true,
    }
  }

  const elapsedMs = Date.now() - startedAt

  // 6. Extract tool use
  const toolBlock = response.content.find(
    (block): block is Extract<typeof block, { type: 'tool_use' }> =>
      block.type === 'tool_use' && block.name === 'submit_policy_sections',
  )

  if (!toolBlock) {
    return {
      ok: false,
      policyId,
      stage: 'claude_call',
      error: 'Claude did not call the submit_policy_sections tool',
      retryable: true,
    }
  }

  // 7. Validate
  const parsed = PolicySectionsSchema.safeParse(toolBlock.input)
  if (!parsed.success) {
    const issuesPreview = parsed.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
    return {
      ok: false,
      policyId,
      stage: 'validation',
      error: `Schema validation failed: ${issuesPreview}`,
      retryable: true,
    }
  }

  const result: PolicySectionsResult = parsed.data

  // 8. Compute cost
  const inputTokens = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens
  const costUsd =
    inputTokens * COST_PER_INPUT_TOKEN + outputTokens * COST_PER_OUTPUT_TOKEN

  // 9. Persist — delete-then-insert pattern for force re-parse
  if (options.force && (existingCount ?? 0) > 0) {
    const { error: delErr } = await supabase
      .from('policy_sections')
      .delete()
      .eq('policy_id', policyId)

    if (delErr) {
      return {
        ok: false,
        policyId,
        stage: 'persist',
        error: `Failed to clear existing sections: ${delErr.message}`,
        retryable: true,
      }
    }
  }

  const rowsToInsert = result.sections.map((s) => ({
    policy_id: policyId,
    fa_id: policy.fa_id,
    section_kind: s.section_kind,
    section_label: s.section_label ?? null,
    page_start: s.page_start ?? null,
    page_end: s.page_end ?? null,
  }))

  const { error: insertErr } = await supabase
    .from('policy_sections')
    .insert(rowsToInsert)

  if (insertErr) {
    return {
      ok: false,
      policyId,
      stage: 'persist',
      error: `DB insert failed: ${insertErr.message}`,
      retryable: true,
    }
  }

  return {
    ok: true,
    policyId,
    sections: result.sections,
    sectionsCount: result.sections.length,
    extractionConfidence: result.extraction_confidence,
    notesOnStructure: result.notes_on_structure ?? null,
    inputTokens,
    outputTokens,
    costUsd,
    model: PARSE_MODEL,
    schemaVersion: SECTIONS_SCHEMA_VERSION,
    elapsedMs,
    forced: !!options.force,
  }
}
