import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySession } from '@/lib/auth-middleware'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    // ── Parse body ────────────────────────────────────────────────────────
    const { policyId, ifaId: _unused } = await request.json()

    if (_unused && _unused !== userId) {
      console.warn(`[policy-delete] ignored mismatched ifaId from body: body=${_unused} session=${userId}`)
    }

    if (!policyId) {
      return NextResponse.json({ error: 'Missing policyId' }, { status: 400 })
    }

    // ── Verify the policy belongs to this IFA before deleting ─────────────
    const { data: policy, error: fetchError } = await supabase
      .from('policies')
      .select('id, document_url')
      .eq('id', policyId)
      .eq('ifa_id', userId)
      .single()

    if (fetchError || !policy) {
      return NextResponse.json({ error: 'Policy not found or unauthorized' }, { status: 404 })
    }

    // ── Delete the document from storage if it exists ─────────────────────
    if (policy.document_url) {
      await supabase.storage.from('policy-documents').remove([policy.document_url])
    }

    // ── Delete the policy record ──────────────────────────────────────────
    const { error: deleteError } = await supabase
      .from('policies')
      .delete()
      .eq('id', policyId)
      .eq('ifa_id', userId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[policy-delete] error:', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
