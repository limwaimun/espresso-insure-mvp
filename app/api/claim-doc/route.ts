import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySession } from '@/lib/auth-middleware'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const BUCKET = 'claim-documents'
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
// Claims live in the alerts table with type='claim', so we check that here.
async function assertClaimOwnership(claimId: string, userId: string) {
  const { data, error } = await supabase
    .from('alerts')
    .select('id, type')
    .eq('id', claimId)
    .eq('ifa_id', userId)
    .single()
  if (error || !data) return { ok: false as const, status: 404, error: 'Claim not found or unauthorized' }
  if (data.type !== 'claim') return { ok: false as const, status: 400, error: 'Target is not a claim' }
  return { ok: true as const }
}

// POST — upload one document for a claim (inserts a row in claim_documents)
export async function POST(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const claimId = formData.get('claimId') as string
    const bodyIfaId = formData.get('ifaId') as string | null

    if (bodyIfaId && bodyIfaId !== userId) {
      console.warn(`[claim-doc POST] ignored mismatched ifaId from form: body=${bodyIfaId} session=${userId}`)
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
    const filePath = `${userId}/${claimId}/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('[claim-doc] upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file: ' + uploadError.message }, { status: 500 })
    }

    // Insert row referencing this upload
    const { data: inserted, error: dbError } = await supabase
      .from('claim_documents')
      .insert({
        claim_id: claimId,
        ifa_id: userId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single()

    if (dbError || !inserted) {
      console.error('[claim-doc] db error:', dbError)
      // Try to roll back the upload to avoid orphan
      await supabase.storage.from(BUCKET).remove([filePath])
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 })
    }

    return NextResponse.json({ success: true, doc: inserted })
  } catch (err) {
    console.error('[claim-doc POST] error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// GET — list all docs for a claim, each with a fresh 1-hour signed URL
export async function GET(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const claimId = searchParams.get('claimId')

    if (!claimId) {
      return NextResponse.json({ error: 'Missing claimId' }, { status: 400 })
    }

    const own = await assertClaimOwnership(claimId, userId)
    if (!own.ok) return NextResponse.json({ error: own.error }, { status: own.status })

    const { data: rows, error } = await supabase
      .from('claim_documents')
      .select('id, file_name, file_path, file_size, mime_type, uploaded_at')
      .eq('claim_id', claimId)
      .eq('ifa_id', userId)
      .order('uploaded_at', { ascending: true })

    if (error) {
      console.error('[claim-doc GET] query error:', error)
      return NextResponse.json({ error: 'Failed to list documents' }, { status: 500 })
    }

    const docs = await Promise.all(
      (rows || []).map(async r => {
        const { data: signed } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(r.file_path, 60 * 60)
        return {
          id: r.id,
          fileName: r.file_name,
          fileSize: r.file_size,
          mimeType: r.mime_type,
          uploadedAt: r.uploaded_at,
          downloadUrl: signed?.signedUrl ?? null,
        }
      })
    )

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
      .from('claim_documents')
      .select('id, file_path')
      .eq('id', docId)
      .eq('ifa_id', userId)
      .single()

    if (fetchErr || !doc) {
      return NextResponse.json({ error: 'Document not found or unauthorized' }, { status: 404 })
    }

    // Remove storage file first. If this fails, we still try to clear the DB row
    // below — orphan storage is preferable to a zombie DB row pointing nowhere.
    const { error: storageErr } = await supabase.storage
      .from(BUCKET)
      .remove([doc.file_path])
    if (storageErr) {
      console.warn('[claim-doc DELETE] storage remove failed (proceeding with DB delete):', storageErr)
    }

    const { error: deleteErr } = await supabase
      .from('claim_documents')
      .delete()
      .eq('id', docId)
      .eq('ifa_id', userId)

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
