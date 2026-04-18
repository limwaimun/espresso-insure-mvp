import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardHome() {
  const supabase = await createClient()

  const now = new Date()
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [
    { count: clientCount },
    { data: policies },
    { data: alerts },
    { data: clients },
    { data: overdueHoldings },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('policies').select('id, type, insurer, premium, renewal_date, status, created_at, client_id, clients!inner(id, name, company)'),
    supabase.from('alerts').select('id, title, type, priority, resolved, created_at, client_id, clients(id, name)').eq('resolved', false).order('created_at', { ascending: false }),
    supabase.from('clients').select('id, name, birthday'),
    supabase.from('holdings')
      .select('id, product_name, client_id, last_reviewed_at, clients(id, name)')
      .or(`last_reviewed_at.is.null,last_reviewed_at.lt.${new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()}`)
      .limit(5),
  ])

  const allPolicies = policies || []
  const allAlerts = alerts || []
  const allClients = clients || []

  const totalPremium = allPolicies.reduce((s, p) => s + (Number(p.premium) || 0), 0)
  const renewingIn30 = allPolicies.filter(p => {
    if (!p.renewal_date) return false
    const d = new Date(p.renewal_date)
    return d >= now && d <= thirtyDays
  })
  const openClaims = allAlerts.filter(a => a.priority === 'high' || a.type === 'claim')

  // Urgent column: lapsed + due ≤7 days + high priority claims
  const lapsed = allPolicies.filter(p => {
    if (!p.renewal_date) return false
    return new Date(p.renewal_date) < now
  })
  const dueSoon = allPolicies.filter(p => {
    if (!p.renewal_date) return false
    const d = new Date(p.renewal_date)
    const days = Math.ceil((d.getTime() - now.getTime()) / 86400000)
    return days >= 0 && days <= 7
  })
  const highClaims = allAlerts.filter(a => a.priority === 'high' && !a.resolved)

  // Relationship column: birthdays + policy anniversaries + quiet conversations
  const birthdaysThisWeek = allClients.filter(c => {
    if (!c.birthday) return false
    const bday = new Date(c.birthday)
    const thisYear = new Date(now.getFullYear(), bday.getMonth(), bday.getDate())
    const diff = Math.ceil((thisYear.getTime() - now.getTime()) / 86400000)
    return diff >= 0 && diff <= 7
  })
  const policyAnniversaries = allPolicies.filter(p => {
    if (!p.created_at) return false
    const created = new Date(p.created_at)
    const anniv = new Date(now.getFullYear(), created.getMonth(), created.getDate())
    const diff = Math.ceil((anniv.getTime() - now.getTime()) / 86400000)
    return diff >= 0 && diff <= 3
  })

  // Pipeline column: renewals 8–30 days + coverage gaps
  const pipeline = allPolicies.filter(p => {
    if (!p.renewal_date) return false
    const d = new Date(p.renewal_date)
    const days = Math.ceil((d.getTime() - now.getTime()) / 86400000)
    return days > 7 && days <= 30
  }).sort((a, b) => new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime())
  const gaps = allAlerts.filter(a => a.type === 'gap' && !a.resolved)

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const getDays = (date: string) => Math.ceil((new Date(date).getTime() - now.getTime()) / 86400000)

  const pill = (text: string, color: 'red' | 'amber' | 'teal' | 'blue') => {
    const styles = {
      red:   { bg: '#FCEBEB', text: '#A32D2D', border: '#F7C1C1' },
      amber: { bg: '#FAEEDA', text: '#854F0B', border: '#FAC775' },
      teal:  { bg: '#E1F5EE', text: '#0F6E56', border: '#9FE1CB' },
      blue:  { bg: '#E6F1FB', text: '#185FA5', border: '#B5D4F4' },
    }
    const s = styles[color]
    return (
      <span style={{ background: s.bg, color: s.text, border: `0.5px solid ${s.border}`, fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 100, flexShrink: 0, whiteSpace: 'nowrap' }}>
        {text}
      </span>
    )
  }

  const card = (key: string, icon: string, name: string, sub: string, badge: React.ReactNode, href: string) => (
    <Link key={key} href={href} style={{ textDecoration: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '10px 12px', marginBottom: 6 }}>
        <span style={{ fontSize: 14, flexShrink: 0, width: 20, textAlign: 'center' }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#1A1410', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#3D3532', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{sub}</div>
        </div>
        {badge}
      </div>
    </Link>
  )

  const secLabel = (text: string) => (
    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#3D3532', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '10px 0 6px', fontWeight: 500 }}>{text}</div>
  )

  const colHead = (label: string, color: string, dot: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0 }} />
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color }}>{label}</div>
    </div>
  )

  return (
    <div style={{ padding: '24px 28px', background: '#F7F4F0', minHeight: '100vh' }}>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 22 }}>
        {[
          { label: 'Clients', value: String(clientCount || 0), sub: 'total book', href: '/dashboard/clients', warn: false },
          { label: 'Annual premium', value: `$${totalPremium.toLocaleString()}`, sub: `${allPolicies.length} policies`, href: '/dashboard/analytics', warn: false },
          { label: 'Renewing', value: String(renewingIn30.length), sub: 'next 30 days', href: '/dashboard/renewals', warn: renewingIn30.length > 0 },
          { label: 'Open claims', value: String(openClaims.length), sub: 'needs follow-up', href: '/dashboard/claims', warn: openClaims.length > 0 },
        ].map(k => (
          <Link key={k.label} href={k.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#1A1410', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontWeight: 500 }}>{k.label}</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 500, color: k.warn ? '#854F0B' : '#1A1410', lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#3D3532', marginTop: 3 }}>{k.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Three columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>

        {/* URGENT */}
        <div>
          {colHead('Urgent — act today', '#A32D2D', '#E24B4A')}

          {lapsed.length > 0 && (
            <>
              {secLabel('Lapsed')}
              {lapsed.slice(0, 3).map(p => {
                const c = p.clients as any
                return card(`lapsed-${p.id}`, '📅', c?.name || 'Unknown', `${p.type} · ${p.insurer}`, pill('Lapsed', 'red'), `/dashboard/clients/${c?.id || ''}`)
              })}
            </>
          )}

          {dueSoon.length > 0 && (
            <>
              {secLabel('Due this week')}
              {dueSoon.slice(0, 3).map(p => {
                const c = p.clients as any
                const days = getDays(p.renewal_date)
                return card(`due-${p.id}`, '📅', c?.name || 'Unknown', `${p.type} · ${p.insurer}`, pill(`${days}d`, 'amber'), `/dashboard/clients/${c?.id || ''}`)
              })}
            </>
          )}

          {highClaims.length > 0 && (
            <>
              {secLabel('High-priority claims')}
              {highClaims.slice(0, 2).map(a => {
                const c = a.clients as any
                return card(`claim-${a.id}`, '📄', c?.name || 'Unknown', a.title || 'Open claim', pill('High', 'red'), `/dashboard/clients/${c?.id || ''}`)
              })}
            </>
          )}

          {lapsed.length === 0 && dueSoon.length === 0 && highClaims.length === 0 && (
            <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '24px 16px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460' }}>
              Nothing urgent today ✓
            </div>
          )}
        </div>

        {/* RELATIONSHIPS */}
        <div>
          {colHead('Relationships — reach out', '#854F0B', '#EF9F27')}

          {birthdaysThisWeek.length > 0 && (
            <>
              {secLabel('Birthdays this week')}
              {birthdaysThisWeek.map(c => {
                const bday = new Date(c.birthday)
                const anniv = new Date(now.getFullYear(), bday.getMonth(), bday.getDate())
                const diff = Math.ceil((anniv.getTime() - now.getTime()) / 86400000)
                const when = diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : `in ${diff}d`
                return card(`bday-${c.id}`, '🎂', c.name, `Birthday ${when}`, pill('Birthday', 'amber'), `/dashboard/clients/${c.id}`)
              })}
            </>
          )}

          {policyAnniversaries.length > 0 && (
            <>
              {secLabel('Policy anniversaries')}
              {policyAnniversaries.slice(0, 2).map(p => {
                const c = p.clients as any
                const years = now.getFullYear() - new Date(p.created_at).getFullYear()
                return card(`anniv-${p.id}`, '🔁', c?.name || 'Unknown', `${p.type} · ${years} year${years !== 1 ? 's' : ''} today`, pill(`${years}yr`, 'blue'), `/dashboard/clients/${c?.id || ''}`)
              })}
            </>
          )}

          {birthdaysThisWeek.length === 0 && policyAnniversaries.length === 0 && (
            <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '24px 16px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460' }}>
              No touchpoints this week
            </div>
          )}
        </div>

        {/* PIPELINE */}
        <div>
          {colHead('Pipeline — plan ahead', '#0F6E56', '#1D9E75')}

          {pipeline.length > 0 && (
            <>
              {secLabel('Renewals next 30 days')}
              {pipeline.slice(0, 4).map(p => {
                const c = p.clients as any
                const days = getDays(p.renewal_date)
                return card(`pipe-${p.id}`, '📅', c?.name || 'Unknown', `${p.type} · $${Number(p.premium).toLocaleString()}/yr`, pill(`${days}d`, 'teal'), `/dashboard/clients/${c?.id || ''}`)
              })}
            </>
          )}

          {gaps.length > 0 && (
            <>
              {secLabel('Coverage gaps')}
              {gaps.slice(0, 2).map(a => {
                const c = a.clients as any
                return card(`gap-${a.id}`, '⚠', c?.name || 'Unknown', a.title || 'Coverage gap', pill('Gap', 'amber'), `/dashboard/clients/${c?.id || ''}`)
              })}
            </>
          )}

          {pipeline.length === 0 && gaps.length === 0 && (!overdueHoldings || overdueHoldings.length === 0) ? (
            <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '24px 16px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460' }}>
              Pipeline clear for now
            </div>
          ) : null}

          {overdueHoldings && overdueHoldings.length > 0 && (
            <>
              {secLabel('Portfolio reviews overdue')}
              {overdueHoldings.map((h: any) => {
                const c = h.clients as any
                const daysSince = h.last_reviewed_at
                  ? Math.floor((Date.now() - new Date(h.last_reviewed_at).getTime()) / (1000 * 60 * 60 * 24))
                  : null
                return card(
                  `holding-${h.id}`, '📊',
                  c?.name || 'Unknown',
                  h.product_name,
                  pill(daysSince ? `${daysSince}d` : 'Never', 'amber'),
                  `/dashboard/clients/${c?.id || ''}`
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
