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

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parsePolicyBrief } from '@/lib/policy-extraction/parse-brief';

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
