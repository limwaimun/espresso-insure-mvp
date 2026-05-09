// Form-state utilities for the holdings add/edit modal.
// Extracted from HoldingsSection in Batch 41.
//
// Forms bind strings (all <input> and <select> values are strings). The DB
// stores typed values (numbers, nulls). These helpers are the two sides of
// that conversion:
//
//   holdingToFormValues : Holding  → HoldingFormValues   (DB → form)
//   formToPayload       : form     → HoldingPayload      (form → DB)
//
// ASSET_CLASSES / GEOGRAPHIES / SECTORS live here because they define the
// form dropdown option set.

import type { Holding } from '@/lib/types'

// ── Classification option lists ────────────────────────────────────────────

export const ASSET_CLASSES = [
  'Equity',
  'Fixed Income',
  'Multi-Asset',
  'Cash',
  'REIT',
  'Alternatives',
  'Structured',
  'Crypto',
  'Other',
] as const

export const GEOGRAPHIES = [
  'Global',
  'Singapore',
  'Asia ex-Japan',
  'Emerging Markets',
  'US',
  'Europe',
  'Japan',
  'Greater China',
  'ASEAN',
  'Other',
] as const

export const SECTORS = [
  'Diversified',
  'Corp credit',
  'Technology',
  'Financials',
  'Healthcare',
  'Consumer',
  'Energy',
  'Industrials',
  'Real estate',
  'Utilities',
  'Materials',
  'Communications',
  'Other',
] as const

// ── Form state shape ───────────────────────────────────────────────────────

export type HoldingFormValues = {
  product_type: string
  product_name: string
  provider: string
  platform: string
  units_held: string
  last_nav: string
  current_value: string
  currency: string
  risk_rating: string
  inception_date: string
  notes: string
  // Batch 8 classification
  asset_class: string
  asset_class_other: string
  geography: string
  geography_other: string
  sector: string
  sector_other: string
  avg_cost_price: string
  distribution_yield: string
}

export const DEFAULT_FORM: HoldingFormValues = {
  product_type: 'unit_trust',
  product_name: '',
  provider: '',
  platform: '',
  units_held: '',
  last_nav: '',
  current_value: '',
  currency: 'SGD',
  risk_rating: 'moderate',
  inception_date: '',
  notes: '',
  // Batch 8
  asset_class: '',
  asset_class_other: '',
  geography: '',
  geography_other: '',
  sector: '',
  sector_other: '',
  avg_cost_price: '',
  distribution_yield: '',
}

// ── DB → form ──────────────────────────────────────────────────────────────

export function holdingToFormValues(h: Holding): HoldingFormValues {
  return {
    product_type: h.product_type,
    product_name: h.product_name,
    provider: h.provider,
    platform: h.platform ?? '',
    units_held: h.units_held != null ? String(h.units_held) : '',
    last_nav: h.last_nav != null ? String(h.last_nav) : '',
    current_value: h.current_value != null ? String(h.current_value) : '',
    currency: h.currency,
    risk_rating: h.risk_rating ?? 'moderate',
    inception_date: h.inception_date ?? '',
    notes: h.notes ?? '',
    // Batch 8
    asset_class: h.asset_class ?? '',
    asset_class_other: h.asset_class_other ?? '',
    geography: h.geography ?? '',
    geography_other: h.geography_other ?? '',
    sector: h.sector ?? '',
    sector_other: h.sector_other ?? '',
    avg_cost_price: h.avg_cost_price != null ? String(h.avg_cost_price) : '',
    distribution_yield: h.distribution_yield != null ? String(h.distribution_yield) : '',
  }
}

// ── form → DB ──────────────────────────────────────────────────────────────

// Shape written to public.holdings on insert/update. Nullability mirrors
// the DB column definitions (see lib/types.ts — Holding interface).
//
// NOTE: preserves the existing behavior of writing form.risk_rating and
// form.currency as strings (never null), even though both DB columns allow
// null. If the user opens the risk_rating dropdown and picks the blank
// option, we currently write the literal empty string — flagged as a
// latent bug for a future fix-only batch, deliberately NOT addressed here
// so this refactor is a pure no-op on DB writes.
export type HoldingPayload = {
  client_id: string
  ifa_id: string
  product_type: string
  product_name: string
  provider: string
  platform: string | null
  units_held: number | null
  last_nav: number | null
  current_value: number | null
  currency: string
  risk_rating: string
  inception_date: string | null
  notes: string | null
  asset_class: string | null
  asset_class_other: string | null
  geography: string | null
  geography_other: string | null
  sector: string | null
  sector_other: string | null
  avg_cost_price: number | null
  distribution_yield: number | null
}

export function formToPayload(
  form: HoldingFormValues,
  clientId: string,
  faId: string,
): HoldingPayload {
  const autoValue = form.units_held && form.last_nav
    ? Number(form.units_held) * Number(form.last_nav)
    : null
  return {
    client_id: clientId,
    ifa_id: faId,
    product_type: form.product_type,
    product_name: form.product_name,
    provider: form.provider,
    platform: form.platform || null,
    units_held: form.units_held ? Number(form.units_held) : null,
    last_nav: form.last_nav ? Number(form.last_nav) : null,
    current_value: form.current_value ? Number(form.current_value) : autoValue,
    currency: form.currency,
    risk_rating: form.risk_rating,
    inception_date: form.inception_date || null,
    notes: form.notes || null,
    // Batch 8 classification + cost basis + yield
    asset_class:       form.asset_class       || null,
    asset_class_other: form.asset_class === 'Other' ? (form.asset_class_other || null) : null,
    geography:         form.geography         || null,
    geography_other:   form.geography === 'Other' ? (form.geography_other || null) : null,
    sector:            form.sector            || null,
    sector_other:      form.sector === 'Other' ? (form.sector_other || null) : null,
    avg_cost_price:    form.avg_cost_price    ? Number(form.avg_cost_price) : null,
    distribution_yield: form.distribution_yield ? Number(form.distribution_yield) : null,
  }
}
