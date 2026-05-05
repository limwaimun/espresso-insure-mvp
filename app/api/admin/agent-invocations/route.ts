import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { isAdminUserId } from '@/lib/admin'

// Service client bypasses RLS — only used server-side
const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

interface TotalsByAgentEntry {
  agent: string
  ok: number
  error: number
  rate_limited: number
  unauthorized: number
  total: number
  p50_latency_ms: number | null
  p95_latency_ms: number | null
  total_input_tokens: number | null
  total_output_tokens: number | null
}

interface RecentErrorEntry {
  created_at: string
  agent: string
  user_id: string | null
  status_code: number | null
  error_message: string | null
}

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null
  const index = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
}

export async function GET(request: NextRequest) {
  // Verify the requester is an admin
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = Object.fromEntries(
    cookieHeader.split('; ').filter(Boolean).map(c => {
      const idx = c.indexOf('=')
      return [c.slice(0, idx), c.slice(idx + 1)]
    })
  )

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => Object.entries(cookies).map(([name, value]) => ({ name, value })), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdminUserId(user?.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Query agent_invocations from last 24h
  const windowHours = 24
  const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString()

  const { data: rows, error } = await serviceSupabase
    .from('agent_invocations')
    .select('*')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Aggregate by agent
  const byAgent = new Map<string, TotalsByAgentEntry>()
  const recentErrors: RecentErrorEntry[] = []

  for (const row of rows || []) {
    // Initialize agent group
    if (!byAgent.has(row.agent)) {
      byAgent.set(row.agent, {
        agent: row.agent,
        ok: 0,
        error: 0,
        rate_limited: 0,
        unauthorized: 0,
        total: 0,
        p50_latency_ms: null,
        p95_latency_ms: null,
        total_input_tokens: 0,
        total_output_tokens: 0,
      })
    }
    const g = byAgent.get(row.agent)!

    g.total++
    if (row.outcome === 'ok') g.ok++
    else if (row.outcome === 'error') g.error++
    else if (row.outcome === 'rate_limited') g.rate_limited++
    else if (row.outcome === 'unauthorized') g.unauthorized++

    if (row.input_tokens) g.total_input_tokens! += row.input_tokens
    if (row.output_tokens) g.total_output_tokens! += row.output_tokens

    // Collect recent errors
    if (row.outcome === 'error' && row.error_message && recentErrors.length < 20) {
      recentErrors.push({
        created_at: row.created_at,
        agent: row.agent,
        user_id: row.user_id,
        status_code: row.status_code,
        error_message: row.error_message.slice(0, 200),
      })
    }
  }

  // Compute percentiles — need a second pass for latency arrays per agent
  const latenciesByAgent = new Map<string, number[]>()
  for (const row of rows || []) {
    if (row.latency_ms != null) {
      if (!latenciesByAgent.has(row.agent)) latenciesByAgent.set(row.agent, [])
      latenciesByAgent.get(row.agent)!.push(row.latency_ms)
    }
  }
  for (const [agent, latencies] of latenciesByAgent) {
    latencies.sort((a, b) => a - b)
    const g = byAgent.get(agent)
    if (g) {
      g.p50_latency_ms = percentile(latencies, 50)
      g.p95_latency_ms = percentile(latencies, 95)
    }
  }

  const totalsByAgent = Array.from(byAgent.values()).sort((a, b) => b.total - a.total)

  return NextResponse.json({
    totalsByAgent,
    recentErrors: recentErrors.slice(0, 20),
    windowHours,
  })
}
