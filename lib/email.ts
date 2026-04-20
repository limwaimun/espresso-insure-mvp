// lib/email.ts
//
// Wraps Resend for sending transactional emails from Espresso.
// All sends are designed to be fire-and-forget — if Resend is down or not
// configured, the caller's flow should continue. Errors are logged, not thrown.

import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = process.env.RESEND_FROM_EMAIL || 'Espresso <hello@espresso.insure>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://espresso-mvp.vercel.app'

// Lazily constructed so missing keys don't crash at import time.
function getResend(): Resend | null {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — email sends will be no-ops')
    return null
  }
  return new Resend(RESEND_API_KEY)
}

// Strip any leading/trailing whitespace & trim to a sensible length.
function safeText(s: string | undefined | null, max = 200): string {
  return (s || '').trim().slice(0, max)
}

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const resend = getResend()
  if (!resend) return { ok: false, error: 'RESEND_API_KEY not set' }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    })
    if (error) {
      console.error('[email] Resend error:', error)
      return { ok: false, error: error.message || 'Unknown Resend error' }
    }
    return { ok: true, id: data?.id }
  } catch (err: any) {
    console.error('[email] Send failed:', err)
    return { ok: false, error: err?.message || 'Send failed' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Welcome email for new FA signups
// ─────────────────────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(params: {
  to: string
  name: string
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const name = safeText(params.name, 80) || 'there'
  const dashboardUrl = `${APP_URL}/dashboard`

  const subject = 'Welcome to Espresso ☕ — let\'s set you up'

  // Plain-text fallback (shown in clients that don't render HTML, and affects deliverability)
  const text = `Hi ${name},

Welcome to Espresso. Your 14-day free trial is live, and Maya has just sent you a WhatsApp to say hi.

Here's how to get the most out of the next 14 days:

1. Import your book (5 minutes)
Click "Import clients" on your dashboard and drop in any CSV, Excel, or PDF export from your CRM or insurer portal. Maya parses it, matches existing clients, and flags anything messy — no templates, no specific format required.

2. Review what Maya flagged
If there are missing premiums, unclear statuses, or possible duplicates, Maya walks you through them conversationally.

3. Connect a client to WhatsApp
On any client's detail page, click "Set up WhatsApp group." Maya joins the chat and handles client questions in real time — renewals, claims, coverage questions. You stay in the loop without being in the middle of every message.

What to expect from Maya:
Maya is quiet by default. She surfaces what needs your attention on your dashboard home — renewals coming due, lapsed policies, coverage gaps, claims that need prefilling. She doesn't take actions without your okay.

Get started: ${dashboardUrl}

Need help? Reply to this email and I'll personally get back within a day.

Wayne
Founder, Espresso
`

  // Simple HTML version — minimal styles, works in all email clients
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welcome to Espresso</title>
</head>
<body style="margin: 0; padding: 0; background: #F7F4F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1A1410;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 24px;">
    <div style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 32px; color: #1A1410; margin-bottom: 32px;">
      espresso<span style="color: #BA7517;">.</span>
    </div>
    <div style="background: #FFFFFF; border: 0.5px solid #E8E2DA; border-radius: 14px; padding: 36px 32px;">
      <h1 style="font-size: 22px; font-weight: 500; margin: 0 0 18px; line-height: 1.3;">Welcome to Espresso ☕</h1>
      <p style="font-size: 15px; line-height: 1.7; margin: 0 0 22px; color: #3D3532;">Hi ${name},</p>
      <p style="font-size: 15px; line-height: 1.7; margin: 0 0 22px; color: #3D3532;">
        Your 14-day free trial is live, and Maya has just sent you a WhatsApp to say hi.
      </p>
      <p style="font-size: 15px; line-height: 1.7; margin: 0 0 10px; color: #3D3532;">
        Here's how to get the most out of the next 14 days:
      </p>

      <div style="margin: 22px 0 4px;">
        <div style="font-size: 15px; font-weight: 500; margin-bottom: 6px; color: #1A1410;">1. Import your book (5 minutes)</div>
        <p style="font-size: 14px; line-height: 1.7; margin: 0 0 18px; color: #5F5A57;">
          Click "Import clients" on your dashboard and drop in any CSV, Excel, or PDF export from your CRM or insurer portal. Maya parses it, matches existing clients, and flags anything messy — no templates, no specific format required.
        </p>

        <div style="font-size: 15px; font-weight: 500; margin-bottom: 6px; color: #1A1410;">2. Review what Maya flagged</div>
        <p style="font-size: 14px; line-height: 1.7; margin: 0 0 18px; color: #5F5A57;">
          If there are missing premiums, unclear statuses, or possible duplicates, Maya walks you through them conversationally.
        </p>

        <div style="font-size: 15px; font-weight: 500; margin-bottom: 6px; color: #1A1410;">3. Connect a client to WhatsApp</div>
        <p style="font-size: 14px; line-height: 1.7; margin: 0 0 22px; color: #5F5A57;">
          On any client's detail page, click "Set up WhatsApp group." Maya joins the chat and handles client questions in real time — renewals, claims, coverage questions. You stay in the loop without being in the middle of every message.
        </p>
      </div>

      <div style="background: #F7F4F0; border-radius: 10px; padding: 16px 18px; margin: 22px 0;">
        <div style="font-size: 13px; font-weight: 500; margin-bottom: 4px; color: #1A1410;">What to expect from Maya</div>
        <p style="font-size: 13px; line-height: 1.7; margin: 0; color: #5F5A57;">
          Maya is quiet by default. She surfaces what needs your attention on your dashboard home — renewals coming due, lapsed policies, coverage gaps, claims that need prefilling. She doesn't take actions without your okay.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0 8px;">
        <a href="${dashboardUrl}" style="display: inline-block; background: #BA7517; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 500; padding: 12px 28px; border-radius: 8px;">Go to your dashboard →</a>
      </div>

      <p style="font-size: 13px; line-height: 1.7; margin: 28px 0 0; color: #9B9088;">
        Need help? Reply to this email and I'll personally get back within a day.
      </p>

      <p style="font-size: 14px; line-height: 1.7; margin: 22px 0 0; color: #3D3532;">
        Wayne<br>
        <span style="color: #9B9088; font-size: 13px;">Founder, Espresso</span>
      </p>
    </div>
    <p style="font-size: 11px; color: #9B9088; text-align: center; margin-top: 24px; line-height: 1.6;">
      You're receiving this because you signed up for an Espresso free trial.<br>
      Espresso · Singapore
    </p>
  </div>
</body>
</html>`

  return sendEmail({ to: params.to, subject, html, text })
}
