import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { isAdminUserId } from '@/lib/admin'

// Service client bypasses RLS — only used server-side
const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

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

  // Use service key to fetch ALL profiles (bypasses RLS)
  const { data: profiles, error } = await serviceSupabase
    .from('profiles')
    .select('id, name, company, phone, plan, created_at, trial_ends_at, preferred_insurers')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Single query for all client counts — no N+1
  const { data: clientCountRows } = await serviceSupabase
    .from('clients')
    .select('fa_id')

  const countMap: Record<string, number> = {}
  for (const row of clientCountRows || []) {
    countMap[row.fa_id] = (countMap[row.fa_id] || 0) + 1
  }

  // Fetch last_sign_in_at from auth.users for each profile
  const lastLoginMap: Record<string, string | null> = {}
  try {
    const { data: { users: authUsers } } = await serviceSupabase.auth.admin.listUsers({ perPage: 1000 })
    for (const u of authUsers || []) {
      lastLoginMap[u.id] = u.last_sign_in_at || null
    }
  } catch (_) {
    // non-fatal — last login simply won't appear
  }

  // Global stats for admin overview
  const [{ count: totalClients }, { count: totalPolicies }] = await Promise.all([
    serviceSupabase.from('clients').select('*', { count: 'exact', head: true }),
    serviceSupabase.from('policies').select('*', { count: 'exact', head: true }),
  ])

  // Active FAs in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const activeFAs7d = profiles?.filter(p => {
    const lastLogin = lastLoginMap[p.id]
    return lastLogin && lastLogin >= sevenDaysAgo
  }).length || 0

  // Workstream stats from work_orders (last 7 days)
  const { data: workOrders } = await serviceSupabase
    .from('work_orders')
    .select('workstream, status')
    .gte('created_at', sevenDaysAgo)

  const wsMap: Record<string, { total: number; done: number; failed: number }> = {}
  for (const wo of workOrders || []) {
    const ws = wo.workstream || 'unknown'
    if (!wsMap[ws]) wsMap[ws] = { total: 0, done: 0, failed: 0 }
    wsMap[ws].total++
    if (['done', 'verified'].includes(wo.status)) wsMap[ws].done++
    if (['failed', 'blocked', 'reverted', 'rejected'].includes(wo.status)) wsMap[ws].failed++
  }
  const workstreamStats = Object.entries(wsMap)
    .map(([name, counts]) => ({ name, ...counts }))
    .sort((a, b) => b.total - a.total)

  return NextResponse.json({
    profiles,
    clientCounts: countMap,
    lastLoginMap,
    stats: {
      totalFAs: profiles?.length || 0,
      totalClients: totalClients || 0,
      totalPolicies: totalPolicies || 0,
      activeFAs7d,
    },
    workstreamStats,
  })
}
