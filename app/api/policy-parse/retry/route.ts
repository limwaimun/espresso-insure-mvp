/**
 * B-pe-18d — Retry endpoint for failed parse layers.
 *
 * POST /api/policy-parse/retry
 * Body: { policy_id: uuid }
 *
 * FA-scoped: verifies session + policy ownership before doing anything.
 * Reads the per-layer status columns, finds every layer in 'failed'
 * state, and fires the appropriate parse function for each (with
 * force: true to bypass the already_parsed skip path).
 *
 * Layers are fired in parallel via after() — response returns
 * immediately with { retried: [...], skipped: [...] } and the actual
 * parses complete in the background. BriefModal's existing 3s status
 * poll surfaces the new 'running' / 'done' / 'failed' state.
 *
 * Edge cases:
 *   - No failed layers: returns ok with empty retried array + message
 *   - 'pending' layers are NOT retried (they were never started; that's
 *     a different problem than failure recovery)
 *   - 'running' layers are NOT retried (already in progress)
 *   - Concurrent retries by the same FA: each call is independent;
 *     the wrapper's force: true delete-then-insert pattern is safe
 *     under concurrent fire because Postgres serialises the
 *     transactions. Worst case is wasted work, not corruption.
 */

import { NextRequest, NextResponse, after } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySession } from '@/lib/auth-middleware'
import { parsePolicyBrief } from '@/lib/policy-extraction/parse-brief'
import {
  parsePolicySectionsWithStatus,
  parseAndEmbedPolicyChunksWithStatus,
} from '@/lib/policy-extraction/status'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type LayerKey = 'brief' | 'sections' | 'chunks'

export async function POST(request: NextRequest) {
  const { userId, error: authError } = await verifySession(request)
  if (authError || !userId) {
    return NextResponse.json(
      { ok: false, error: authError ?? 'Unauthorized' },
      { status: 401 },
    )
  }

  let body: { policy_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 },
    )
  }

  const policyId = body.policy_id
  if (!policyId || typeof policyId !== 'string' || !UUID_RE.test(policyId)) {
    return NextResponse.json(
      { ok: false, error: 'Missing or invalid policy_id' },
      { status: 400 },
    )
  }

  // Load + ownership check + read all three status columns
  const { data: policy, error: queryErr } = await supabase
    .from('policies')
    .select('id, parse_status, sections_status, chunks_status')
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
    return NextResponse.json(
      { ok: false, error: 'Policy not found' },
      { status: 404 },
    )
  }

  const p = policy as {
    id: string
    parse_status: string | null
    sections_status: string | null
    chunks_status: string | null
  }

  // Decide which layers to retry. Only 'failed' qualifies.
  const toRetry: LayerKey[] = []
  if (p.parse_status === 'failed') toRetry.push('brief')
  if (p.sections_status === 'failed') toRetry.push('sections')
  if (p.chunks_status === 'failed') toRetry.push('chunks')

  if (toRetry.length === 0) {
    return NextResponse.json({
      ok: true,
      policy_id: policyId,
      retried: [],
      message:
        'Nothing to retry — no layers are in failed state. ' +
        '(If a layer appears stuck, refresh and check status.)',
    })
  }

  // Fire retries in parallel via after(). Response returns immediately;
  // BriefModal polling picks up the new 'running' state within 3s.
  //
  // skipSectionAssignment is false here (default) — when retrying
  // chunks via this endpoint, the FA has no automated B-then-C
  // orchestration to leverage, so each layer parses independently
  // including section_id mapping for chunks.
  after(async () => {
    const work: Array<Promise<unknown>> = []
    if (toRetry.includes('brief')) {
      work.push(
        parsePolicyBrief(policyId, { force: true }).catch((err) => {
          console.error(
            `[retry] parsePolicyBrief failed for policy ${policyId}:`,
            err,
          )
        }),
      )
    }
    if (toRetry.includes('sections')) {
      work.push(
        parsePolicySectionsWithStatus(policyId, { force: true }).catch((err) => {
          console.error(
            `[retry] parsePolicySectionsWithStatus failed for policy ${policyId}:`,
            err,
          )
        }),
      )
    }
    if (toRetry.includes('chunks')) {
      work.push(
        parseAndEmbedPolicyChunksWithStatus(policyId, { force: true }).catch((err) => {
          console.error(
            `[retry] parseAndEmbedPolicyChunksWithStatus failed for policy ${policyId}:`,
            err,
          )
        }),
      )
    }
    await Promise.allSettled(work)
  })

  return NextResponse.json({
    ok: true,
    policy_id: policyId,
    retried: toRetry,
    message: `Retrying ${toRetry.length} layer${toRetry.length === 1 ? '' : 's'}. Refresh in a few seconds.`,
  })
}

// GET returns 405 — this endpoint is POST-only
export async function GET() {
  return NextResponse.json(
    { ok: false, error: 'Method not allowed. Use POST.' },
    { status: 405 },
  )
}
