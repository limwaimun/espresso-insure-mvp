/**
 * Layer B — section index parse trigger.
 *
 * Admin-only endpoints:
 *   POST /api/policy-parse/sections
 *     body: { policy_id: uuid, force?: bool }
 *     -> triggers parsePolicySections, returns extracted sections
 *
 *   GET /api/policy-parse/sections?policy_id=<uuid>
 *     -> returns currently-stored sections for that policy_id
 *
 * Loosening to FA-scoped happens in B-pe-7 (orchestrator).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parsePolicySections } from '@/lib/policy-extraction/parse-sections'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 min — Claude PDF parse can be slow on long docs

interface PostBody {
  policy_id?: string
  force?: boolean
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

async function requireAdmin(): Promise<
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { ok: false, status: 401, error: 'unauthenticated' }
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin') {
    return { ok: false, status: 403, error: 'admin only' }
  }
  return { ok: true, userId: user.id }
}

// ---------------------------------------------------------------------------
// POST — trigger parse
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status })
  }

  let body: PostBody
  try {
    body = (await req.json()) as PostBody
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid JSON body' },
      { status: 400 },
    )
  }

  const policyId = body.policy_id?.trim()
  if (!policyId) {
    return NextResponse.json(
      { ok: false, error: 'policy_id is required' },
      { status: 400 },
    )
  }

  const result = await parsePolicySections(policyId, { force: !!body.force })

  if (!result.ok) {
    const status =
      result.stage === 'fetch_policy' ? 404 :
      result.stage === 'fetch_pdf' ? 404 :
      result.stage === 'pdf_too_large' ? 413 :
      result.stage === 'already_parsed' ? 409 :
      result.stage === 'validation' ? 422 :
      result.stage === 'claude_call' ? 502 :
      500
    return NextResponse.json(result, { status })
  }

  return NextResponse.json({
    ok: true,
    policy_id: result.policyId,
    schema_version: result.schemaVersion,
    model: result.model,
    elapsed_ms: result.elapsedMs,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    cost_usd: Number(result.costUsd.toFixed(6)),
    sections_count: result.sectionsCount,
    extraction_confidence: result.extractionConfidence,
    notes_on_structure: result.notesOnStructure,
    forced: result.forced,
    sections: result.sections,
  })
}

// ---------------------------------------------------------------------------
// GET — fetch stored sections
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status })
  }

  const url = new URL(req.url)
  const policyId = url.searchParams.get('policy_id')?.trim()
  if (!policyId) {
    return NextResponse.json(
      { ok: false, error: 'policy_id query param is required' },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const { data: rows, error } = await supabase
    .from('policy_sections')
    .select('id, section_kind, section_label, page_start, page_end, created_at')
    .eq('policy_id', policyId)
    .order('page_start', { ascending: true, nullsFirst: false })

  if (error) {
    return NextResponse.json(
      { ok: false, error: `query failed: ${error.message}` },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    policy_id: policyId,
    sections_count: rows?.length ?? 0,
    sections: rows ?? [],
  })
}
