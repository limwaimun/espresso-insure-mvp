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

export async function POST(request: NextRequest) {
  const start = Date.now()

  try {
    // ── Auth (accept session OR relay-internal) ───────────────────────────
    const auth = await authenticateAgentRequest(request)
    if (!auth.ok) {
      await logAgentInvocation({
        agent: 'lens',
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
    const rl = checkRateLimit(userId, 'lens')
    if (!rl.allowed) {
      await logAgentInvocation({
        agent: 'lens',
        userId,
        source: auth.source,
        outcome: 'rate_limited',
        statusCode: 429,
        latencyMs: Date.now() - start,
      })
      return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
    }

    // ── Parse body ────────────────────────────────────────────────────────
    const { ifaId: _unused, reportType, query, forceRefresh } = await request.json()

    if (_unused && _unused !== userId) {
      console.warn(`[lens] ignored mismatched ifaId: body=${_unused} verified=${userId}`)
    }

    const CACHE_TTL_HOURS = 6

    // ── Check cache first (scoped to userId) ──────────────────────────────
    if (!forceRefresh && !query) {
      const { data: cached } = await supabase
        .from('lens_cache')
        .select('narrative, metrics, generated_at')
        .eq('ifa_id', userId)
        .single()

      if (cached) {
        const ageHours = (Date.now() - new Date(cached.generated_at).getTime()) / 3600000
        if (ageHours < CACHE_TTL_HOURS) {
          await logAgentInvocation({
            agent: 'lens',
            userId,
            source: auth.source,
            outcome: 'ok',
            statusCode: 200,
            latencyMs: Date.now() - start,
            metadata: { fromCache: true, reportType: reportType || 'portfolio' },
          })
          return NextResponse.json({
            success: true,
            agent: 'lens',
            reportType: reportType || 'portfolio',
            generatedAt: cached.generated_at,
            metrics: cached.metrics,
            narrative: cached.narrative,
            fromCache: true,
            cacheAge: Math.round(ageHours * 10) / 10,
          })
        }
      }
    }

    // ── Fetch all FA data in parallel (scoped to userId) ──────────────────
    const [
      { data: clients },
      { data: policies },
      { data: alerts },
      { data: ifa },
    ] = await Promise.all([
      supabase.from('clients').select('*').eq('ifa_id', userId),
      supabase.from('policies').select('*').eq('ifa_id', userId),
      supabase.from('alerts').select('*').eq('ifa_id', userId),
      supabase.from('profiles').select('*').eq('id', userId).single(),
    ])

    const now = new Date()
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

    // ── Compute metrics ────────────────────────────────────────────────────
    const totalClients = clients?.length || 0
    const totalPolicies = policies?.length || 0
    const totalAnnualPremium = (policies || []).reduce((sum, p) => sum + (Number(p.premium) || 0), 0)

    const renewingIn30 = (policies || []).filter(p => {
      if (!p.renewal_date) return false
      const d = new Date(p.renewal_date)
      return d >= now && d <= thirtyDays
    })
    const renewingIn90 = (policies || []).filter(p => {
      if (!p.renewal_date) return false
      const d = new Date(p.renewal_date)
      return d >= now && d <= ninetyDays
    })

    const openClaims = (alerts || []).filter(a => !a.resolved && a.type === 'claim')
    const highPriorityClaims = openClaims.filter(a => a.priority === 'high')

    // Client tier breakdown
    const tierCounts = (clients || []).reduce((acc: Record<string, number>, c) => {
      const premium = (policies || [])
        .filter(p => p.client_id === c.id)
        .reduce((s, p) => s + (Number(p.premium) || 0), 0)
      const tier = premium >= 20000 ? 'platinum' : premium >= 10000 ? 'gold' : premium >= 3000 ? 'silver' : 'bronze'
      acc[tier] = (acc[tier] || 0) + 1
      return acc
    }, {})

    // Top clients by premium
    const clientPremiums = (clients || []).map(c => ({
      name: c.name,
      company: c.company,
      totalPremium: (policies || [])
        .filter(p => p.client_id === c.id)
        .reduce((s, p) => s + (Number(p.premium) || 0), 0),
      policyCount: (policies || []).filter(p => p.client_id === c.id).length,
    })).sort((a, b) => b.totalPremium - a.totalPremium)

    // Insurer breakdown
    const insurerBreakdown = (policies || []).reduce((acc: Record<string, { count: number; premium: number }>, p) => {
      const ins = p.insurer || 'Unknown'
      if (!acc[ins]) acc[ins] = { count: 0, premium: 0 }
      acc[ins].count++
      acc[ins].premium += Number(p.premium) || 0
      return acc
    }, {})

    // Coverage type breakdown
    const coverageBreakdown = (policies || []).reduce((acc: Record<string, number>, p) => {
      const type = p.type || 'Unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    const metrics = {
      portfolio: {
        totalClients,
        totalPolicies,
        totalAnnualPremium,
        avgPremiumPerClient: totalClients > 0 ? Math.round(totalAnnualPremium / totalClients) : 0,
        avgPoliciesPerClient: totalClients > 0 ? Math.round((totalPolicies / totalClients) * 10) / 10 : 0,
      },
      renewals: {
        next30Days: {
          count: renewingIn30.length,
          totalPremium: renewingIn30.reduce((s, p) => s + (Number(p.premium) || 0), 0),
          policies: renewingIn30.map(p => ({
            client: (clients || []).find(c => c.id === p.client_id)?.name || 'Unknown',
            insurer: p.insurer,
            type: p.type,
            premium: p.premium,
            renewalDate: p.renewal_date,
          })).sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime()),
        },
        next90Days: {
          count: renewingIn90.length,
          totalPremium: renewingIn90.reduce((s, p) => s + (Number(p.premium) || 0), 0),
        },
      },
      claims: {
        open: openClaims.length,
        highPriority: highPriorityClaims.length,
        details: openClaims.map(a => ({
          client: (clients || []).find(c => c.id === a.client_id)?.name || 'Unknown',
          title: a.title,
          priority: a.priority,
          daysOpen: Math.floor((now.getTime() - new Date(a.created_at).getTime()) / (24 * 60 * 60 * 1000)),
        })),
      },
      tiers: tierCounts,
      topClients: clientPremiums.slice(0, 10),
      insurerBreakdown,
      coverageBreakdown,
    }

    // ── Generate narrative insight if requested ────────────────────────────
    let narrative = null
    if (reportType === 'portfolio' || query) {
      const narrativeRes = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: 'You are Lens, an analytics agent for Singapore financial advisors. Write in clean flowing prose — no markdown, no headers, no bullet points, no bold text. Just clear, direct sentences an FA can read at a glance. Be specific with numbers and names. Highlight the single most urgent action first.',
        messages: [{
          role: 'user',
          content: `Write a 3-4 sentence portfolio insight for this FA. Lead with the most urgent action item, then cover portfolio health and one growth opportunity. Use specific client names, dollar amounts, and dates where relevant. No markdown formatting of any kind.

FA: ${ifa?.name || 'Advisor'}
${query ? `Specific question: "${query}"` : ''}

METRICS:
${JSON.stringify(metrics, null, 2)}`,
        }],
      })
      narrative = narrativeRes.content.find(b => b.type === 'text')?.text
    }

    // ── Save to cache (scoped to userId — closes cache-poisoning hole) ────
    if (!query) {
      await supabase
        .from('lens_cache')
        .upsert({
          ifa_id: userId,
          narrative,
          metrics,
          generated_at: now.toISOString(),
        }, { onConflict: 'ifa_id' })
    }

    await logAgentInvocation({
      agent: 'lens',
      userId,
      source: auth.source,
      outcome: 'ok',
      statusCode: 200,
      latencyMs: Date.now() - start,
      model: 'claude-sonnet-4-6',
      inputTokens: narrative ? undefined : null,
      outputTokens: narrative ? undefined : null,
      metadata: { fromCache: false, reportType: reportType || 'portfolio', hasQuery: !!query },
    })

    return NextResponse.json({
      success: true,
      agent: 'lens',
      reportType: reportType || 'portfolio',
      generatedAt: now.toISOString(),
      metrics,
      narrative,
      fromCache: false,
    })

  } catch (err) {
    console.error('[lens] error:', err)
    await logAgentInvocation({
      agent: 'lens',
      userId: null,
      source: null,
      outcome: 'error',
      statusCode: 500,
      latencyMs: Date.now() - start,
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Lens failed' }, { status: 500 })
  }
}
