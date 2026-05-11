/**
 * B-pe-18b — Per-layer parse status API.
 *
 * GET /api/policy-parse/status?policy_id=<uuid>
 *
 * Returns the parse state of all three layers (brief / sections / chunks)
 * in a unified shape, so the UI doesn't need to know that Layer A uses
 * `parse_status` while Layers B/C use `sections_status` / `chunks_status`,
 * or that Layer A's vocabulary is 'parsing' while B/C use 'running'.
 *
 * FA-scoped: only the FA who owns the policy (or admin via RLS) can read.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySession } from '@/lib/auth-middleware'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

type UnifiedStatus = 'pending' | 'running' | 'done' | 'failed'

interface LayerStatus {
  status: UnifiedStatus
  started_at: string | null
  completed_at: string | null
  error: string | null
}

interface StatusResponse {
  ok: true
  policy_id: string
  brief: LayerStatus
  sections: LayerStatus
  chunks: LayerStatus
  overall: UnifiedStatus
}

/**
 * Normalize Layer A's 'parsing' / 'stale' vocabulary to the unified
 * 'pending' / 'running' / 'done' / 'failed' shape used by B/C.
 *
 *   parsing  -> running
 *   stale    -> pending  (model upgraded; needs re-parse)
 *   done / pending / failed pass through.
 */
function normalizeBriefStatus(raw: string | null | undefined): UnifiedStatus {
  if (raw === 'parsing') return 'running'
  if (raw === 'stale') return 'pending'
  if (raw === 'done' || raw === 'failed' || raw === 'pending' || raw === 'running') {
    return raw
  }
  return 'pending'
}

function normalizeLayerStatus(raw: string | null | undefined): UnifiedStatus {
  if (raw === 'done' || raw === 'failed' || raw === 'pending' || raw === 'running') {
    return raw
  }
  // 'skipped' (only valid for B/C) — treat as 'done' for UI purposes;
  // the FA doesn't care why it was skipped, just that it isn't running.
  if (raw === 'skipped') return 'done'
  return 'pending'
}

/**
 * Roll-up: worst-state-wins.
 *   any failed   -> failed
 *   any running  -> running
 *   any pending  -> pending
 *   all done     -> done
 */
function rollUp(states: UnifiedStatus[]): UnifiedStatus {
  if (states.some((s) => s === 'failed')) return 'failed'
  if (states.some((s) => s === 'running')) return 'running'
  if (states.some((s) => s === 'pending')) return 'pending'
  return 'done'
}

export async function GET(request: NextRequest) {
  const { userId, error: authError } = await verifySession(request)
  if (authError || !userId) {
    return NextResponse.json(
      { ok: false, error: authError ?? 'Unauthorized' },
      { status: 401 },
    )
  }

  const { searchParams } = new URL(request.url)
  const policyId = searchParams.get('policy_id')
  if (!policyId) {
    return NextResponse.json(
      { ok: false, error: 'Missing policy_id query parameter' },
      { status: 400 },
    )
  }

  // UUID sanity (cheap; prevents DB-side syntax errors on bad input)
  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(policyId)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid policy_id (not a UUID)' },
      { status: 400 },
    )
  }

  const { data: policy, error: queryErr } = await supabase
    .from('policies')
    .select(
      [
        'id',
        'parse_status',
        'parsed_at',
        'parse_last_error',
        'sections_status',
        'sections_started_at',
        'sections_completed_at',
        'sections_error',
        'chunks_status',
        'chunks_started_at',
        'chunks_completed_at',
        'chunks_error',
      ].join(','),
    )
    .eq('id', policyId)
    .eq('fa_id', userId)
    .maybeSingle()

  if (queryErr) {
    return NextResponse.json(
      { ok: false, error: `DB error: ${queryErr.message}` },
      { status: 500 },
    )
  }

  if (!policy) {
    // 404 also covers "exists but owned by a different FA" — by design.
    return NextResponse.json(
      { ok: false, error: 'Policy not found' },
      { status: 404 },
    )
  }

  // Cast to any once — the column shape is wider than the generated types
  // know about (B-pe-18a is fresh). See similar `as any` pattern on
  // parsed_summary fields in app/api/policy-parse/brief/route.ts.
  const p = policy as any

  const briefStatus = normalizeBriefStatus(p.parse_status)
  // Layer A doesn't have a dedicated started_at column. parsed_at is
  // set on terminal states (done / failed). For running, we have no
  // start timestamp — return null and let the UI handle 'running with
  // no start' gracefully.
  const brief: LayerStatus = {
    status: briefStatus,
    started_at: null,
    completed_at: p.parsed_at ?? null,
    error: p.parse_last_error ?? null,
  }

  const sections: LayerStatus = {
    status: normalizeLayerStatus(p.sections_status),
    started_at: p.sections_started_at ?? null,
    completed_at: p.sections_completed_at ?? null,
    error: p.sections_error ?? null,
  }

  const chunks: LayerStatus = {
    status: normalizeLayerStatus(p.chunks_status),
    started_at: p.chunks_started_at ?? null,
    completed_at: p.chunks_completed_at ?? null,
    error: p.chunks_error ?? null,
  }

  const response: StatusResponse = {
    ok: true,
    policy_id: policyId,
    brief,
    sections,
    chunks,
    overall: rollUp([brief.status, sections.status, chunks.status]),
  }

  return NextResponse.json(response, {
    status: 200,
    headers: {
      // No caching — this endpoint is polled and must return fresh data.
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
