import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySession } from '@/lib/auth-middleware'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// Claims live in the dedicated `claims` table (post-B57 schema migration).
// Previously they were stored in `alerts` with type='claim' and a [Type]
// body prefix; that's all gone now. claim_type is a real column,
// validated against an enum.

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

    const {
      clientId,
      faId: _unused,
      title,
      body,
      priority = 'medium',
      claim_type = 'Other',
      // New optional fields (Phase B schema)
      policy_id,
      incident_date,
      filed_date,
      estimated_amount,
      insurer_claim_ref,
      insurer_handler_name,
      insurer_handler_contact,
    } = await request.json()

    if (_unused && _unused !== userId) {
      console.warn(`[claim-create] ignored mismatched faId: body=${_unused} session=${userId}`)
    }

    if (!clientId || !title?.trim()) {
      return NextResponse.json({ error: 'clientId and title are required' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(claim_type)) {
      return NextResponse.json({ error: `Invalid claim_type: ${claim_type}` }, { status: 400 })
    }

    if (!ALLOWED_PRIORITIES.has(priority)) {
      return NextResponse.json({ error: `Invalid priority: ${priority}` }, { status: 400 })
    }

    // ── Ownership check: client belongs to verified userId ────────────────
    const { data: clientCheck } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('fa_id', userId)
      .single()

    if (!clientCheck) {
      return NextResponse.json({ error: 'Client not found or unauthorized' }, { status: 404 })
    }

    // ── If policy_id provided, verify it belongs to this client ───────────
    if (policy_id) {
      const { data: policyCheck } = await supabase
        .from('policies')
        .select('id')
        .eq('id', policy_id)
        .eq('client_id', clientId)
        .eq('fa_id', userId)
        .single()
      if (!policyCheck) {
        return NextResponse.json({ error: 'Policy not found or does not belong to this client' }, { status: 400 })
      }
    }

    // ── Insert claim ──────────────────────────────────────────────────────
    const { data: claim, error } = await supabase
      .from('claims')
      .insert({
        fa_id: userId,
        client_id: clientId,
        policy_id: policy_id || null,
        title: title.trim(),
        body: body || null,
        priority,
        status: 'open',
        claim_type,
        incident_date: incident_date || null,
        filed_date: filed_date || null,
        estimated_amount: estimated_amount != null && estimated_amount !== '' ? Number(estimated_amount) : null,
        insurer_claim_ref: insurer_claim_ref || null,
        insurer_handler_name: insurer_handler_name || null,
        insurer_handler_contact: insurer_handler_contact || null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[claim-create] insert error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, claim })
  } catch (err) {
    console.error('[claim-create] error:', err)
    return NextResponse.json({ error: 'Failed to create claim' }, { status: 500 })
  }
}
