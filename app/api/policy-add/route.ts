import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { clientId, ifaId, insurer, type, premium, renewal_date, status } = await request.json()

    if (!clientId || !ifaId || !insurer || !type || !premium || !renewal_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: policy, error } = await supabase
      .from('policies')
      .insert({
        client_id: clientId,
        ifa_id: ifaId,
        insurer,
        type,
        premium: Number(premium),
        renewal_date,
        status: status || 'active',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, policy })
  } catch (err) {
    console.error('[policy-add] error:', err)
    return NextResponse.json({ error: 'Failed to add policy' }, { status: 500 })
  }
}
