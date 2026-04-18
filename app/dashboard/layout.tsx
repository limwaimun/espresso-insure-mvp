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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F7F4F0' }}>

      {/* Full-width topbar — spans entire viewport, no gap possible */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 56, zIndex: 300,
        background: '#FFFFFF',
        borderBottom: '0.5px solid #E8E2DA',
        display: 'flex', alignItems: 'center',
      }}>
        {/* Logo section — exactly 240px, matches sidebar width */}
        <div style={{ width: 240, flexShrink: 0, padding: '0 20px', borderRight: '0.5px solid #E8E2DA', height: '100%', display: 'flex', alignItems: 'center' }}>
          <a href="/dashboard" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 400, color: '#1A1410', letterSpacing: '-0.01em' }}>
              espresso<span style={{ color: '#BA7517' }}>.</span>
            </span>
          </a>
        </div>
        {/* Topbar content */}
        <div style={{ flex: 1, padding: '0 32px' }}>
          <DashboardTopbar profile={profile} />
        </div>
      </div>

      {/* Body — below topbar */}
      <div style={{ display: 'flex', flex: 1, paddingTop: 56 }}>

        {/* Sidebar — no logo needed, starts below topbar */}
        <aside style={{
          width: 240, flexShrink: 0,
          position: 'fixed', top: 56, left: 0,
          height: 'calc(100vh - 56px)',
          zIndex: 200, overflowY: 'auto',
        }}>
          <DashboardSidebar
            profile={profile || undefined}
            counts={{ conversations: 0, alerts: highAlerts, renewals: renewalsCount, claims: highAlerts }}
          />
        </aside>

        {/* Main content */}
        <main style={{ marginLeft: 240, flex: 1, minHeight: 'calc(100vh - 56px)', background: '#F7F4F0' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
