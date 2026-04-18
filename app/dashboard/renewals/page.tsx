import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function RenewalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: policies } = await supabase
    .from('policies')
    .select('id, type, insurer, premium, renewal_date, status, client_id, clients(id, name, company, whatsapp)')
    .eq('ifa_id', user.id)
    .order('renewal_date', { ascending: true })

  const now = new Date()
  const allPolicies = policies || []

  const enriched = allPolicies.map(p => {
    const days = p.renewal_date
      ? Math.ceil((new Date(p.renewal_date).getTime() - now.getTime()) / 86400000)
      : null
    const status = days === null ? 'upcoming'
      : days < 0 ? 'lapsed'
      : days <= 30 ? 'urgent'
      : days <= 60 ? 'action_needed'
      : 'under_review'
    return { ...p, days, status }
  })

  const lapsed = enriched.filter(p => p.status === 'lapsed')
  const urgent = enriched.filter(p => p.status === 'urgent')
  const actionNeeded = enriched.filter(p => p.status === 'action_needed')
  const underReview = enriched.filter(p => p.status === 'under_review')

  const lapsedPremium = lapsed.reduce((s, p) => s + (Number(p.premium) || 0), 0)
  const urgentPremium = urgent.reduce((s, p) => s + (Number(p.premium) || 0), 0)

  const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
    lapsed:       { bg: '#FCEBEB', color: '#A32D2D', border: '#F7C1C1', label: 'Lapsed' },
    urgent:       { bg: '#FAEEDA', color: '#854F0B', border: '#FAC775', label: 'Urgent' },
    action_needed:{ bg: '#E6F1FB', color: '#185FA5', border: '#B5D4F4', label: 'Action needed' },
    under_review: { bg: '#F1EFE8', color: '#5F5E5A', border: '#D3D1C7', label: 'Under review' },
  }

  const kpis = [
    { label: 'Lapsed', value: lapsed.length, sub: lapsedPremium > 0 ? `$${lapsedPremium.toLocaleString()} at risk` : '', danger: true },
    { label: 'Urgent', value: urgent.length, sub: urgentPremium > 0 ? `$${urgentPremium.toLocaleString()} in next 30 days` : '', warn: true },
    { label: 'Action needed', value: actionNeeded.length, sub: '31–60 days', info: true },
    { label: 'Under review', value: underReview.length, sub: '61–90 days', neutral: true },
  ]

  return (
    <div style={{ padding: '24px 28px', background: '#F7F4F0', minHeight: '100vh' }}>

      <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 500, color: '#1A1410', margin: '0 0 20px' }}>Renewals</h1>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 28, fontWeight: 500, lineHeight: 1, marginBottom: 4, color: k.danger ? '#A32D2D' : k.warn ? '#854F0B' : k.info ? '#185FA5' : '#1A1410' }}>{k.value}</div>
            {k.sub && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088' }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Summary bar */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 10, padding: '12px 18px', marginBottom: 20, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460' }}>
        {allPolicies.length} policies tracked
        {lapsed.length > 0 && <> · <span style={{ color: '#A32D2D' }}>{lapsed.length} lapsed</span></>}
        {urgent.length > 0 && <> · <span style={{ color: '#854F0B' }}>{urgent.length} urgent</span></>}
        {actionNeeded.length > 0 && <> · <span style={{ color: '#185FA5' }}>{actionNeeded.length} action needed</span></>}
        {underReview.length > 0 && <> · <span style={{ color: '#6B6460' }}>{underReview.length} under review</span></>}
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '180px 160px 140px 110px 100px 80px 120px 160px', padding: '10px 20px', borderBottom: '0.5px solid #E8E2DA', background: '#FAFAF8' }}>
          {['Client', 'Policy type', 'Insurer', 'Premium', 'Renewal', 'Days', 'Status', 'Action'].map(h => (
            <div key={h} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
          ))}
        </div>

        {enriched.map((p, i) => {
          const s = STATUS_STYLES[p.status] || STATUS_STYLES.under_review
          const client = p.clients as any
          const daysColor = p.days === null ? '#6B6460' : p.days < 0 ? '#A32D2D' : p.days <= 7 ? '#854F0B' : '#6B6460'

          return (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '180px 160px 140px 110px 100px 80px 120px 160px', padding: '14px 20px', borderBottom: i < enriched.length - 1 ? '0.5px solid #F1EFE8' : 'none', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#1A1410' }}>{client?.name || 'Unknown'}</div>
                {client?.company && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088' }}>{client.company}</div>}
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410' }}>{p.type}</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460' }}>{p.insurer}</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410' }}>${Number(p.premium).toLocaleString()}/yr</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: daysColor }}>
                {p.renewal_date ? new Date(p.renewal_date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' }) : '—'}
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: daysColor, fontWeight: p.days !== null && p.days <= 7 ? 500 : 400 }}>
                {p.days === null ? '—' : p.days < 0 ? 'Overdue' : `${p.days}d`}
              </div>
              <div>
                <span style={{ background: s.bg, color: s.color, border: `0.5px solid ${s.border}`, fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 100 }}>
                  {s.label}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Link href={`/dashboard/clients/${client?.id || ''}`} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#BA7517', textDecoration: 'none' }}>View client →</Link>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#9B9088', cursor: 'pointer' }}>Ask Maya to follow up</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
