// Maya prompt templates for holding-level actions.
// Extracted from HoldingsSection in Batch 40. Pure functions — each returns
// the { title, prompt } object that the Ask Maya stub modal displays.
//
// TYPE_LABELS lives here (not in lib/holdings.ts) because it's a
// human-readable rendering concern specific to these prompt strings. If
// another surface ever needs it, promote it to lib/holdings.ts then.

import type { Holding } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = {
  unit_trust: 'Unit trust',
  etf: 'ETF',
  ilp: 'ILP',
  annuity: 'Annuity',
  structured_product: 'Structured',
  other: 'Other',
}

export type MayaPrompt = { title: string; prompt: string }

export function buildHoldingReviewPrompt(h: Holding): MayaPrompt {
  return {
    title: `Review ${h.product_name} with Maya`,
    prompt: `Please review this holding for my client and share:
1. A short plain-English explanation of what this fund/product is
2. Its suitability given the client's risk rating (${h.risk_rating || 'unspecified'})
3. Any recent market context I should know before the next client review
4. Suggested talking points for the conversation

Holding: ${h.product_name}
Provider: ${h.provider}${h.platform ? ` (${h.platform})` : ''}
Type: ${TYPE_LABELS[h.product_type] || h.product_type}
Current value: ${h.currency} ${Number(h.current_value || 0).toLocaleString()}
Units: ${h.units_held ?? '—'} @ ${h.last_nav ?? '—'} (last NAV)
Inception: ${h.inception_date || '—'}
Last reviewed: ${h.last_reviewed_at ? new Date(h.last_reviewed_at).toLocaleDateString() : 'Never'}
Notes: ${h.notes || 'None'}`,
  }
}

export function buildHoldingUpdatePrompt(h: Holding): MayaPrompt {
  return {
    title: `Draft client update for ${h.product_name}`,
    prompt: `Draft a warm, concise update message I can send to my client about their ${h.product_name} holding.

Include:
- A friendly greeting using the client's first name
- A brief note on recent performance (current value ${h.currency} ${Number(h.current_value || 0).toLocaleString()})
- Any relevant market context for ${TYPE_LABELS[h.product_type] || h.product_type}
- An offer to discuss at the next review
- A warm sign-off

Keep it under 150 words. Tone: professional but personal.`,
  }
}
