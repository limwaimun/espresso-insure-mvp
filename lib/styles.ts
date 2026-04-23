// ── Shared UI styles ──────────────────────────────────────────────────────────
//
// Extracted from ClientDetailPage + HoldingsSection (identical definitions).
// Use these for any modal/form/button inside the dashboard to keep visuals
// consistent. Colors match the design tokens in the session handoff.

import type React from 'react'

export const inputStyle: React.CSSProperties = {
  width: '100%', background: '#FFFFFF', border: '0.5px solid #E8E2DA',
  borderRadius: 8, padding: '10px 13px', fontSize: 13, color: '#1A1410',
  outline: 'none', fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box',
}

export const labelStyle: React.CSSProperties = {
  fontSize: 11, color: '#6B6460', textTransform: 'uppercase',
  letterSpacing: '0.08em', marginBottom: 5, display: 'block',
}

export const btnPrimary: React.CSSProperties = {
  background: '#BA7517', color: '#F7F4F0', border: 'none',
  borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
  display: 'flex', alignItems: 'center', gap: 6,
}

export const btnOutline: React.CSSProperties = {
  background: 'transparent', color: '#6B6460', border: '0.5px solid #E8E2DA',
  borderRadius: 8, padding: '10px 20px', fontSize: 13,
  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
}

// Outlined amber "+ Add X" button — used consistently across Policies, Holdings, Claims
export const btnAddSection: React.CSSProperties = {
  fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#BA7517',
  background: 'transparent', border: '1px solid #BA7517', borderRadius: 6,
  padding: '6px 12px', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 4,
}
