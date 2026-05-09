import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySession } from '@/lib/auth-middleware'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const BUCKET = 'policy-documents'
const MAX_BYTES = 20 * 1024 * 1024

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'document'
}

async function assertPolicyOwnership(policyId: string, userId: string) {
  const { data, error } = await supabase
    .from('policies')
    .select('id')
    .eq('id', policyId)
    .eq('ifa_id', userId)
    .single()
  if (error || !data) return { ok: false as const, status: 404, error: 'Policy not found or unauthorized' }
  return { ok: true as const }
}

// POST — upload one doc for a policy (inserts a row in policy_documents)
export async function POST(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File
    const policyId = formData.get('policyId') as string
    const bodyIfaId = formData.get('ifaId') as string | null

    if (bodyIfaId && bodyIfaId !== userId) {
      console.warn(`[policy-doc POST] ignored mismatched ifaId: body=${bodyIfaId} session=${userId}`)
    }

    if (!file || !policyId) return NextResponse.json({ error: 'Missing file or policyId' }, { status: 400 })
    if (!ALLOWED_MIMES.has(file.type)) return NextResponse.json({ error: 'Unsupported file type. Accepted: PDF, JPG, PNG, WebP, DOC, DOCX, XLS, XLSX' }, { status: 400 })
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File too large — max 20MB' }, { status: 400 })

    const own = await assertPolicyOwnership(policyId, userId)
    if (!own.ok) return NextResponse.json({ error: own.error }, { status: own.status })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const safeName = sanitizeFilename(file.name)
    const filePath = `${userId}/${policyId}/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('[policy-doc POST] storage error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file: ' + uploadError.message }, { status: 500 })
    }

    const { data: inserted, error: dbError } = await supabase
      .from('policy_documents')
      .insert({
        policy_id: policyId,
        ifa_id: userId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single()

    if (dbError || !inserted) {
      console.error('[policy-doc POST] db error:', dbError)
      await supabase.storage.from(BUCKET).remove([filePath])
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 })
    }

    return NextResponse.json({ success: true, doc: inserted })
  } catch (err) {
    console.error('[policy-doc POST] error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// GET — list all docs for a policy with fresh 1-hour signed URLs
export async function GET(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const policyId = searchParams.get('policyId')
    const docId = searchParams.get('docId')

    // ── Single-doc mode: fetch a fresh signed URL for one doc ──────────
    // Called on-demand from DocList when user clicks a filename. Keeping
    // this separate from the list query means list loads are DB-only
    // (fast); signed URL round-trips only happen when actually needed.
    if (docId) {
      const { data: doc, error } = await supabase
        .from('policy_documents')
        .select('file_path, file_name')
        .eq('id', docId)
        .eq('ifa_id', userId)
        .single()
      if (error || !doc) {
        return NextResponse.json({ error: 'Document not found or unauthorized' }, { status: 404 })
      }
      const { data: signed, error: urlErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(doc.file_path, 60 * 60)
      if (urlErr || !signed) {
        console.error('[policy-doc GET docId] signed URL failed:', urlErr)
        return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 })
      }
      return NextResponse.json({ downloadUrl: signed.signedUrl, fileName: doc.file_name })
    }

    // ── List mode ──────────────────────────────────────────────────────
    if (!policyId) return NextResponse.json({ error: 'Missing policyId or docId' }, { status: 400 })

    // Single query that both filters and enforces ownership. No separate
    // ownership pre-check — `.eq('ifa_id', userId)` + RLS make it impossible
    // to see rows belonging to another FA. Saves a round-trip.
    const { data: rows, error } = await supabase
      .from('policy_documents')
      .select('id, file_name, file_size, mime_type, uploaded_at')
      .eq('policy_id', policyId)
      .eq('ifa_id', userId)
      .order('uploaded_at', { ascending: true })

    if (error) {
      console.error('[policy-doc GET] query error:', error)
      return NextResponse.json({ error: 'Failed to list documents' }, { status: 500 })
    }

    // Return metadata only — no signed URLs. DocList fetches URLs on-demand.
    const docs = (rows || []).map(r => ({
      id: r.id,
      fileName: r.file_name,
      fileSize: r.file_size,
      mimeType: r.mime_type,
      uploadedAt: r.uploaded_at,
    }))

    return NextResponse.json({ docs })
  } catch (err) {
    console.error('[policy-doc GET] error:', err)
    return NextResponse.json({ error: 'Failed to get documents' }, { status: 500 })
  }
}

// DELETE — remove one doc by docId
export async function DELETE(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const docId = searchParams.get('docId')
    if (!docId) return NextResponse.json({ error: 'Missing docId' }, { status: 400 })

    const { data: doc, error: fetchErr } = await supabase
      .from('policy_documents')
      .select('id, file_path')
      .eq('id', docId)
      .eq('ifa_id', userId)
      .single()

    if (fetchErr || !doc) return NextResponse.json({ error: 'Document not found or unauthorized' }, { status: 404 })

    const { error: storageErr } = await supabase.storage.from(BUCKET).remove([doc.file_path])
    if (storageErr) console.warn('[policy-doc DELETE] storage remove failed (proceeding):', storageErr)

    const { error: deleteErr } = await supabase
      .from('policy_documents')
      .delete()
      .eq('id', docId)
      .eq('ifa_id', userId)

    if (deleteErr) {
      console.error('[policy-doc DELETE] db error:', deleteErr)
      return NextResponse.json({ error: 'Failed to delete document record' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[policy-doc DELETE] error:', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
