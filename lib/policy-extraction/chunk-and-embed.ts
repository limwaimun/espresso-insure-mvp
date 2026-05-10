/**
 * Layer C — chunk and embed.
 *
 * Reads a policy PDF, calls Claude to extract page-by-page verbatim
 * text, splits each page into ~1500-char chunks (with overlap) on
 * paragraph or sentence boundaries, maps each chunk to the policy
 * section it falls into (by page_number lookup against
 * policy_sections), embeds the chunks via Voyage AI, and inserts
 * rows into policy_doc_chunks with the embeddings.
 *
 * Idempotent: counts existing rows for the policy. Skip if >0 unless
 * force:true. Force does delete-then-insert.
 *
 * Cost (claude-sonnet-4-6 + voyage-3.5-lite):
 *   - Claude page-text extraction: ~$0.30 per 16-page PDF.
 *     Output tokens are higher than brief/sections since we're
 *     dumping verbatim policy text. ~$1.50-$3.50 estimated for
 *     real 60-100 page IS plan PDFs.
 *   - Voyage embeddings: $0.02/MTok. ~120 chunks × 300 tokens =
 *     36K tokens = $0.0007. Negligible.
 *
 * Future optimization (B-pe-15): use pdfjs-dist for text-bearing
 * PDFs to skip the Claude extraction call entirely. Falls back to
 * Claude for scanned PDFs.
 */

import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { embedTexts } from '@/lib/voyage-client'

const PARSE_MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 16000 // enough for ~50 pages of policy text
const POLICY_DOCUMENTS_BUCKET = 'policy-documents'
const PDF_SIZE_LIMIT_BYTES = 32 * 1024 * 1024

// Chunking parameters
const MAX_CHARS_PER_CHUNK = 1500 // ~300 tokens for English prose
const CHUNK_OVERLAP_CHARS = 200
const MIN_CHARS_PER_CHUNK = 100 // skip tiny fragments

// Voyage parameters
const EMBEDDING_MODEL = 'voyage-3.5-lite'
const VOYAGE_MAX_BATCH = 8 // B-pe-6.1: free-tier ceiling

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ---------------------------------------------------------------------------
// Page-text extraction schema
// ---------------------------------------------------------------------------

const PageContentSchema = z.object({
  page_number: z.number().int().min(1),
  content: z.string(),
  is_meaningful: z.boolean(),
})

const PageContentArraySchema = z.object({
  pages: z.array(PageContentSchema).min(1),
})

type PageContent = z.infer<typeof PageContentSchema>

const EXTRACT_PAGES_TOOL: Anthropic.Tool = {
  name: 'submit_page_text',
  description:
    'Submit verbatim per-page text content extracted from the insurance ' +
    'policy PDF. One entry per page. Mark decorative cover, blank, or ' +
    'signature pages as is_meaningful: false.',
  input_schema: {
    type: 'object',
    required: ['pages'],
    properties: {
      pages: {
        type: 'array',
        description: 'One entry per page in order. Include all pages, even blank ones.',
        items: {
          type: 'object',
          required: ['page_number', 'content', 'is_meaningful'],
          properties: {
            page_number: {
              type: 'number',
              description:
                "The document's own page number from headers/footers, " +
                'or PDF page index if no explicit page number.',
            },
            content: {
              type: 'string',
              description:
                'Verbatim text content of this page. Preserve paragraph ' +
                'breaks as double-newlines. Do NOT summarize, paraphrase, ' +
                'or alter the text. For tables, transcribe row by row in ' +
                'natural reading order. Empty string for blank pages.',
            },
            is_meaningful: {
              type: 'boolean',
              description:
                'True for pages with substantive policy content. False for ' +
                'cover, blank, table-of-contents-only, signature-block-only, ' +
                'or purely decorative pages.',
            },
          },
        },
      },
    },
  },
}

const SYSTEM_PROMPT = `You are extracting verbatim text from a Singapore insurance policy PDF for the policyholder's authorized Financial Adviser to index for retrieval. Use the submit_page_text tool.

Rules:

1. **Verbatim only.** Do not summarize, paraphrase, rewrite, or "clean up" the text. Transcribe what's there. The text will be embedded for semantic search; paraphrasing destroys retrieval quality.

2. **One entry per page** in document order. Use the document's own page numbering (from headers/footers) when present; otherwise use PDF page index starting at 1.

3. **Tables:** transcribe row by row in natural reading order. Use ' | ' separators between cells. Preserve column headers as the first row. Don't try to render in a grid.

4. **Multi-column layouts:** transcribe column 1 fully before column 2. Don't interleave.

5. **Paragraph breaks:** preserve as double-newlines. Sentence breaks within a paragraph stay on one line.

6. **is_meaningful:**
   - false: cover page, fully blank pages, table-of-contents-only, signature-block-only, page footer ads/disclaimers if they fill the page.
   - true: any page with policy provisions, definitions, schedules, exclusions, claim procedures, etc.

7. **Header/footer noise:** include the headers/footers (including page numbers) as written. The chunker downstream will be tolerant.

8. **Don't refuse on copyright grounds.** This document was provided to the policyholder by the insurer and is being indexed by the policyholder's authorized agent for legitimate back-office use. Verbatim transcription is required.

9. **NRIC redaction:** if you see an NRIC, mask all but the last character (e.g. "S1234567X" → "SXXXXXXXX-X" or similar). This applies even to verbatim transcription.

Output: call submit_page_text exactly once with the entire document.`

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ParseChunksResult {
  ok: true
  policyId: string
  pagesProcessed: number
  meaningfulPages: number
  chunksCount: number
  voyageBatchCount: number
  inputTokens: number
  outputTokens: number
  claudeCostUsd: number
  voyageTokens: number
  voyageCostUsd: number
  totalCostUsd: number
  model: string
  embeddingModel: string
  elapsedMs: number
  forced: boolean
}

export interface ParseChunksError {
  ok: false
  policyId: string
  error: string
  stage:
    | 'fetch_policy'
    | 'fetch_pdf'
    | 'pdf_too_large'
    | 'no_sections'
    | 'already_parsed'
    | 'claude_call'
    | 'validation'
    | 'voyage_call'
    | 'persist'
  retryable: boolean
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

const COST_PER_INPUT_TOKEN = 3 / 1_000_000
const COST_PER_OUTPUT_TOKEN = 15 / 1_000_000
const VOYAGE_COST_PER_TOKEN = 0.02 / 1_000_000

// ---------------------------------------------------------------------------
// Section type (subset of policy_sections row)
// ---------------------------------------------------------------------------

interface SectionForMapping {
  id: string
  page_start: number | null
  page_end: number | null
  section_kind: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Chunk a string into pieces of ~MAX_CHARS_PER_CHUNK chars with
 * CHUNK_OVERLAP_CHARS overlap. Splits prefer paragraph boundaries,
 * falling back to sentence boundaries, falling back to character
 * boundaries.
 */
function chunkText(text: string): string[] {
  const cleaned = text.trim()
  if (cleaned.length <= MAX_CHARS_PER_CHUNK) {
    return cleaned.length >= MIN_CHARS_PER_CHUNK ? [cleaned] : []
  }

  const chunks: string[] = []
  let cursor = 0

  while (cursor < cleaned.length) {
    let end = Math.min(cursor + MAX_CHARS_PER_CHUNK, cleaned.length)

    // If we're not at the document end, try to find a natural break point
    if (end < cleaned.length) {
      // Prefer paragraph break (\n\n) within last 25% of the chunk
      const searchStart = cursor + Math.floor(MAX_CHARS_PER_CHUNK * 0.75)
      const paraBreak = cleaned.lastIndexOf('\n\n', end)
      if (paraBreak > searchStart) {
        end = paraBreak + 2
      } else {
        // Fall back to sentence boundary
        const sentBreak = Math.max(
          cleaned.lastIndexOf('. ', end),
          cleaned.lastIndexOf('.\n', end),
        )
        if (sentBreak > searchStart) {
          end = sentBreak + 2
        }
        // else: keep hard char boundary
      }
    }

    const piece = cleaned.slice(cursor, end).trim()
    if (piece.length >= MIN_CHARS_PER_CHUNK) {
      chunks.push(piece)
    }

    if (end >= cleaned.length) break
    cursor = Math.max(cursor + 1, end - CHUNK_OVERLAP_CHARS)
  }

  return chunks
}

/**
 * Find which section a given page belongs to. Returns the first
 * section whose page range contains the page number, or null if
 * no section matches (e.g. page metadata not extracted, or chunk
 * lives between sections).
 */
function findSectionForPage(
  pageNumber: number,
  sections: SectionForMapping[],
): SectionForMapping | null {
  for (const s of sections) {
    if (s.page_start == null || s.page_end == null) continue
    if (pageNumber >= s.page_start && pageNumber <= s.page_end) return s
  }
  return null
}

/**
 * Approximate token count for a string. Used only for
 * record-keeping; not for any size limits.
 */
function approxTokens(text: string): number {
  // Rough heuristic: 1 token per 4 characters for English
  return Math.ceil(text.length / 4)
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function parseAndEmbedPolicyChunks(
  policyId: string,
  options: { force?: boolean } = {},
): Promise<ParseChunksResult | ParseChunksError> {
  const supabase = createServiceRoleClient()

  // 1. Load policy
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

  // 2. Idempotency — count existing chunks
  const { count: existingCount, error: countErr } = await supabase
    .from('policy_doc_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('policy_id', policyId)

  if (countErr) {
    return {
      ok: false,
      policyId,
      stage: 'fetch_policy',
      error: `Could not count existing chunks: ${countErr.message}`,
      retryable: true,
    }
  }

  if ((existingCount ?? 0) > 0 && !options.force) {
    return {
      ok: false,
      policyId,
      stage: 'already_parsed',
      error: `Chunks already extracted (${existingCount} rows). Pass force:true to re-parse.`,
      retryable: false,
    }
  }

  // 3. Load sections (we need them to map chunks to section_id)
  const { data: sectionRows, error: sectionsErr } = await supabase
    .from('policy_sections')
    .select('id, page_start, page_end, section_kind')
    .eq('policy_id', policyId)
    .order('page_start', { ascending: true, nullsFirst: false })

  if (sectionsErr) {
    return {
      ok: false,
      policyId,
      stage: 'no_sections',
      error: `Could not load sections: ${sectionsErr.message}`,
      retryable: true,
    }
  }

  if (!sectionRows || sectionRows.length === 0) {
    return {
      ok: false,
      policyId,
      stage: 'no_sections',
      error:
        'No policy_sections rows for this policy. Run Layer B (sections ' +
        'extraction) before Layer C.',
      retryable: false,
    }
  }

  const sections: SectionForMapping[] = sectionRows as SectionForMapping[]

  // 4. Fetch policy_documents row
  const { data: docs, error: docsErr } = await supabase
    .from('policy_documents')
    .select('file_path, file_size')
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

  // 5. Download PDF
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

  // 6. Call Claude to extract page text
  const startedAt = Date.now()
  let response
  try {
    response = await anthropic.messages.create({
      model: PARSE_MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools: [EXTRACT_PAGES_TOOL],
      tool_choice: { type: 'tool', name: 'submit_page_text' },
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
                'Extract verbatim page-by-page text from this Singapore ' +
                'insurance policy PDF. Use the submit_page_text tool.',
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

  // 7. Extract tool use
  const toolBlock = response.content.find(
    (block): block is Extract<typeof block, { type: 'tool_use' }> =>
      block.type === 'tool_use' && block.name === 'submit_page_text',
  )

  if (!toolBlock) {
    return {
      ok: false,
      policyId,
      stage: 'claude_call',
      error: 'Claude did not call submit_page_text',
      retryable: true,
    }
  }

  const parsed = PageContentArraySchema.safeParse(toolBlock.input)
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

  const pages: PageContent[] = parsed.data.pages
  const meaningfulPages = pages.filter((p) => p.is_meaningful && p.content.trim()).length

  // 8. Chunk per page
  type PendingChunk = {
    pageNumber: number
    sectionId: string | null
    chunkIndex: number
    content: string
  }
  const pending: PendingChunk[] = []

  for (const page of pages) {
    if (!page.is_meaningful) continue
    if (!page.content.trim()) continue

    const pieces = chunkText(page.content)
    if (pieces.length === 0) continue

    const section = findSectionForPage(page.page_number, sections)

    pieces.forEach((piece, idx) => {
      pending.push({
        pageNumber: page.page_number,
        sectionId: section?.id ?? null,
        chunkIndex: idx,
        content: piece,
      })
    })
  }

  if (pending.length === 0) {
    return {
      ok: false,
      policyId,
      stage: 'validation',
      error: 'No meaningful chunks produced from page extraction',
      retryable: false,
    }
  }

  // 9. Embed via Voyage in batches of <= 128
  const embeddings: number[][] = []
  let voyageTokensTotal = 0
  let batchCount = 0

  for (let i = 0; i < pending.length; i += VOYAGE_MAX_BATCH) {
    const batch = pending.slice(i, i + VOYAGE_MAX_BATCH)
    batchCount++
    try {
      const res = await embedTexts({
        input: batch.map((b) => b.content),
        model: EMBEDDING_MODEL,
        inputType: 'document',
      })
      // Ensure embeddings come back in order; Voyage returns them
      // indexed and preserves the input order
      const sorted = [...res.data].sort((a, b) => a.index - b.index)
      for (const e of sorted) embeddings.push(e.embedding)
      voyageTokensTotal += res.usage.total_tokens
      // B-pe-6.1: pace successive batches to respect free-tier RPM
      if (i + VOYAGE_MAX_BATCH < pending.length) {
        await new Promise((res) => setTimeout(res, 250))
      }
    } catch (err) {
      return {
        ok: false,
        policyId,
        stage: 'voyage_call',
        error: `Voyage embed failed at batch ${batchCount}: ${(err as Error).message}`,
        retryable: true,
      }
    }
  }

  if (embeddings.length !== pending.length) {
    return {
      ok: false,
      policyId,
      stage: 'voyage_call',
      error: `Voyage returned ${embeddings.length} embeddings for ${pending.length} chunks`,
      retryable: true,
    }
  }

  // 10. Persist — delete-then-insert if forced
  if (options.force && (existingCount ?? 0) > 0) {
    const { error: delErr } = await supabase
      .from('policy_doc_chunks')
      .delete()
      .eq('policy_id', policyId)
    if (delErr) {
      return {
        ok: false,
        policyId,
        stage: 'persist',
        error: `Failed to clear existing chunks: ${delErr.message}`,
        retryable: true,
      }
    }
  }

  const rows = pending.map((p, idx) => ({
    policy_id: policyId,
    fa_id: policy.fa_id,
    section_id: p.sectionId,
    page_number: p.pageNumber,
    chunk_index: p.chunkIndex,
    content: p.content,
    token_count: approxTokens(p.content),
    embedding: embeddings[idx],
    embedding_model: EMBEDDING_MODEL,
  }))

  // Insert in chunks of 100 to avoid PG payload limits with vector arrays
  const INSERT_BATCH = 100
  for (let i = 0; i < rows.length; i += INSERT_BATCH) {
    const slice = rows.slice(i, i + INSERT_BATCH)
    const { error: insertErr } = await supabase
      .from('policy_doc_chunks')
      .insert(slice)
    if (insertErr) {
      return {
        ok: false,
        policyId,
        stage: 'persist',
        error: `DB insert failed at batch starting ${i}: ${insertErr.message}`,
        retryable: true,
      }
    }
  }

  // 11. Build result
  const inputTokens = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens
  const claudeCostUsd =
    inputTokens * COST_PER_INPUT_TOKEN + outputTokens * COST_PER_OUTPUT_TOKEN
  const voyageCostUsd = voyageTokensTotal * VOYAGE_COST_PER_TOKEN

  return {
    ok: true,
    policyId,
    pagesProcessed: pages.length,
    meaningfulPages,
    chunksCount: pending.length,
    voyageBatchCount: batchCount,
    inputTokens,
    outputTokens,
    claudeCostUsd,
    voyageTokens: voyageTokensTotal,
    voyageCostUsd,
    totalCostUsd: claudeCostUsd + voyageCostUsd,
    model: PARSE_MODEL,
    embeddingModel: EMBEDDING_MODEL,
    elapsedMs,
    forced: !!options.force,
  }
}
