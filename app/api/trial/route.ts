import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWelcomeEmail } from '@/lib/email'
import { sendWhatsAppTemplate, WA_TEMPLATES } from '@/lib/whatsapp'

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

// Normalise phone to digits-only (no +, no spaces) for consistent uniqueness checks.
// e.g. "+65 9123 4567" -> "6591234567"
function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '')
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
    const cleanPhone = phone.trim() // original format (e.g. +65...) for display
    const normalizedPhone = normalizePhone(cleanPhone)

    // ── Uniqueness check: mobile number ───────────────────────────────────
    // Profiles may store the phone with or without the + — match both.
    if (normalizedPhone) {
      const { data: existingPhoneProfiles } = await supabase
        .from('profiles')
        .select('id, email')
        .or(`phone.eq.+${normalizedPhone},phone.eq.${normalizedPhone}`)

      if (existingPhoneProfiles && existingPhoneProfiles.length > 0) {
        return NextResponse.json(
          {
            error: 'This mobile number is already linked to an Espresso account. Sign in with the email you used, or email hello@espresso.insure if this isn\'t you.',
            code: 'phone_in_use',
          },
          { status: 409 }
        )
      }
    }

    // ── Create the auth user ──────────────────────────────────────────────
    // email_confirm: true skips the "confirm your email" flow — they can sign
    // in immediately with the password they just chose.
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { name, company, phone: cleanPhone },
    })

    if (authError) {
      const msg = authError.message.toLowerCase()
      if (msg.includes('already') || msg.includes('registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in.', code: 'email_in_use' },
          { status: 409 }
        )
      }
      throw authError
    }

    const userId = authData.user.id

    // ── Create profile record ─────────────────────────────────────────────
    await supabase.from('profiles').upsert({
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      company: company?.trim() || null,
      phone: cleanPhone,
      plan: 'trial',
      trial_started_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'id' })

    console.log(`[trial] New signup: ${name} <${cleanEmail}> ${company || ''} ${cleanPhone}`)

    // ── Fire-and-forget welcome touchpoints ───────────────────────────────
    // Both run in the background and never block the signup response. If
    // either fails, the FA is still signed up and can use the product — we
    // just log the failure for later investigation.

    // 1. Welcome email via Resend
    sendWelcomeEmail({ to: cleanEmail, name: name.trim() })
      .then(result => {
        if (!result.ok) console.error('[trial] Welcome email failed:', result.error)
      })
      .catch(err => console.error('[trial] Welcome email threw:', err))

    // 2. Maya WhatsApp welcome (uses pre-approved Meta template)
    //    Requires Meta Business Manager template `espresso_welcome_fa` with
    //    one body parameter: {{1}} = FA name.
    sendWhatsAppTemplate({
      to: cleanPhone,
      templateName: WA_TEMPLATES.WELCOME_FA,
      bodyParams: [name.trim()],
    })
      .then(result => {
        if (!result.ok) console.error('[trial] Maya WhatsApp welcome failed:', result.error)
        else if (result.stubbed) console.log('[trial] Maya WhatsApp welcome stubbed (flag off)')
        else console.log(`[trial] Maya WhatsApp welcome sent: ${result.messageId}`)
      })
      .catch(err => console.error('[trial] Maya WhatsApp welcome threw:', err))

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[trial] error:', err)
    return NextResponse.json({ error: err.message || 'Signup failed. Please try again.' }, { status: 500 })
  }
}
