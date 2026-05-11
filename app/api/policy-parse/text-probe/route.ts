/**
 * B-pe-15d — unpdf text extraction probe.
 *
 * Standalone admin-only GET endpoint that runs ONLY unpdf extraction
 * against the most recent PDF for a given policy_id, returning
 * structured success/failure JSON with timing breakdown.
 *
 * Purpose: validate text-extraction library compatibility with Vercel
 * Node.js runtime in isolation before integrating into Layer C.
 * Replaces in-place integration approach that crashed three times
 * (B-pe-15b/b.1/b.2) with the @napi-rs/canvas dep on pdfjs-dist.
 *
 * Usage:
 *   GET /api/policy-parse/text-probe?policy_id=<uuid>
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { extractText, getDocumentProxy } from 'unpdf';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const t_start = Date.now();

  // Authenticate
  const userSupabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await userSupabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, errorType: 'unauthenticated' },
      { status: 401 }
    );
  }

  // Authorize admin
  const { data: profile, error: profileError } = await userSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    return NextResponse.json(
      { ok: false, errorType: 'admin_only' },
      { status: 403 }
    );
  }

  const policyId = req.nextUrl.searchParams.get('policy_id');
  if (!policyId) {
    return NextResponse.json(
      { ok: false, errorType: 'bad_request', errorMessage: 'missing policy_id' },
      { status: 400 }
    );
  }

  // Service-role client to bypass RLS on storage + policy_documents lookup
  const supabase = createServiceRoleClient();

  // 1) Find the most recent PDF for this policy
  const { data: doc, error: docError } = await supabase
    .from('policy_documents')
    .select('file_path, file_name, file_size')
    .eq('policy_id', policyId)
    .order('uploaded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (docError || !doc) {
    return NextResponse.json(
      {
        ok: false,
        errorType: 'db_lookup',
        errorMessage: docError?.message || 'no document for policy',
      },
      { status: 404 }
    );
  }

  // 2) Download from storage
  const t_dl_start = Date.now();
  const { data: fileBlob, error: dlError } = await supabase.storage
    .from('policy-documents')
    .download(doc.file_path);

  if (dlError || !fileBlob) {
    return NextResponse.json(
      {
        ok: false,
        errorType: 'storage_download',
        errorMessage: dlError?.message || 'download returned null',
        storagePath: doc.file_path,
      },
      { status: 500 }
    );
  }
  const t_dl_ms = Date.now() - t_dl_start;

  const arrayBuffer = await fileBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // 3) unpdf extraction — wrapped in try/catch so we capture module-load
  //    OR runtime failures cleanly, not 500 with no diagnostics.
  const t_pdf_start = Date.now();
  try {
    const pdf = await getDocumentProxy(bytes);
    const result = await extractText(pdf, { mergePages: false });
    const t_pdf_ms = Date.now() - t_pdf_start;

    // result.text is string[] when mergePages: false
    const pages: string[] = Array.isArray(result.text)
      ? result.text
      : [result.text];

    const totalChars = pages.reduce((sum, p) => sum + (p?.length || 0), 0);

    return NextResponse.json({
      ok: true,
      file: {
        name: doc.file_name,
        sizeBytes: doc.file_size,
        storagePath: doc.file_path,
      },
      numPages: result.totalPages,
      totalChars,
      perPage: pages.map((text, idx) => ({
        idx,
        chars: text?.length || 0,
        preview: (text || '').slice(0, 200).replace(/\s+/g, ' '),
      })),
      timing: {
        download_ms: t_dl_ms,
        extract_ms: t_pdf_ms,
        total_ms: Date.now() - t_start,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        errorType: 'unpdf_extraction',
        errorName: err?.name || 'Unknown',
        errorMessage: err?.message || String(err),
        stack: (err?.stack || '').split('\n').slice(0, 12).join('\n'),
        timing: {
          download_ms: t_dl_ms,
          extract_ms_until_crash: Date.now() - t_pdf_start,
          total_ms: Date.now() - t_start,
        },
      },
      { status: 500 }
    );
  }
}
