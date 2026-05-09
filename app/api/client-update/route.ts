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
    const { clientId, faId: _unused, name, type, company, whatsapp, email, birthday, address } = await request.json()

    if (_unused && _unused !== userId) {
      console.warn(`[client-update] ignored mismatched faId from body: body=${_unused} session=${userId}`)
    }

    if (!clientId || !name?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate type — must be one of the three allowed enum values, or omitted.
    // Omitted = unchanged. Any other string = reject (defends against client-side
    // tampering writing arbitrary strings into the type column).
    const ALLOWED_TYPES = new Set(['individual', 'sme', 'corporate'])
    if (type !== undefined && type !== null && !ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: 'Invalid type — must be individual, sme, or corporate' }, { status: 400 })
    }

    // ── Update, scoped to verified userId ─────────────────────────────────
    // Build update payload. type is only included when explicitly provided
    // — undefined means 'don't change it'. This keeps backward compatibility
    // with any caller that doesn't send type.
    const updatePayload: Record<string, string | null> = {
      name: name.trim(),
      company: company?.trim() || null,
      whatsapp: whatsapp?.trim() || null,
      email: email?.trim() || null,
      birthday: birthday || null,
      address: address?.trim() || null,
    }
    if (type !== undefined && type !== null) {
      updatePayload.type = type
    }

    const { error } = await supabase
      .from('clients')
      .update(updatePayload)
      .eq('id', clientId)
      .eq('fa_id', userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[client-update] error:', err)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
