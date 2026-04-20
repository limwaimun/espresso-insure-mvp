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

// Build the list of phone-format variants to check against the DB.
// Handles 3 storage formats we've seen in the wild:
//   1. "+6581267212" (current format — with + and country code)
//   2. "6581267212"  (normalized — no +, with country code)
//   3. "81267212"    (legacy format — local digits only, pre-country-code-dropdown)
//
// The third form assumes Singapore (+65). If the normalized phone starts with
// "65" and is longer than 8 digits, we also check the stripped local form.
function phoneVariantsForCheck(normalized: string): string[] {
  const variants = new Set<string>()
  variants.add(`+${normalized}`)
  variants.add(normalized)
  if (normalized.startsWith('65') && normalized.length > 8) {
    variants.add(normalized.slice(2)) // strip SG country code
  }
  return Array.from(variants)
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

    // ── Uniqueness check 1: email ──────────────────────────────────────────
    // Explicit pre-check so we can return a clear error rather than rely on
    // createUser's generic "already registered" response.
    const { data: existingEmailProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', cleanEmail)
      .limit(1)

    if (existingEmailProfiles && existingEmailProfiles.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.', code: 'email_in_use' },
        { status: 409 }
      )
    }

    // ── Uniqueness check 2: mobile number ─────────────────────────────────
    // Matches all known phone storage formats (see phoneVariantsForCheck).
    if (normalizedPhone) {
      const variants = phoneVariantsForCheck(normalizedPhone)
      const { data: existingPhoneProfiles } = await supabase
        .from('profiles')
        .select('id')
        .in('phone', variants)
        .limit(1)

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
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { name, company, phone: cleanPhone },
    })

    if (authError) {
      const msg = authError.message.toLowerCase()
      if (msg.includes('already') || msg.includes('registered')) {
        // Our pre-checks above should have caught this. If we hit it anyway,
        // something's in auth.users that isn't in profiles — likely a leftover
        // from a failed previous signup. Return honest message.
        return NextResponse.json(
          { error: 'An account with these details already exists. Please sign in, or email hello@espresso.insure for help.', code: 'account_exists' },
          { status: 409 }
        )
      }
      throw authError
    }

    const userId = authData.user.id

    // ── Create profile record (with error handling + orphan cleanup) ──────
    // If this fails, we delete the auth user we just created so the account
    // isn't left in a broken half-state (auth exists, profile doesn't).
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      company: company?.trim() || null,
      phone: cleanPhone,
      plan: 'trial',
      trial_started_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'id' })

    if (profileError) {
      console.error('[trial] Profile upsert failed:', profileError)
      // Roll back the auth user so retry works cleanly
      await supabase.auth.admin.deleteUser(userId).catch(cleanupErr =>
        console.error('[trial] Orphan auth user cleanup failed:', cleanupErr)
      )
      return NextResponse.json(
        { error: 'We couldn\'t complete your signup. Please try again, or email hello@espresso.insure for help.', code: 'profile_create_failed' },
        { status: 500 }
      )
    }

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
