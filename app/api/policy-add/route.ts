import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySession } from '@/lib/auth-middleware'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    // ── Parse body ────────────────────────────────────────────────────────
    const {
      clientId, faId: _unused,
      policy_number,
      insurer, type,
      premium, premium_frequency,
      sum_assured,
      start_date, renewal_date,
      status,
    } = await request.json()

    if (_unused && _unused !== userId) {
      console.warn(`[policy-add] ignored mismatched faId from body: body=${_unused} session=${userId}`)
    }

    if (!clientId || !insurer || !type || !premium) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // ── Ownership check: verify the client belongs to the caller ──────────
    // Without this, an attacker could add policies to someone else's client.
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('ifa_id', userId)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found or unauthorized' }, { status: 404 })
    }

    // ── Insert, scoped to verified userId ─────────────────────────────────
    const { data: policy, error } = await supabase
      .from('policies')
      .insert({
        client_id: clientId,
        ifa_id: userId,
        policy_number: policy_number || null,
        insurer,
        type,
        premium: Number(premium),
        premium_frequency: premium_frequency || 'annual',
        sum_assured: sum_assured ? Number(sum_assured) : null,
        start_date: start_date || null,
        renewal_date: renewal_date || null,
        status: status || 'active',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, policy })
  } catch (err) {
    console.error('[policy-add] error:', err)
    return NextResponse.json({ error: 'Failed to add policy' }, { status: 500 })
  }
}
