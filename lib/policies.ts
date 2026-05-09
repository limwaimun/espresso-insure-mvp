// ── Shared policy helpers ────────────────────────────────────────────────
//
// Single canonical source for policy-related helpers used by both PolicyRow
// (client detail page) and the renewals-list page. Mirrors lib/claims.ts
// (B80a) — extracted helpers, bucket filters, status pill derivation.

import type { Policy } from './types'

export type { Policy }

// ── Days-to-renewal ─────────────────────────────────────────────────────

export function daysToRenewal(policy: Pick<Policy, 'renewal_date'>): number | null {
  if (!policy.renewal_date) return null
  return Math.ceil((new Date(policy.renewal_date).getTime() - Date.now()) / 86400000)
}

// ── Status pill derivation ──────────────────────────────────────────────
//
// Returns the className + label for the policy status pill. Uses
// globals.css pill-* classes which are shared across the app.
//
// Logic matches PolicyRow.renderStatus() exactly (B81a extracted from
// there). The pill encodes urgency via both class (color) AND text
// (day count) — so renewals page can drop its separate Days column.

export function policyStatusPill(policy: Pick<Policy, 'status' | 'renewal_date'>): { cls: string; text: string } {
  if (policy.status === 'lapsed') return { cls: 'pill-red', text: 'Lapsed' }
  if (policy.status === 'cancelled') return { cls: 'pill-neutral', text: 'Cancelled' }
  if (policy.status === 'pending') return { cls: 'pill-amber', text: 'Pending' }
  if (!policy.renewal_date) return { cls: 'pill-green', text: 'Active' }
  const days = daysToRenewal(policy) ?? 0
  if (days < 0) return { cls: 'pill-amber', text: 'Overdue renewal' }
  if (days <= 30) return { cls: 'pill-red', text: `Due in ${days}d` }
  if (days <= 90) return { cls: 'pill-amber', text: `${days}d to renewal` }
  return { cls: 'pill-green', text: `Renews in ${days}d` }
}

// ── Renewal buckets ─────────────────────────────────────────────────────
//
// Renewals page uses these to compute KPI counts and as filter values.
// Buckets are mutually exclusive and cover all policies:
//   - 'lapsed': renewal_date in the past
//   - 'urgent': 0-30 days to renewal
//   - 'action_needed': 31-60 days
//   - 'under_review': 61-90 days
//   - 'upcoming': 91+ days OR no renewal date set
//
// Note: lapsed here means 'past renewal date' — separate from the
// Policy.status === 'lapsed' field (which is set explicitly by the FA).
// Most past-renewal policies aren't marked lapsed in the DB until the
// FA confirms.

export type RenewalBucket = 'lapsed' | 'urgent' | 'action_needed' | 'under_review' | 'upcoming'

export function renewalBucket(policy: Pick<Policy, 'renewal_date'>): RenewalBucket {
  const days = daysToRenewal(policy)
  if (days === null) return 'upcoming'
  if (days < 0) return 'lapsed'
  if (days <= 30) return 'urgent'
  if (days <= 60) return 'action_needed'
  if (days <= 90) return 'under_review'
  return 'upcoming'
}

export function isLapsed(policy: Pick<Policy, 'renewal_date'>): boolean {
  return renewalBucket(policy) === 'lapsed'
}

export function isUrgent(policy: Pick<Policy, 'renewal_date'>): boolean {
  return renewalBucket(policy) === 'urgent'
}

export function isActionNeeded(policy: Pick<Policy, 'renewal_date'>): boolean {
  return renewalBucket(policy) === 'action_needed'
}

export function isUnderReview(policy: Pick<Policy, 'renewal_date'>): boolean {
  return renewalBucket(policy) === 'under_review'
}

// ── Premium math ────────────────────────────────────────────────────────

const FREQ_MULT: Record<string, number> = {
  'monthly': 12,
  'quarterly': 4,
  'half-yearly': 2,
  'annual': 1,
  'single': 1,
}

// Annualized total = base premium × frequency multiplier. Used in
// PolicyRow expanded view's Money section. Falls back to annual.
export function annualPremium(policy: Pick<Policy, 'premium' | 'premium_frequency'>): number {
  const freq = (policy.premium_frequency || 'annual').toLowerCase()
  const base = Number(policy.premium) || 0
  return base * (FREQ_MULT[freq] ?? 1)
}
