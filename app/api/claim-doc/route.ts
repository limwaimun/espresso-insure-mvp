import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySession } from '@/lib/auth-middleware'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const BUCKET = 'claim-attachments'
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

// Verify that `claimId` is an alert of type 'claim' owned by `userId`.
// Claims live in the dedicated `claims` table (post-B57 schema migration). We also fetch the
// client_id here because claim_attachments.client_id is NOT NULL.
async function assertClaimOwnership(claimId: string, userId: string) {
  const { data, error } = await supabase
    .from('claims')
    .select('id, type, client_id')
    .eq('id', claimId)
    .eq('fa_id', userId)
    .single()
  if (error || !data) return { ok: false as const, status: 404, error: 'Claim not found or unauthorized' }
  if (data.type !== 'claim') return { ok: false as const, status: 400, error: 'Target is not a claim' }
  if (!data.client_id) return { ok: false as const, status: 400, error: 'Claim has no associated client' }
  return { ok: true as const, clientId: data.client_id as string }
}

// POST — upload one document for a claim (inserts a row in claim_attachments)
export async function POST(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const claimId = formData.get('claimId') as string
    const bodyFaId = formData.get('faId') as string | null
    const description = (formData.get('description') as string | null) || null

    if (bodyFaId && bodyFaId !== userId) {
      console.warn(`[claim-doc POST] ignored mismatched faId from form: body=${bodyFaId} session=${userId}`)
    }

    if (!file || !claimId) {
      return NextResponse.json({ error: 'Missing file or claimId' }, { status: 400 })
    }

    if (!ALLOWED_MIMES.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Accepted: PDF, JPG, PNG, WebP, DOC, DOCX, XLS, XLSX' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large — max 20MB' }, { status: 400 })
    }

    const own = await assertClaimOwnership(claimId, userId)
    if (!own.ok) return NextResponse.json({ error: own.error }, { status: own.status })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const safeName = sanitizeFilename(file.name)
    // Prepend timestamp for uniqueness — multiple docs per claim must not collide
    const storagePath = `${userId}/${claimId}/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('[claim-doc] upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file: ' + uploadError.message }, { status: 500 })
    }

    // Insert row in claim_attachments
    const { data: inserted, error: dbError } = await supabase
      .from('claim_attachments')
      .insert({
        claim_id: claimId,
        client_id: own.clientId,
        fa_id: userId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        source: 'fa_upload',
        description,
        uploaded_by: 'FA',
      })
      .select()
      .single()

    if (dbError || !inserted) {
      console.error('[claim-doc] db error:', dbError)
      // Try to roll back the upload to avoid orphan
      await supabase.storage.from(BUCKET).remove([storagePath])
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 })
    }

    return NextResponse.json({ success: true, doc: inserted })
  } catch (err) {
    console.error('[claim-doc POST] error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// GET — list metadata for a claim (?claimId=) OR fetch fresh signed URL for
// one doc (?docId=). Splitting these keeps list loads DB-only (fast); signed
// URL generation only happens when the user actually clicks a download.
export async function GET(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const claimId = searchParams.get('claimId')
    const docId = searchParams.get('docId')

    // ── Single-doc mode: on-demand signed URL for download ──────────────
    if (docId) {
      const { data: doc, error } = await supabase
        .from('claim_attachments')
        .select('storage_path, file_name')
        .eq('id', docId)
        .eq('fa_id', userId)
        .single()
      if (error || !doc) {
        return NextResponse.json({ error: 'Document not found or unauthorized' }, { status: 404 })
      }
      const { data: signed, error: urlErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(doc.storage_path, 60 * 60)
      if (urlErr || !signed) {
        console.error('[claim-doc GET docId] signed URL failed:', urlErr)
        return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 })
      }
      return NextResponse.json({ downloadUrl: signed.signedUrl, fileName: doc.file_name })
    }

    // ── List mode ───────────────────────────────────────────────────────
    if (!claimId) {
      return NextResponse.json({ error: 'Missing claimId or docId' }, { status: 400 })
    }

    // Single query that both filters and enforces ownership. No separate
    // ownership pre-check — `.eq('fa_id', userId)` + RLS make it impossible
    // to see rows belonging to another FA. Saves a round-trip.
    const { data: rows, error } = await supabase
      .from('claim_attachments')
      .select('id, file_name, file_size, file_type, source, description, uploaded_by, created_at')
      .eq('claim_id', claimId)
      .eq('fa_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[claim-doc GET] query error:', error)
      return NextResponse.json({ error: 'Failed to list documents' }, { status: 500 })
    }

    // Return metadata only — no signed URLs. DocList fetches URLs on-demand.
    // Extra fields (source, description, uploadedBy) let DocList optionally
    // render source badges; components that don't use them just ignore them.
    const docs = (rows || []).map(r => ({
      id: r.id,
      fileName: r.file_name,
      fileSize: r.file_size,
      mimeType: r.file_type,
      uploadedAt: r.created_at,
      source: r.source,
      description: r.description,
      uploadedBy: r.uploaded_by,
    }))

    return NextResponse.json({ docs })
  } catch (err) {
    console.error('[claim-doc GET] error:', err)
    return NextResponse.json({ error: 'Failed to get documents' }, { status: 500 })
  }
}

// DELETE — remove one document by docId. Removes the storage file and the row.
export async function DELETE(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const docId = searchParams.get('docId')

    if (!docId) {
      return NextResponse.json({ error: 'Missing docId' }, { status: 400 })
    }

    // Fetch the row (scoped to caller) to get the storage path
    const { data: doc, error: fetchErr } = await supabase
      .from('claim_attachments')
      .select('id, storage_path')
      .eq('id', docId)
      .eq('fa_id', userId)
      .single()

    if (fetchErr || !doc) {
      return NextResponse.json({ error: 'Document not found or unauthorized' }, { status: 404 })
    }

    // Remove storage file first. If this fails, we still try to clear the DB row
    // below — orphan storage is preferable to a zombie DB row pointing nowhere.
    const { error: storageErr } = await supabase.storage
      .from(BUCKET)
      .remove([doc.storage_path])
    if (storageErr) {
      console.warn('[claim-doc DELETE] storage remove failed (proceeding with DB delete):', storageErr)
    }

    const { error: deleteErr } = await supabase
      .from('claim_attachments')
      .delete()
      .eq('id', docId)
      .eq('fa_id', userId)

    if (deleteErr) {
      console.error('[claim-doc DELETE] db error:', deleteErr)
      return NextResponse.json({ error: 'Failed to delete document record' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[claim-doc DELETE] error:', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
