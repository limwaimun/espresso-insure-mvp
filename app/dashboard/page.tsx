import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Greeting from '@/components/Greeting'


export default async function DashboardHome() {
  const supabase = await createClient()

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  // Get authenticated user — required for profile and greeting
  const { data: { user } } = await supabase.auth.getUser()

  // All 6 data fetches run in parallel. Previously the profile fetch
  // awaited auth.getUser() and then ran serially BEFORE the Promise.all,
  // adding one full SG→US roundtrip to every page load. Folding it in
  // saves ~400ms. The profile query is conditional on `user` existing,
  // so unauthenticated visits still short-circuit with data: null.
  const [
    { data: ifaProfile },
    { count: clientCount },
    { data: policies },
    { data: alerts },
    { data: clients },
    { data: overdueHoldings },
  ] = await Promise.all([
    user
      ? supabase.from('profiles').select('name').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('policies').select('id, type, product_name, insurer, premium, renewal_date, start_date, status, created_at, client_id, clients!inner(id, name, company)'),
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
  const activePolicies = allPolicies.filter(p => p.status === 'active')

  // Helper: days until next anniversary of a given month/day, handling year wrap.
  // Returns 0 if today is the anniversary.
  const daysUntilNext = (month: number, day: number): number => {
    const thisYear = new Date(now.getFullYear(), month, day)
    const target = thisYear >= today ? thisYear : new Date(now.getFullYear() + 1, month, day)
    return Math.round((target.getTime() - today.getTime()) / 86400000)
  }

  // KPI metrics — active policies only
  const totalPremium = activePolicies.reduce((s, p) => s + (Number(p.premium) || 0), 0)
  const renewingIn30 = activePolicies.filter(p => {
    if (!p.renewal_date) return false
    const d = new Date(p.renewal_date)
    return d >= now && d <= thirtyDays
  })
  const openClaims = allAlerts.filter(a => a.priority === 'high' || a.type === 'claim')

  // ── URGENT ─────────────────────────────────────────────────────────────────
  // Lapsed = DB status is lapsed (contract is dead)
  const lapsed = allPolicies.filter(p => p.status === 'lapsed')
  // Overdue = status is active but renewal_date has passed (needs chasing)
  const overdue = activePolicies.filter(p => {
    if (!p.renewal_date) return false
    return new Date(p.renewal_date) < now
  })
  // Due soon = active, renewal in next 7 days
  const dueSoon = activePolicies.filter(p => {
    if (!p.renewal_date) return false
    const d = new Date(p.renewal_date)
    const days = Math.ceil((d.getTime() - now.getTime()) / 86400000)
    return days >= 0 && days <= 7
  })
  const highClaims = allAlerts.filter(a => a.priority === 'high' && !a.resolved)

  // ── RELATIONSHIPS ──────────────────────────────────────────────────────────
  const birthdaysThisWeek = allClients
    .filter(c => c.birthday)
    .map(c => {
      const bday = new Date(c.birthday)
      return { client: c, daysUntil: daysUntilNext(bday.getMonth(), bday.getDate()) }
    })
    .filter(b => b.daysUntil <= 7)
    .sort((a, b) => a.daysUntil - b.daysUntil)

  const policyAnniversaries = activePolicies
    .filter(p => p.start_date)
    .map(p => {
      const start = new Date(p.start_date)
      const days = daysUntilNext(start.getMonth(), start.getDate())
      // Years of ownership: if this year's anniversary has passed, they're in the next year
      const thisYearAnniv = new Date(now.getFullYear(), start.getMonth(), start.getDate())
      const baseYears = now.getFullYear() - start.getFullYear()
      const years = thisYearAnniv < today
        ? baseYears + 1   // anniversary already passed this year — upcoming anniv is next year
        : baseYears        // upcoming this year (or today) — count to this year
      return { policy: p, daysUntil: days, years }
    })
    .filter(a => a.daysUntil <= 7 && a.years > 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)

  // ── PIPELINE ───────────────────────────────────────────────────────────────
  const pipeline = activePolicies
    .filter(p => {
      if (!p.renewal_date) return false
      const d = new Date(p.renewal_date)
      const days = Math.ceil((d.getTime() - now.getTime()) / 86400000)
      return days > 7 && days <= 30
    })
    .sort((a, b) => new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime())
  const gaps = allAlerts.filter(a => a.type === 'gap' && !a.resolved)

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

      {/* Greeting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <Greeting name={ifaProfile?.name || undefined} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDF7', border: '0.5px solid #9FE1CB', borderRadius: 100, padding: '5px 14px', marginTop: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1D9E75' }} />
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#0F6E56' }}>Maya active</span>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 22 }}>
        {[
          { label: 'Clients', value: String(clientCount || 0), sub: 'total book', href: '/dashboard/clients', warn: false },
          { label: 'Annual premium', value: `$${totalPremium.toLocaleString()}`, sub: `${activePolicies.length} active policies`, href: '/dashboard/analytics', warn: false },
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
                return card(`lapsed-${p.id}`, '📅', c?.name || 'Unknown', `${p.product_name || p.type} · ${p.insurer}`, pill('Lapsed', 'red'), `/dashboard/clients/${c?.id || ''}`)
              })}
            </>
          )}

          {overdue.length > 0 && (
            <>
              {secLabel('Overdue renewal')}
              {overdue.slice(0, 3).map(p => {
                const c = p.clients as any
                const days = Math.abs(getDays(p.renewal_date))
                return card(`overdue-${p.id}`, '⏰', c?.name || 'Unknown', `${p.product_name || p.type} · ${p.insurer}`, pill(`${days}d late`, 'red'), `/dashboard/clients/${c?.id || ''}`)
              })}
            </>
          )}

          {dueSoon.length > 0 && (
            <>
              {secLabel('Due this week')}
              {dueSoon.slice(0, 3).map(p => {
                const c = p.clients as any
                const days = getDays(p.renewal_date)
                return card(`due-${p.id}`, '📅', c?.name || 'Unknown', `${p.product_name || p.type} · ${p.insurer}`, pill(`${days}d`, 'amber'), `/dashboard/clients/${c?.id || ''}`)
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

          {lapsed.length === 0 && overdue.length === 0 && dueSoon.length === 0 && highClaims.length === 0 && (
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
              {birthdaysThisWeek.map(b => {
                const when = b.daysUntil === 0 ? 'today' : b.daysUntil === 1 ? 'tomorrow' : `in ${b.daysUntil}d`
                return card(`bday-${b.client.id}`, '🎂', b.client.name, `Birthday ${when}`, pill('Birthday', 'amber'), `/dashboard/clients/${b.client.id}`)
              })}
            </>
          )}

          {policyAnniversaries.length > 0 && (
            <>
              {secLabel('Policy anniversaries')}
              {policyAnniversaries.slice(0, 3).map(a => {
                const c = a.policy.clients as any
                const when = a.daysUntil === 0 ? 'today' : a.daysUntil === 1 ? 'tomorrow' : `in ${a.daysUntil}d`
                return card(`anniv-${a.policy.id}`, '🔁', c?.name || 'Unknown', `${a.policy.product_name || a.policy.type} · ${a.years} year${a.years !== 1 ? 's' : ''} ${when}`, pill(`${a.years}yr`, 'blue'), `/dashboard/clients/${c?.id || ''}`)
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
                return card(`pipe-${p.id}`, '📅', c?.name || 'Unknown', `${p.product_name || p.type} · $${Number(p.premium).toLocaleString()}/yr`, pill(`${days}d`, 'teal'), `/dashboard/clients/${c?.id || ''}`)
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

          {pipeline.length === 0 && gaps.length === 0 && (!overdueHoldings || overdueHoldings.length === 0) && (
            <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '24px 16px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460' }}>
              Pipeline clear for now
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
