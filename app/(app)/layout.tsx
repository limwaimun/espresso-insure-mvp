import DashboardSidebar from '@/components/DashboardSidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()

  const [profileResult, renewalsResult, alertsResult, claimsResult] = await Promise.all([
    supabase.from('profiles').select('name, plan').eq('id', user.id).single(),
    supabase.from('policies')
      .select('id', { count: 'exact', head: true })
      .eq('ifa_id', user.id)
      .gte('renewal_date', now.toISOString())
      .lte('renewal_date', ninetyDays),
    supabase.from('alerts')
      .select('id, priority')
      .eq('ifa_id', user.id)
      .eq('resolved', false),
    supabase.from('claims')
      .select('id', { count: 'exact', head: true })
      .eq('ifa_id', user.id)
      .neq('status', 'paid'),
  ])

  const profile = profileResult.data
  const renewalsCount = renewalsResult.count || 0
  const allAlerts = alertsResult.data || []
  const highAlerts = allAlerts.filter((a: any) => a.priority === 'high').length
  const openClaims = claimsResult.count ?? highAlerts

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#1C0F0A' }}>
      <aside style={{
        width: 240, minWidth: 240, flexShrink: 0,
        position: 'fixed', top: 0, left: 0,
        height: '100vh', zIndex: 200,
        background: '#120A06',
        borderRight: '1px solid #2E1A0E',
      }}>
        <DashboardSidebar
          profile={profile || undefined}
          counts={{ conversations: 0, alerts: highAlerts, renewals: renewalsCount, claims: openClaims }}
        />
      </aside>
      <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh', background: '#1C0F0A' }}>
        {children}
      </main>
    </div>
  )
}
