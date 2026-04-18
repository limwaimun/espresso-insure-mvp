import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const { ifaId, reportType, query } = await request.json()

    if (!ifaId) return NextResponse.json({ error: 'Missing ifaId' }, { status: 400 })

    // ── Fetch all FA data in parallel ──────────────────────────────────────
    const [
      { data: clients },
      { data: policies },
      { data: alerts },
      { data: ifa },
    ] = await Promise.all([
      supabase.from('clients').select('*').eq('ifa_id', ifaId),
      supabase.from('policies').select('*').eq('ifa_id', ifaId),
      supabase.from('alerts').select('*').eq('ifa_id', ifaId),
      supabase.from('profiles').select('*').eq('id', ifaId).single(),
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
      topClients: clientPremiums.slice(0, 5),
      insurerBreakdown,
      coverageBreakdown,
    }

    // ── Generate narrative insight if requested ────────────────────────────
    let narrative = null
    if (reportType === 'portfolio' || query) {
      const narrativeRes = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: 'You are Lens, an analytics agent for Singapore financial advisors. Provide concise, actionable portfolio insights. Be specific with numbers. Highlight risks and opportunities.',
        messages: [{
          role: 'user',
          content: `Generate a portfolio insight report for this FA based on their metrics.

FA: ${ifa?.name || 'Advisor'}
${query ? `Specific question: "${query}"` : ''}

METRICS:
${JSON.stringify(metrics, null, 2)}

Write 3-4 sentences covering:
1. Portfolio health summary (size, premium volume)
2. Most urgent action item (renewals, claims, or gaps)
3. One growth opportunity

Keep it direct, no fluff. This is for an FA who wants actionable intelligence.`,
        }],
      })
      narrative = narrativeRes.content.find(b => b.type === 'text')?.text
    }

    return NextResponse.json({
      success: true,
      agent: 'lens',
      reportType: reportType || 'portfolio',
      generatedAt: now.toISOString(),
      metrics,
      narrative,
    })

  } catch (err) {
    console.error('[lens] error:', err)
    return NextResponse.json({ error: 'Lens failed' }, { status: 500 })
  }
}
