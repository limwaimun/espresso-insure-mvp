import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// Server-side password validation (mirrors client)
function validatePassword(pw: string): string | null {
  if (!pw || pw.length < 8) return 'Password must be at least 8 characters'
  if (!/\d/.test(pw)) return 'Password must contain a number'
  if (!/[A-Z]/.test(pw)) return 'Password must contain an uppercase letter'
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, company, phone, password } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Mobile number is required — Maya needs it to reach your clients on WhatsApp' }, { status: 400 })
    }
    const pwErr = validatePassword(password)
    if (pwErr) {
      return NextResponse.json({ error: pwErr }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()

    // 1. Create the auth user with the FA's chosen password. email_confirm: true
    //    skips the "confirm your email" flow — they can sign in immediately.
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { name, company, phone },
    })

    if (authError) {
      const msg = authError.message.toLowerCase()
      if (msg.includes('already') || msg.includes('registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in.' },
          { status: 409 }
        )
      }
      throw authError
    }

    const userId = authData.user.id

    // 2. Create profile record
    await supabase.from('profiles').upsert({
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      company: company?.trim() || null,
      phone: phone.trim(),
      plan: 'trial',
      trial_started_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'id' })

    // 3. Log the trial signup
    console.log(`[trial] New signup: ${name} <${cleanEmail}> ${company || ''} ${phone || ''}`)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[trial] error:', err)
    return NextResponse.json({ error: err.message || 'Signup failed. Please try again.' }, { status: 500 })
  }
}
