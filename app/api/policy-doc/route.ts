import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySession } from '@/lib/auth-middleware'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const BUCKET = 'policy-documents'

// POST — upload a policy document PDF
export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const policyId = formData.get('policyId') as string
    const bodyIfaId = formData.get('ifaId') as string | null

    if (bodyIfaId && bodyIfaId !== userId) {
      console.warn(`[policy-doc POST] ignored mismatched ifaId from form: body=${bodyIfaId} session=${userId}`)
    }

    if (!file || !policyId) {
      return NextResponse.json({ error: 'Missing file or policyId' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large — max 20MB' }, { status: 400 })
    }

    // ── Ownership check: verify the policy belongs to the caller ──────────
    const { data: policy, error: policyError } = await supabase
      .from('policies')
      .select('id')
      .eq('id', policyId)
      .eq('ifa_id', userId)
      .single()

    if (policyError || !policy) {
      return NextResponse.json({ error: 'Policy not found or unauthorized' }, { status: 404 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Store at: policy-documents/{userId}/{policyId}/{filename}
    const filePath = `${userId}/${policyId}/${file.name}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('[policy-doc] upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file: ' + uploadError.message }, { status: 500 })
    }

    // Get signed URL (valid 1 year)
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 60 * 60 * 24 * 365)

    if (urlError || !signedUrl) {
      return NextResponse.json({ error: 'File uploaded but could not generate download link' }, { status: 500 })
    }

    // Save file path to policies table — scoped to verified userId
    const { error: dbError } = await supabase
      .from('policies')
      .update({ document_url: filePath, document_name: file.name })
      .eq('id', policyId)
      .eq('ifa_id', userId)

    if (dbError) {
      console.error('[policy-doc] db error:', dbError)
      return NextResponse.json({ error: 'File uploaded but failed to save to policy record' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      filePath,
      downloadUrl: signedUrl.signedUrl,
      fileName: file.name,
      message: 'Policy document saved',
    })
  } catch (err) {
    console.error('[policy-doc] error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// GET — get a fresh signed download URL for a policy document
export async function GET(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const policyId = searchParams.get('policyId')

    if (!policyId) {
      return NextResponse.json({ error: 'Missing policyId' }, { status: 400 })
    }

    // ── Ownership check: only return a download URL for the caller's own policy ──
    const { data: policy, error } = await supabase
      .from('policies')
      .select('document_url, document_name')
      .eq('id', policyId)
      .eq('ifa_id', userId)
      .single()

    if (error || !policy?.document_url) {
      return NextResponse.json({ error: 'No document found for this policy' }, { status: 404 })
    }

    const { data: signedUrl, error: urlError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(policy.document_url, 60 * 60) // 1 hour

    if (urlError || !signedUrl) {
      return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 })
    }

    return NextResponse.json({
      downloadUrl: signedUrl.signedUrl,
      fileName: policy.document_name,
    })
  } catch (err) {
    console.error('[policy-doc GET] error:', err)
    return NextResponse.json({ error: 'Failed to get document' }, { status: 500 })
  }
}
