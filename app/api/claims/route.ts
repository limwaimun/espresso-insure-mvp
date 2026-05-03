import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySession } from '@/lib/auth-middleware'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const ALLOWED_TYPES = new Set([
  'Health', 'Life', 'Critical Illness', 'Disability',
  'Personal Accident', 'Motor', 'Travel', 'Property', 'Other',
])

const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high'])

// ─── GET /api/claims — List claims for the authenticated user ─────────────
export async function GET(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('client_id')
    const policyId = searchParams.get('policy_id')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    let query = supabase
      .from('claims')
      .select(`
        id, client_id, ifa_id, policy_id, title, claim_type, priority, status,
        body, incident_date, filed_date, estimated_amount, approved_amount,
        deductible_amount, denial_reason, insurer_claim_ref,
        insurer_handler_name, insurer_handler_contact,
        approved_at, denied_at, paid_at, closed_at, created_at, updated_at,
        clients!inner(name, company, email, phone, whatsapp)
      `)
      .eq('ifa_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }
    if (clientId) {
      query = query.eq('client_id', clientId)
    }
    if (policyId) {
      query = query.eq('policy_id', policyId)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('[api/claims] get error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, claims: data, count })
  } catch (err) {
    console.error('[api/claims] get error:', err)
    return NextResponse.json({ error: 'Failed to fetch claims' }, { status: 500 })
  }
}

// ─── POST /api/claims — Create a new claim ────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const {
      client_id: clientId,
      policy_id: policyId,
      title,
      body,
      claim_type: claimType,
      priority = 'medium',
      incident_date: incidentDate,
      estimated_amount: estimatedAmount,
    } = await request.json()

    // ── Validation ──────────────────────────────────────────────────────────
    if (!clientId || !title?.trim()) {
      return NextResponse.json({ error: 'client_id and title are required' }, { status: 400 })
    }
    if (claimType && !ALLOWED_TYPES.has(claimType)) {
      return NextResponse.json({ error: `Invalid claim_type: ${claimType}` }, { status: 400 })
    }
    if (!ALLOWED_PRIORITIES.has(priority)) {
      return NextResponse.json({ error: `Invalid priority: ${priority}` }, { status: 400 })
    }

    // ── Ownership check: client belongs to verified user ────────────────────
    const { data: clientCheck } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('ifa_id', userId)
      .single()

    if (!clientCheck) {
      return NextResponse.json({ error: 'Client not found or unauthorized' }, { status: 404 })
    }

    // ── If policy_id provided, verify it belongs to this client ─────────────
    if (policyId) {
      const { data: policyCheck } = await supabase
        .from('policies')
        .select('id')
        .eq('id', policyId)
        .eq('client_id', clientId)
        .eq('ifa_id', userId)
        .single()
      if (!policyCheck) {
        return NextResponse.json({ error: 'Policy not found or does not belong to this client' }, { status: 400 })
      }
    }

    // ── Insert claim ────────────────────────────────────────────────────────
    const { data: claim, error: insertError } = await supabase
      .from('claims')
      .insert({
        ifa_id: userId,
        client_id: clientId,
        policy_id: policyId || null,
        title: title.trim(),
        body: body || null,
        priority,
        status: 'open',
        claim_type: claimType || 'Other',
        incident_date: incidentDate || null,
        estimated_amount: estimatedAmount != null && estimatedAmount !== '' ? Number(estimatedAmount) : null,
      })
      .select('id, title, client_id, policy_id, status, claim_type')
      .single()

    if (insertError) {
      console.error('[api/claims] insert error:', insertError.message)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // ── Structured audit log ────────────────────────────────────────────────
    console.log(JSON.stringify({
      event: 'claim.created',
      advisor_id: userId,
      client_id: clientId,
      policy_id: policyId || null,
      claim_id: claim.id,
    }))

    return NextResponse.json({ success: true, claim })
  } catch (err) {
    console.error('[api/claims] create error:', err)
    return NextResponse.json({ error: 'Failed to create claim' }, { status: 500 })
  }
}
