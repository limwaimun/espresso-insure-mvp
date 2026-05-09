// ── Shared claim helpers ─────────────────────────────────────────────────────
//
// Single canonical source for claim-related helpers and types. Used by both
// the client detail page (ClaimCard) and the claims-list page. Kept in sync
// with the `claims` table schema (B57+).
//
// Color values match the ClaimCard B61/B65 palette — a more refined and
// in-progress-aware set than the older claims-list locals.

import type { Alert } from './types'

// Claim shape — extends Alert with the schema fields added in B57+.
// Kept as a type intersection so existing rows queried as Alert still
// pass through; these fields are nullable until back-filled.
export type Claim = Alert & {
  claim_type?: string | null
  policy_id?: string | null
  estimated_amount?: string | number | null
  approved_amount?: string | number | null
  deductible_amount?: string | number | null
  incident_date?: string | null
  filed_date?: string | null
  insurer_claim_ref?: string | null
  insurer_handler_name?: string | null
  insurer_handler_contact?: string | null
  denial_reason?: string | null
  approved_at?: string | null
  denied_at?: string | null
  paid_at?: string | null
  closed_at?: string | null
}

export const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  approved: 'Approved',
  denied: 'Denied',
  paid: 'Paid',
}

export function statusLabel(s: string): string {
  return STATUS_LABELS[s] ?? s
}

export function statusColor(status: string): { bg: string; text: string } {
  if (status === 'paid' || status === 'approved') return { bg: '#E5F0EB', text: '#0F6E56' }
  if (status === 'denied') return { bg: '#F8E0E0', text: '#A32D2D' }
  if (status === 'in_progress') return { bg: '#E0EAF5', text: '#4A9EBF' }
  return { bg: '#FBF7EE', text: '#854F0B' }  // open
}

export function priorityColor(priority: string): { bg: string; text: string } {
  if (priority === 'high') return { bg: '#F8E0E0', text: '#A32D2D' }
  if (priority === 'medium') return { bg: '#FBF7EE', text: '#854F0B' }
  if (priority === 'low' || priority === 'info') return { bg: '#E6F1FB', text: '#185FA5' }
  return { bg: '#F1EFE8', text: '#6B6460' }
}

export function priorityLabel(priority: string): string {
  if (!priority) return '—'
  return priority.charAt(0).toUpperCase() + priority.slice(1).replace('_', ' ')
}

export function fmtMoney(v: string | number | null | undefined): string {
  if (v == null || v === '') return '—'
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (isNaN(n)) return '—'
  return `SGD ${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function daysBetween(later: string | Date, earlier: string | Date): number {
  const a = new Date(later).getTime()
  const b = new Date(earlier).getTime()
  return Math.floor((a - b) / 86400000)
}

export function daysAgo(d: string | Date): string {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return '1d ago'
  return `${days}d ago`
}

// Net payout = approved - deductible. Returns null if approved is missing
// or non-numeric. Treats missing deductible as 0.
export function netPayout(claim: Claim): number | null {
  const a = claim.approved_amount
  if (a == null || a === '') return null
  const aN = typeof a === 'string' ? parseFloat(a) : a
  if (isNaN(aN)) return null
  const d = claim.deductible_amount
  const dN = d == null || d === '' ? 0 : (typeof d === 'string' ? parseFloat(d) : d)
  return aN - (isNaN(dN) ? 0 : dN)
}

// Status-history "freshness" map: which timestamps reflect the row's
// current state (vs. ones it passed through but isn't in anymore).
// Used by ClaimCard expanded view to dim stale audit-trail rows.
const FRESH_BY_STATUS: Record<string, Set<string>> = {
  'open':        new Set<string>(),
  'in_progress': new Set<string>(),
  'approved':    new Set<string>(['Approved']),
  'denied':      new Set<string>(['Denied', 'Closed']),
  'paid':        new Set<string>(['Approved', 'Paid', 'Closed']),
}

export function freshLabelsForStatus(status: string): Set<string> {
  return FRESH_BY_STATUS[status] ?? new Set<string>()
}

// Open / Resolved / High-priority bucket helpers (used by both claims-list
// KPI cards and any future filtering logic).
export function isOpen(c: Pick<Claim, 'status'>): boolean {
  return c.status === 'open' || c.status === 'in_progress'
}

export function isResolved(c: Pick<Claim, 'status'>): boolean {
  return c.status === 'approved' || c.status === 'paid' || c.status === 'denied'
}
