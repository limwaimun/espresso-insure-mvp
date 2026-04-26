import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySession } from '@/lib/auth-middleware'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// Claims live in the dedicated `claims` table (post-B57 schema migration).
// `resolved` is no longer a field — `status` enum replaces it. When status
// transitions to approved/denied/paid for the first time, we auto-set the
// corresponding _at timestamp. Terminal states (denied, paid) also set
// closed_at if not already set.

const ALLOWED_STATUS = new Set(['open', 'in_progress', 'approved', 'denied', 'paid'])
const TERMINAL_STATUS = new Set(['denied', 'paid'])

const ALLOWED_TYPES = new Set([
  'Health', 'Life', 'Critical Illness', 'Disability',
  'Personal Accident', 'Motor', 'Travel', 'Property', 'Other',
])

const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high'])

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const body_raw = await request.json()
    const {
      claimId,
      ifaId: _unused,
      // Existing fields
      status,
      priority,
      title,
      body,
      claim_type,
      policy_id,
      // New B58 fields
      incident_date,
      filed_date,
      estimated_amount,
      approved_amount,
      deductible_amount,
      denial_reason,
      insurer_claim_ref,
      insurer_handler_name,
      insurer_handler_contact,
    } = body_raw

    if (_unused && _unused !== userId) {
      console.warn(`[claim-update] ignored mismatched ifaId from body: body=${_unused} session=${userId}`)
    }

    if (!claimId) {
      return NextResponse.json({ error: 'Missing claimId' }, { status: 400 })
    }

    // Defensive enum validation
    if (status !== undefined && !ALLOWED_STATUS.has(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 })
    }
    if (claim_type !== undefined && !ALLOWED_TYPES.has(claim_type)) {
      return NextResponse.json({ error: `Invalid claim_type: ${claim_type}` }, { status: 400 })
    }
    if (priority !== undefined && !ALLOWED_PRIORITIES.has(priority)) {
      return NextResponse.json({ error: `Invalid priority: ${priority}` }, { status: 400 })
    }

    // ── Read current state (so we know which timestamps to auto-set) ─────
    const { data: existing, error: readErr } = await supabase
      .from('claims')
      .select('id, status, approved_at, denied_at, paid_at, closed_at')
      .eq('id', claimId)
      .eq('ifa_id', userId)
      .single()

    if (readErr || !existing) {
      return NextResponse.json({ error: 'Claim not found or unauthorized' }, { status: 404 })
    }

    // ── Build patch — only include fields that were actually sent ────────
    const patch: Record<string, unknown> = {}
    if (title !== undefined)                   patch.title = title
    if (body !== undefined)                    patch.body = body || null
    if (priority !== undefined)                patch.priority = priority
    if (claim_type !== undefined)              patch.claim_type = claim_type
    if (policy_id !== undefined)               patch.policy_id = policy_id || null
    if (incident_date !== undefined)           patch.incident_date = incident_date || null
    if (filed_date !== undefined)              patch.filed_date = filed_date || null
    if (denial_reason !== undefined)           patch.denial_reason = denial_reason || null
    if (insurer_claim_ref !== undefined)       patch.insurer_claim_ref = insurer_claim_ref || null
    if (insurer_handler_name !== undefined)    patch.insurer_handler_name = insurer_handler_name || null
    if (insurer_handler_contact !== undefined) patch.insurer_handler_contact = insurer_handler_contact || null

    // Numeric fields: empty string or null → null
    if (estimated_amount !== undefined)
      patch.estimated_amount = estimated_amount === '' || estimated_amount === null ? null : Number(estimated_amount)
    if (approved_amount !== undefined)
      patch.approved_amount = approved_amount === '' || approved_amount === null ? null : Number(approved_amount)
    if (deductible_amount !== undefined)
      patch.deductible_amount = deductible_amount === '' || deductible_amount === null ? null : Number(deductible_amount)

    // ── Status transition logic ──────────────────────────────────────────
    // When status changes to approved/denied/paid for the first time,
    // set the corresponding _at timestamp (only if not already set).
    // Terminal states (denied, paid) also set closed_at.
    if (status !== undefined && status !== existing.status) {
      patch.status = status
      const now = new Date().toISOString()

      if (status === 'approved' && !existing.approved_at) {
        patch.approved_at = now
      }
      if (status === 'denied' && !existing.denied_at) {
        patch.denied_at = now
      }
      if (status === 'paid') {
        if (!existing.paid_at) patch.paid_at = now
        // If a claim went paid without ever being explicitly approved,
        // set approved_at too (paid implies approved).
        if (!existing.approved_at) patch.approved_at = now
      }
      if (TERMINAL_STATUS.has(status) && !existing.closed_at) {
        patch.closed_at = now
      }
    } else if (status !== undefined) {
      // status sent but no transition (same value) — still write it for safety
      patch.status = status
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ success: true, noop: true })
    }

    // ── Update, scoped to verified userId ────────────────────────────────
    const { error } = await supabase
      .from('claims')
      .update(patch)
      .eq('id', claimId)
      .eq('ifa_id', userId)

    if (error) {
      console.error('[claim-update] update error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[claim-update] error:', err)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
