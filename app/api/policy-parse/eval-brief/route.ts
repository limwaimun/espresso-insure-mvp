/**
 * B-pe-16a — structured-output quality eval for Layer A (brief).
 *
 * Admin-only GET endpoint. Loads policies.parsed_summary (current
 * baseline) + unpdf-extracted text from policy_doc_chunks, then runs
 * a battery of quality checks:
 *
 *   1. Schema validation against ParsedPolicySummaryV1Schema
 *   2. Field presence (populated vs null vs empty-array)
 *   3. Hallucination check: numerical + key text fields must appear
 *      in source text using fuzzy format matching
 *   4. Sanity checks: date ranges, percent bounds, currency ISO
 *
 * Plain-text report output (browser-readable, no DevTools needed).
 *
 * Usage:
 *   GET /api/policy-parse/eval-brief?policy_id=<uuid>
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { ParsedPolicySummaryV1Schema } from '@/lib/policy-extraction/brief-schema'

export const runtime = 'nodejs'
export const maxDuration = 30

// ---------------------------------------------------------------------------
// Fuzzy-match helpers
// ---------------------------------------------------------------------------

function findNumberInText(value: number | null | undefined, text: string): string {
  if (value === null || value === undefined) return '(null)'

  const formats = new Set<string>([
    String(value),
    value.toLocaleString('en-US'),
    value.toFixed(2),
    value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  ])

  for (const f of formats) {
    if (text.includes(f)) return `FOUND as "${f}"`
  }
  return '*** NOT FOUND ***'
}

function findPercentInText(value: number | null | undefined, text: string): string {
  if (value === null || value === undefined) return '(null)'

  const formats = new Set<string>([
    `${value}%`,
    `${value} %`,
    `${value.toFixed(0)}%`,
    `${value.toFixed(1)}%`,
    `${value} percent`,
  ])

  for (const f of formats) {
    if (text.includes(f)) return `FOUND as "${f}"`
  }
  return '*** NOT FOUND ***'
}

function findDateInText(iso: string | null | undefined, text: string): string {
  if (!iso) return '(null)'
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return `BAD FORMAT: ${iso}`

  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])

  const monthLong = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const monthShort = monthLong.map((n) => n.slice(0, 3))

  const formats = new Set<string>([
    iso,
    `${day} ${monthLong[month - 1]} ${year}`,
    `${day} ${monthShort[month - 1]} ${year}`,
    `${monthLong[month - 1]} ${day}, ${year}`,
    `${monthShort[month - 1]} ${day}, ${year}`,
    `${day}/${month}/${year}`,
    `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
    `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`,
  ])

  const lowerText = text.toLowerCase()
  for (const f of formats) {
    if (lowerText.includes(f.toLowerCase())) return `FOUND as "${f}"`
  }
  return '*** NOT FOUND ***'
}

function findTextInText(value: string | null | undefined, text: string): string {
  if (!value) return '(null)'
  if (text.includes(value)) return `FOUND`
  if (text.toLowerCase().includes(value.toLowerCase()))
    return `FOUND (case-insensitive)`
  return '*** NOT FOUND ***'
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  // Authenticate
  const userSupabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await userSupabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 })
  }

  const { data: profile } = await userSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'admin_only' }, { status: 403 })
  }

  const policyId = req.nextUrl.searchParams.get('policy_id')
  if (!policyId) {
    return NextResponse.json(
      { ok: false, error: 'missing_policy_id' },
      { status: 400 },
    )
  }

  const supabase = createServiceRoleClient()

  // 1. Load policy + parsed_summary
  const { data: policy, error: pErr } = await supabase
    .from('policies')
    .select('id, parsed_summary, parse_model, parse_schema_version, parsed_at')
    .eq('id', policyId)
    .single()

  if (pErr || !policy) {
    return NextResponse.json(
      { ok: false, error: 'policy_not_found', message: pErr?.message },
      { status: 404 },
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsedSummary = (policy as any).parsed_summary
  if (!parsedSummary) {
    return NextResponse.json(
      { ok: false, error: 'no_parsed_summary', message: 'parsed_summary is null — run Layer A first' },
      { status: 404 },
    )
  }

  // 2. Load source text from chunks
  const { data: chunks, error: cErr } = await supabase
    .from('policy_doc_chunks')
    .select('content')
    .eq('policy_id', policyId)
    .order('chunk_index')

  if (cErr || !chunks || chunks.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'no_chunks', message: 'run Layer C (embed) first' },
      { status: 404 },
    )
  }

  const sourceText = chunks.map((c) => c.content || '').join('\n')

  // 3. Schema validation
  const schemaResult = ParsedPolicySummaryV1Schema.safeParse(parsedSummary)

  // 4. Field presence
  const allKeys = Object.keys(parsedSummary)
  const populated: string[] = []
  const nullKeys: string[] = []
  const emptyArrays: string[] = []
  for (const k of allKeys) {
    const v = parsedSummary[k]
    if (v === null || v === undefined) nullKeys.push(k)
    else if (Array.isArray(v) && v.length === 0) emptyArrays.push(k)
    else populated.push(k)
  }

  // 5. Hallucination checks — numerical money fields
  const moneyChecks = [
    ['annual_premium', findNumberInText(parsedSummary.annual_premium, sourceText)],
    ['sum_assured', findNumberInText(parsedSummary.sum_assured, sourceText)],
    ['annual_deductible', findNumberInText(parsedSummary.annual_deductible, sourceText)],
    ['co_insurance_percent', findPercentInText(parsedSummary.co_insurance_percent, sourceText)],
    ['co_insurance_cap', findNumberInText(parsedSummary.co_insurance_cap, sourceText)],
    ['annual_claim_limit', findNumberInText(parsedSummary.annual_claim_limit, sourceText)],
    ['lifetime_claim_limit', findNumberInText(parsedSummary.lifetime_claim_limit, sourceText)],
    ['premium_payment_term_years', findNumberInText(parsedSummary.premium_payment_term_years, sourceText)],
  ]

  // 6. Hallucination checks — dates
  const dateChecks = [
    ['issue_date', findDateInText(parsedSummary.issue_date, sourceText)],
    ['cover_start_date', findDateInText(parsedSummary.cover_start_date, sourceText)],
    ['renewal_date', findDateInText(parsedSummary.renewal_date, sourceText)],
    ['maturity_date', findDateInText(parsedSummary.maturity_date, sourceText)],
    ['premium_cessation_date', findDateInText(parsedSummary.premium_cessation_date, sourceText)],
    ['date_of_birth', findDateInText(parsedSummary.date_of_birth, sourceText)],
  ]

  // 7. Presence checks — high-signal text fields
  const textChecks = [
    ['policy_number', findTextInText(parsedSummary.policy_number, sourceText)],
    ['policyholder_name', findTextInText(parsedSummary.policyholder_name, sourceText)],
    ['insurer_name', findTextInText(parsedSummary.insurer_name, sourceText)],
    ['plan_name', findTextInText(parsedSummary.plan_name, sourceText)],
    ['product_family', findTextInText(parsedSummary.product_family, sourceText)],
    ['currency', findTextInText(parsedSummary.currency, sourceText)],
  ]

  const allChecks = [...moneyChecks, ...dateChecks, ...textChecks]
  const notFoundCount = allChecks.filter(([, r]) => r === '*** NOT FOUND ***').length

  // 8. Sanity checks
  const sanityIssues: string[] = []

  const parseDateYear = (d: string | null | undefined): number | null => {
    if (!d) return null
    const m = d.match(/^(\d{4})/)
    return m ? Number(m[1]) : null
  }
  const dateFields = [
    'issue_date', 'cover_start_date', 'renewal_date',
    'maturity_date', 'premium_cessation_date', 'date_of_birth',
  ]
  for (const df of dateFields) {
    const y = parseDateYear(parsedSummary[df])
    if (y !== null && (y < 1990 || y > 2080)) {
      sanityIssues.push(`${df} year ${y} outside plausible range 1990-2080`)
    }
  }

  const pct = parsedSummary.co_insurance_percent
  if (pct !== null && pct !== undefined && (pct < 0 || pct > 100)) {
    sanityIssues.push(`co_insurance_percent ${pct} outside 0-100`)
  }

  for (const numField of ['annual_premium', 'sum_assured', 'annual_deductible', 'co_insurance_cap']) {
    const v = parsedSummary[numField]
    if (v !== null && v !== undefined && v < 0) {
      sanityIssues.push(`${numField} ${v} is negative`)
    }
  }

  const validCurrencies = new Set(['SGD', 'USD', 'EUR', 'GBP', 'AUD', 'HKD', 'JPY', 'CNY', 'MYR', 'IDR', 'PHP', 'THB', 'VND'])
  if (parsedSummary.currency && !validCurrencies.has(parsedSummary.currency)) {
    sanityIssues.push(`currency "${parsedSummary.currency}" not in recognised ISO 4217 set`)
  }

  // 9. Render report
  const out: string[] = []
  const sep = (s: string) => `--- ${s} ---`

  out.push('========================================')
  out.push('  BRIEF EXTRACTION QUALITY EVAL')
  out.push('========================================')
  out.push(`Policy ID:     ${policyId}`)
  out.push(`Parse model:   ${(policy as any).parse_model ?? '(unknown)'}`)
  out.push(`Schema ver:    ${(policy as any).parse_schema_version ?? '(unknown)'}`)
  out.push(`Parsed at:     ${(policy as any).parsed_at ?? '(unknown)'}`)
  out.push(`Source text:   ${sourceText.length} chars, ${chunks.length} chunks`)
  out.push('')

  out.push(sep('SCHEMA VALIDATION'))
  if (schemaResult.success) {
    out.push('Result: VALID')
  } else {
    out.push('Result: FAILED')
    for (const issue of schemaResult.error.issues.slice(0, 10)) {
      out.push(`  - ${issue.path.join('.')}: ${issue.message}`)
    }
  }
  out.push('')

  out.push(sep('FIELD PRESENCE'))
  out.push(`Populated:    ${populated.length} / ${allKeys.length}`)
  out.push(`Null:         ${nullKeys.length} (${nullKeys.join(', ') || '—'})`)
  out.push(`Empty arrays: ${emptyArrays.length} (${emptyArrays.join(', ') || '—'})`)
  out.push('')

  const renderSection = (title: string, rows: (string | unknown)[][]) => {
    out.push(sep(title))
    const labelWidth = Math.max(...rows.map(([k]) => String(k).length)) + 2
    for (const [k, r] of rows) {
      const v = parsedSummary[String(k)]
      const vDisplay = v === null || v === undefined ? 'null' : String(v).slice(0, 35)
      out.push(`  ${String(k).padEnd(labelWidth)}  ${vDisplay.padEnd(38)}  ${r}`)
    }
    out.push('')
  }

  renderSection('HALLUCINATION CHECK — MONEY FIELDS', moneyChecks)
  renderSection('HALLUCINATION CHECK — DATES', dateChecks)
  renderSection('HALLUCINATION CHECK — KEY TEXT FIELDS', textChecks)

  out.push(sep('SANITY CHECKS'))
  if (sanityIssues.length === 0) {
    out.push('All passed.')
  } else {
    for (const i of sanityIssues) out.push(`  - ${i}`)
  }
  out.push('')

  out.push(sep('SUMMARY'))
  out.push(`Schema validation:    ${schemaResult.success ? 'PASS' : 'FAIL'}`)
  out.push(`Hallucinations:       ${notFoundCount} / ${allChecks.filter(([, r]) => r !== '(null)').length} non-null checks`)
  out.push(`Sanity issues:        ${sanityIssues.length}`)
  out.push('')

  out.push(sep('RAW PARSED OUTPUT'))
  out.push(JSON.stringify(parsedSummary, null, 2))
  out.push('')

  out.push('--- END EVAL ---')

  return new NextResponse(out.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
