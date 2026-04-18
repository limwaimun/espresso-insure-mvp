'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RenewalsPage() {
  const supabase = createClient()
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [mayaModal, setMayaModal] = useState<{ name: string; type: string; insurer: string; days: number | null; wa: string | null } | null>(null)
  const [copied, setCopied] = useState(false)

  const now = new Date()

  useEffect(() => {
    supabase
      .from('policies')
      .select('id, type, insurer, premium, renewal_date, status, client_id, clients(id, name, company, whatsapp)')
      .order('renewal_date', { ascending: true })
      .then(({ data }) => { setPolicies(data || []); setLoading(false) })
  }, [])

  const getDays = (d: string | null) => d ? Math.ceil((new Date(d).getTime() - now.getTime()) / 86400000) : null
  const getStatus = (days: number | null) => days === null ? 'upcoming' : days < 0 ? 'lapsed' : days <= 30 ? 'urgent' : days <= 60 ? 'action_needed' : 'under_review'

  const enriched = policies.map(p => ({ ...p, days: getDays(p.renewal_date), status: getStatus(getDays(p.renewal_date)) }))

  const filtered = enriched.filter(p => {
    const client = p.clients as any
    if (!search) return true
    const q = search.toLowerCase()
    return client?.name?.toLowerCase().includes(q) || p.type?.toLowerCase().includes(q) || p.insurer?.toLowerCase().includes(q)
  })

  const lapsed       = enriched.filter(p => p.status === 'lapsed')
  const urgent       = enriched.filter(p => p.status === 'urgent')
  const actionNeeded = enriched.filter(p => p.status === 'action_needed')
  const underReview  = enriched.filter(p => p.status === 'under_review')
  const lapsedPremium = lapsed.reduce((s, p) => s + (Number(p.premium) || 0), 0)
  const urgentPremium = urgent.reduce((s, p) => s + (Number(p.premium) || 0), 0)

  const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
    lapsed:        { bg: '#FCEBEB', color: '#A32D2D', border: '#F7C1C1', label: 'Lapsed' },
    urgent:        { bg: '#FAEEDA', color: '#854F0B', border: '#FAC775', label: 'Urgent' },
    action_needed: { bg: '#E6F1FB', color: '#185FA5', border: '#B5D4F4', label: 'Action needed' },
    under_review:  { bg: '#F1EFE8', color: '#5F5E5A', border: '#D3D1C7', label: 'Under review' },
  }

  function openMayaModal(p: any) {
    const client = p.clients as any
    const days = p.days
    const urgency = days !== null && days < 0 ? 'has lapsed' : days !== null && days <= 7 ? `renews in ${days} day${days !== 1 ? 's' : ''}` : `renews on ${new Date(p.renewal_date).toLocaleDateString('en-SG', { day: 'numeric', month: 'long' })}`
    const msg = `Hi ${client?.name?.split(' ')[0] || 'there'}, just a quick note that your ${p.type} policy with ${p.insurer} ${urgency}. I wanted to reach out early to make sure everything is in order — let me know if you'd like to review or have any questions!`
    ;(window as any)._renewalMsg = msg
    setMayaModal({ name: client?.name || '', type: p.type, insurer: p.insurer, days: p.days, wa: client?.whatsapp || null })
    setCopied(false)
  }

  async function copyMsg() {
    await navigator.clipboard.writeText((window as any)._renewalMsg || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputStyle: React.CSSProperties = { padding: '8px 12px', border: '0.5px solid #E8E2DA', borderRadius: 7, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' as const }

  return (
    <div style={{ padding: '24px 28px', background: '#F7F4F0', minHeight: '100vh' }}>
      <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 500, color: '#1A1410', margin: '0 0 20px' }}>Renewals</h1>

      {/* Maya modal */}
      {mayaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 28, width: 460, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 500, color: '#1A1410', margin: 0 }}>Ask Maya to follow up</h2>
              <button onClick={() => setMayaModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, color: '#5F5A57' }}>✕</button>
            </div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57', margin: '0 0 14px' }}>For: <strong style={{ color: '#1A1410' }}>{mayaModal.name}</strong> — {mayaModal.type} · {mayaModal.insurer}</p>
            <div style={{ background: '#F7F4F0', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', lineHeight: 1.6, fontStyle: 'italic' }}>
              "{(window as any)._renewalMsg}"
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={copyMsg} style={{ flex: 1, background: '#F7F4F0', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '9px 0', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410' }}>
                {copied ? '✓ Copied!' : 'Copy message'}
              </button>
              {mayaModal.wa && (
                <a href={`https://wa.me/${mayaModal.wa.replace(/[^0-9]/g, '')}?text=${encodeURIComponent((window as any)._renewalMsg || '')}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, background: '#25D366', border: 'none', borderRadius: 8, padding: '9px 0', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#FFFFFF', fontWeight: 500, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Open in WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Lapsed', value: lapsed.length, sub: lapsedPremium > 0 ? `$${lapsedPremium.toLocaleString()} at risk` : '', danger: true },
          { label: 'Urgent', value: urgent.length, sub: urgentPremium > 0 ? `$${urgentPremium.toLocaleString()} in next 30 days` : '', warn: true },
          { label: 'Action needed', value: actionNeeded.length, sub: '31–60 days', info: true },
          { label: 'Under review', value: underReview.length, sub: '61–90 days' },
        ].map(k => (
          <div key={k.label} style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#1A1410', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 28, fontWeight: 500, lineHeight: 1, marginBottom: 4, color: k.danger ? '#A32D2D' : k.warn ? '#854F0B' : k.info ? '#185FA5' : '#1A1410' }}>{k.value}</div>
            {k.sub && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#5F5A57' }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Summary + search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 10, padding: '12px 18px', marginBottom: 16 }}>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#3D3532' }}>
          {policies.length} policies tracked
          {lapsed.length > 0 && <> · <span style={{ color: '#A32D2D' }}>{lapsed.length} lapsed</span></>}
          {urgent.length > 0 && <> · <span style={{ color: '#854F0B' }}>{urgent.length} urgent</span></>}
          {actionNeeded.length > 0 && <> · <span style={{ color: '#185FA5' }}>{actionNeeded.length} action needed</span></>}
        </div>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#B4B2A9', fontSize: 13 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search renewals…" style={{ ...inputStyle, paddingLeft: 32, width: 220 }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '180px 160px 140px 110px 100px 80px 130px 160px', padding: '10px 20px', borderBottom: '0.5px solid #E8E2DA', background: '#FAFAF8' }}>
          {['Client', 'Policy type', 'Insurer', 'Premium', 'Renewal', 'Days', 'Status', 'Action'].map(h => (
            <div key={h} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#1A1410', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
          ))}
        </div>
        {loading ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57' }}>Loading…</div>
        ) : filtered.map((p, i) => {
          const s = STATUS_STYLES[p.status] || STATUS_STYLES.under_review
          const client = p.clients as any
          const daysColor = p.days === null ? '#3D3532' : p.days < 0 ? '#A32D2D' : p.days <= 7 ? '#854F0B' : '#3D3532'
          return (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '180px 160px 140px 110px 100px 80px 130px 160px', padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '0.5px solid #F1EFE8' : 'none', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#1A1410' }}>{client?.name || '—'}</div>
                {client?.company && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#5F5A57' }}>{client.company}</div>}
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410' }}>{p.type}</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#3D3532' }}>{p.insurer}</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410' }}>${Number(p.premium).toLocaleString()}/yr</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: daysColor }}>{p.renewal_date ? new Date(p.renewal_date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' }) : '—'}</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: daysColor, fontWeight: p.days !== null && p.days <= 7 ? 500 : 400 }}>{p.days === null ? '—' : p.days < 0 ? 'Overdue' : `${p.days}d`}</div>
              <div><span style={{ background: s.bg, color: s.color, border: `0.5px solid ${s.border}`, fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 100 }}>{s.label}</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Link href={`/dashboard/clients/${client?.id || ''}`} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#BA7517', textDecoration: 'none' }}>View client →</Link>
                <button onClick={() => openMayaModal(p)} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#5F5A57', textAlign: 'left' }}>
                  Ask Maya to follow up
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
