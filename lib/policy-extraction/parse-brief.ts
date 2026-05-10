/**
 * Layer A — policy brief extraction.
 *
 * Reads a policy PDF from Supabase Storage, calls Claude with the
 * structured-output tool definition, validates the result, and writes
 * to policies.parsed_summary + policies.parsed_brief.
 *
 * Idempotent: safe to re-run on the same policy. parse_status
 * transitions: pending/failed -> parsing -> done/failed.
 *
 * Cost per call (claude-sonnet-4-6): roughly $0.05–$0.15 per policy
 * depending on PDF length. Token usage logged to policies row for
 * cost tracking.
 */

import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'node:crypto';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
  ParsedPolicySummarySchema,
  PARSE_BRIEF_TOOL_DEFINITION,
  SCHEMA_VERSION,
  type ParsedPolicySummary,
} from './brief-schema';

const PARSE_MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 4096;
const POLICY_DOCUMENTS_BUCKET = 'policy-documents';
const PDF_SIZE_LIMIT_BYTES = 32 * 1024 * 1024; // 32 MB

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a Singapore insurance policy parser for Espresso, an AI back-office tool for Financial Advisers (FAs).

Your job: read a policy document and extract structured information using the submit_policy_brief tool.

Critical rules:

1. **Never invent data.** If a field is not stated in the document, use null. Do not infer values from context, do not guess. FAs will rely on this output for client communications — wrong is worse than missing.

2. **Singapore Integrated Shield Plans (IS plans):** these have specific structural fields — Annual Deductible, Co-Insurance percent, Co-Insurance Cap, Annual Claim Limit, Lifetime Claim Limit. Extract all of these when regulatory_type is "is_plan". For non-IS policies, leave these as null.

3. **NRIC redaction:** if you see an NRIC, mask all but the last character (e.g. "SXXXXXXX-J"). Never output a full NRIC even if the document contains one.

4. **Money amounts:** extract as numbers, not strings. "$1,000,000" → 1000000. "S$ 3,500" → 3500. "USD 8,000" → 8000 with currency: "USD". If the document says "unlimited" for a claim limit, set the field to null and note "unlimited" in notes_on_money.

5. **Dates:** convert all dates to ISO YYYY-MM-DD format. "1 March 1995" → "1995-03-01". "15/03/2018" → "2018-03-15" (Singapore uses DD/MM/YYYY by convention). If only a year/month is given (e.g. "January 2024"), use the first day of that month and note the imprecision in notes_on_dates.

6. **Beneficiaries:** extract the actual nominee table. If the document states a "Trust Nomination" vs "Revocable Nomination" distinction, capture it in nomination_type — these have different legal effects under the Singapore Insurance Act.

7. **Notable exclusions:** pick the 5–10 exclusions most relevant to typical claims (pre-existing conditions, suicide clauses, war/terror, mental health caps, overseas treatment, experimental treatment). Summarize each in 1–2 sentences. Don't transcribe verbatim.

8. **Riders:** include all riders attached to the policy. If the document lists a rider with "—" or "Not attached", omit it from the array.

9. **FA review flags:** if the document contains any "FA note", "advisor review", or annotation suggesting the FA should follow up (e.g. "review unit allocation Q2"), capture it in fa_review_flags. Do not invent flags that aren't in the document.

10. **Extraction confidence:** be honest. "high" only if the PDF was clean and structured. "medium" if some fields had to be inferred from layout or were partially obscured. "low" for scanned, blurry, or fragmentary documents. List specific uncertain field names in fields_with_low_confidence.

Output: call the submit_policy_brief tool exactly once with your extraction.`;

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ParseBriefResult {
  ok: true;
  policyId: string;
  summary: ParsedPolicySummary;
  brief: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  model: string;
  schemaVersion: number;
  docHash: string;
  elapsedMs: number;
}

export interface ParseBriefError {
  ok: false;
  policyId: string;
  error: string;
  stage:
    | 'fetch_policy'
    | 'fetch_pdf'
    | 'pdf_too_large'
    | 'already_parsed'
    | 'in_progress'
    | 'claude_call'
    | 'validation'
    | 'persist';
  retryable: boolean;
}

const COST_PER_INPUT_TOKEN = 3 / 1_000_000;
const COST_PER_OUTPUT_TOKEN = 15 / 1_000_000;

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function parsePolicyBrief(
  policyId: string,
  options: { force?: boolean } = {},
): Promise<ParseBriefResult | ParseBriefError> {
  const supabase = createServiceRoleClient();

  // 1. Load policy
  const { data: policy, error: policyErr } = await supabase
    .from('policies')
    .select('id, fa_id, parse_status, parse_doc_hash, parse_attempt_count')
    .eq('id', policyId)
    .single();

  if (policyErr || !policy) {
    return {
      ok: false,
      policyId,
      stage: 'fetch_policy',
      error: `Policy not found: ${policyErr?.message ?? 'no row'}`,
      retryable: false,
    };
  }

  if (policy.parse_status === 'parsing') {
    return {
      ok: false,
      policyId,
      stage: 'in_progress',
      error: 'Already in progress',
      retryable: true,
    };
  }

  // 2. Most recent policy_documents row
  const { data: docs, error: docsErr } = await supabase
    .from('policy_documents')
    .select('file_path, file_name, file_size')
    .eq('policy_id', policyId)
    .order('uploaded_at', { ascending: false })
    .limit(1);

  if (docsErr || !docs || docs.length === 0) {
    return {
      ok: false,
      policyId,
      stage: 'fetch_pdf',
      error: 'No policy_documents row found for policy',
      retryable: false,
    };
  }

  const filePath = docs[0].file_path;
  const fileSize = docs[0].file_size ?? 0;

  if (fileSize > PDF_SIZE_LIMIT_BYTES) {
    return {
      ok: false,
      policyId,
      stage: 'pdf_too_large',
      error: `PDF size ${fileSize} exceeds ${PDF_SIZE_LIMIT_BYTES}`,
      retryable: false,
    };
  }

  // 3. Download PDF
  const { data: pdfBlob, error: dlErr } = await supabase.storage
    .from(POLICY_DOCUMENTS_BUCKET)
    .download(filePath);

  if (dlErr || !pdfBlob) {
    return {
      ok: false,
      policyId,
      stage: 'fetch_pdf',
      error: `Storage download failed: ${dlErr?.message ?? 'no data'}`,
      retryable: true,
    };
  }

  const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
  const docHash = createHash('sha256').update(pdfBuffer).digest('hex');

  if (
    !options.force &&
    policy.parse_status === 'done' &&
    policy.parse_doc_hash === docHash
  ) {
    return {
      ok: false,
      policyId,
      stage: 'already_parsed',
      error: 'Already parsed (doc_hash match) — pass force:true to re-parse',
      retryable: false,
    };
  }

  // 4. Mark parsing
  const nextAttempt = (policy.parse_attempt_count ?? 0) + 1;
  await supabase
    .from('policies')
    .update({
      parse_status: 'parsing',
      parse_attempt_count: nextAttempt,
      parse_last_error: null,
    })
    .eq('id', policyId);

  // 5. Call Claude
  const startedAt = Date.now();
  let response;
  try {
    response = await anthropic.messages.create({
      model: PARSE_MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools: [PARSE_BRIEF_TOOL_DEFINITION],
      tool_choice: { type: 'tool', name: 'submit_policy_brief' },
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
                'Extract the structured policy brief from this Singapore insurance ' +
                'policy document. Use the submit_policy_brief tool.',
            },
          ],
        },
      ],
    });
  } catch (err) {
    await markFailed(supabase, policyId, `Claude API error: ${(err as Error).message}`);
    return {
      ok: false,
      policyId,
      stage: 'claude_call',
      error: (err as Error).message,
      retryable: true,
    };
  }

  const elapsedMs = Date.now() - startedAt;

  const toolBlock = response.content.find(
    (block): block is Extract<typeof block, { type: 'tool_use' }> =>
      block.type === 'tool_use' && block.name === 'submit_policy_brief',
  );

  if (!toolBlock) {
    await markFailed(supabase, policyId, 'No tool_use block in response');
    return {
      ok: false,
      policyId,
      stage: 'claude_call',
      error: 'Claude did not call the submit_policy_brief tool',
      retryable: true,
    };
  }

  const parsed = ParsedPolicySummarySchema.safeParse(toolBlock.input);
  if (!parsed.success) {
    const issuesPreview = parsed.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    await markFailed(supabase, policyId, `Schema validation failed: ${issuesPreview}`);
    return {
      ok: false,
      policyId,
      stage: 'validation',
      error: `Schema validation failed: ${issuesPreview}`,
      retryable: true,
    };
  }

  const summary = parsed.data;
  const brief = renderBriefMarkdown(summary);

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const costUsd =
    inputTokens * COST_PER_INPUT_TOKEN + outputTokens * COST_PER_OUTPUT_TOKEN;

  const { error: persistErr } = await supabase
    .from('policies')
    .update({
      parsed_summary: summary,
      parsed_brief: brief,
      parse_status: 'done',
      parsed_at: new Date().toISOString(),
      parse_input_tokens: inputTokens,
      parse_output_tokens: outputTokens,
      parse_cost_usd: costUsd,
      parse_model: PARSE_MODEL,
      parse_doc_hash: docHash,
      parse_schema_version: SCHEMA_VERSION,
      parse_last_error: null,
    })
    .eq('id', policyId);

  if (persistErr) {
    return {
      ok: false,
      policyId,
      stage: 'persist',
      error: `DB write failed: ${persistErr.message}`,
      retryable: true,
    };
  }

  return {
    ok: true,
    policyId,
    summary,
    brief,
    inputTokens,
    outputTokens,
    costUsd,
    model: PARSE_MODEL,
    schemaVersion: SCHEMA_VERSION,
    docHash,
    elapsedMs,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function markFailed(
  supabase: ReturnType<typeof createServiceRoleClient>,
  policyId: string,
  error: string,
) {
  await supabase
    .from('policies')
    .update({
      parse_status: 'failed',
      parse_last_error: error.slice(0, 1000),
    })
    .eq('id', policyId);
}

export function renderBriefMarkdown(s: ParsedPolicySummary): string {
  const lines: string[] = [];

  lines.push(
    `# ${s.product_family ?? s.plan_name ?? 'Policy'} — ${s.insurer_name ?? 'Unknown insurer'}`,
  );
  lines.push('');

  if (s.policyholder_name) lines.push(`**Policyholder:** ${s.policyholder_name}`);
  if (s.insured_person_name && s.insured_person_name !== s.policyholder_name) {
    lines.push(`**Insured:** ${s.insured_person_name}`);
  }
  if (s.policy_number) lines.push(`**Policy #:** ${s.policy_number}`);
  if (s.plan_tier) lines.push(`**Tier:** ${s.plan_tier}`);
  lines.push(
    `**Type:** ${s.regulatory_type.replace(/_/g, ' ')}  |  **Status:** ${s.policy_status.replace(/_/g, ' ')}`,
  );
  lines.push('');

  lines.push('## Premiums & Cover');
  if (s.annual_premium != null) {
    lines.push(
      `- Annual premium: ${s.currency ?? ''} ${s.annual_premium.toLocaleString()}  (${s.premium_frequency.replace(/_/g, ' ')})`,
    );
  }
  if (s.sum_assured != null) {
    lines.push(`- Sum assured: ${s.currency ?? ''} ${s.sum_assured.toLocaleString()}`);
  }
  if (s.regulatory_type === 'is_plan') {
    if (s.annual_deductible != null)
      lines.push(`- Annual deductible: ${s.currency ?? ''} ${s.annual_deductible.toLocaleString()}`);
    if (s.co_insurance_percent != null) lines.push(`- Co-insurance: ${s.co_insurance_percent}%`);
    if (s.co_insurance_cap != null)
      lines.push(`- Co-insurance cap: ${s.currency ?? ''} ${s.co_insurance_cap.toLocaleString()}`);
    if (s.annual_claim_limit != null)
      lines.push(`- Annual claim limit: ${s.currency ?? ''} ${s.annual_claim_limit.toLocaleString()}`);
    if (s.lifetime_claim_limit != null) {
      lines.push(`- Lifetime claim limit: ${s.currency ?? ''} ${s.lifetime_claim_limit.toLocaleString()}`);
    } else if (s.notes_on_money?.toLowerCase().includes('unlimited')) {
      lines.push('- Lifetime claim limit: Unlimited');
    }
  }
  if (s.notes_on_money) lines.push(`- *Note:* ${s.notes_on_money}`);
  lines.push('');

  lines.push('## Key Dates');
  if (s.cover_start_date) lines.push(`- Cover started: ${s.cover_start_date}`);
  if (s.renewal_date) lines.push(`- Renewal: ${s.renewal_date}`);
  if (s.maturity_date) lines.push(`- Maturity: ${s.maturity_date}`);
  if (s.premium_cessation_date) lines.push(`- Premium cessation: ${s.premium_cessation_date}`);
  if (s.notes_on_dates) lines.push(`- *Note:* ${s.notes_on_dates}`);
  lines.push('');

  lines.push('## Coverage');
  const cov: string[] = [];
  if (s.death_benefit) cov.push('Death');
  if (s.terminal_illness_benefit) cov.push('Terminal Illness');
  if (s.tpd_benefit) cov.push('TPD');
  if (s.ci_coverage) {
    const stages: string[] = [];
    if (s.ci_coverage.early_stage) stages.push('early');
    if (s.ci_coverage.intermediate_stage) stages.push('intermediate');
    if (s.ci_coverage.severe_stage) stages.push('severe');
    if (stages.length) {
      cov.push(
        `CI (${stages.join(', ')}${s.ci_coverage.total_conditions_covered ? `, ${s.ci_coverage.total_conditions_covered} conditions` : ''})`,
      );
    }
  }
  if (cov.length) lines.push(`- Covered: ${cov.join(', ')}`);
  if (s.riders_attached.length) {
    lines.push('- Riders:');
    for (const r of s.riders_attached) {
      lines.push(
        `  - ${r.name}${r.annual_premium != null ? ` (${r.annual_premium}/yr)` : ''}${r.effect_summary ? ` — ${r.effect_summary}` : ''}`,
      );
    }
  }
  if (s.notes_on_coverage) lines.push(`- *Note:* ${s.notes_on_coverage}`);
  lines.push('');

  if (s.beneficiaries.length) {
    lines.push('## Beneficiaries');
    lines.push(`*Nomination type:* ${s.nomination_type.replace(/_/g, ' ')}`);
    for (const b of s.beneficiaries) {
      lines.push(
        `- ${b.name}${b.relationship ? ` (${b.relationship})` : ''}${b.share_percent != null ? ` — ${b.share_percent}%` : ''}`,
      );
    }
    lines.push('');
  }

  if (s.notable_exclusions.length) {
    lines.push('## Notable Exclusions');
    for (const e of s.notable_exclusions) lines.push(`- ${e}`);
    if (s.pre_existing_excluded) {
      lines.push('- Pre-existing conditions excluded unless declared and accepted');
    }
    lines.push('');
  }

  if (s.fa_review_flags.length) {
    lines.push('## FA Review Flags');
    for (const f of s.fa_review_flags) lines.push(`- ${f}`);
    lines.push('');
  }

  lines.push('---');
  lines.push(
    `*Extracted with ${s.extraction_confidence} confidence${s.fields_with_low_confidence.length ? `; uncertain: ${s.fields_with_low_confidence.join(', ')}` : ''}.*`,
  );

  return lines.join('\n');
}
