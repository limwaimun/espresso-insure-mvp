/**
 * B-pe-16e — Gemini Flash 2.5 full-sections extraction + inline quality eval.
 *
 * Admin-only GET endpoint. Parallel to /api/policy-parse/eval-sections but runs
 * Gemini Flash 2.5 with the full PolicySectionsSchema instead of reading the
 * saved Haiku baseline from policy_sections. Does NOT persist.
 *
 * Same quality check battery as eval-sections for visual side-by-side comparison.
 *
 * Schema converter inlined (NOT factored to shared lib). Factor in B-pe-16i
 * when we build the production provider abstraction. Today's batch is additive
 * investigation, not production wiring.
 *
 * Usage:
 *   GET /api/policy-parse/gemini-sections?policy_id=<uuid>
 *
 * Compare with: /api/policy-parse/eval-sections?policy_id=<uuid> (Haiku baseline)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { GoogleGenAI } from '@google/genai'
import {
  PolicySectionsSchema,
  PARSE_SECTIONS_TOOL_DEFINITION,
  SECTION_KINDS,
} from '@/lib/policy-extraction/sections-schema'

export const runtime = 'nodejs'
export const maxDuration = 60

const MODEL = 'gemini-2.5-flash'
const COST_PER_INPUT_TOKEN = 0.3 / 1_000_000
const COST_PER_OUTPUT_TOKEN = 2.5 / 1_000_000

const TARGET_MIN_SECTIONS = 5
const TARGET_MAX_SECTIONS = 18 // matches eval-sections after B-pe-16b finding
const OTHER_OVERUSE_THRESHOLD = 0.3

const SYSTEM_PROMPT = `You are a Singapore insurance policy structural extraction assistant. Read the provided policy text and produce a section index — a list of section_kind classifications with their page ranges.

Rules:
1. Each section maps to ONE of the 16 controlled section_kind values: schedule, definitions, summary, benefits, surgical_schedule, exclusions, premiums, claims, conditions, free_look, termination, signatures, cover, welcome, toc, other.
2. Use "other" only if no specific category fits. The same kind can appear multiple times if the document has multiple separate sections of that kind.
3. section_label: the literal heading text as it appears in the document (e.g., "Part 1 — Definitions"). Use null if no heading text is present.
4. page_start and page_end: use the document's own page numbering when available; otherwise count from page 1 of the PDF.
5. Aim for 5-15 sections per policy. Over-fragmenting hurts downstream routing.
6. Do NOT extract section content — only the index.
7. extraction_confidence: high (clean structured), medium (structural inference required), low (scanned/fragmentary).`

// ---------------------------------------------------------------------------
// Schema converter — Anthropic JSON Schema → OpenAPI 3.0 (Gemini-compatible)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertSchema(schema: any): any {
  if (Array.isArray(schema)) return schema.map(convertSchema)
  if (!schema || typeof schema !== 'object') return schema

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: any = { ...schema }

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
// Label-in-source helper (parallel to eval-sections)
// ---------------------------------------------------------------------------

function findLabelInText(label: string, text: string): string {
  if (text.includes(label)) return 'FOUND'
  if (text.toLowerCase().includes(label.toLowerCase())) return 'FOUND (case-insensitive)'

  const normalise = (s: string) =>
    s
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .trim()

  if (normalise(text).includes(normalise(label))) return 'FOUND (normalised)'
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

  const { data: chunks, error: cErr } = await supabase
    .from('policy_doc_chunks')
    .select('content, page_number')
    .eq('policy_id', policyId)
    .order('chunk_index')

  if (cErr || !chunks || chunks.length === 0) {
    return NextResponse.json({ ok: false, error: 'no_chunks' }, { status: 404 })
  }
  const sourceText = chunks.map(c => c.content || '').join('\n')
  const numPages = chunks.reduce((max, c) => Math.max(max, c.page_number ?? 0), 0)

  const geminiSchema = convertSchema(PARSE_SECTIONS_TOOL_DEFINITION.input_schema)

  const t_call_start = Date.now()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let response: any
  try {
    const ai = new GoogleGenAI({ apiKey })
    response = await ai.models.generateContent({
      model: MODEL,
      contents: `${SYSTEM_PROMPT}\n\n--- POLICY TEXT ---\n${sourceText}\n--- END OF POLICY TEXT ---\n\nProduce the section index.`,
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
  const schemaResult = PolicySectionsSchema.safeParse(parsedRaw)

  const sectionRows = Array.isArray(parsedRaw.sections) ? parsedRaw.sections : []
  const count = sectionRows.length

  // Kind distribution
  const kindCounts = new Map<string, number>()
  for (const k of SECTION_KINDS) kindCounts.set(k, 0)
  for (const r of sectionRows) {
    const k = r.section_kind ?? 'other'
    kindCounts.set(k, (kindCounts.get(k) ?? 0) + 1)
  }
  const otherCount = kindCounts.get('other') ?? 0
  const otherFraction = count > 0 ? otherCount / count : 0
  const otherOverused = otherFraction > OTHER_OVERUSE_THRESHOLD

  // Page range sanity
  const pageIssues: string[] = []
  let lastEnd = 0
  let inversions = 0, outOfRange = 0, overlaps = 0
  for (let i = 0; i < sectionRows.length; i++) {
    const r = sectionRows[i]
    const ps = r.page_start ?? null
    const pe = r.page_end ?? null
    const label = r.section_label ?? `[${r.section_kind} #${i + 1}]`
    if (ps !== null && pe !== null && ps > pe) {
      inversions++
      pageIssues.push(`${label}: page_start (${ps}) > page_end (${pe})`)
    }
    if (ps !== null && (ps < 1 || ps > numPages)) {
      outOfRange++
      pageIssues.push(`${label}: page_start ${ps} outside [1, ${numPages}]`)
    }
    if (pe !== null && (pe < 1 || pe > numPages)) {
      outOfRange++
      pageIssues.push(`${label}: page_end ${pe} outside [1, ${numPages}]`)
    }
    if (ps !== null && ps < lastEnd) {
      overlaps++
      pageIssues.push(`${label}: page_start ${ps} < previous page_end ${lastEnd}`)
    }
    if (pe !== null) lastEnd = pe
  }

  // Label presence + label-in-source
  const withLabel = sectionRows.filter((r: { section_label?: string | null }) => r.section_label && r.section_label.trim().length > 0)
  const labelCoverage = count > 0 ? withLabel.length / count : 0
  const labelChecks = withLabel.map((r: { section_label: string; section_kind: string; page_start: number | null; page_end: number | null }) => ({
    label: r.section_label,
    kind: r.section_kind,
    pages: `${r.page_start ?? '?'}-${r.page_end ?? '?'}`,
    result: findLabelInText(r.section_label, sourceText),
  }))
  const labelNotFound = labelChecks.filter((c: { result: string }) => c.result === '*** NOT FOUND ***').length

  // Render report
  const out: string[] = []
  const sep = (s: string) => `--- ${s} ---`

  out.push('========================================')
  out.push('  SECTIONS EXTRACTION QUALITY EVAL (GEMINI)')
  out.push('========================================')
  out.push(`Policy ID:    ${policyId}`)
  out.push(`Parse model:  ${MODEL}`)
  out.push(`Source text:  ${sourceText.length} chars, ${chunks.length} chunks across ${numPages} pages`)
  out.push(`Sections:     ${count} rows`)
  out.push(`Elapsed:      ${t_call_ms}ms (Gemini), ${Date.now() - t_start}ms (total)`)
  out.push('')

  out.push(sep('SCHEMA VALIDATION'))
  if (schemaResult.success) out.push('Result: VALID')
  else {
    out.push('Result: FAILED')
    for (const issue of schemaResult.error.issues.slice(0, 10)) {
      out.push(`  - ${issue.path.join('.')}: ${issue.message}`)
    }
  }
  out.push('')

  out.push(sep('SECTION COUNT'))
  out.push(`Count:    ${count}`)
  out.push(`Target:   ${TARGET_MIN_SECTIONS}-${TARGET_MAX_SECTIONS}`)
  out.push(`Result:   ${count >= TARGET_MIN_SECTIONS && count <= TARGET_MAX_SECTIONS ? 'OK' : count < TARGET_MIN_SECTIONS ? 'TOO FEW' : 'TOO MANY'}`)
  out.push('')

  out.push(sep('KIND DISTRIBUTION'))
  const sortedKinds = [...kindCounts.entries()].filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1])
  for (const [kind, c] of sortedKinds) {
    const pct = ((c / count) * 100).toFixed(1)
    out.push(`  ${kind.padEnd(20)} ${String(c).padStart(3)}  (${pct}%)`)
  }
  out.push('')
  out.push(`'other' usage: ${otherCount}/${count} = ${(otherFraction * 100).toFixed(1)}%`)
  out.push(`  Result: ${otherOverused ? '*** OVERUSED ***' : 'OK'}`)
  out.push('')

  out.push(sep('PAGE RANGE SANITY'))
  if (pageIssues.length === 0) out.push('All passed.')
  else {
    out.push(`Inversions:  ${inversions}, OutOfRange: ${outOfRange}, Overlaps: ${overlaps}`)
    for (const i of pageIssues) out.push(`  - ${i}`)
  }
  out.push('')

  out.push(sep('LABEL PRESENCE'))
  out.push(`With label:    ${withLabel.length}/${count} (${(labelCoverage * 100).toFixed(1)}%)`)
  out.push(`Without label: ${count - withLabel.length}`)
  out.push('')

  out.push(sep('LABEL-IN-SOURCE CHECK'))
  if (labelChecks.length === 0) out.push('(no labels to check)')
  else {
    const w = Math.min(50, Math.max(...labelChecks.map((c: { label: string }) => c.label.length)))
    for (const c of labelChecks) {
      const trunc = c.label.length > w ? c.label.slice(0, w - 3) + '...' : c.label
      out.push(`  ${trunc.padEnd(w + 2)} p${c.pages.padEnd(8)} ${c.result}`)
    }
  }
  out.push('')

  out.push(sep('SECTIONS DUMP (ordered)'))
  for (let i = 0; i < sectionRows.length; i++) {
    const r = sectionRows[i]
    const label = r.section_label ?? '(no label)'
    out.push(`  ${String(i + 1).padStart(2)}.  ${(r.section_kind || '???').padEnd(20)}  p${r.page_start ?? '?'}-${r.page_end ?? '?'}  ${label}`)
  }
  out.push('')

  out.push(sep('USAGE + COST'))
  out.push(`Prompt tokens:    ${promptTokens}`)
  out.push(`Candidate tokens: ${candidateTokens}`)
  out.push(`Cost (USD):       $${costUsd.toFixed(6)}`)
  out.push('')

  out.push(sep('SUMMARY'))
  out.push(`Schema validation: ${schemaResult.success ? 'PASS' : 'FAIL'}`)
  out.push(`Section count:     ${count >= TARGET_MIN_SECTIONS && count <= TARGET_MAX_SECTIONS ? 'OK' : 'OUT OF TARGET'}`)
  out.push(`'other' overused:  ${otherOverused ? 'YES' : 'NO'}`)
  out.push(`Page sanity:       ${pageIssues.length === 0 ? 'PASS' : `${pageIssues.length} issues`}`)
  out.push(`Labels not found:  ${labelNotFound} / ${labelChecks.length}`)
  out.push(`Cost:              $${costUsd.toFixed(6)}`)
  out.push(`Elapsed:           ${t_call_ms}ms`)
  out.push('')

  out.push('--- END EVAL ---')

  return new NextResponse(out.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
