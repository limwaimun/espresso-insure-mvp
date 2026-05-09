import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySession } from '@/lib/auth-middleware'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// GET /api/policy-lifecycle/list?policyId=...
//
// Returns lifecycle events for a single policy, newest first. Used by
// PolicyRow's Activity timeline section. Caps at 50 events; older
// history can be fetched with ?before=<timestamp> if needed (V2).

export async function GET(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const policyId = searchParams.get('policyId')
    if (!policyId) {
      return NextResponse.json({ error: 'policyId required' }, { status: 400 })
    }

    // Confirm the policy belongs to this FA before returning events
    const { data: policy, error: policyErr } = await supabase
      .from('policies')
      .select('id, fa_id')
      .eq('id', policyId)
      .single()

    if (policyErr || !policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
    }
    if (policy.fa_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: events, error: eventsErr } = await supabase
      .from('policy_lifecycle_events')
      .select('*')
      .eq('policy_id', policyId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (eventsErr) {
      console.error('[policy-lifecycle/list] query failed:', eventsErr)
      return NextResponse.json({ error: 'Failed to load events' }, { status: 500 })
    }

    return NextResponse.json({ events: events || [] })
  } catch (err) {
    console.error('[policy-lifecycle/list] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
