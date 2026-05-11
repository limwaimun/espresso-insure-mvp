/**
 * B-pe-15d.q1 — quality eval: unpdf extraction vs Claude verbatim baseline.
 *
 * Admin-only GET endpoint. Pulls existing policy_doc_chunks (Claude baseline)
 * and runs unpdf extraction in-line. Returns plain-text comparison output:
 * coverage stats, critical-facts presence, and sample chunks/pages.
 *
 * Purpose: confirm extraction quality preserved before B-pe-15f ships
 * unpdf into the production Layer C path.
 *
 * Usage:
 *   GET /api/policy-parse/eval-extraction?policy_id=<uuid>
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { extractText, getDocumentProxy } from 'unpdf';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Curated for the AIA HSG STRESSED test policy.
// Each MUST appear somewhere in correctly-extracted policy text.
const CRITICAL_FACTS = [
  'AIA-HSG-7841',
  'Tan Wei Ming',
  'HealthShield Gold Max',
  'AIA Singapore',
  'Plan A',
  'AIA-HSG-MAX/PD/03-2024',
  'Annual Deductible',
  'Co-insurance',
];

export async function GET(req: NextRequest) {
  // Authenticate
  const userSupabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await userSupabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: 'unauthenticated' },
      { status: 401 }
    );
  }

  // Authorize admin
  const { data: profile } = await userSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json(
      { ok: false, error: 'admin_only' },
      { status: 403 }
    );
  }

  const policyId = req.nextUrl.searchParams.get('policy_id');
  if (!policyId) {
    return NextResponse.json(
      { ok: false, error: 'missing_policy_id' },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();

  // 1) Pull Claude chunks (baseline)
  const { data: chunks, error: chunksErr } = await supabase
    .from('policy_doc_chunks')
    .select('chunk_index, chunk_text')
    .eq('policy_id', policyId)
    .order('chunk_index');

  if (chunksErr || !chunks || chunks.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: 'no_claude_baseline',
        message: chunksErr?.message || 'no chunks found for policy',
      },
      { status: 404 }
    );
  }

  const claudeText = chunks.map((c) => c.chunk_text || '').join('\n');

  // 2) Fetch PDF doc
  const { data: doc, error: docErr } = await supabase
    .from('policy_documents')
    .select('file_path, file_name')
    .eq('policy_id', policyId)
    .order('uploaded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (docErr || !doc) {
    return NextResponse.json(
      { ok: false, error: 'no_document' },
      { status: 404 }
    );
  }

  const { data: fileBlob, error: dlErr } = await supabase.storage
    .from('policy-documents')
    .download(doc.file_path);

  if (dlErr || !fileBlob) {
    return NextResponse.json(
      { ok: false, error: 'download_failed', message: dlErr?.message },
      { status: 500 }
    );
  }

  // 3) Run unpdf
  const t_extract_start = Date.now();
  const bytes = new Uint8Array(await fileBlob.arrayBuffer());
  const pdf = await getDocumentProxy(bytes);
  const result = await extractText(pdf, { mergePages: false });
  const pages: string[] = Array.isArray(result.text) ? result.text : [result.text];
  const unpdfText = pages.join('\n');
  const t_extract_ms = Date.now() - t_extract_start;

  // 4) Critical facts (case-insensitive)
  const factsCheck = CRITICAL_FACTS.map((fact) => ({
    fact,
    inClaude: claudeText.toLowerCase().includes(fact.toLowerCase()),
    inUnpdf: unpdfText.toLowerCase().includes(fact.toLowerCase()),
  }));

  // 5) Build pretty-printed plain text output
  const out: string[] = [];
  out.push('========================================');
  out.push('  EXTRACTION QUALITY EVAL');
  out.push('========================================');
  out.push(`Policy ID: ${policyId}`);
  out.push(`File:      ${doc.file_name}`);
  out.push('');

  out.push('--- COVERAGE STATS ---');
  out.push(`Claude baseline:   ${chunks.length} chunks, ${claudeText.length} chars`);
  out.push(`unpdf candidate:   ${pages.length} pages, ${unpdfText.length} chars`);
  const ratio = (unpdfText.length / Math.max(claudeText.length, 1)).toFixed(3);
  out.push(`Ratio (unpdf/claude): ${ratio}`);
  out.push(`unpdf extract time:   ${t_extract_ms}ms`);
  out.push('');

  out.push('--- CRITICAL FACTS (case-insensitive) ---');
  const factMaxLen = Math.max(...CRITICAL_FACTS.map((f) => f.length));
  for (const f of factsCheck) {
    const c = f.inClaude ? 'YES' : 'NO ';
    const u = f.inUnpdf ? 'YES' : 'NO ';
    out.push(`  ${f.fact.padEnd(factMaxLen + 2)}  Claude: ${c}   unpdf: ${u}`);
  }
  out.push('');

  // Sample chunks/pages — pick from middle and end of doc
  const claudeSampleIdx = [0, Math.floor(chunks.length / 2), chunks.length - 1];
  const unpdfSampleIdx = [4, 9, 13]; // 0-indexed largest pages from probe

  for (const i of claudeSampleIdx) {
    out.push(`--- CLAUDE CHUNK ${i} (${(chunks[i].chunk_text || '').length} chars) ---`);
    out.push(chunks[i].chunk_text || '(empty)');
    out.push('');
  }

  for (const i of unpdfSampleIdx) {
    const p = pages[i] || '';
    out.push(`--- unpdf PAGE ${i + 1} (${p.length} chars) ---`);
    out.push(p || '(empty)');
    out.push('');
  }

  out.push('--- END EVAL ---');

  return new NextResponse(out.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
