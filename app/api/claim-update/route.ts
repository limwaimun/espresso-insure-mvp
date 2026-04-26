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
      // B64a: user-supplied transition timestamps. When provided, the
      // API uses these instead of now() for back-dating support. The
      // form sends them as ISO date strings (YYYY-MM-DD); we convert
      // to ISO timestamp at midnight UTC for storage.
      approved_at,
      denied_at,
      paid_at,
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

    // ── B64a: Validate user-supplied transition timestamps ──────────────
    // FA can back-date approvals/denials/paid to capture when the
    // transition actually happened (vs when they got around to logging
    // it). We accept ISO date strings (YYYY-MM-DD), reject future dates,
    // and convert to a full ISO timestamp at midnight UTC for storage.
    function normaliseUserTimestamp(v: unknown, label: string): string | null | undefined {
      if (v === undefined) return undefined  // not provided — keep existing behaviour
      if (v === null || v === '') return null  // explicit null — clear (but we don't expose this on the form yet)
      if (typeof v !== 'string') {
        throw new Error(`${label} must be a date string`)
      }
      // ISO date YYYY-MM-DD: convert to a full ISO timestamp at UTC midnight
      const m = v.match(/^\d{4}-\d{2}-\d{2}$/)
      if (!m) {
        throw new Error(`${label} must be in YYYY-MM-DD format`)
      }
      const todayISO = new Date().toISOString().slice(0, 10)
      if (v > todayISO) {
        throw new Error(`${label} cannot be in the future`)
      }
      return `${v}T00:00:00Z`
    }

    let userApprovedAt: string | null | undefined
    let userDeniedAt: string | null | undefined
    let userPaidAt: string | null | undefined
    try {
      userApprovedAt = normaliseUserTimestamp(approved_at, 'approved_at')
      userDeniedAt = normaliseUserTimestamp(denied_at, 'denied_at')
      userPaidAt = normaliseUserTimestamp(paid_at, 'paid_at')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid timestamp'
      return NextResponse.json({ error: msg }, { status: 400 })
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

    // ── Status transition logic (B64a: with user-supplied timestamps) ────
    // When status changes to approved/denied/paid for the first time,
    // set the corresponding _at timestamp (only if not already set).
    // Terminal states (denied, paid) also set closed_at.
    //
    // B64a: if the FA supplies an explicit *_at value (back-dating),
    // use that instead of now(). Form sends YYYY-MM-DD; normaliseUserTimestamp
    // converted those to ISO timestamps above.
    if (status !== undefined && status !== existing.status) {
      patch.status = status
      const now = new Date().toISOString()

      if (status === 'approved' && !existing.approved_at) {
        patch.approved_at = userApprovedAt ?? now
      }
      if (status === 'denied' && !existing.denied_at) {
        patch.denied_at = userDeniedAt ?? now
      }
      if (status === 'paid') {
        if (!existing.paid_at) patch.paid_at = userPaidAt ?? now
        // If a claim went paid without ever being explicitly approved,
        // set approved_at too (paid implies approved). Use user's
        // approved_at if supplied, else paid_at, else now.
        if (!existing.approved_at) patch.approved_at = userApprovedAt ?? userPaidAt ?? now
      }
      // closed_at always uses now() per design — not user-editable.
      if (TERMINAL_STATUS.has(status) && !existing.closed_at) {
        patch.closed_at = now
      }
    } else if (status !== undefined) {
      // status sent but no transition (same value) — still write it for safety
      patch.status = status
    }

    // B64a: allow OVERRIDE of existing timestamps when FA sends explicit
    // values (correcting a mistake on a claim that's already in that state).
    // Only writes if the user-supplied value differs from what's already
    // in patch (don't double-write).
    if (userApprovedAt !== undefined && patch.approved_at === undefined) {
      patch.approved_at = userApprovedAt
    }
    if (userDeniedAt !== undefined && patch.denied_at === undefined) {
      patch.denied_at = userDeniedAt
    }
    if (userPaidAt !== undefined && patch.paid_at === undefined) {
      patch.paid_at = userPaidAt
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
