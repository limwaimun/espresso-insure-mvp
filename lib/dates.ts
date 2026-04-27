// ── Date formatting utilities ────────────────────────────────────────────────

export const formatDate = (d: string | null | undefined) => {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return '—' }
}

export const formatRelativeTime = (dateStr: string) => {
  if (!dateStr) return '—'
  try {
    const now = new Date()
    const date = new Date(dateStr)
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return '—' }
}


// ── Claim date sequencing validation ─────────────────────────────────────────
//
// Used by both /api/claim-update and EditClaimModal to enforce pairwise
// ordering constraints on claim dates. Accepts ISO date strings (YYYY-MM-DD)
// AND full ISO timestamps (YYYY-MM-DDTHH:MM:SSZ) — normalises by taking the
// date portion before comparing. Returns the FIRST violation as a human-
// readable message; server (400 response) and form (setError) use the same
// string for consistency.
//
// Rule set (each rule applies only if both dates exist):
//   incident_date <= filed_date / approved_at / denied_at / paid_at
//   filed_date    <= approved_at / denied_at / paid_at
//   approved_at   <= paid_at

type ClaimDates = {
  incident_date?: string | null
  filed_date?: string | null
  approved_at?: string | null
  denied_at?: string | null
  paid_at?: string | null
}

// Normalise to YYYY-MM-DD for string comparison. Accepts plain date strings
// or full ISO timestamps. Returns null if the value isn't usable.
const dateOnly = (v: string | null | undefined): string | null => {
  if (!v) return null
  const m = v.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : null
}

export const validateClaimDateSequence = (c: ClaimDates): { ok: true } | { ok: false; error: string } => {
  const incident = dateOnly(c.incident_date)
  const filed    = dateOnly(c.filed_date)
  const approved = dateOnly(c.approved_at)
  const denied   = dateOnly(c.denied_at)
  const paid     = dateOnly(c.paid_at)

  // Check: if both exist and a > b, return the violation message.
  const check = (a: string | null, aLabel: string, b: string | null, bLabel: string): string | null =>
    (a && b && a > b) ? `${aLabel} can't be after ${bLabel}.` : null

  const violations = [
    check(incident, 'Incident date', filed,    'filed date'),
    check(incident, 'Incident date', approved, 'approved date'),
    check(incident, 'Incident date', denied,   'denied date'),
    check(incident, 'Incident date', paid,     'paid date'),
    check(filed,    'Filed date',    approved, 'approved date'),
    check(filed,    'Filed date',    denied,   'denied date'),
    check(filed,    'Filed date',    paid,     'paid date'),
    check(approved, 'Approved date', paid,     'paid date'),
  ]

  const firstError = violations.find(v => v !== null)
  return firstError ? { ok: false, error: firstError } : { ok: true }
}
