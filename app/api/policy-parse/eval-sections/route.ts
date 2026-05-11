/**
 * B-pe-16b — structured-output quality eval for Layer B (sections).
 *
 * Admin-only GET endpoint. Loads policy_sections rows (Haiku baseline)
 * + unpdf-extracted text from policy_doc_chunks, then runs:
 *
 *   1. Reconstruct PolicySectionsResult shape from rows
 *   2. Schema validation against PolicySectionsSchema
 *   3. Section count plausibility (target 5-15 per schema docstring)
 *   4. Kind distribution (frequency by section_kind, flag overuse of 'other')
 *   5. Page range sanity (start<=end, within [1, numPages], gap/overlap detection)
 *   6. Label presence (% with non-null section_label)
 *   7. Label-in-source check (literal labels searched in unpdf text)
 *
 * Plain-text report. Distinct from B-pe-16a (which evaluates Layer A brief).
 *
 * Usage:
 *   GET /api/policy-parse/eval-sections?policy_id=<uuid>
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  PolicySectionsSchema,
  SECTION_KINDS,
} from '@/lib/policy-extraction/sections-schema'

export const runtime = 'nodejs'
export const maxDuration = 30

const TARGET_MIN_SECTIONS = 5
const TARGET_MAX_SECTIONS = 15
const OTHER_OVERUSE_THRESHOLD = 0.3 // flag if >30% of sections are 'other'

function findLabelInText(label: string, text: string): string {
  if (text.includes(label)) return 'FOUND'
  if (text.toLowerCase().includes(label.toLowerCase()))
    return 'FOUND (case-insensitive)'

  // Allow common variants — em-dash vs hyphen, smart quotes, normalised whitespace
  const normalise = (s: string) =>
    s
      .replace(/[\u2013\u2014]/g, '-') // en/em dash → hyphen
      .replace(/[\u2018\u2019]/g, "'") // smart single quotes
      .replace(/[\u201c\u201d]/g, '"') // smart double quotes
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .trim()

  if (normalise(text).includes(normalise(label))) return 'FOUND (normalised)'
  return '*** NOT FOUND ***'
}

export async function GET(req: NextRequest) {
  // Authenticate
  const userSupabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await userSupabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: 'unauthenticated' },
      { status: 401 },
    )
  }

  const { data: profile } = await userSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json(
      { ok: false, error: 'admin_only' },
      { status: 403 },
    )
  }

  const policyId = req.nextUrl.searchParams.get('policy_id')
  if (!policyId) {
    return NextResponse.json(
      { ok: false, error: 'missing_policy_id' },
      { status: 400 },
    )
  }

  const supabase = createServiceRoleClient()

  // 1. Load section rows
  const { data: sectionRows, error: sErr } = await supabase
    .from('policy_sections')
    .select('section_kind, section_label, page_start, page_end')
    .eq('policy_id', policyId)
    .order('page_start', { ascending: true, nullsFirst: false })

  if (sErr || !sectionRows || sectionRows.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: 'no_sections',
        message: sErr?.message ?? 'no rows in policy_sections — run Layer B first',
      },
      { status: 404 },
    )
  }

  // 2. Load source text from chunks
  const { data: chunks } = await supabase
    .from('policy_doc_chunks')
    .select('content, page_number')
    .eq('policy_id', policyId)
    .order('chunk_index')

  if (!chunks || chunks.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'no_chunks', message: 'run Layer C first' },
      { status: 404 },
    )
  }

  const sourceText = chunks.map((c) => c.content || '').join('\n')
  const numPages = chunks.reduce(
    (max, c) => Math.max(max, c.page_number ?? 0),
    0,
  )

  // 3. Reconstruct PolicySectionsResult shape for schema validation
  const reconstructed = {
    sections: sectionRows.map((r) => ({
      section_kind: r.section_kind,
      section_label: r.section_label,
      page_start: r.page_start,
      page_end: r.page_end,
    })),
    // policy_sections table doesn't persist extraction_confidence;
    // use 'high' as a no-op placeholder so schema validation focuses
    // on the section rows themselves.
    extraction_confidence: 'high' as const,
  }

  const schemaResult = PolicySectionsSchema.safeParse(reconstructed)

  // 4. Section count
  const count = sectionRows.length
  const countOk = count >= TARGET_MIN_SECTIONS && count <= TARGET_MAX_SECTIONS

  // 5. Kind distribution
  const kindCounts = new Map<string, number>()
  for (const k of SECTION_KINDS) kindCounts.set(k, 0)
  for (const r of sectionRows) {
    kindCounts.set(r.section_kind, (kindCounts.get(r.section_kind) ?? 0) + 1)
  }
  const otherCount = kindCounts.get('other') ?? 0
  const otherFraction = count > 0 ? otherCount / count : 0
  const otherOverused = otherFraction > OTHER_OVERUSE_THRESHOLD

  // 6. Page range sanity
  const pageIssues: string[] = []
  let lastEnd = 0
  let inversions = 0
  let outOfRange = 0
  let overlaps = 0

  for (let i = 0; i < sectionRows.length; i++) {
    const r = sectionRows[i]
    const ps = r.page_start
    const pe = r.page_end
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
      pageIssues.push(`${label}: page_start ${ps} < previous section's page_end ${lastEnd}`)
    }
    if (pe !== null) lastEnd = pe
  }

  // 7. Label presence
  const withLabel = sectionRows.filter(
    (r) => r.section_label && r.section_label.trim().length > 0,
  )
  const labelCoverage = count > 0 ? withLabel.length / count : 0

  // 8. Label-in-source check
  const labelChecks = withLabel.map((r) => ({
    label: r.section_label as string,
    kind: r.section_kind,
    pages: `${r.page_start ?? '?'}-${r.page_end ?? '?'}`,
    result: findLabelInText(r.section_label as string, sourceText),
  }))

  const labelNotFound = labelChecks.filter((c) => c.result === '*** NOT FOUND ***').length

  // 9. Render report
  const out: string[] = []
  const sep = (s: string) => `--- ${s} ---`

  out.push('========================================')
  out.push('  SECTIONS EXTRACTION QUALITY EVAL')
  out.push('========================================')
  out.push(`Policy ID:    ${policyId}`)
  out.push(`Source text:  ${sourceText.length} chars, ${chunks.length} chunks across ${numPages} pages`)
  out.push(`Sections:     ${count} rows`)
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

  out.push(sep('SECTION COUNT'))
  out.push(`Count:    ${count}`)
  out.push(`Target:   ${TARGET_MIN_SECTIONS}-${TARGET_MAX_SECTIONS}`)
  out.push(`Result:   ${countOk ? 'OK' : count < TARGET_MIN_SECTIONS ? 'TOO FEW (may have missed sections)' : 'TOO MANY (over-fragmented)'}`)
  out.push('')

  out.push(sep('KIND DISTRIBUTION'))
  const sortedKinds = [...kindCounts.entries()]
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
  for (const [kind, c] of sortedKinds) {
    const pct = ((c / count) * 100).toFixed(1)
    out.push(`  ${kind.padEnd(20)} ${String(c).padStart(3)}  (${pct}%)`)
  }
  out.push('')
  out.push(`'other' usage: ${otherCount}/${count} = ${(otherFraction * 100).toFixed(1)}%`)
  out.push(`  Result: ${otherOverused ? '*** OVERUSED *** (taxonomy may be missing categories)' : 'OK'}`)
  out.push('')

  out.push(sep('PAGE RANGE SANITY'))
  if (pageIssues.length === 0) {
    out.push('All passed.')
  } else {
    out.push(`Inversions (start > end):  ${inversions}`)
    out.push(`Out of range (1-${numPages}): ${outOfRange}`)
    out.push(`Overlaps with previous:     ${overlaps}`)
    out.push('')
    for (const i of pageIssues) out.push(`  - ${i}`)
  }
  out.push('')

  out.push(sep('LABEL PRESENCE'))
  out.push(`With label:    ${withLabel.length}/${count} (${(labelCoverage * 100).toFixed(1)}%)`)
  out.push(`Without label: ${count - withLabel.length}`)
  out.push('')

  out.push(sep('LABEL-IN-SOURCE CHECK'))
  if (labelChecks.length === 0) {
    out.push('(no labels to check)')
  } else {
    const labelMaxLen = Math.min(50, Math.max(...labelChecks.map((c) => c.label.length)))
    for (const c of labelChecks) {
      const truncLabel =
        c.label.length > labelMaxLen
          ? c.label.slice(0, labelMaxLen - 3) + '...'
          : c.label
      out.push(`  ${truncLabel.padEnd(labelMaxLen + 2)} p${c.pages.padEnd(8)} ${c.result}`)
    }
  }
  out.push('')

  out.push(sep('SECTIONS DUMP (ordered)'))
  for (let i = 0; i < sectionRows.length; i++) {
    const r = sectionRows[i]
    const label = r.section_label ?? '(no label)'
    out.push(`  ${String(i + 1).padStart(2)}.  ${r.section_kind.padEnd(20)}  p${r.page_start ?? '?'}-${r.page_end ?? '?'}  ${label}`)
  }
  out.push('')

  out.push(sep('SUMMARY'))
  out.push(`Schema validation: ${schemaResult.success ? 'PASS' : 'FAIL'}`)
  out.push(`Section count:     ${countOk ? 'OK' : 'OUT OF TARGET'}`)
  out.push(`'other' overused:  ${otherOverused ? 'YES' : 'NO'}`)
  out.push(`Page sanity:       ${pageIssues.length === 0 ? 'PASS' : `${pageIssues.length} issues`}`)
  out.push(`Labels not found:  ${labelNotFound} / ${labelChecks.length} non-null labels`)
  out.push('')

  out.push('--- END EVAL ---')

  return new NextResponse(out.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
