import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySession } from '@/lib/auth-middleware'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// Allowed status values from DB enum
const VALID_STATUS = new Set(['active', 'lapsed', 'pending', 'cancelled'])
const VALID_FREQUENCY = new Set(['annual', 'monthly', 'quarterly', 'half-yearly', 'single'])

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      policyId,
      faId: _unused,
      insurer,
      product_name,
      policy_number,
      type,
      premium,
      premium_frequency,
      sum_assured,
      start_date,
      renewal_date,
      status,
      notes,
    } = body

    if (_unused && _unused !== userId) {
      console.warn(`[policy-update] ignored mismatched faId: body=${_unused} session=${userId}`)
    }

    if (!policyId) {
      return NextResponse.json({ error: 'Missing policyId' }, { status: 400 })
    }

    // ── Ownership check: policy must belong to verified userId ────────────
    const { data: policyCheck } = await supabase
      .from('policies')
      .select('id')
      .eq('id', policyId)
      .eq('fa_id', userId)
      .single()

    if (!policyCheck) {
      return NextResponse.json({ error: 'Policy not found or unauthorized' }, { status: 404 })
    }

    // ── Build patch — only include fields that were actually sent ─────────
    const patch: Record<string, unknown> = {}

    if (insurer !== undefined) patch.insurer = insurer
    if (product_name !== undefined) patch.product_name = product_name || null
    if (policy_number !== undefined) patch.policy_number = policy_number || null
    if (type !== undefined) patch.type = type
    if (premium !== undefined) patch.premium = premium === '' ? null : Number(premium)
    if (sum_assured !== undefined) patch.sum_assured = sum_assured === '' || sum_assured === null ? null : Number(sum_assured)
    if (start_date !== undefined) patch.start_date = start_date || null
    if (renewal_date !== undefined) patch.renewal_date = renewal_date || null
    if (notes !== undefined) patch.notes = notes || null

    // Defensive validation on enum fields
    if (status !== undefined) {
      if (!VALID_STATUS.has(status)) {
        return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 })
      }
      patch.status = status
    }
    if (premium_frequency !== undefined) {
      if (premium_frequency && !VALID_FREQUENCY.has(premium_frequency)) {
        return NextResponse.json({ error: `Invalid premium_frequency: ${premium_frequency}` }, { status: 400 })
      }
      patch.premium_frequency = premium_frequency || null
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // ── Update, scoped to verified userId ─────────────────────────────────
    const { error } = await supabase
      .from('policies')
      .update(patch)
      .eq('id', policyId)
      .eq('fa_id', userId)

    if (error) {
      console.error('[policy-update] update error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[policy-update] error:', err)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
