/**
 * Brief — factual policy-lookup agent.
 * ─────────────────────────────────────
 * Single-purpose agent that answers FACTUAL questions about a client's
 * existing policies by reading policies.parsed_summary (Layer A of the
 * policy parsing pipeline).
 *
 * Not the same as Compass — Compass does MARKET comparison ("which insurer
 * has the best cancer cover at this price point"), Brief does POLICY
 * lookup ("what does THIS client's existing policy say about cancer").
 *
 * Future-grow path (not in this version):
 *   - Read policy_sections (Layer B) for specific clauses by page
 *   - RAG-retrieve from policy_doc_chunks (Layer C) for arbitrary text lookups
 *
 * Called via Relay (intent: policy_lookup). Dual-auth like Compass — accepts
 * session OR x-relay-key. Always re-queries with userId scope, never trusts
 * pre-loaded data from upstream callers.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { authenticateAgentRequest } from '@/lib/agent-auth'
import { logAgentInvocation } from '@/lib/agent-log'
import { checkRateLimit } from '@/lib/agent-rate-limit'
import { resolveAgentModel } from '@/lib/agent-model'
import type { ParsedPolicySummary } from '@/lib/policy-extraction/brief-schema'

export const runtime = 'nodejs'
export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

interface PolicyRow {
  id: string
  client_id: string
  fa_id: string
  insurer: string | null
  type: string | null
  premium: number | null
  renewal_date: string | null
  status: string | null
  policy_number: string | null
  product_name: string | null
  sum_assured: number | null
  parsed_summary: ParsedPolicySummary | null
}

interface ClientRow {
  id: string
  name: string
  type: string
  tier: string
  birthday: string | null
  company: string | null
}

interface BriefRequestBody {
  faId?: string         // accepted for backward-compat; ignored — we use auth.userId
  clientId?: string     // load all policies for this client
  policyId?: string     // OR load just this specific policy
  query: string         // the question to answer
}

interface BriefAnalysis {
  answer: string
  policy_facts_used?: string[]
  confidence?: 'definite' | 'implied' | 'unknown'
  caveats?: string | null
  needs_other_agent?: string | null
}

export async function POST(request: NextRequest) {
  const start = Date.now()

  try {
    // ── Auth (accept session OR relay-internal) ─────────────────────────────
    const auth = await authenticateAgentRequest(request)
    if (!auth.ok) {
      await logAgentInvocation({
        agent: 'brief',
        userId: null,
        source: null,
        outcome: 'unauthorized',
        statusCode: auth.status,
        latencyMs: Date.now() - start,
      })
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const userId = auth.userId

    // ── Rate limit ───────────────────────────────────────────────────────────
    const rl = checkRateLimit(userId, 'brief')
    if (!rl.allowed) {
      await logAgentInvocation({
        agent: 'brief',
        userId,
        source: auth.source,
        outcome: 'rate_limited',
        statusCode: 429,
        latencyMs: Date.now() - start,
      })
      return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
    }

    // ── Parse body ───────────────────────────────────────────────────────────
    const body = (await request.json()) as BriefRequestBody
    const { faId: _unused, clientId, policyId, query } = body

    if (_unused && _unused !== userId) {
      console.warn(`[brief] ignored mismatched faId: body=${_unused} verified=${userId}`)
    }

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 })
    }
    if (!clientId && !policyId) {
      return NextResponse.json({ error: 'Need either clientId or policyId' }, { status: 400 })
    }

    // ── Load policies, scoped to verified userId ────────────────────────────
    // SECURITY: ignore any pre-loaded data; re-query with ownership check.
    // Same defense pattern as Compass.
    let policies: PolicyRow[] = []

    if (policyId) {
      const { data } = await supabase
        .from('policies')
        .select('*')
        .eq('id', policyId)
        .eq('fa_id', userId)
      policies = (data as PolicyRow[]) || []
    } else if (clientId) {
      const { data } = await supabase
        .from('policies')
        .select('*')
        .eq('client_id', clientId)
        .eq('fa_id', userId)
      policies = (data as PolicyRow[]) || []
    }

    if (policies.length === 0) {
      await logAgentInvocation({
        agent: 'brief',
        userId,
        source: auth.source,
        outcome: 'ok',
        statusCode: 200,
        latencyMs: Date.now() - start,
        metadata: { clientId, policyId, policyCount: 0, noPolicies: true },
      })
      return NextResponse.json({
        success: true,
        agent: 'brief',
        no_policies: true,
        mayaSummary: 'No policies on record for this client.',
        analysis: {
          answer: 'No policies on record for this client.',
          confidence: 'definite' as const,
          caveats: null,
          needs_other_agent: null,
        },
      })
    }

    // ── Load client for context (optional, only if clientId given) ──────────
    let clientData: ClientRow | null = null
    if (clientId) {
      const { data } = await supabase
        .from('clients')
        .select('id, name, type, tier, birthday, company')
        .eq('id', clientId)
        .eq('fa_id', userId)
        .single()
      clientData = data as ClientRow | null
    }

    // ── Detect how much parse data we actually have ─────────────────────────
    const parsedCount = policies.filter(p => p.parsed_summary != null).length
    const unparsedCount = policies.length - parsedCount

    // ── Build the briefing block for the LLM ────────────────────────────────
    const policyBriefs = policies.map(p => formatPolicyBrief(p)).join('\n\n---\n\n')

    // ── System prompt ────────────────────────────────────────────────────────
    const systemPrompt = `You are Brief, a Singapore insurance policy expert. Your single job is to answer factual questions about a CLIENT'S OWN EXISTING POLICIES by reading the structured policy data provided to you.

You are NOT a recommendation engine. You are NOT a market comparison engine. You report what the policies say, with citations and confidence.

RULES:
1. NEVER make up numbers, conditions, dates, or coverage details that are not present in the policy data. If something isn't in the data, say so.
2. Always include a confidence level:
   - "definite": the data clearly shows this
   - "implied": reasonable inference from the data (e.g. an IS plan covers hospitalization even if not stated literally)
   - "unknown": the data doesn't address this question
3. Currency is SGD unless explicitly stated otherwise.
4. This is FACTUAL REPORTING. Do not give advice, do not recommend changes, do not warn about gaps (Compass does that). Just answer the question.
5. If the question asks about something this data can't answer (e.g. specific hospital networks, claim filing procedure, comparing to other insurers), say so and suggest which other agent could help:
   - For claim filing → Atlas
   - For comparing to other insurers / coverage gaps → Compass
   - For premium estimates on new coverage → Sage
6. Be concise. The answer goes into a WhatsApp conversation, so 1-4 sentences usually. Use specific numbers where possible.
7. If the extraction_confidence on a policy is "low" or "medium", mention that caveat in your answer.`

    // ── User prompt ──────────────────────────────────────────────────────────
    const clientHeader = clientData
      ? `CLIENT: ${clientData.name} (${clientData.type}/${clientData.tier})${clientData.company ? ` — ${clientData.company}` : ''}`
      : `POLICY ID: ${policyId}`

    const parseStatusNote =
      unparsedCount > 0
        ? `\n\nNOTE: ${unparsedCount} of ${policies.length} polic${policies.length === 1 ? 'y has' : 'ies have'} not been fully parsed yet. Only basic columns are available for those.`
        : ''

    const userPrompt = `${clientHeader}

POLICIES ON FILE:
${policyBriefs}${parseStatusNote}

QUESTION (asked by Maya on behalf of the client or FA):
${query}

Answer the question using ONLY the policy data above. Respond as JSON:
{
  "answer": "the substantive answer in natural language, 1-4 sentences",
  "policy_facts_used": ["each specific fact you cited, with the value"],
  "confidence": "definite" | "implied" | "unknown",
  "caveats": "any caveats Maya should know, or null",
  "needs_other_agent": "name of another agent who could answer the unanswered part, or null"
}`

    const response = await anthropic.messages.create({
      model: resolveAgentModel('brief'),
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const rawText = response.content.find(b => b.type === 'text')?.text || ''

    let analysis: BriefAnalysis
    try {
      const clean = rawText.replace(/```json|```/g, '').trim()
      analysis = JSON.parse(clean) as BriefAnalysis
      if (!analysis.answer) analysis.answer = rawText
    } catch {
      analysis = {
        answer: rawText,
        confidence: 'unknown',
        caveats: 'Brief failed to produce structured output; raw text returned.',
        needs_other_agent: null,
      }
    }

    const mayaSummary = analysis.answer

    await logAgentInvocation({
      agent: 'brief',
      userId,
      source: auth.source,
      outcome: 'ok',
      statusCode: 200,
      latencyMs: Date.now() - start,
      model: resolveAgentModel('brief'),
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
      metadata: {
        clientId,
        policyId,
        policyCount: policies.length,
        parsedCount,
        confidence: analysis.confidence,
        needsOtherAgent: analysis.needs_other_agent || null,
      },
    })

    return NextResponse.json({
      success: true,
      agent: 'brief',
      analysis,
      mayaSummary,
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
    })
  } catch (err) {
    console.error('[brief] error:', err)
    await logAgentInvocation({
      agent: 'brief',
      userId: null,
      source: null,
      outcome: 'error',
      statusCode: 500,
      latencyMs: Date.now() - start,
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Brief failed' }, { status: 500 })
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Render a policy row as a human-readable, LLM-digestible briefing block.
 * Uses parsed_summary if available; falls back to basic columns otherwise.
 */
function formatPolicyBrief(p: PolicyRow): string {
  const lines: string[] = []
  lines.push(`Policy ID: ${p.id}`)

  const brief = p.parsed_summary
  if (!brief) {
    // Unparsed — just the basic columns
    if (p.product_name) lines.push(`Product: ${p.product_name}`)
    if (p.type) lines.push(`Type: ${p.type}`)
    if (p.insurer) lines.push(`Insurer: ${p.insurer}`)
    if (p.premium != null) lines.push(`Annual premium: $${p.premium}`)
    if (p.sum_assured != null) lines.push(`Sum assured: $${p.sum_assured}`)
    if (p.policy_number) lines.push(`Policy number: ${p.policy_number}`)
    if (p.renewal_date) lines.push(`Renewal: ${p.renewal_date}`)
    if (p.status) lines.push(`Status: ${p.status}`)
    lines.push(
      `⚠ This policy has NOT been parsed for detailed coverage yet. Only the fields above are available — coverage specifics (deductibles, exclusions, etc.) are unknown.`
    )
    return lines.join('\n')
  }

  // Parsed — emit the structured brief
  if (brief.plan_name) lines.push(`Plan name: ${brief.plan_name}`)
  if (brief.product_family) lines.push(`Product family: ${brief.product_family}`)
  if (brief.plan_tier) lines.push(`Plan tier: ${brief.plan_tier}`)
  lines.push(`Insurer: ${brief.insurer_name || p.insurer || 'unknown'}`)
  lines.push(`Regulatory type: ${brief.regulatory_type}`)
  lines.push(`Status: ${brief.policy_status}`)
  if (brief.policy_number) lines.push(`Policy number: ${brief.policy_number}`)

  // Money
  const currency = brief.currency || 'SGD'
  if (brief.annual_premium != null) {
    lines.push(`Annual premium: ${currency} ${brief.annual_premium} (${brief.premium_frequency})`)
  }
  if (brief.sum_assured != null) lines.push(`Sum assured: ${currency} ${brief.sum_assured}`)
  if (brief.annual_deductible != null) {
    lines.push(`Annual deductible: ${currency} ${brief.annual_deductible}`)
  }
  if (brief.co_insurance_percent != null) {
    let coinsuranceLine = `Co-insurance: ${brief.co_insurance_percent}%`
    if (brief.co_insurance_cap != null) {
      coinsuranceLine += ` (cap ${currency} ${brief.co_insurance_cap})`
    }
    lines.push(coinsuranceLine)
  }
  if (brief.annual_claim_limit != null) {
    lines.push(`Annual claim limit: ${currency} ${brief.annual_claim_limit}`)
  }
  if (brief.lifetime_claim_limit != null) {
    lines.push(`Lifetime claim limit: ${currency} ${brief.lifetime_claim_limit}`)
  } else if (brief.notes_on_money?.toLowerCase().includes('unlimited')) {
    lines.push(`Lifetime claim limit: unlimited (per policy notes)`)
  }

  // Coverage
  lines.push(`Death benefit: ${brief.death_benefit ? 'yes' : 'no'}`)
  lines.push(`Terminal illness benefit: ${brief.terminal_illness_benefit ? 'yes' : 'no'}`)
  lines.push(`TPD (total permanent disability) benefit: ${brief.tpd_benefit ? 'yes' : 'no'}`)
  if (brief.ci_coverage) {
    const stages: string[] = []
    if (brief.ci_coverage.early_stage) stages.push('early')
    if (brief.ci_coverage.intermediate_stage) stages.push('intermediate')
    if (brief.ci_coverage.severe_stage) stages.push('severe')
    const stagesStr = stages.length > 0 ? stages.join('/') : 'none'
    const condStr = brief.ci_coverage.total_conditions_covered
      ? ` (${brief.ci_coverage.total_conditions_covered} conditions)`
      : ''
    lines.push(`Critical illness coverage: ${stagesStr}${condStr}`)
  }
  if (brief.riders_attached && brief.riders_attached.length > 0) {
    const riders = brief.riders_attached.map(r => r.name).join(', ')
    lines.push(`Riders attached: ${riders}`)
  }

  // Pre-existing
  lines.push(`Pre-existing conditions: ${brief.pre_existing_excluded ? 'EXCLUDED' : 'not flagged as excluded'}`)

  // Exclusions
  if (brief.notable_exclusions && brief.notable_exclusions.length > 0) {
    lines.push(`Notable exclusions:`)
    brief.notable_exclusions.forEach(e => lines.push(`  - ${e}`))
  }

  // Dates
  if (brief.cover_start_date) lines.push(`Cover start date: ${brief.cover_start_date}`)
  if (brief.renewal_date) lines.push(`Renewal date: ${brief.renewal_date}`)
  if (brief.maturity_date) lines.push(`Maturity date: ${brief.maturity_date}`)
  if (brief.premium_cessation_date) {
    lines.push(`Premium cessation date: ${brief.premium_cessation_date}`)
  }

  // Free-text caveats
  if (brief.notes_on_money) lines.push(`Notes on money: ${brief.notes_on_money}`)
  if (brief.notes_on_dates) lines.push(`Notes on dates: ${brief.notes_on_dates}`)
  if (brief.notes_on_coverage) lines.push(`Notes on coverage: ${brief.notes_on_coverage}`)

  // Beneficiaries (light touch — names + relationship)
  if (brief.beneficiaries && brief.beneficiaries.length > 0) {
    const beneStrs = brief.beneficiaries.map(b => {
      const parts = [b.name]
      if (b.relationship) parts.push(b.relationship)
      if (b.share_percent != null) parts.push(`${b.share_percent}%`)
      return parts.join(' / ')
    })
    lines.push(`Beneficiaries (nomination: ${brief.nomination_type}): ${beneStrs.join('; ')}`)
  }

  // FA flags
  if (brief.fa_review_flags && brief.fa_review_flags.length > 0) {
    lines.push(`FA review flags: ${brief.fa_review_flags.join('; ')}`)
  }

  // Confidence
  if (brief.extraction_confidence !== 'high') {
    lines.push(`⚠ Extraction confidence: ${brief.extraction_confidence}`)
  }
  if (brief.fields_with_low_confidence && brief.fields_with_low_confidence.length > 0) {
    lines.push(`⚠ Low-confidence fields: ${brief.fields_with_low_confidence.join(', ')}`)
  }

  return lines.join('\n')
}
