import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const STATUS_MAP: Record<string, { resolved: boolean }> = {
  open: { resolved: false },
  in_progress: { resolved: false },
  resolved: { resolved: true },
}

export async function POST(request: NextRequest) {
  try {
    const { claimId, ifaId, status, priority, title, body, resolved } = await request.json()

    if (!claimId || !ifaId) {
      return NextResponse.json({ error: 'Missing claimId or ifaId' }, { status: 400 })
    }

    const patch: Record<string, unknown> = {}
    if (title !== undefined) patch.title = title
    if (body !== undefined) patch.body = body
    if (priority !== undefined) patch.priority = priority
    if (status !== undefined) {
      patch.status = status
      patch.resolved = STATUS_MAP[status]?.resolved ?? (resolved ?? false)
    } else if (resolved !== undefined) {
      patch.resolved = resolved
    }

    const { error } = await supabase
      .from('alerts')
      .update(patch)
      .eq('id', claimId)
      .eq('ifa_id', ifaId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[claim-update] error:', err)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
