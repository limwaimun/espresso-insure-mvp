import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

const ADMIN_USER_IDS = ['1a5b902c-9e3a-44cd-970a-bb852b1cd5e4']

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
  if (!user || !ADMIN_USER_IDS.includes(user.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service key to fetch ALL profiles (bypasses RLS)
  const { data: profiles, error } = await serviceSupabase
    .from('profiles')
    .select('id, name, company, phone, plan, created_at, trial_ends_at, preferred_insurers')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get client counts for each FA
  const counts = await Promise.all(
    (profiles || []).map(async fa => {
      const { count } = await serviceSupabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('ifa_id', fa.id)
      return { id: fa.id, count: count || 0 }
    })
  )

  const countMap = Object.fromEntries(counts.map(c => [c.id, c.count]))

  return NextResponse.json({
    profiles,
    clientCounts: countMap,
  })
}
