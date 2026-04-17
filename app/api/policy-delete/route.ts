import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { policyId, ifaId } = await request.json()

    if (!policyId || !ifaId) {
      return NextResponse.json({ error: 'Missing policyId or ifaId' }, { status: 400 })
    }

    // Verify the policy belongs to this IFA before deleting
    const { data: policy, error: fetchError } = await supabase
      .from('policies')
      .select('id, document_url')
      .eq('id', policyId)
      .eq('ifa_id', ifaId)
      .single()

    if (fetchError || !policy) {
      return NextResponse.json({ error: 'Policy not found or unauthorized' }, { status: 404 })
    }

    // Delete the document from storage if it exists
    if (policy.document_url) {
      await supabase.storage.from('policy-documents').remove([policy.document_url])
    }

    // Delete the policy record
    const { error: deleteError } = await supabase
      .from('policies')
      .delete()
      .eq('id', policyId)
      .eq('ifa_id', ifaId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[policy-delete] error:', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
