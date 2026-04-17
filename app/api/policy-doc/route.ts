import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const BUCKET = 'policy-documents'

// POST — upload a policy document PDF
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const policyId = formData.get('policyId') as string
    const ifaId = formData.get('ifaId') as string

    if (!file || !policyId || !ifaId) {
      return NextResponse.json({ error: 'Missing file, policyId or ifaId' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large — max 20MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Store at: policy-documents/{ifaId}/{policyId}/{filename}
    const filePath = `${ifaId}/${policyId}/${file.name}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        upsert: true, // overwrite if re-uploading
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

    // Save file path to policies table
    const { error: dbError } = await supabase
      .from('policies')
      .update({ document_url: filePath, document_name: file.name })
      .eq('id', policyId)

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
    const { searchParams } = new URL(request.url)
    const policyId = searchParams.get('policyId')

    if (!policyId) {
      return NextResponse.json({ error: 'Missing policyId' }, { status: 400 })
    }

    const { data: policy, error } = await supabase
      .from('policies')
      .select('document_url, document_name')
      .eq('id', policyId)
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
