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
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('policies').select('*, clients(id, name, company)').eq('status', 'active'),
    supabase.from('alerts').select('*, clients(id, name)').eq('resolved', false).order('created_at', { ascending: false }),
  ])

  const allPolicies = policies || []
  const allAlerts = alerts || []

  const totalPremium = allPolicies.reduce((s, p) => s + (Number(p.premium) || 0), 0)
  const renewingIn30 = allPolicies.filter(p => {
    if (!p.renewal_date) return false
    const d = new Date(p.renewal_date)
    return d >= now && d <= thirtyDays
  })

  type FeedItem = {
    id: string
    urgency: number
    type: 'renewal' | 'claim' | 'alert'
    label: string
    sublabel: string
    tag: string
    tagColor: string
    href: string
    meta: string
  }

  const feed: FeedItem[] = []

  allPolicies.forEach(p => {
    if (!p.renewal_date) return
    const d = new Date(p.renewal_date)
    const days = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (days <= 7) {
      const client = p.clients as any
      feed.push({
        id: `renewal-${p.id}`,
        urgency: days < 0 ? -999 : days,
        type: 'renewal',
        label: client?.name || 'Unknown client',
        sublabel: `${p.type} · ${p.insurer}`,
        tag: days < 0 ? 'Lapsed' : `${days}d`,
        tagColor: days < 0 ? '#D06060' : '#D4A030',
        href: `/dashboard/clients/${client?.id || ''}`,
        meta: `$${Number(p.premium).toLocaleString()}/yr`,
      })
    }
  })

  allAlerts.forEach(a => {
    const client = a.clients as any
    const daysAgo = Math.floor((now.getTime() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24))
    const isClaim = a.type === 'claim'
    const isHighPriority = a.priority === 'high'
    if (isHighPriority || isClaim) {
      feed.push({
        id: `alert-${a.id}`,
        urgency: 100 + daysAgo,
        type: isClaim ? 'claim' : 'alert',
        label: client?.name || 'Unknown client',
        sublabel: a.title || 'Alert',
        tag: isHighPriority ? 'High' : (a.priority || 'Info'),
        tagColor: isHighPriority ? '#D06060' : '#D4A030',
        href: `/dashboard/clients/${client?.id || ''}`,
        meta: `${daysAgo}d ago`,
      })
    }
  })

  feed.sort((a, b) => a.urgency - b.urgency)

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const TYPE_ICONS: Record<string, string> = {
    renewal: '📅',
    claim: '📄',
    alert: '🔔',
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900, margin: '0 auto' }}>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 400, color: '#F5ECD7', margin: '0 0 6px' }}>
          {greeting}
        </h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#C9B99A', margin: 0 }}>
          {feed.length > 0
            ? `${feed.length} item${feed.length > 1 ? 's' : ''} need${feed.length === 1 ? 's' : ''} your attention today`
            : 'All clear — nothing urgent today'}
        </p>
      </div>

      {/* 3 KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <Link href="/dashboard/clients" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: 10, padding: '20px 24px' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#C9B99A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Clients</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: '#F5ECD7', lineHeight: 1 }}>{clientCount || 0}</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#C9B99A', marginTop: 4 }}>total</div>
          </div>
        </Link>
        <Link href="/dashboard/analytics" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: 10, padding: '20px 24px' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#C9B99A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Annual premium</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: '#F5ECD7', lineHeight: 1 }}>${totalPremium.toLocaleString()}</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#C9B99A', marginTop: 4 }}>across all policies</div>
          </div>
        </Link>
        <Link href="/dashboard/renewals" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: 10, padding: '20px 24px' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#C9B99A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Renewing</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: renewingIn30.length > 0 ? '#D4A030' : '#F5ECD7', lineHeight: 1 }}>{renewingIn30.length}</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#C9B99A', marginTop: 4 }}>next 30 days</div>
          </div>
        </Link>
      </div>

      {/* Priority feed */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 400, color: '#F5ECD7', margin: 0 }}>
            Needs attention
          </h2>
          {feed.length > 0 && (
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#C9B99A' }}>
              {feed.length} item{feed.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {feed.length === 0 ? (
          <div style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#C9B99A' }}>
              Nothing urgent right now. Great work.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {feed.map(item => (
              <Link key={item.id} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#1C0F0A', border: '1px solid #2E1A0E', borderRadius: 10, padding: '14px 18px' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{TYPE_ICONS[item.type]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#F5ECD7', fontWeight: 500, marginBottom: 2 }}>
                      {item.label}
                    </div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#C9B99A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.sublabel}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#C9B99A' }}>{item.meta}</span>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 100, textTransform: 'uppercase', background: `${item.tagColor}22`, color: item.tagColor, border: `1px solid ${item.tagColor}44` }}>
                      {item.tag}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
