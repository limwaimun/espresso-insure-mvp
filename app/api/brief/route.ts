/**
 * Brief — factual policy-lookup agent. v2 (with anti-hallucination guardrails)
 * ───────────────────────────────────────────────────────────────────────────
 * Reads policies.parsed_summary (Layer A of the policy parsing pipeline) and
 * answers FACTUAL questions. Not a recommendation engine. Not market analysis.
 *
 * Hardening added in v2 (after observing Maya quote AIA hotline + MyAIA app
 * from training data on 2026-05-17):
 *   - System prompt is much more emphatic about citing fields and refusing
 *     to fill any gap from general knowledge.
 *   - policy_facts_used is now REQUIRED in output, not optional. If the LLM
 *     can't cite specific fields, the answer is suspect.
 *   - Explicit forbidden categories: phone numbers, URLs, app names, hospital
 *     names, doctor names, panel lists, claim filing procedure (unless in
 *     parsed_summary), regulatory citations beyond what's in the data.
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
  faId?: string
  clientId?: string
  policyId?: string
  query: string
}

interface BriefAnalysis {
  answer: string
  policy_facts_used: string[]  // REQUIRED — must cite specific fields used
  confidence: 'definite' | 'implied' | 'unknown'
  caveats: string | null
  needs_other_agent: string | null
}

export async function POST(request: NextRequest) {
  const start = Date.now()

  try {
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
          policy_facts_used: [],
          confidence: 'definite' as const,
          caveats: null,
          needs_other_agent: null,
        } satisfies BriefAnalysis,
      })
    }

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

    const parsedCount = policies.filter(p => p.parsed_summary != null).length
    const unparsedCount = policies.length - parsedCount

    const policyBriefs = policies.map(p => formatPolicyBrief(p)).join('\n\n---\n\n')

    // ── System prompt (anti-hallucination hardened) ─────────────────────────
    const systemPrompt = `You are Brief, a Singapore insurance policy expert. Your ONLY job is to answer factual questions about a CLIENT'S OWN EXISTING POLICIES using ONLY the structured policy data provided below.

YOU ARE NOT a recommendation engine. YOU ARE NOT a market comparison engine. YOU REPORT WHAT THE POLICY DATA SAYS, with field-level citations.

═══════════════════════════════════════════
CRITICAL: SOURCING RULES (read twice)
═══════════════════════════════════════════

Every fact you state MUST come from the policy data block below. ZERO exceptions.

You MAY NOT supply from your own knowledge:
  ❌ Insurer hotline numbers, customer service phone numbers, any phone number
  ❌ Mobile app names (e.g. "MyAIA app", "GE Wellness app") — these may not exist or have been renamed
  ❌ Website URLs (e.g. "aia.com.sg") — these may have changed
  ❌ Hospital names (panel hospitals, recommended hospitals, ANY hospital)
  ❌ Doctor or specialist names
  ❌ Specific claim filing steps unless explicitly stated in the policy data
  ❌ Reimbursement timeframes (e.g. "7-14 days") unless explicitly stated in the policy data
  ❌ Insurer process details (LOG letters, cashless admission, etc.) unless explicitly stated in the policy data
  ❌ Premium market rates, market comparisons, or "average" figures
  ❌ MAS regulations beyond the general IS/MediShield framework (and only if the data references them)

If a question asks for any of the above, your answer must be a polite "I don't have that detail in the policy data" with a needs_other_agent suggestion.

What you CAN do:
  ✅ Quote specific values from parsed_summary fields (premium, deductible, co-insurance, sum_assured, exclusions, etc.)
  ✅ Quote text from notes_on_money / notes_on_dates / notes_on_coverage exactly as written
  ✅ Make REASONABLE structural inferences (e.g. "IS plan means it works alongside MediShield Life" — this is structurally true of all IS plans)
  ✅ Refer to rider effects when they're stated in riders_attached[].effect_summary
  ✅ Cite policy_number and plan_name to be specific

═══════════════════════════════════════════
OUTPUT RULES
═══════════════════════════════════════════

1. policy_facts_used: REQUIRED. List each specific field you cited (e.g. "annual_deductible: 3500", "riders_attached[0].effect_summary"). If you can't cite specific fields, your answer is suspect — return confidence "unknown".

2. confidence:
   - "definite": value comes literally from a parsed_summary field
   - "implied": reasonable inference from structural facts (e.g. IS plan = MediShield integration)
   - "unknown": data doesn't address the question

3. needs_other_agent: name the agent who CAN answer the unanswerable part:
   - Claim filing procedure → "Atlas"
   - Market comparison → "Compass"
   - Premium estimates on new coverage → "Sage"
   - Panel hospitals/doctors → "I don't have a panel agent — recommend FA pulls the live list from the insurer"

4. Be concise. The answer is going into a WhatsApp message. 1-4 sentences typically.

5. Currency is SGD unless explicitly stated.

6. If extraction_confidence on the policy is "low" or "medium", mention that in caveats.`

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

Answer using ONLY the policy data above. Cite specific field names in policy_facts_used. Respond as JSON:
{
  "answer": "your answer in natural language, 1-4 sentences",
  "policy_facts_used": ["specific field references — e.g. 'annual_deductible: 3500', 'riders_attached[0].name', 'notes_on_coverage'"],
  "confidence": "definite" | "implied" | "unknown",
  "caveats": "any caveats Maya should know, or null",
  "needs_other_agent": "name of agent or null"
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
      const parsed = JSON.parse(clean)
      analysis = {
        answer: typeof parsed.answer === 'string' ? parsed.answer : rawText,
        policy_facts_used: Array.isArray(parsed.policy_facts_used) ? parsed.policy_facts_used : [],
        confidence: ['definite', 'implied', 'unknown'].includes(parsed.confidence) ? parsed.confidence : 'unknown',
        caveats: typeof parsed.caveats === 'string' ? parsed.caveats : null,
        needs_other_agent: typeof parsed.needs_other_agent === 'string' ? parsed.needs_other_agent : null,
      }
    } catch {
      analysis = {
        answer: rawText,
        policy_facts_used: [],
        confidence: 'unknown',
        caveats: 'Brief failed to produce structured output; raw text returned.',
        needs_other_agent: null,
      }
    }

    // Soft guard: if confidence is "definite" but no facts were cited, downgrade.
    if (analysis.confidence === 'definite' && analysis.policy_facts_used.length === 0) {
      analysis.confidence = 'unknown'
      analysis.caveats = (analysis.caveats ? analysis.caveats + ' ' : '') + 'Auto-downgraded: claimed definite but cited no specific fields.'
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
        factsCitedCount: analysis.policy_facts_used.length,
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

function formatPolicyBrief(p: PolicyRow): string {
  const lines: string[] = []
  lines.push(`Policy ID: ${p.id}`)

  const brief = p.parsed_summary
  if (!brief) {
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

  if (brief.plan_name) lines.push(`plan_name: ${brief.plan_name}`)
  if (brief.product_family) lines.push(`product_family: ${brief.product_family}`)
  if (brief.plan_tier) lines.push(`plan_tier: ${brief.plan_tier}`)
  lines.push(`insurer_name: ${brief.insurer_name || p.insurer || 'unknown'}`)
  lines.push(`regulatory_type: ${brief.regulatory_type}`)
  lines.push(`policy_status: ${brief.policy_status}`)
  if (brief.policy_number) lines.push(`policy_number: ${brief.policy_number}`)

  const currency = brief.currency || 'SGD'
  if (brief.annual_premium != null) {
    lines.push(`annual_premium: ${currency} ${brief.annual_premium} (${brief.premium_frequency})`)
  }
  if (brief.sum_assured != null) lines.push(`sum_assured: ${currency} ${brief.sum_assured}`)
  if (brief.annual_deductible != null) {
    lines.push(`annual_deductible: ${currency} ${brief.annual_deductible}`)
  }
  if (brief.co_insurance_percent != null) {
    let coinsuranceLine = `co_insurance_percent: ${brief.co_insurance_percent}%`
    if (brief.co_insurance_cap != null) {
      coinsuranceLine += ` (co_insurance_cap: ${currency} ${brief.co_insurance_cap})`
    }
    lines.push(coinsuranceLine)
  }
  if (brief.annual_claim_limit != null) {
    lines.push(`annual_claim_limit: ${currency} ${brief.annual_claim_limit}`)
  }
  if (brief.lifetime_claim_limit != null) {
    lines.push(`lifetime_claim_limit: ${currency} ${brief.lifetime_claim_limit}`)
  } else if (brief.notes_on_money?.toLowerCase().includes('unlimited')) {
    lines.push(`lifetime_claim_limit: null (notes_on_money says "Unlimited")`)
  }

  lines.push(`death_benefit: ${brief.death_benefit}`)
  lines.push(`terminal_illness_benefit: ${brief.terminal_illness_benefit}`)
  lines.push(`tpd_benefit: ${brief.tpd_benefit}`)
  if (brief.ci_coverage) {
    const stages: string[] = []
    if (brief.ci_coverage.early_stage) stages.push('early')
    if (brief.ci_coverage.intermediate_stage) stages.push('intermediate')
    if (brief.ci_coverage.severe_stage) stages.push('severe')
    const stagesStr = stages.length > 0 ? stages.join('/') : 'none'
    const condStr = brief.ci_coverage.total_conditions_covered
      ? ` (${brief.ci_coverage.total_conditions_covered} conditions)`
      : ''
    lines.push(`ci_coverage: ${stagesStr}${condStr}`)
  }
  if (brief.riders_attached && brief.riders_attached.length > 0) {
    lines.push(`riders_attached:`)
    brief.riders_attached.forEach((r, i) => {
      const premiumStr = r.annual_premium != null ? `, annual_premium: ${currency} ${r.annual_premium}` : ''
      const effectStr = r.effect_summary ? `, effect_summary: "${r.effect_summary}"` : ''
      lines.push(`  [${i}] name: ${r.name}${premiumStr}${effectStr}`)
    })
  }

  lines.push(`pre_existing_excluded: ${brief.pre_existing_excluded}`)

  if (brief.notable_exclusions && brief.notable_exclusions.length > 0) {
    lines.push(`notable_exclusions:`)
    brief.notable_exclusions.forEach((e, i) => lines.push(`  [${i}] ${e}`))
  }

  if (brief.cover_start_date) lines.push(`cover_start_date: ${brief.cover_start_date}`)
  if (brief.renewal_date) lines.push(`renewal_date: ${brief.renewal_date}`)
  if (brief.maturity_date) lines.push(`maturity_date: ${brief.maturity_date}`)
  if (brief.premium_cessation_date) {
    lines.push(`premium_cessation_date: ${brief.premium_cessation_date}`)
  }
  if (brief.issue_date) lines.push(`issue_date: ${brief.issue_date}`)

  if (brief.notes_on_money) lines.push(`notes_on_money: "${brief.notes_on_money}"`)
  if (brief.notes_on_dates) lines.push(`notes_on_dates: "${brief.notes_on_dates}"`)
  if (brief.notes_on_coverage) lines.push(`notes_on_coverage: "${brief.notes_on_coverage}"`)

  if (brief.beneficiaries && brief.beneficiaries.length > 0) {
    lines.push(`beneficiaries (nomination_type: ${brief.nomination_type}):`)
    brief.beneficiaries.forEach((b, i) => {
      const parts = [b.name]
      if (b.relationship) parts.push(b.relationship)
      if (b.share_percent != null) parts.push(`${b.share_percent}%`)
      lines.push(`  [${i}] ${parts.join(' / ')}`)
    })
  }

  if (brief.fa_review_flags && brief.fa_review_flags.length > 0) {
    lines.push(`fa_review_flags: ${brief.fa_review_flags.join('; ')}`)
  }

  lines.push(`extraction_confidence: ${brief.extraction_confidence}`)
  if (brief.fields_with_low_confidence && brief.fields_with_low_confidence.length > 0) {
    lines.push(`fields_with_low_confidence: ${brief.fields_with_low_confidence.join(', ')}`)
  }

  return lines.join('\n')
}
