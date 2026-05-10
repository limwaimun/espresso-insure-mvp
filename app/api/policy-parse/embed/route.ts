/**
 * Layer C — chunk and embed trigger.
 *
 * Admin-only endpoints:
 *   POST /api/policy-parse/embed
 *     body: { policy_id: uuid, force?: bool }
 *     -> triggers parseAndEmbedPolicyChunks, returns counts + cost
 *
 *   GET /api/policy-parse/embed?policy_id=<uuid>
 *     -> returns chunk-count summary (does NOT return embeddings or
 *     full content; those are large. Returns counts + meta only.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseAndEmbedPolicyChunks } from '@/lib/policy-extraction/chunk-and-embed'

export const runtime = 'nodejs'
export const maxDuration = 300

interface PostBody {
  policy_id?: string
  force?: boolean
}

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
// POST — trigger chunk+embed pipeline
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
    return NextResponse.json({ ok: false, error: 'invalid JSON body' }, { status: 400 })
  }

  const policyId = body.policy_id?.trim()
  if (!policyId) {
    return NextResponse.json({ ok: false, error: 'policy_id is required' }, { status: 400 })
  }

  const result = await parseAndEmbedPolicyChunks(policyId, { force: !!body.force })

  if (!result.ok) {
    const status =
      result.stage === 'fetch_policy' ? 404 :
      result.stage === 'fetch_pdf' ? 404 :
      result.stage === 'pdf_too_large' ? 413 :
      result.stage === 'no_sections' ? 412 : // 412 Precondition Failed
      result.stage === 'already_parsed' ? 409 :
      result.stage === 'validation' ? 422 :
      result.stage === 'claude_call' ? 502 :
      result.stage === 'voyage_call' ? 502 :
      500
    return NextResponse.json(result, { status })
  }

  return NextResponse.json({
    ok: true,
    policy_id: result.policyId,
    pages_processed: result.pagesProcessed,
    meaningful_pages: result.meaningfulPages,
    chunks_count: result.chunksCount,
    voyage_batch_count: result.voyageBatchCount,
    elapsed_ms: result.elapsedMs,
    model: result.model,
    embedding_model: result.embeddingModel,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    voyage_tokens: result.voyageTokens,
    claude_cost_usd: Number(result.claudeCostUsd.toFixed(6)),
    voyage_cost_usd: Number(result.voyageCostUsd.toFixed(6)),
    total_cost_usd: Number(result.totalCostUsd.toFixed(6)),
    forced: result.forced,
  })
}

// ---------------------------------------------------------------------------
// GET — chunk count summary (does NOT return full content or embeddings)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status })
  }

  const url = new URL(req.url)
  const policyId = url.searchParams.get('policy_id')?.trim()
  if (!policyId) {
    return NextResponse.json({ ok: false, error: 'policy_id query param is required' }, { status: 400 })
  }

  const supabase = await createClient()

  // Total count
  const { count, error: countErr } = await supabase
    .from('policy_doc_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('policy_id', policyId)

  if (countErr) {
    return NextResponse.json(
      { ok: false, error: `count failed: ${countErr.message}` },
      { status: 500 },
    )
  }

  // Sample of recent chunks (no embeddings — those are huge)
  const { data: sample, error: sampleErr } = await supabase
    .from('policy_doc_chunks')
    .select('id, section_id, page_number, chunk_index, token_count, embedding_model, created_at')
    .eq('policy_id', policyId)
    .order('page_number', { ascending: true, nullsFirst: false })
    .order('chunk_index', { ascending: true })
    .limit(50)

  if (sampleErr) {
    return NextResponse.json(
      { ok: false, error: `sample failed: ${sampleErr.message}` },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    policy_id: policyId,
    chunks_count: count ?? 0,
    sample_size: sample?.length ?? 0,
    sample: sample ?? [],
  })
}
