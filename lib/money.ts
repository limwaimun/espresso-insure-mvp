// ── Money + percent formatters ──────────────────────────────────────────────
//
// Generic display helpers used across the dashboard. Not domain-specific.

export function formatMoney(n: number | null | undefined, currency = 'SGD'): string {
  if (n == null || isNaN(n)) return '—'
  const abs = Math.abs(n)
  const sign = n < 0 ? '−' : (n > 0 ? '+' : '')
  return `${sign}${currency} ${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

export function formatPct(n: number | null | undefined, decimals = 1): string {
  if (n == null || isNaN(n)) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(decimals)}%`
}
