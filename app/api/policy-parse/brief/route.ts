/**
 * Layer A — manual brief-parse trigger.
 *
 * Admin-only POST endpoint. Triggers parsePolicyBrief() for a given
 * policy_id. Returns the parse result + cost breakdown.
 *
 * Usage:
 *   POST /api/policy-parse/brief
 *   { "policy_id": "uuid", "force": false }
 *
 * Auto-trigger on policy upload lands in B-pe-4. This batch (B-pe-3)
 * is manual-trigger only.
 */

import { NextRequest, NextResponse, after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parsePolicyBrief } from '@/lib/policy-extraction/parse-brief';
import { parsePolicySectionsWithStatus } from '@/lib/policy-extraction/status';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 min — Claude PDF parse can be slow on long docs

interface RequestBody {
  policy_id?: string;
  force?: boolean;
}

export async function POST(req: NextRequest) {
  // Authenticate
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }

  // Authorize admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'admin only' }, { status: 403 });
  }

  // Parse body
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid JSON body' },
      { status: 400 },
    );
  }

  const policyId = body.policy_id?.trim();
  if (!policyId) {
    return NextResponse.json(
      { ok: false, error: 'policy_id is required' },
      { status: 400 },
    );
  }

  // Run parse
  const result = await parsePolicyBrief(policyId, { force: !!body.force });

  if (!result.ok) {
    const status =
      result.stage === 'fetch_policy' ? 404 :
      result.stage === 'fetch_pdf' ? 404 :
      result.stage === 'pdf_too_large' ? 413 :
      result.stage === 'in_progress' ? 409 :
      result.stage === 'already_parsed' ? 409 :
      result.stage === 'validation' ? 422 :
      result.stage === 'claude_call' ? 502 :
      500;
    return NextResponse.json(result, { status });
  }

  // B-pe-7: chain Layer A -> Layer B. Fire-and-forget; errors
  // logged but don't affect the brief response. Layer B failures
  // can be retried manually via /api/policy-parse/sections.
  // Layer C (chunks) is NOT chained here because the combined
  // A+B+C runtime can exceed Vercel's 300s function budget on
  // real-world PDFs. Layer C remains manually triggered.
  after(async () => {
    try {
      const r = await parsePolicySectionsWithStatus(result.policyId)
      if (!r.ok && r.stage !== 'already_parsed') {
        console.error(
          `[chain] parsePolicySections failed for policy ${result.policyId}:`,
          r.error,
        )
      }
    } catch (err) {
      console.error(
        `[chain] parsePolicySections threw for policy ${result.policyId}:`,
        err,
      )
    }
  })

  // Return summary + brief preview + cost
  return NextResponse.json({
    ok: true,
    policy_id: result.policyId,
    schema_version: result.schemaVersion,
    model: result.model,
    elapsed_ms: result.elapsedMs,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    cost_usd: Number(result.costUsd.toFixed(6)),
    doc_hash: result.docHash,
    summary: result.summary,
    brief: result.brief,
  });
}


/**
 * GET handler — admin-only. Returns cached brief + parse metadata
 * for a policy_id. Does NOT trigger a parse; use POST for that.
 *
 * Usage:
 *   GET /api/policy-parse/brief?policy_id=<uuid>
 *
 * Response:
 *   { ok, parse_status, schema_version, brief, summary,
 *     model, parsed_at, cost_usd, tokens, last_error }
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'admin only' }, { status: 403 });
  }

  const url = new URL(req.url);
  const policyId = url.searchParams.get('policy_id')?.trim();
  if (!policyId) {
    return NextResponse.json(
      { ok: false, error: 'policy_id query param is required' },
      { status: 400 },
    );
  }

  const { data: policy, error: policyErr } = await supabase
    .from('policies')
    .select(
      'id, parse_status, parse_schema_version, parsed_brief, parsed_summary, ' +
        'parse_model, parsed_at, parse_cost_usd, parse_input_tokens, ' +
        'parse_output_tokens, parse_last_error, parse_attempt_count',
    )
    .eq('id', policyId)
    .single();

  if (policyErr || !policy) {
    return NextResponse.json(
      { ok: false, error: 'policy not found' },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    policy_id: (policy as any).id,
    parse_status: (policy as any).parse_status,
    schema_version: (policy as any).parse_schema_version,
    brief: (policy as any).parsed_brief,
    summary: (policy as any).parsed_summary,
    model: (policy as any).parse_model,
    parsed_at: (policy as any).parsed_at,
    cost_usd: (policy as any).parse_cost_usd,
    input_tokens: (policy as any).parse_input_tokens,
    output_tokens: (policy as any).parse_output_tokens,
    last_error: (policy as any).parse_last_error,
    attempt_count: (policy as any).parse_attempt_count,
  });
}
