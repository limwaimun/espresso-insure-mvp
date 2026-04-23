// ── Holdings domain logic ─────────────────────────────────────────────────
//
// Calculations, derived display helpers, and other holdings-specific logic
// derived from the canonical Holding row shape. Kept free of React/UI
// dependencies so server and client code can both import from here.

import type { Holding } from '@/lib/types'

export function calcPnl(h: Holding) {
  const value = Number(h.current_value) || 0
  const cost  = Number(h.avg_cost_price) || 0
  const units = Number(h.units_held) || 0
  if (!cost || !units || !value) return null
  const totalCost = cost * units
  const absolute = value - totalCost
  const percent = (absolute / totalCost) * 100
  // Annualize only if we know inception and it's been >= 1 year
  let annualized: number | null = null
  if (h.inception_date) {
    const years = (Date.now() - new Date(h.inception_date).getTime()) / (365.25 * 86400000)
    if (years >= 1 && totalCost > 0) {
      annualized = (Math.pow(value / totalCost, 1 / years) - 1) * 100
    }
  }
  return { totalCost, absolute, percent, annualized }
}

export function calcAnnualIncome(h: Holding): number | null {
  const yield_ = Number(h.distribution_yield) || 0
  const value  = Number(h.current_value) || 0
  if (!yield_ || !value) return null
  return (yield_ / 100) * value
}


export function reviewPill(last_reviewed_at: string | null): { cls: string; text: string } {
  if (!last_reviewed_at) return { cls: 'pill-red', text: 'Never reviewed' }
  const days = Math.floor((Date.now() - new Date(last_reviewed_at).getTime()) / 86400000)
  if (days <= 30)  return { cls: 'pill-green', text: days === 0 ? 'Today' : `Reviewed ${days}d ago` }
  if (days <= 180) return { cls: 'pill-amber', text: `Reviewed ${days}d ago` }
  return                   { cls: 'pill-red',   text: `Reviewed ${days}d ago` }
}

export function heldDuration(inception: string): string {
  const months = Math.floor((Date.now() - new Date(inception).getTime()) / (30.44 * 86400000))
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y === 0) return `${m}m`
  if (m === 0) return `${y}y`
  return `${y}y ${m}m`
}
