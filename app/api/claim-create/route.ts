import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySession } from '@/lib/auth-middleware'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// Claims are stored in the `alerts` table with type='claim'.
// This endpoint creates a new claim, scoped to the verified user's session.

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const {
      clientId,
      ifaId: _unused,
      title,
      body,
      priority = 'medium',
      claim_type, // optional classifier (Health/Life/Motor/etc)
    } = await request.json()

    if (_unused && _unused !== userId) {
      console.warn(`[claim-create] ignored mismatched ifaId: body=${_unused} session=${userId}`)
    }

    if (!clientId || !title?.trim()) {
      return NextResponse.json({ error: 'clientId and title are required' }, { status: 400 })
    }

    // ── Ownership check: client belongs to verified userId ────────────────
    const { data: clientCheck } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('ifa_id', userId)
      .single()

    if (!clientCheck) {
      return NextResponse.json({ error: 'Client not found or unauthorized' }, { status: 404 })
    }

    // ── Build body with claim_type prefix if provided ────────────────────
    // We stash claim_type into the body text since the alerts table doesn't
    // have a dedicated column for it. Shape: "[Type] Description"
    const prefixedBody = claim_type && body
      ? `[${claim_type}] ${body}`
      : claim_type
        ? `[${claim_type}]`
        : (body || '')

    // ── Insert claim ──────────────────────────────────────────────────────
    const { data: claim, error } = await supabase
      .from('alerts')
      .insert({
        ifa_id: userId,
        client_id: clientId,
        type: 'claim',
        title: title.trim(),
        body: prefixedBody,
        priority,
        status: 'open',
        resolved: false,
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
