import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { authenticateAgentRequest } from '@/lib/agent-auth'
import { logAgentInvocation } from '@/lib/agent-log'
import { checkRateLimit } from '@/lib/agent-rate-limit'
import { resolveAgentModel } from '@/lib/agent-model'

export const runtime = 'nodejs'
export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ── Coverage categories Compass knows about ────────────────────────────────
const COVERAGE_CATEGORIES = [
  'Group Health',
  'Group Life',
  'Professional Indemnity',
  'Business Interruption',
  'Keyman Insurance',
  'Directors & Officers (D&O)',
  'Cyber Insurance',
  'Fire Insurance',
  'Personal Accident',
  'Life',
  'Critical Illness',
  'Disability',
  'Travel',
  'Motor',
  // Investment products
  'Unit Trust / Mutual Fund',
  'ETF',
  'ILP (Investment-Linked Policy)',
  'Annuity',
  'Retirement Planning',
]

// ── SG insurer landscape (for comparison context) ─────────────────────────
const SG_INSURERS = [
  'AIA', 'Great Eastern', 'Prudential', 'NTUC Income',
  'Manulife', 'Singlife', 'FWD', 'Tokio Marine', 'HSBC Life',
  'AXA', 'Etiqa', 'Chubb',
]

export async function POST(request: NextRequest) {
  const start = Date.now()

  try {
    // ── Auth (accept session OR relay-internal) ───────────────────────────
    const auth = await authenticateAgentRequest(request)
    if (!auth.ok) {
      await logAgentInvocation({
        agent: 'compass',
        userId: null,
        source: null,
        outcome: 'unauthorized',
        statusCode: auth.status,
        latencyMs: Date.now() - start,
      })
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const userId = auth.userId

    // ── Parse body ────────────────────────────────────────────────────────
    // ── Rate limit ────────────────────────────────────────────────────────────
    const rl = checkRateLimit(userId, 'compass')
    if (!rl.allowed) {
      await logAgentInvocation({
        agent: 'compass',
        userId,
        source: auth.source,
        outcome: 'rate_limited',
        statusCode: 429,
        latencyMs: Date.now() - start,
      })
      return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
    }

    const body = await request.json()
    const { faId: _unused, clientId, query, mode, coverageType, insurer } = body

    if (_unused && _unused !== userId) {
      console.warn(`[compass] ignored mismatched faId: body=${_unused} verified=${userId}`)
    }

    // ── Load data, scoped to verified userId ──────────────────────────────
    // SECURITY NOTE: We ignore any `client`/`policies` pre-loaded by Relay
    // and re-query with ownership check. Slightly more DB load, but prevents
    // Relay bugs from translating into cross-tenant reads here.
    let clientData = null
    let policyData: any[] = []

    if (clientId) {
      const { data: c } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .eq('fa_id', userId)
        .single()

      if (!c) {
        return NextResponse.json({ error: 'Client not found or unauthorized' }, { status: 404 })
      }
      clientData = c

      const { data: p } = await supabase
        .from('policies')
        .select('*')
        .eq('client_id', clientId)
        .eq('fa_id', userId)
      policyData = p || []
    }

    const { data: faProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    const preferredInsurers: string[] = faProfile?.preferred_insurers || []

    // ── Build context ──────────────────────────────────────────────────────
    const currentCoverage = policyData.map((p: any) => p.type)
    const missingCoverage = COVERAGE_CATEGORIES.filter(c =>
      !currentCoverage.some((cc: string) => cc?.toLowerCase().includes(c.toLowerCase()))
    )

    const policyLines = policyData.length > 0
      ? policyData.map((p: any) =>
          `${p.type} — ${p.insurer} — $${Number(p.premium).toLocaleString()}/yr — renews ${p.renewal_date || 'unknown'}`
        ).join('\n')
      : 'No active policies on record'

    // ── Generate Compass analysis ──────────────────────────────────────────
    const systemPrompt = `You are Compass, an expert financial product analysis agent for Singapore financial advisors.
You have deep knowledge of the Singapore insurance AND investment market, MAS regulations, all major SG insurers, fund houses, and investment platforms.
You can analyse both insurance coverage gaps AND investment portfolio gaps.
You provide structured, actionable analysis — never generic advice.
Always cite specific insurers and approximate premium ranges based on Singapore market rates (2025-2026).
Preferred insurers for this FA: ${preferredInsurers.length > 0 ? preferredInsurers.join(', ') : 'None specified — be neutral'}.`

    let userPrompt = ''

    if (mode === 'gap_analysis') {
      userPrompt = `Analyse the coverage gaps for this client and recommend what they should add.

CLIENT PROFILE:
Name: ${clientData?.name || 'Unknown'}
Company: ${clientData?.company || 'N/A'}
Age: ${clientData?.birthday ? Math.floor((Date.now() - new Date(clientData.birthday).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 'Unknown'}

CURRENT COVERAGE:
${policyLines}

IDENTIFIED GAPS: ${missingCoverage.join(', ')}

FA's specific question: "${query}"

Provide:
1. TOP 3 coverage gaps ranked by urgency (with reason why it matters for this client)
2. For each gap: recommended insurer(s), approximate annual premium range in SGD, key coverage points
3. A suggested conversation opener the FA can use with the client

Format as structured JSON:
{
  "gaps": [
    {
      "coverage_type": "",
      "urgency": "high|medium|low",
      "reason": "",
      "recommended_insurers": [],
      "premium_range": {"min": 0, "max": 0, "currency": "SGD", "period": "annual"},
      "key_points": []
    }
  ],
  "conversation_starter": "",
  "summary": ""
}`
    } else {
      // Comparison mode
      const targetCoverage = coverageType || 'the coverage mentioned in the query'
      const targetInsurers = insurer
        ? [insurer]
        : preferredInsurers.length > 0
          ? preferredInsurers.slice(0, 4)
          : SG_INSURERS.slice(0, 5)

      userPrompt = `Compare ${targetCoverage} insurance options for this client across Singapore insurers.

CLIENT PROFILE:
Name: ${clientData?.name || 'Unknown'}
Company: ${clientData?.company || 'N/A'}
Age: ${clientData?.birthday ? Math.floor((Date.now() - new Date(clientData.birthday).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 'Unknown'}

CURRENT COVERAGE:
${policyLines}

FA's specific question: "${query}"

Compare these insurers: ${targetInsurers.join(', ')}

Provide a structured comparison. Format as JSON:
{
  "coverage_type": "",
  "comparison": [
    {
      "insurer": "",
      "product_name": "",
      "premium_range": {"min": 0, "max": 0, "currency": "SGD", "period": "annual"},
      "key_benefits": [],
      "exclusions": [],
      "claim_rating": "excellent|good|average",
      "best_for": "",
      "verdict": ""
    }
  ],
  "recommendation": "",
  "notes": ""
}`
    }

    const response = await anthropic.messages.create({
      model: resolveAgentModel('compass'),
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const rawText = response.content.find(b => b.type === 'text')?.text || ''

    let analysis = null
    try {
      const clean = rawText.replace(/```json|```/g, '').trim()
      analysis = JSON.parse(clean)
    } catch {
      analysis = { raw: rawText }
    }

    // ── Format a Maya-readable summary ────────────────────────────────────
    const mayaSummaryRes = await anthropic.messages.create({
      model: resolveAgentModel('compass'),
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Summarise this insurance analysis in 2-3 sentences for a WhatsApp message to the FA. Be specific about insurers and premiums. No bullet points.

Analysis: ${JSON.stringify(analysis)}`
      }],
    })
    const mayaSummary = mayaSummaryRes.content.find(b => b.type === 'text')?.text || ''

    await logAgentInvocation({
      agent: 'compass',
      userId,
      source: auth.source,
      outcome: 'ok',
      statusCode: 200,
      latencyMs: Date.now() - start,
      model: resolveAgentModel('compass'),
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
      metadata: { mode: mode || 'comparison' },
    })

    return NextResponse.json({
      success: true,
      agent: 'compass',
      mode: mode || 'comparison',
      client: clientData ? { name: clientData.name, id: clientId } : null,
      analysis,
      mayaSummary,
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
    })

  } catch (err) {
    console.error('[compass] error:', err)
    await logAgentInvocation({
      agent: 'compass',
      userId: null,
      source: null,
      outcome: 'error',
      statusCode: 500,
      latencyMs: Date.now() - start,
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Compass failed' }, { status: 500 })
  }
}
