import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { authenticateAgentRequest } from '@/lib/agent-auth'
import { logAgentInvocation } from '@/lib/agent-log'
import { checkRateLimit } from '@/lib/agent-rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SIX_MONTHS_AGO = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()

export async function POST(request: NextRequest) {
  const start = Date.now()
  try {
    // ── Auth (accept session OR relay-internal) ───────────────────────────
    const auth = await authenticateAgentRequest(request)
    if (!auth.ok) {
      await logAgentInvocation({
        agent: 'harbour',
        userId: null,
        source: null,
        outcome: 'unauthorized',
        statusCode: auth.status,
        latencyMs: Date.now() - start,
      })
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const userId = auth.userId

    // ── Rate limit ────────────────────────────────────────────────────────────
    const rl = checkRateLimit(userId, 'harbour')
    if (!rl.allowed) {
      await logAgentInvocation({
        agent: 'harbour',
        userId,
        source: auth.source,
        outcome: 'rate_limited',
        statusCode: 500,
        latencyMs: Date.now() - start,
      })
      return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
    }

    // ── Parse body ────────────────────────────────────────────────────────
    const { ifaId: _unused, mode = 'review_report', clientId } = await request.json()

    if (_unused && _unused !== userId) {
      console.warn(`[harbour] ignored mismatched ifaId: body=${_unused} verified=${userId}`)
    }

    // ── Fetch all holdings for this FA (scoped to verified userId) ────────
    const { data: holdings } = await supabase
      .from('holdings')
      .select('*, clients(id, name, company)')
      .eq('ifa_id', userId)

    const allHoldings = holdings || []

    // ── Compute review metrics ─────────────────────────────────────────────
    const overdueReview = allHoldings.filter(h =>
      !h.last_reviewed_at || h.last_reviewed_at < SIX_MONTHS_AGO
    )
    const neverReviewed = allHoldings.filter(h => !h.last_reviewed_at)
    const totalValue = allHoldings.reduce((s, h) => s + (Number(h.current_value) || 0), 0)

    // Concentration risk — clients with >80% in one holding
    const clientHoldings: Record<string, { total: number; holdings: typeof allHoldings }> = {}
    allHoldings.forEach(h => {
      if (!clientHoldings[h.client_id]) clientHoldings[h.client_id] = { total: 0, holdings: [] }
      clientHoldings[h.client_id].total += Number(h.current_value) || 0
      clientHoldings[h.client_id].holdings.push(h)
    })

    const concentrationRisks = Object.entries(clientHoldings)
      .flatMap(([, { total, holdings: ch }]) =>
        ch.filter(h => total > 0 && (Number(h.current_value) / total) > 0.8)
          .map(h => ({ client: (h.clients as any)?.name, holding: h.product_name, pct: Math.round((Number(h.current_value) / total) * 100) }))
      )

    // ── Single client mode — detailed holdings + Maya script ───────────────
    if (mode === 'client_review' && clientId) {
      // Ownership check: ensure client belongs to verified userId
      const { data: client } = await supabase
        .from('clients')
        .select('name, birthday')
        .eq('id', clientId)
        .eq('ifa_id', userId)
        .single()

      if (!client) {
        return NextResponse.json({ error: 'Client not found or unauthorized' }, { status: 404 })
      }

      const clientHoldingsList = allHoldings.filter(h => h.client_id === clientId)

      const reviewRes = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: 'You are Harbour, an investment portfolio review agent for Singapore financial advisors. You assess client investment holdings for review needs, concentration risk, and suitability. Write in clean prose, no markdown.',
        messages: [{
          role: 'user',
          content: `Review this client's investment holdings and generate a WhatsApp message the FA can send to initiate a portfolio review conversation.

Client: ${client?.name}
Holdings:
${clientHoldingsList.map(h => `- ${h.product_name} (${h.provider}) — ${h.product_type} — Value: SGD ${Number(h.current_value).toLocaleString()} — Last reviewed: ${h.last_reviewed_at ? new Date(h.last_reviewed_at).toLocaleDateString('en-SG') : 'Never'}`).join('\n')}

Write a warm, natural WhatsApp message under 80 words that:
1. References their specific holdings naturally (don't list them all)
2. Suggests a portfolio review
3. Doesn't sound like a compliance template

Return JSON: { "mayaScript": "", "reviewNotes": "", "urgency": "high|medium|low" }`
        }],
      })

      const raw = reviewRes.content.find(b => b.type === 'text')?.text || ''
      let result = null
      try { result = JSON.parse(raw.replace(/```json|```/g, '').trim()) } catch { result = { mayaScript: raw } }

      await logAgentInvocation({
        agent: 'harbour',
        userId,
        source: auth.source,
        outcome: 'ok',
        statusCode: 200,
        latencyMs: Date.now() - start,
        model: 'claude-sonnet-4-6',
        inputTokens: reviewRes.usage?.input_tokens ?? null,
        outputTokens: reviewRes.usage?.output_tokens ?? null,
        metadata: { mode: 'client_review', clientId },
      })

      return NextResponse.json({
        success: true, agent: 'harbour', mode: 'client_review',
        holdings: clientHoldingsList,
        review: result,
      })
    }

    // ── Portfolio report mode — full FA overview ───────────────────────────
    const narrativeRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: 'You are Harbour, an investment oversight agent for Singapore financial advisors. Write in clean prose, no markdown, no bullet points.',
      messages: [{
        role: 'user',
        content: `Summarise the investment portfolio review status for this FA in 2-3 sentences. Be specific with numbers. Focus on what needs action.

Total holdings: ${allHoldings.length} across ${Object.keys(clientHoldings).length} clients
Total AUM tracked: SGD ${totalValue.toLocaleString()}
Overdue review (6+ months): ${overdueReview.length} holdings
Never reviewed: ${neverReviewed.length} holdings
Concentration risks flagged: ${concentrationRisks.length}

Top overdue:
${overdueReview.slice(0, 3).map(h => `- ${(h.clients as any)?.name}: ${h.product_name}`).join('\n')}`
      }],
    })
    const narrative = narrativeRes.content.find(b => b.type === 'text')?.text || ''

    await logAgentInvocation({
      agent: 'harbour',
      userId,
      source: auth.source,
      outcome: 'ok',
      statusCode: 200,
      latencyMs: Date.now() - start,
      model: 'claude-sonnet-4-6',
      inputTokens: narrativeRes.usage?.input_tokens ?? null,
      outputTokens: narrativeRes.usage?.output_tokens ?? null,
      metadata: { mode: 'review_report', holdingsCount: allHoldings.length },
    })

    return NextResponse.json({
      success: true,
      agent: 'harbour',
      mode: 'review_report',
      summary: {
        totalHoldings: allHoldings.length,
        totalClients: Object.keys(clientHoldings).length,
        totalAUM: totalValue,
        overdueReview: overdueReview.length,
        neverReviewed: neverReviewed.length,
        concentrationRisks: concentrationRisks.length,
      },
      overdueList: overdueReview.slice(0, 10).map(h => ({
        client: (h.clients as any)?.name,
        clientId: h.client_id,
        holding: h.product_name,
        provider: h.provider,
        type: h.product_type,
        value: h.current_value,
        lastReviewed: h.last_reviewed_at,
      })),
      concentrationRisks,
      narrative,
    })

  } catch (err) {
    console.error('[harbour] error:', err)
    await logAgentInvocation({
      agent: 'harbour',
      userId: null,
      source: null,
      outcome: 'error',
      statusCode: 500,
      latencyMs: Date.now() - start,
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Harbour failed' }, { status: 500 })
  }
}
