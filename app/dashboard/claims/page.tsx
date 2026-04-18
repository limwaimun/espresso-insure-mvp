'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type FilterType = 'all' | 'open' | 'resolved' | 'high'

interface Claim {
  id: string
  title: string
  body: string
  resolved: boolean
  priority: 'high' | 'medium' | 'info'
  created_at: string
  client_id: string
  clients: { name: string; company: string | null; whatsapp: string | null } | null
}

interface Client { id: string; name: string; company: string | null }

const STATUS_STYLE = {
  urgent:   { bg: '#FCEBEB', color: '#A32D2D', border: '#F7C1C1' },
  resolved: { bg: '#E1F5EE', color: '#0F6E56', border: '#9FE1CB' },
  open:     { bg: '#FAEEDA', color: '#854F0B', border: '#FAC775' },
}
const PRIORITY_STYLE = {
  high:   { bg: '#FCEBEB', color: '#A32D2D', border: '#F7C1C1' },
  medium: { bg: '#FAEEDA', color: '#854F0B', border: '#FAC775' },
  info:   { bg: '#E6F1FB', color: '#185FA5', border: '#B5D4F4' },
}

const pill = (label: string, s: { bg: string; color: string; border: string }) => (
  <span style={{ background: s.bg, color: s.color, border: `0.5px solid ${s.border}`, fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 100, whiteSpace: 'nowrap' }}>
    {label}
  </span>
)

export default function ClaimsPage() {
  const supabase = createClient()
  const [claims, setClaims] = useState<Claim[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [mayaModal, setMayaModal] = useState<{ name: string; title: string; wa: string | null } | null>(null)
  const [copied, setCopied] = useState(false)
  const [newForm, setNewForm] = useState({ client_id: '', title: '', body: '', priority: 'medium' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
    supabase.from('clients').select('id, name, company').order('name').then(({ data }) => setClients(data || []))
  }, [])

  async function load() {
    const { data } = await supabase
      .from('alerts')
      .select('id, title, body, resolved, priority, created_at, client_id, clients(name, company, whatsapp)')
      .order('created_at', { ascending: false })
    setClaims((data || []) as any)
    setLoading(false)
  }

  async function createClaim() {
    if (!newForm.client_id || !newForm.title) return
    setSaving(true)
    await supabase.from('alerts').insert({
      client_id: newForm.client_id,
      title: newForm.title,
      body: newForm.body,
      priority: newForm.priority,
      resolved: false,
      type: 'claim',
    })
    setNewForm({ client_id: '', title: '', body: '', priority: 'medium' })
    setShowNew(false)
    setSaving(false)
    load()
  }

  function openMayaModal(claim: Claim) {
    const client = claim.clients as any
    const msg = `Hi ${client?.name?.split(' ')[0] || 'there'}, just checking in on your claim — "${claim.title}". Let me know if you need any help or have questions. I'm here to assist. 😊`
    setMayaModal({ name: client?.name || 'Client', title: claim.title, wa: client?.whatsapp || null })
    setCopied(false)
    ;(window as any)._mayaMsg = msg
  }

  async function copyMayaMsg() {
    await navigator.clipboard.writeText((window as any)._mayaMsg || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const totalClaims = claims.length
  const openClaims = claims.filter(c => !c.resolved).length
  const resolvedClaims = claims.filter(c => c.resolved).length
  const highPriority = claims.filter(c => c.priority === 'high' && !c.resolved).length

  const filtered = claims.filter(c => {
    const client = c.clients as any
    const q = search.toLowerCase()
    if (q && !c.title?.toLowerCase().includes(q) && !client?.name?.toLowerCase().includes(q)) return false
    if (filter === 'open') return !c.resolved
    if (filter === 'resolved') return c.resolved
    if (filter === 'high') return c.priority === 'high' && !c.resolved
    return true
  })

  const daysAgo = (d: string) => { const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000); return days === 0 ? 'Today' : `${days}d ago` }

  const tab = (label: string, f: FilterType, count?: number) => (
    <button onClick={() => setFilter(f)} style={{ background: filter === f ? '#1A1410' : 'transparent', color: filter === f ? '#FFFFFF' : '#3D3532', border: `0.5px solid ${filter === f ? '#1A1410' : '#E8E2DA'}`, borderRadius: 100, padding: '5px 14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
      {label}{count !== undefined && count > 0 && <span style={{ background: filter === f ? 'rgba(255,255,255,0.2)' : '#F1EFE8', color: filter === f ? '#FFFFFF' : '#3D3532', fontSize: 10, padding: '1px 6px', borderRadius: 100 }}>{count}</span>}
    </button>
  )

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '0.5px solid #E8E2DA', borderRadius: 7, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ padding: '24px 28px', background: '#F7F4F0', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 500, color: '#1A1410', margin: 0 }}>Claims</h1>
        <button onClick={() => setShowNew(true)} style={{ background: '#BA7517', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#FFFFFF', fontWeight: 500 }}>
          + New claim
        </button>
      </div>

      {/* New claim modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 28, width: 480, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 500, color: '#1A1410', margin: 0 }}>New claim</h2>
              <button onClick={() => setShowNew(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, color: '#5F5A57' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#1A1410', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Client *</label>
                <select value={newForm.client_id} onChange={e => setNewForm(p => ({ ...p, client_id: e.target.value }))} style={inputStyle}>
                  <option value="">Select client…</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#1A1410', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Title *</label>
                <input value={newForm.title} onChange={e => setNewForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Health claim — clinic visit" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#1A1410', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Details</label>
                <textarea value={newForm.body} onChange={e => setNewForm(p => ({ ...p, body: e.target.value }))} placeholder="Claim details, amount, insurer reference…" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#1A1410', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Priority</label>
                <select value={newForm.priority} onChange={e => setNewForm(p => ({ ...p, priority: e.target.value }))} style={inputStyle}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="info">Info</option>
                </select>
              </div>
              <button onClick={createClaim} disabled={saving || !newForm.client_id || !newForm.title} style={{ background: '#BA7517', border: 'none', borderRadius: 8, padding: '10px 0', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#FFFFFF', fontWeight: 500, opacity: saving || !newForm.client_id || !newForm.title ? 0.6 : 1 }}>
                {saving ? 'Saving…' : 'Create claim'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maya follow-up modal */}
      {mayaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 28, width: 460, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 500, color: '#1A1410', margin: 0 }}>Ask Maya to follow up</h2>
              <button onClick={() => setMayaModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, color: '#5F5A57' }}>✕</button>
            </div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57', margin: '0 0 14px' }}>For: <strong style={{ color: '#1A1410' }}>{mayaModal.name}</strong> — {mayaModal.title}</p>
            <div style={{ background: '#F7F4F0', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', lineHeight: 1.6, fontStyle: 'italic' }}>
              "{(window as any)._mayaMsg}"
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={copyMayaMsg} style={{ flex: 1, background: '#F7F4F0', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '9px 0', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410' }}>
                {copied ? '✓ Copied!' : 'Copy message'}
              </button>
              {mayaModal.wa && (
                <a href={`https://wa.me/${mayaModal.wa.replace(/[^0-9]/g, '')}?text=${encodeURIComponent((window as any)._mayaMsg || '')}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, background: '#25D366', border: 'none', borderRadius: 8, padding: '9px 0', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#FFFFFF', fontWeight: 500, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
          { label: 'Total claims', value: totalClaims },
          { label: 'Open', value: openClaims, warn: openClaims > 0 },
          { label: 'Resolved', value: resolvedClaims, green: true },
          { label: 'High priority', value: highPriority, danger: highPriority > 0 },
        ].map(k => (
          <div key={k.label} style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#1A1410', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 28, fontWeight: 500, color: k.danger ? '#A32D2D' : k.green ? '#0F6E56' : k.warn ? '#854F0B' : '#1A1410', lineHeight: 1 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 280 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#B4B2A9', fontSize: 13 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search claims…" style={{ ...inputStyle, paddingLeft: 32, width: 280 }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab('All', 'all', totalClaims)}
          {tab('Open', 'open', openClaims)}
          {tab('Resolved', 'resolved', resolvedClaims)}
          {tab('High priority', 'high', highPriority)}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 120px 100px 80px 180px', padding: '10px 20px', borderBottom: '0.5px solid #E8E2DA', background: '#FAFAF8' }}>
          {['Client', 'Description', 'Status', 'Priority', 'Filed', 'Action'].map(h => (
            <div key={h} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#1A1410', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
          ))}
        </div>
        {loading ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57' }}>No claims found</div>
        ) : filtered.map((claim, i) => {
          const client = claim.clients as any
          const statusS = claim.resolved ? STATUS_STYLE.resolved : claim.priority === 'high' ? STATUS_STYLE.urgent : STATUS_STYLE.open
          const statusLabel = claim.resolved ? 'Resolved' : claim.priority === 'high' ? 'Urgent' : 'Open'
          const priorityS = PRIORITY_STYLE[claim.priority] || PRIORITY_STYLE.info
          return (
            <div key={claim.id} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 120px 100px 80px 180px', padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '0.5px solid #F1EFE8' : 'none', alignItems: 'start' }}>
              <div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#1A1410' }}>{client?.name || '—'}</div>
                {client?.company && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#5F5A57' }}>{client.company}</div>}
              </div>
              <div style={{ paddingRight: 16 }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', marginBottom: 3 }}>{claim.title}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#5F5A57', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 360 }}>{claim.body}</div>
              </div>
              <div>{pill(statusLabel, statusS)}</div>
              <div>{pill(claim.priority.charAt(0).toUpperCase() + claim.priority.slice(1), priorityS)}</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#5F5A57' }}>{daysAgo(claim.created_at)}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Link href={`/dashboard/clients/${claim.client_id}`} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#BA7517', textDecoration: 'none' }}>View client →</Link>
                <button onClick={() => openMayaModal(claim)} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#5F5A57', textAlign: 'left' }}>
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
