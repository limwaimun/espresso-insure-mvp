// ── Holdings domain calculations ────────────────────────────────────────────
//
// Derived metrics from the canonical Holding row shape. Keep this file
// focused on math/business logic — no formatting, no UI concerns.

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
