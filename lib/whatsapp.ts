// lib/whatsapp.ts
//
// Wraps the Meta Cloud API for sending WhatsApp messages.
//
// Two modes:
//   - sendWhatsAppText(to, body): free-form text, only works inside the
//     24-hour "customer service window" (i.e. the recipient messaged us first
//     in the last 24 hours). Used by Maya when replying to a client or FA.
//
//   - sendWhatsAppTemplate(to, templateName, params): pre-approved Meta
//     template. Required for cold-start outbound (e.g. Maya welcoming a new
//     FA after signup, proactive renewal reminders).
//     Templates must be submitted & approved in Meta Business Manager before
//     they can be used. Our canonical template names are documented below.
//
// Feature flag: WHATSAPP_ENABLED must be "true" for real sends.
// When disabled (or missing env vars), we log what would have been sent and
// return a success-like result so callers can treat the call as fire-and-forget.

const WHATSAPP_ENABLED = process.env.WHATSAPP_ENABLED === 'true'
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const GRAPH_API_VERSION = 'v18.0'

// Canonical template names — these MUST match what's registered in
// Meta Business Manager → WhatsApp Manager → Message Templates.
export const WA_TEMPLATES = {
  // Sent to a new FA right after signup. Body variables: {{1}} = FA name.
  // Category: UTILITY, Language: en
  WELCOME_FA: 'espresso_welcome_fa',
} as const

export type WhatsAppResult = {
  ok: boolean
  messageId?: string
  error?: string
  stubbed?: boolean // true if WHATSAPP_ENABLED is off — means call was a log-only no-op
}

// Normalise a phone number to Meta's expected format: digits only, no +.
// Meta accepts "6591234567" — no leading +, no spaces, no dashes.
function normalizeTo(phone: string): string {
  return phone.replace(/[^\d]/g, '')
}

async function postToMeta(payload: unknown): Promise<WhatsAppResult> {
  if (!WHATSAPP_ENABLED) {
    console.log('[whatsapp] Stubbed (WHATSAPP_ENABLED=false):', JSON.stringify(payload))
    return { ok: true, stubbed: true }
  }
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.error('[whatsapp] WHATSAPP_ENABLED=true but WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID is missing')
    return { ok: false, error: 'WhatsApp not configured' }
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      const errMsg = data?.error?.message || `HTTP ${res.status}`
      console.error('[whatsapp] Meta API error:', errMsg, data)
      return { ok: false, error: errMsg }
    }

    const messageId = data?.messages?.[0]?.id
    return { ok: true, messageId }
  } catch (err: any) {
    console.error('[whatsapp] Network error:', err)
    return { ok: false, error: err?.message || 'Network error' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// sendWhatsAppText — free-form text reply (24h window only)
// ─────────────────────────────────────────────────────────────────────────────

export async function sendWhatsAppText(to: string, body: string): Promise<WhatsAppResult> {
  const toNorm = normalizeTo(to)
  if (!toNorm) return { ok: false, error: 'Invalid phone number' }
  if (!body?.trim()) return { ok: false, error: 'Empty message body' }

  return postToMeta({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: toNorm,
    type: 'text',
    text: { body: body.slice(0, 4096) }, // Meta caps at 4096 chars
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// sendWhatsAppTemplate — pre-approved template (cold-start capable)
// ─────────────────────────────────────────────────────────────────────────────
//
// Usage:
//   await sendWhatsAppTemplate({
//     to: '+6591234567',
//     templateName: WA_TEMPLATES.WELCOME_FA,
//     bodyParams: [faName],
//     languageCode: 'en',
//   })

export async function sendWhatsAppTemplate(params: {
  to: string
  templateName: string
  bodyParams?: string[]
  languageCode?: string
}): Promise<WhatsAppResult> {
  const toNorm = normalizeTo(params.to)
  if (!toNorm) return { ok: false, error: 'Invalid phone number' }

  const components = params.bodyParams?.length
    ? [{
        type: 'body',
        parameters: params.bodyParams.map(text => ({ type: 'text', text })),
      }]
    : []

  return postToMeta({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: toNorm,
    type: 'template',
    template: {
      name: params.templateName,
      language: { code: params.languageCode || 'en' },
      components,
    },
  })
}
