/**
 * B-pe-16d — Gemini Flash 2.5 full-brief extraction with inline quality eval.
 *
 * Admin-only GET endpoint. Parallel to /api/policy-parse/eval-brief but
 * runs Gemini Flash 2.5 with the full ParsedPolicySummaryV1 schema instead
 * of reading the saved Haiku baseline. Does NOT persist to policies.parsed_summary.
 *
 * Same quality checks as eval-brief so the two reports can be compared visually:
 *   - Schema validation against ParsedPolicySummaryV1Schema (Zod)
 *   - Field presence (populated vs null vs empty arrays)
 *   - Hallucination checks (money + dates + key text) against unpdf source
 *   - Sanity checks (date ranges, percent bounds, currency ISO)
 *
 * Output: plain-text report, browser-readable.
 *
 * Usage:
 *   GET /api/policy-parse/gemini-brief?policy_id=<uuid>
 *
 * Compare with: /api/policy-parse/eval-brief?policy_id=<uuid> (Haiku baseline)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { GoogleGenAI } from '@google/genai'
import {
  ParsedPolicySummaryV1Schema,
  PARSE_BRIEF_TOOL_DEFINITION,
} from '@/lib/policy-extraction/brief-schema'

export const runtime = 'nodejs'
export const maxDuration = 60

const MODEL = 'gemini-2.5-flash'
const COST_PER_INPUT_TOKEN = 0.3 / 1_000_000
const COST_PER_OUTPUT_TOKEN = 2.5 / 1_000_000

const SYSTEM_PROMPT = `You are a Singapore insurance policy data extraction assistant. Read the provided policy text and extract the requested fields into the structured JSON output.

Rules:
1. Use null for fields not stated in the document. Do NOT infer, guess, or compute values not present in the source text.
2. For numerical fields, extract as a number (no currency symbol, no commas).
3. For dates, use ISO format YYYY-MM-DD.
4. For percentages, use the number value (e.g., 10 for 10%).
5. NRIC must be masked: S followed by mask + last 4 chars (e.g., SXXXXXXX-J). Never include a fully unredacted NRIC.
6. For Singapore Integrated Shield Plans, deductible and co_insurance fields are mandatory.
7. For non-IS policies, those fields should be null.
8. extraction_confidence reflects overall PDF quality: high (clean structured), medium (partial), low (scanned/fragmentary).
9. fields_with_low_confidence lists field names where extraction was uncertain. Empty array if none.
10. notable_exclusions: 5-10 most consequential exclusions, summarized.
11. fa_review_flags: any "FA note" annotations or things flagged for advisor review. Empty array if none.`

// ---------------------------------------------------------------------------
// Convert Anthropic JSON Schema (type: [X, 'null']) → OpenAPI 3.0 (nullable: true)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertSchema(schema: any): any {
  if (Array.isArray(schema)) return schema.map(convertSchema)
  if (!schema || typeof schema !== 'object') return schema

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: any = { ...schema }

  // type: [X, 'null'] → type: X, nullable: true
  if (Array.isArray(out.type)) {
    const types = out.type.filter((t: unknown) => t !== 'null')
    if (types.length === 1 && out.type.includes('null')) {
      out.type = types[0]
      out.nullable = true
    }
  }

  if (out.properties && typeof out.properties === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newProps: any = {}
    for (const [k, v] of Object.entries(out.properties)) {
      newProps[k] = convertSchema(v)
    }
    out.properties = newProps
  }
  if (out.items) out.items = convertSchema(out.items)

  return out
}

// ---------------------------------------------------------------------------
// Hallucination check helpers (parallel to eval-brief)
// ---------------------------------------------------------------------------

function findNumberInText(value: number | null | undefined, text: string): string {
  if (value === null || value === undefined) return '(null)'
  const formats = new Set<string>([
    String(value),
    value.toLocaleString('en-US'),
    value.toFixed(2),
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  ])
  for (const f of formats) if (text.includes(f)) return `FOUND as "${f}"`
  return '*** NOT FOUND ***'
}

function findPercentInText(value: number | null | undefined, text: string): string {
  if (value === null || value === undefined) return '(null)'
  const formats = new Set<string>([
    `${value}%`, `${value} %`, `${value.toFixed(0)}%`, `${value.toFixed(1)}%`, `${value} percent`,
  ])
  for (const f of formats) if (text.includes(f)) return `FOUND as "${f}"`
  return '*** NOT FOUND ***'
}

function findDateInText(iso: string | null | undefined, text: string): string {
  if (!iso) return '(null)'
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return `BAD FORMAT: ${iso}`
  const year = Number(m[1]); const month = Number(m[2]); const day = Number(m[3])
  const monthLong = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const monthShort = monthLong.map(n => n.slice(0,3))
  const formats = new Set<string>([
    iso,
    `${day} ${monthLong[month-1]} ${year}`,
    `${day} ${monthShort[month-1]} ${year}`,
    `${monthLong[month-1]} ${day}, ${year}`,
    `${monthShort[month-1]} ${day}, ${year}`,
    `${day}/${month}/${year}`,
    `${String(day).padStart(2,'0')}/${String(month).padStart(2,'0')}/${year}`,
    `${String(day).padStart(2,'0')}-${String(month).padStart(2,'0')}-${year}`,
  ])
  const lower = text.toLowerCase()
  for (const f of formats) if (lower.includes(f.toLowerCase())) return `FOUND as "${f}"`
  return '*** NOT FOUND ***'
}

function findTextInText(value: string | null | undefined, text: string): string {
  if (!value) return '(null)'
  if (text.includes(value)) return 'FOUND'
  if (text.toLowerCase().includes(value.toLowerCase())) return 'FOUND (case-insensitive)'
  return '*** NOT FOUND ***'
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const t_start = Date.now()

  const userSupabase = await createClient()
  const { data: { user }, error: authErr } = await userSupabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 })
  }
  const { data: profile } = await userSupabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'admin_only' }, { status: 403 })
  }

  const policyId = req.nextUrl.searchParams.get('policy_id')
  if (!policyId) {
    return NextResponse.json({ ok: false, error: 'missing_policy_id' }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'env_missing_GEMINI_API_KEY' }, { status: 500 })
  }

  const supabase = createServiceRoleClient()

  // Load source text from chunks
  const { data: chunks, error: cErr } = await supabase
    .from('policy_doc_chunks')
    .select('content')
    .eq('policy_id', policyId)
    .order('chunk_index')

  if (cErr || !chunks || chunks.length === 0) {
    return NextResponse.json({ ok: false, error: 'no_chunks' }, { status: 404 })
  }
  const sourceText = chunks.map(c => c.content || '').join('\n')

  // Build Gemini-compatible schema from the existing Anthropic tool definition
  const geminiSchema = convertSchema(PARSE_BRIEF_TOOL_DEFINITION.input_schema)

  // Call Gemini
  const t_call_start = Date.now()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let response: any
  try {
    const ai = new GoogleGenAI({ apiKey })
    response = await ai.models.generateContent({
      model: MODEL,
      contents: `${SYSTEM_PROMPT}\n\n--- POLICY TEXT ---\n${sourceText}\n--- END OF POLICY TEXT ---\n\nExtract all requested fields into the structured output.`,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: geminiSchema,
        temperature: 0,
      },
    })
  } catch (err) {
    const e = err as Error & { status?: number; name?: string }
    return NextResponse.json({
      ok: false,
      errorType: 'gemini_call',
      errorName: e.name ?? 'Unknown',
      errorMessage: e.message ?? String(err),
      errorStatus: e.status,
      stack: (e.stack ?? '').split('\n').slice(0, 15).join('\n'),
      timing: { call_ms_until_crash: Date.now() - t_call_start },
    }, { status: 500 })
  }
  const t_call_ms = Date.now() - t_call_start

  const rawText: string = response.text ?? ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsedRaw: any = null
  let parseError: string | null = null
  try { parsedRaw = JSON.parse(rawText) } catch (e) { parseError = (e as Error).message }

  const usage = response.usageMetadata ?? {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const promptTokens: number = (usage as any).promptTokenCount ?? 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidateTokens: number = (usage as any).candidatesTokenCount ?? 0
  const costUsd = promptTokens * COST_PER_INPUT_TOKEN + candidateTokens * COST_PER_OUTPUT_TOKEN

  // If JSON parse failed, return diagnostic immediately
  if (parseError || !parsedRaw) {
    return NextResponse.json({
      ok: false,
      errorType: 'json_parse',
      parseError,
      rawText: rawText.slice(0, 2000),
      usage: { promptTokens, candidateTokens },
      timing: { call_ms: t_call_ms },
    }, { status: 500 })
  }

  // Schema validation
  const schemaResult = ParsedPolicySummaryV1Schema.safeParse(parsedRaw)

  // Field presence
  const allKeys = Object.keys(parsedRaw)
  const populated: string[] = []
  const nullKeys: string[] = []
  const emptyArrays: string[] = []
  for (const k of allKeys) {
    const v = parsedRaw[k]
    if (v === null || v === undefined) nullKeys.push(k)
    else if (Array.isArray(v) && v.length === 0) emptyArrays.push(k)
    else populated.push(k)
  }

  // Hallucination checks
  const moneyChecks: [string, string][] = [
    ['annual_premium', findNumberInText(parsedRaw.annual_premium, sourceText)],
    ['sum_assured', findNumberInText(parsedRaw.sum_assured, sourceText)],
    ['annual_deductible', findNumberInText(parsedRaw.annual_deductible, sourceText)],
    ['co_insurance_percent', findPercentInText(parsedRaw.co_insurance_percent, sourceText)],
    ['co_insurance_cap', findNumberInText(parsedRaw.co_insurance_cap, sourceText)],
    ['annual_claim_limit', findNumberInText(parsedRaw.annual_claim_limit, sourceText)],
    ['lifetime_claim_limit', findNumberInText(parsedRaw.lifetime_claim_limit, sourceText)],
    ['premium_payment_term_years', findNumberInText(parsedRaw.premium_payment_term_years, sourceText)],
  ]
  const dateChecks: [string, string][] = [
    ['issue_date', findDateInText(parsedRaw.issue_date, sourceText)],
    ['cover_start_date', findDateInText(parsedRaw.cover_start_date, sourceText)],
    ['renewal_date', findDateInText(parsedRaw.renewal_date, sourceText)],
    ['maturity_date', findDateInText(parsedRaw.maturity_date, sourceText)],
    ['premium_cessation_date', findDateInText(parsedRaw.premium_cessation_date, sourceText)],
    ['date_of_birth', findDateInText(parsedRaw.date_of_birth, sourceText)],
  ]
  const textChecks: [string, string][] = [
    ['policy_number', findTextInText(parsedRaw.policy_number, sourceText)],
    ['policyholder_name', findTextInText(parsedRaw.policyholder_name, sourceText)],
    ['insurer_name', findTextInText(parsedRaw.insurer_name, sourceText)],
    ['plan_name', findTextInText(parsedRaw.plan_name, sourceText)],
    ['product_family', findTextInText(parsedRaw.product_family, sourceText)],
    ['currency', findTextInText(parsedRaw.currency, sourceText)],
  ]
  const allChecks = [...moneyChecks, ...dateChecks, ...textChecks]
  const notFoundCount = allChecks.filter(([, r]) => r === '*** NOT FOUND ***').length
  const checkedCount = allChecks.filter(([, r]) => r !== '(null)').length

  // Sanity checks
  const sanityIssues: string[] = []
  const parseYear = (d: string | null | undefined): number | null => {
    if (!d) return null; const m = d.match(/^(\d{4})/); return m ? Number(m[1]) : null
  }
  for (const f of ['issue_date','cover_start_date','renewal_date','maturity_date','premium_cessation_date']) {
    const y = parseYear(parsedRaw[f])
    if (y !== null && (y < 1990 || y > 2080)) sanityIssues.push(`${f} year ${y} outside 1990-2080`)
  }
  const dobY = parseYear(parsedRaw.date_of_birth)
  if (dobY !== null && (dobY < 1925 || dobY > 2025)) sanityIssues.push(`date_of_birth year ${dobY} outside 1925-2025`)
  const pct = parsedRaw.co_insurance_percent
  if (pct !== null && pct !== undefined && (pct < 0 || pct > 100)) sanityIssues.push(`co_insurance_percent ${pct} outside 0-100`)
  for (const nf of ['annual_premium','sum_assured','annual_deductible','co_insurance_cap']) {
    const v = parsedRaw[nf]
    if (v !== null && v !== undefined && v < 0) sanityIssues.push(`${nf} ${v} is negative`)
  }
  const validCurrencies = new Set(['SGD','USD','EUR','GBP','AUD','HKD','JPY','CNY','MYR','IDR','PHP','THB','VND'])
  if (parsedRaw.currency && !validCurrencies.has(parsedRaw.currency)) {
    sanityIssues.push(`currency "${parsedRaw.currency}" not in ISO 4217 set`)
  }

  // Render report
  const out: string[] = []
  const sep = (s: string) => `--- ${s} ---`

  out.push('========================================')
  out.push('  BRIEF EXTRACTION QUALITY EVAL (GEMINI)')
  out.push('========================================')
  out.push(`Policy ID:    ${policyId}`)
  out.push(`Parse model:  ${MODEL}`)
  out.push(`Source text:  ${sourceText.length} chars, ${chunks.length} chunks`)
  out.push(`Elapsed:      ${t_call_ms}ms (Gemini call), ${Date.now() - t_start}ms (total)`)
  out.push('')

  out.push(sep('SCHEMA VALIDATION'))
  if (schemaResult.success) out.push('Result: VALID')
  else {
    out.push('Result: FAILED')
    for (const issue of schemaResult.error.issues.slice(0, 15)) {
      out.push(`  - ${issue.path.join('.')}: ${issue.message}`)
    }
  }
  out.push('')

  out.push(sep('FIELD PRESENCE'))
  out.push(`Populated:    ${populated.length} / ${allKeys.length}`)
  out.push(`Null:         ${nullKeys.length} (${nullKeys.join(', ') || '—'})`)
  out.push(`Empty arrays: ${emptyArrays.length} (${emptyArrays.join(', ') || '—'})`)
  out.push('')

  const renderSection = (title: string, rows: [string, string][]) => {
    out.push(sep(title))
    const w = Math.max(...rows.map(([k]) => k.length)) + 2
    for (const [k, r] of rows) {
      const v = parsedRaw[k]
      const vDisp = v === null || v === undefined ? 'null' : String(v).slice(0, 35)
      out.push(`  ${k.padEnd(w)}  ${vDisp.padEnd(38)}  ${r}`)
    }
    out.push('')
  }
  renderSection('HALLUCINATION CHECK — MONEY FIELDS', moneyChecks)
  renderSection('HALLUCINATION CHECK — DATES', dateChecks)
  renderSection('HALLUCINATION CHECK — KEY TEXT FIELDS', textChecks)

  out.push(sep('SANITY CHECKS'))
  if (sanityIssues.length === 0) out.push('All passed.')
  else for (const i of sanityIssues) out.push(`  - ${i}`)
  out.push('')

  out.push(sep('USAGE + COST'))
  out.push(`Prompt tokens:    ${promptTokens}`)
  out.push(`Candidate tokens: ${candidateTokens}`)
  out.push(`Cost (USD):       $${costUsd.toFixed(6)}`)
  out.push('')

  out.push(sep('SUMMARY'))
  out.push(`Schema validation:    ${schemaResult.success ? 'PASS' : 'FAIL'}`)
  out.push(`Hallucinations:       ${notFoundCount} / ${checkedCount} non-null checks`)
  out.push(`Sanity issues:        ${sanityIssues.length}`)
  out.push(`Cost:                 $${costUsd.toFixed(6)}`)
  out.push(`Elapsed:              ${t_call_ms}ms`)
  out.push('')

  out.push(sep('RAW PARSED OUTPUT'))
  out.push(JSON.stringify(parsedRaw, null, 2))
  out.push('')

  out.push('--- END EVAL ---')

  return new NextResponse(out.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
