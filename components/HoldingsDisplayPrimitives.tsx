// ── Holdings display primitives ───────────────────────────────────────────────
//
// Small presentational components used inside HoldingsSection rows.
// Currently scoped to holdings; promote to a generic module if reused
// in policies/claims later.

import type React from 'react'

export function PerfItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: 10, color: '#854F0B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 500, color: '#1A1410', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  )
}

export function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      <span style={{ fontSize: 13, color: '#1A1410' }}>{value}</span>
    </div>
  )
}
