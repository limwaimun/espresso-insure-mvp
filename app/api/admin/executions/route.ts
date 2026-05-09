import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { isAdminUserId } from '@/lib/admin'

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(request: NextRequest) {
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

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: rows, error } = await serviceSupabase
    .from('execution_log')
    .select('action, success, error_message, created_at')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Aggregate by action
  const byAction: Record<string, { ok: number; fail: number; deferred: number }> = {}
  const recentFailures: { action: string; error: string; created_at: string }[] = []

  // Some action+error combinations are intentional deferrals, not real failures.
  // The executor's claim path returns success=false when an order is already running/done/failed,
  // which is correct behavior (Bolt is choosing NOT to do duplicate work). Bucket those separately.
  function isIntentionalDeferral(action: string, errorMessage: string | null): boolean {
    if (action === 'claim' && errorMessage && errorMessage.startsWith('already_claimed_or_not_dispatched')) {
      return true
    }
    return false
  }

  for (const row of rows || []) {
    if (!byAction[row.action]) byAction[row.action] = { ok: 0, fail: 0, deferred: 0 }
    if (row.success === true) {
      byAction[row.action].ok++
    } else if (isIntentionalDeferral(row.action, row.error_message)) {
      byAction[row.action].deferred++
    } else {
      byAction[row.action].fail++
      if (recentFailures.length < 10 && row.error_message) {
        recentFailures.push({
          action: row.action,
          error: String(row.error_message).slice(0, 180),
          created_at: row.created_at,
        })
      }
    }
  }

  const total = (rows || []).length
  const totalFail = Object.values(byAction).reduce((s, v) => s + v.fail, 0)
  const failRate = total > 0 ? totalFail / total : 0

  return NextResponse.json({ byAction, recentFailures, total, totalFail, failRate, windowHours: 24 })
}
