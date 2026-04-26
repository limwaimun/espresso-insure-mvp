import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySession } from '@/lib/auth-middleware'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// Claims live in the dedicated `claims` table (post-B57 schema migration).
// This route deletes a claim, scoped to the verified user's session.

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const { claimId, ifaId: _unused } = await request.json()

    if (_unused && _unused !== userId) {
      console.warn(`[claim-delete] ignored mismatched ifaId: body=${_unused} session=${userId}`)
    }

    if (!claimId) {
      return NextResponse.json({ error: 'Missing claimId' }, { status: 400 })
    }

    // ── Delete, scoped to verified userId ──────────────────────────────────
    const { error } = await supabase
      .from('claims')
      .delete()
      .eq('id', claimId)
      .eq('ifa_id', userId)

    if (error) {
      console.error('[claim-delete] delete error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[claim-delete] error:', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
