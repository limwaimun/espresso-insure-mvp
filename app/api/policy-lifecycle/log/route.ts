import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySession } from '@/lib/auth-middleware'
import { validTransitions, type Phase, type State, type EventType } from '@/lib/policy-lifecycle'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const ALLOWED_ACTIONS = new Set(['manual_note', 'stage_transition'])

export async function POST(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, policyId, text, to_phase, to_state } = body

    if (!ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    if (!policyId || typeof policyId !== 'string') {
      return NextResponse.json({ error: 'policyId required' }, { status: 400 })
    }

    const { data: policy, error: policyErr } = await supabase
      .from('policies')
      .select('id, fa_id, client_id, current_phase, policy_state')
      .eq('id', policyId)
      .single()

    if (policyErr || !policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
    }
    if (policy.fa_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (action === 'manual_note') {
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return NextResponse.json({ error: 'text required for manual_note' }, { status: 400 })
      }
      if (text.length > 5000) {
        return NextResponse.json({ error: 'text too long (max 5000 chars)' }, { status: 400 })
      }

      const { data: event, error: eventErr } = await supabase
        .from('policy_lifecycle_events')
        .insert({
          policy_id: policy.id,
          fa_id: policy.fa_id,
          client_id: policy.client_id,
          event_type: 'manual_note' as EventType,
          text: text.trim(),
          metadata: {},
        })
        .select()
        .single()

      if (eventErr) {
        console.error('[policy-lifecycle/log] manual_note insert failed:', eventErr)
        return NextResponse.json({ error: 'Failed to log note' }, { status: 500 })
      }

      return NextResponse.json({ ok: true, event })
    }

    if (action === 'stage_transition') {
      if (!to_phase || !to_state) {
        return NextResponse.json({ error: 'to_phase and to_state required' }, { status: 400 })
      }

      const valid = validTransitions(policy.current_phase, policy.policy_state)
      const match = valid.find(t => t.to_phase === to_phase && t.to_state === to_state)
      if (!match) {
        return NextResponse.json({
          error: 'Invalid transition from ' + policy.current_phase + '/' + policy.policy_state + ' to ' + to_phase + '/' + to_state,
        }, { status: 400 })
      }

      const trimmed = typeof text === 'string' ? text.trim() : ''
      if (trimmed.length > 5000) {
        return NextResponse.json({ error: 'text too long (max 5000 chars)' }, { status: 400 })
      }

      const { error: updateErr } = await supabase
        .from('policies')
        .update({
          current_phase: to_phase,
          policy_state: to_state,
        })
        .eq('id', policy.id)

      if (updateErr) {
        console.error('[policy-lifecycle/log] policy update failed:', updateErr)
        return NextResponse.json({ error: 'Failed to update policy' }, { status: 500 })
      }

      const { data: event, error: eventErr } = await supabase
        .from('policy_lifecycle_events')
        .insert({
          policy_id: policy.id,
          fa_id: policy.fa_id,
          client_id: policy.client_id,
          event_type: 'stage_transition' as EventType,
          from_phase: policy.current_phase as Phase,
          from_state: policy.policy_state as State,
          to_phase: to_phase as Phase,
          to_state: to_state as State,
          text: trimmed || null,
          metadata: {},
        })
        .select()
        .single()

      if (eventErr) {
        console.error('[policy-lifecycle/log] event insert failed (policy already updated):', eventErr)
        return NextResponse.json({ ok: true, event: null, warning: 'Policy updated but event log failed' })
      }

      return NextResponse.json({ ok: true, event })
    }

    return NextResponse.json({ error: 'Unhandled action' }, { status: 400 })
  } catch (err) {
    console.error('[policy-lifecycle/log] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
