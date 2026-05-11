/**
 * B-pe-16c — Gemini Flash 2.5 structured-output probe.
 *
 * Admin-only GET endpoint. Loads unpdf-extracted text for the given
 * policy_id from policy_doc_chunks, sends a minimal 4-field
 * structured-output request to gemini-2.5-flash, returns timing +
 * usage + cost + raw and parsed output.
 *
 * Purpose: validate @google/genai SDK works on Vercel Node.js runtime
 * in isolation BEFORE we build the provider abstraction and refactor
 * parse-brief.ts. Same probe-first discipline that paid off for unpdf
 * (B-pe-15d).
 *
 * Tiny schema (4 fields only) so we can spot-check correctness manually
 * against the AIA HSG test policy without writing eval infra yet:
 *   - policy_number       expected: "AIA-HSG-7841"
 *   - insurer_name        expected: "AIA Singapore Private Limited"
 *   - policyholder_name   expected: "Tan Wei Ming"
 *   - annual_premium      expected: 1850
 *
 * Usage:
 *   GET /api/policy-parse/gemini-probe?policy_id=<uuid>
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { GoogleGenAI, Type } from '@google/genai'

export const runtime = 'nodejs'
export const maxDuration = 60

const MODEL = 'gemini-2.5-flash'

// Pricing (USD per million tokens) — gemini-2.5-flash as of 2026-05
const COST_PER_INPUT_TOKEN = 0.3 / 1_000_000
const COST_PER_OUTPUT_TOKEN = 2.5 / 1_000_000

const PROBE_SCHEMA = {
  type: Type.OBJECT,
  required: ['policy_number', 'insurer_name', 'policyholder_name'],
  properties: {
    policy_number: {
      type: Type.STRING,
      description: 'The policy number as printed on the policy, e.g. AIA-HSG-7841',
    },
    insurer_name: {
      type: Type.STRING,
      description: 'The full legal name of the insurance company',
    },
    policyholder_name: {
      type: Type.STRING,
      description: 'The full name of the policyholder (the person who owns the policy)',
    },
    annual_premium: {
      type: Type.NUMBER,
      description:
        'The annual premium amount as a number (no currency symbol, no commas). ' +
        'Omit this field if no annual premium amount is stated.',
    },
  },
}

const SYSTEM_PROMPT = `You are a policy data extraction assistant. Read the provided Singapore insurance policy text and extract the four requested fields exactly as they appear in the document. Do not infer, guess, or compute. If a field is not stated in the document, omit it (do not include the key).`

export async function GET(req: NextRequest) {
  const t_start = Date.now()

  const userSupabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await userSupabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, errorType: 'unauthenticated' },
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
      { ok: false, errorType: 'admin_only' },
      { status: 403 },
    )
  }

  const policyId = req.nextUrl.searchParams.get('policy_id')
  if (!policyId) {
    return NextResponse.json(
      { ok: false, errorType: 'bad_request', errorMessage: 'missing policy_id' },
      { status: 400 },
    )
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        errorType: 'env_missing',
        errorMessage: 'GEMINI_API_KEY not set in Vercel env',
      },
      { status: 500 },
    )
  }

  const supabase = createServiceRoleClient()

  const { data: chunks, error: cErr } = await supabase
    .from('policy_doc_chunks')
    .select('content')
    .eq('policy_id', policyId)
    .order('chunk_index')

  if (cErr || !chunks || chunks.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        errorType: 'no_chunks',
        errorMessage: cErr?.message ?? 'no chunks — run Layer C first',
      },
      { status: 404 },
    )
  }

  const sourceText = chunks.map((c) => c.content || '').join('\n')
  const sourceChars = sourceText.length

  const t_call_start = Date.now()
  let response
  try {
    const ai = new GoogleGenAI({ apiKey })
    response = await ai.models.generateContent({
      model: MODEL,
      contents: `${SYSTEM_PROMPT}\n\n--- POLICY TEXT ---\n${sourceText}\n--- END ---\n\nExtract the four requested fields.`,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: PROBE_SCHEMA,
        temperature: 0,
      },
    })
  } catch (err) {
    const e = err as Error & { status?: number; name?: string }
    return NextResponse.json(
      {
        ok: false,
        errorType: 'gemini_call',
        errorName: e.name ?? 'Unknown',
        errorMessage: e.message ?? String(err),
        errorStatus: e.status,
        stack: (e.stack ?? '').split('\n').slice(0, 12).join('\n'),
        timing: { call_ms_until_crash: Date.now() - t_call_start },
      },
      { status: 500 },
    )
  }
  const t_call_ms = Date.now() - t_call_start

  const rawText = response.text ?? ''
  let parsed: unknown = null
  let parseError: string | null = null
  try {
    parsed = JSON.parse(rawText)
  } catch (err) {
    parseError = (err as Error).message
  }

  const usage = response.usageMetadata ?? {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const promptTokens: number = (usage as any).promptTokenCount ?? 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidateTokens: number = (usage as any).candidatesTokenCount ?? 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalTokens: number = (usage as any).totalTokenCount ?? 0
  const costUsd =
    promptTokens * COST_PER_INPUT_TOKEN +
    candidateTokens * COST_PER_OUTPUT_TOKEN

  return NextResponse.json({
    ok: parseError === null,
    model: MODEL,
    source: {
      chars: sourceChars,
      chunks: chunks.length,
    },
    rawText,
    parsed,
    parseError,
    usage: {
      promptTokens,
      candidateTokens,
      totalTokens,
    },
    cost: {
      costUsd,
      breakdown: {
        inputUsd: promptTokens * COST_PER_INPUT_TOKEN,
        outputUsd: candidateTokens * COST_PER_OUTPUT_TOKEN,
      },
    },
    timing: {
      call_ms: t_call_ms,
      total_ms: Date.now() - t_start,
    },
  })
}
