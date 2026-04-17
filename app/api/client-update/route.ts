import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { clientId, ifaId, name, company, whatsapp, email, birthday, address } = await request.json()

    if (!clientId || !ifaId || !name?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

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
      .eq('ifa_id', ifaId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[client-update] error:', err)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
