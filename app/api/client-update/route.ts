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
    const { clientId, ifaId: _unused, name, company, whatsapp, email, birthday, address } = await request.json()

    if (_unused && _unused !== userId) {
      console.warn(`[client-update] ignored mismatched ifaId from body: body=${_unused} session=${userId}`)
    }

    if (!clientId || !name?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // ── Update, scoped to verified userId ─────────────────────────────────
    const { error } = await supabase
      .from('clients')
      .update({
        name: name.trim(),
        company: company?.trim() || null,
        whatsapp: whatsapp?.trim() || null,
        email: email?.trim() || null,
        birthday: birthday || null,
        address: address?.trim() || null,
      })
      .eq('id', clientId)
      .eq('ifa_id', userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[client-update] error:', err)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
