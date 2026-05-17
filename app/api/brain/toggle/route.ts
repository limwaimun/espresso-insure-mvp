import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySession } from '@/lib/auth-middleware'
import { isAdminUserId } from '@/lib/admin-ids'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// GET — read current flag state. Admin-only.
export async function GET(req: NextRequest) {
  const { userId, error } = await verifySession(req)
  if (error || !userId) {
    return NextResponse.json({ error: error ?? 'unauthorized' }, { status: 401 })
  }
  if (!isAdminUserId(userId)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { data, error: dbError } = await supabase
    .from('system_flags')
    .select('key, enabled, last_toggled_by, last_toggled_at, last_toggle_reason')
    .eq('key', 'brain_tick')
    .maybeSingle()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, flag: data })
}

// POST — toggle the flag. Body: { enabled: boolean, reason?: string }. Admin-only.
export async function POST(req: NextRequest) {
  const { userId, error } = await verifySession(req)
  if (error || !userId) {
    return NextResponse.json({ error: error ?? 'unauthorized' }, { status: 401 })
  }
  if (!isAdminUserId(userId)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json body' }, { status: 400 })
  }

  if (typeof body?.enabled !== 'boolean') {
    return NextResponse.json({ error: '"enabled" must be a boolean' }, { status: 400 })
  }

  const reason =
    typeof body?.reason === 'string' && body.reason.trim().length > 0
      ? body.reason.trim().slice(0, 500)
      : null

  const { data, error: dbError } = await supabase
    .from('system_flags')
    .update({
      enabled: body.enabled,
      last_toggled_by: userId,
      last_toggled_at: new Date().toISOString(),
      last_toggle_reason: reason,
    })
    .eq('key', 'brain_tick')
    .select('key, enabled, last_toggled_by, last_toggled_at, last_toggle_reason')
    .single()

  if (dbError || !data) {
    return NextResponse.json({ error: dbError?.message ?? 'flag row missing' }, { status: 500 })
  }

  // Audit trail in execution_log for visibility alongside brain ticks.
  await supabase.from('execution_log').insert({
    action: body.enabled ? 'brain_resumed_by_admin' : 'brain_paused_by_admin',
    success: true,
    raw_output: JSON.stringify({
      toggled_by: userId,
      reason,
      new_state: body.enabled,
    }),
  })

  return NextResponse.json({ ok: true, flag: data })
}
