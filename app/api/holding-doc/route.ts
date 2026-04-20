import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySession } from '@/lib/auth-middleware'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const BUCKET = 'holding-documents'
const MAX_BYTES = 20 * 1024 * 1024

// Allowed MIME types: PDF + images + Office docs (per Batch 2 scope)
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
  // Strip path separators, null bytes, and anything exotic. Keep dots, dashes, underscores.
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'document'
}

// POST — upload a holding document (single doc per holding; replaces existing)
export async function POST(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const holdingId = formData.get('holdingId') as string
    const bodyIfaId = formData.get('ifaId') as string | null

    if (bodyIfaId && bodyIfaId !== userId) {
      console.warn(`[holding-doc POST] ignored mismatched ifaId from form: body=${bodyIfaId} session=${userId}`)
    }

    if (!file || !holdingId) {
      return NextResponse.json({ error: 'Missing file or holdingId' }, { status: 400 })
    }

    if (!ALLOWED_MIMES.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Accepted: PDF, JPG, PNG, WebP, DOC, DOCX, XLS, XLSX' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large — max 20MB' }, { status: 400 })
    }

    // ── Ownership check ──────────────────────────────────────────────────
    const { data: holding, error: holdingError } = await supabase
      .from('holdings')
      .select('id')
      .eq('id', holdingId)
      .eq('ifa_id', userId)
      .single()

    if (holdingError || !holding) {
      return NextResponse.json({ error: 'Holding not found or unauthorized' }, { status: 404 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const safeName = sanitizeFilename(file.name)
    const filePath = `${userId}/${holdingId}/${safeName}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, { contentType: file.type, upsert: true })

    if (uploadError) {
      console.error('[holding-doc] upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file: ' + uploadError.message }, { status: 500 })
    }

    const { data: signedUrl, error: urlError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 60 * 60 * 24 * 365)

    if (urlError || !signedUrl) {
      return NextResponse.json({ error: 'File uploaded but could not generate download link' }, { status: 500 })
    }

    const { error: dbError } = await supabase
      .from('holdings')
      .update({ document_url: filePath, document_name: file.name })
      .eq('id', holdingId)
      .eq('ifa_id', userId)

    if (dbError) {
      console.error('[holding-doc] db error:', dbError)
      return NextResponse.json({ error: 'File uploaded but failed to save to holding record' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      filePath,
      downloadUrl: signedUrl.signedUrl,
      fileName: file.name,
      message: 'Holding document saved',
    })
  } catch (err) {
    console.error('[holding-doc] error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// GET — get a fresh signed download URL for a holding document
export async function GET(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const holdingId = searchParams.get('holdingId')

    if (!holdingId) {
      return NextResponse.json({ error: 'Missing holdingId' }, { status: 400 })
    }

    const { data: holding, error } = await supabase
      .from('holdings')
      .select('document_url, document_name')
      .eq('id', holdingId)
      .eq('ifa_id', userId)
      .single()

    if (error || !holding?.document_url) {
      return NextResponse.json({ error: 'No document found for this holding' }, { status: 404 })
    }

    const { data: signedUrl, error: urlError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(holding.document_url, 60 * 60)

    if (urlError || !signedUrl) {
      return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 })
    }

    return NextResponse.json({
      downloadUrl: signedUrl.signedUrl,
      fileName: holding.document_name,
    })
  } catch (err) {
    console.error('[holding-doc GET] error:', err)
    return NextResponse.json({ error: 'Failed to get document' }, { status: 500 })
  }
}
