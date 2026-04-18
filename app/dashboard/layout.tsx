import DashboardSidebar from '@/components/DashboardSidebar'
import DashboardTopbar from '@/components/DashboardTopbar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()

  // All queries in parallel
  const [profileResult, renewalsResult, alertsResult] = await Promise.all([
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
  ])

  const profile = profileResult.data
  const renewalsCount = renewalsResult.count || 0
  const allAlerts = alertsResult.data || []
  const highAlerts = allAlerts.filter((a: any) => a.priority === 'high').length

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F4F0' }}>
      <aside style={{
        width: 240, minWidth: 240,
        position: 'fixed', top: 0, left: 0,
        height: '100vh', zIndex: 200, overflowY: 'auto',
      }}>
        <DashboardSidebar
          profile={profile || undefined}
          counts={{ conversations: 0, alerts: highAlerts, renewals: renewalsCount, claims: highAlerts }}
        />
      </aside>
      <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh', background: '#F7F4F0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ borderBottom: '0.5px solid #E8E2DA', background: '#FFFFFF', padding: '0 32px' }}>
          <DashboardTopbar profile={profile} />
        </div>
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  )
}
