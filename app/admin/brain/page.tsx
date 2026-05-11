import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { getAdminUser } from '@/lib/admin'
import BrainOrdersList from './components/BrainOrdersList'
import DirectivePanel from './components/DirectivePanel'
import BrainModelPanel from './components/BrainModelPanel'
import AnthropicLimitBanner from './components/AnthropicLimitBanner'
import type { ActiveDirective } from './components/DirectivePanel'

export const dynamic = 'force-dynamic'

export interface WorkOrder {
  id: string
  title: string
  intent: string | null
  rationale: string | null
  files_to_change: string[] | null
  risk_level: string | null
  category: string | null
  workstream: string | null
  spec: any
  status: string
  created_at: string
  dispatched_at: string | null
  completed_at: string | null
  verified_at: string | null
  auto_approved: boolean
  verification_result: any
  reverted_at: string | null
}

export default async function BrainAdminPage() {
  const user = await getAdminUser()
  if (!user) redirect('/dashboard')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(url, key)

  const { data, error } = await supabase
    .from('work_orders')
    .select('id, title, intent, rationale, files_to_change, risk_level, category, workstream, spec, status, created_at, dispatched_at, completed_at, verified_at, auto_approved, verification_result, reverted_at')
    .order('created_at', { ascending: false })
    .limit(200)

  const orders: WorkOrder[] = (data ?? []) as WorkOrder[]

  // Try to expire stale directives, then read the active one.
  try { await supabase.rpc('expire_stale_directives') } catch {}
  const { data: activeDir } = await supabase
    .from('brain_directives')
    .select('id, title, description, workstream, expires_at, created_at, status')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const active: ActiveDirective | null = (activeDir ?? null) as ActiveDirective | null

  return (
    <div style={{ minHeight: '100vh', background: '#F7F4F0', padding: '32px 40px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <header style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
            Brain Loop
          </div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, color: '#1A1410', fontWeight: 500, margin: 0, letterSpacing: '-0.01em' }}>
            Work Orders
          </h1>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460', marginTop: 6, marginBottom: 0 }}>
            Everything Brain has proposed, executed, or failed on. Read-only.
          </p>
        </header>

        {error ? (
          <div style={{ background: '#FCEBEB', border: '1px solid #F7C1C1', color: '#A32D2D', padding: '14px 18px', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
            Failed to load work orders: {error.message}
          </div>
        ) : (
          <>
            <AnthropicLimitBanner />
            <BrainModelPanel />
            <DirectivePanel active={active} />
            <BrainOrdersList orders={orders} />
          </>
        )}
      </div>
    </div>
  )
}
