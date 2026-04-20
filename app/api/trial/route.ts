import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { name, email, company, phone } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Mobile number is required — Maya needs it to reach your clients on WhatsApp' }, { status: 400 })
    }

    // 1. Create Supabase auth user with a temporary password
    const tempPassword = `Trial${Math.random().toString(36).slice(2, 10)}!`
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: tempPassword,
      email_confirm: true, // skip email confirmation for trials
      user_metadata: { name, company, phone },
    })
    if (authError) {
      // User already exists
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        return NextResponse.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 409 })
      }
      throw authError
    }
    const userId = authData.user.id

    // 2. Create profile record
    await supabase.from('profiles').upsert({
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company?.trim() || null,
      phone: phone.trim(),
      plan: 'trial',
      trial_started_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'id' })

    // 3. Send welcome email via Supabase (reset password so they can set their own)
    await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email.trim().toLowerCase(),
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      },
    })

    // 4. Log the trial signup (simple notification — replace with email service later)
    console.log(`[trial] New signup: ${name} <${email}> ${company || ''} ${phone || ''}`)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[trial] error:', err)
    return NextResponse.json({ error: err.message || 'Signup failed. Please try again.' }, { status: 500 })
  }
}
