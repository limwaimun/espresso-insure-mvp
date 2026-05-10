/**
 * Voyage AI smoke-test endpoint.
 *
 * Admin-only. POST a string, get back:
 *   - confirmation that VOYAGE_API_KEY is set and the API responds
 *   - the embedding dimensions (should be 1024 for voyage-3.5-lite)
 *   - first 5 dimensions of the vector (for sanity-checking it's not all zeros)
 *   - token count and elapsed time
 *
 * Does NOT persist the embedding to the database. This is a connectivity probe.
 *
 * Real persistence will land in B-pe-6 (chunk-and-embed.ts).
 *
 * Usage (after deploy):
 *   curl -X POST https://espresso.insure/api/voyage/smoke-test \
 *     -H "Content-Type: application/json" \
 *     -H "Cookie: <your admin session cookie>" \
 *     -d '{"text": "AIA HealthShield Gold Max — Plan A"}'
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { embedSingle, VoyageError } from '@/lib/voyage-client';

export const runtime = 'nodejs';

interface SmokeTestRequestBody {
  text?: string;
}

interface SmokeTestResponse {
  ok: boolean;
  model: string;
  dimensions: number;
  firstFiveDims: number[];
  l2Norm: number;
  tokensUsed: number;
  elapsedMs: number;
  inputLength: number;
}

interface SmokeTestErrorResponse {
  ok: false;
  error: string;
  detail?: unknown;
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<SmokeTestResponse | SmokeTestErrorResponse>> {
  // 1. Authenticate the requester
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: 'unauthenticated' },
      { status: 401 },
    );
  }

  // 2. Authorize: admin only
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    return NextResponse.json(
      { ok: false, error: 'admin only' },
      { status: 403 },
    );
  }

  // 3. Parse body
  let body: SmokeTestRequestBody;
  try {
    body = (await req.json()) as SmokeTestRequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid JSON body' },
      { status: 400 },
    );
  }

  const text = (body.text ?? '').trim();
  if (!text) {
    return NextResponse.json(
      { ok: false, error: 'body.text is required and must be non-empty' },
      { status: 400 },
    );
  }
  if (text.length > 8000) {
    return NextResponse.json(
      { ok: false, error: 'body.text capped at 8000 chars for smoke test' },
      { status: 400 },
    );
  }

  // 4. Hit Voyage
  const startedAt = Date.now();
  try {
    const { embedding, tokens } = await embedSingle(text, 'document');
    const elapsedMs = Date.now() - startedAt;

    // L2 norm check — voyage-3.5-lite returns unit-normalized vectors,
    // so this should be ~1.0. Any value far from 1.0 indicates either
    // a model misconfiguration or a transport corruption.
    const l2Norm = Math.sqrt(
      embedding.reduce((sum, v) => sum + v * v, 0),
    );

    return NextResponse.json({
      ok: true,
      model: 'voyage-3.5-lite',
      dimensions: embedding.length,
      firstFiveDims: embedding.slice(0, 5),
      l2Norm: Number(l2Norm.toFixed(6)),
      tokensUsed: tokens,
      elapsedMs,
      inputLength: text.length,
    });
  } catch (err) {
    const elapsedMs = Date.now() - startedAt;
    if (err instanceof VoyageError) {
      return NextResponse.json(
        {
          ok: false,
          error: `voyage error: ${err.message}`,
          detail: { status: err.status, body: err.body, elapsedMs },
        },
        { status: 502 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: 'unexpected error',
        detail: { message: (err as Error).message, elapsedMs },
      },
      { status: 500 },
    );
  }
}
