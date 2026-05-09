'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import DocList from '@/components/DocList'
import NewClaimModal from './components/NewClaimModal'
import { createClient } from '@/lib/supabase/client'
import {
  statusLabel as statusLabelFn,
  statusColor,
  priorityColor,
  priorityLabel,
  daysAgo as daysAgoFn,
  isOpen,
  isResolved,
} from '@/lib/claims'

type FilterType = 'all' | 'open' | 'resolved' | 'high'

interface Claim {
  id: string
  title: string
  body: string
  status: 'open' | 'in_progress' | 'approved' | 'denied' | 'paid'
  priority: 'high' | 'medium' | 'info'
  claim_type: string
  created_at: string
  client_id: string
  clients: { name: string; company: string | null; whatsapp: string | null } | null
}

// Pill renderer using shared color helpers from lib/claims.ts
const pill = (label: string, color: { bg: string; text: string }) => (
  <span style={{ background: color.bg, color: color.text, fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 100, whiteSpace: 'nowrap' }}>
    {label}
  </span>
)

export default function ClaimsPage() {
  const supabase = createClient()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [mayaModal, setMayaModal] = useState<{ name: string; title: string; wa: string | null } | null>(null)
  const [copied, setCopied] = useState(false)
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [ifaId, setIfaId] = useState<string>('')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    load()
    supabase.auth.getUser().then(({ data }) => { if (data.user) setIfaId(data.user.id) })
  }, [])

  async function updateStatus(claimId: string, newStatus: Claim['status']) {
    setUpdatingStatus(claimId)
    try {
      await fetch('/api/claim-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, ifaId, status: newStatus }),
      })
      await load()
    } catch {
      // silently fail — list will still refresh
    } finally {
      setUpdatingStatus(null)
    }
  }

  async function load() {
    const { data } = await supabase
      .from('claims')
      .select('id, title, body, status, priority, claim_type, created_at, client_id, clients(name, company, whatsapp)')
      .order('created_at', { ascending: false })
    setClaims((data || []) as any)
    setLoading(false)
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
  const openClaims = claims.filter(isOpen).length
  const resolvedClaims = claims.filter(isResolved).length
  const highPriority = claims.filter(c => c.priority === 'high' && isOpen(c)).length

  const filtered = claims.filter(c => {
    const client = c.clients as any
    const q = search.toLowerCase()
    if (q && !c.title?.toLowerCase().includes(q) && !client?.name?.toLowerCase().includes(q)) return false
    if (filter === 'open') return isOpen(c)
    if (filter === 'resolved') return isResolved(c)
    if (filter === 'high') return c.priority === 'high' && isOpen(c)
    return true
  })



  return (
    <div style={{ padding: '16px 16px', background: '#F7F4F0', minHeight: '100vh' }} className="claims-page">
      <style>{`
        @media (min-width: 640px) { .claims-page { padding: 24px 28px !important; } }
        .claims-kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
        @media (min-width: 640px) { .claims-kpi-grid { grid-template-columns: repeat(4, 1fr); } }
        .claims-filter-bar { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
        @media (min-width: 640px) { .claims-filter-bar { flex-direction: row; align-items: center; } }
        .claims-filter-search { width: 100%; box-sizing: border-box; }
        @media (min-width: 640px) { .claims-filter-search { max-width: 320px; } }
        .claims-filter-select { width: 100%; box-sizing: border-box; }
        @media (min-width: 640px) { .claims-filter-select { width: auto; } }
        .claims-table-header { display: none; }
        @media (min-width: 768px) { .claims-table-header { display: grid; grid-template-columns: 180px 1fr 120px 100px 80px 200px; padding: 10px 20px; border-bottom: 0.5px solid #E8E2DA; background: #FAFAF8; } }
        .claims-row { display: flex; flex-direction: column; padding: 14px 16px; border-bottom: 0.5px solid #F1EFE8; gap: 6px; }
        @media (min-width: 768px) { .claims-row { display: grid; grid-template-columns: 180px 1fr 120px 100px 80px 200px; padding: 14px 20px; gap: 0; align-items: start; } }
        .claims-row-client { font-family: DM Sans, sans-serif; font-size: 13px; font-weight: 500; color: #1A1410; }
        .claims-row-desc { font-family: DM Sans, sans-serif; font-size: 13px; color: #1A1410; padding-right: 0; }
        @media (min-width: 768px) { .claims-row-desc { padding-right: 16px; } }
        .claims-row-meta { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
        @media (min-width: 768px) { .claims-row-meta { display: contents; } }
        .claims-row-actions { display: flex; flex-direction: row; gap: 10px; flex-wrap: wrap; }
        @media (min-width: 768px) { .claims-row-actions { flex-direction: column; gap: 4px; } }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 22, fontWeight: 500, color: '#1A1410', margin: 0 }}>Claims</h1>
        <button onClick={() => setShowNew(true)} style={{ background: '#BA7517', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#FFFFFF', fontWeight: 500, minHeight: 44, minWidth: 44 }}>
          + New claim
        </button>
        {showNew && ifaId && (
          <NewClaimModal
            ifaId={ifaId}
            onClose={() => setShowNew(false)}
            onCreated={() => { setShowNew(false); load() }}
          />
        )}
      </div>

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
      <div className="claims-kpi-grid">
        {[
          { label: 'Total claims', value: totalClaims },
          { label: 'Open', value: openClaims, warn: openClaims > 0 },
          { label: 'Resolved', value: resolvedClaims, green: true },
          { label: 'High priority', value: highPriority, danger: highPriority > 0 },
        ].map(k => (
          <div key={k.label} style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#1A1410', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 500, color: k.danger ? '#A32D2D' : k.green ? '#0F6E56' : k.warn ? '#854F0B' : '#1A1410', lineHeight: 1 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="claims-filter-bar">
        <div style={{ position: 'relative', flex: 1 }} className="claims-filter-search">
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#B4B2A9', fontSize: 13, pointerEvents: 'none' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by client or description…" style={{ width: '100%', height: 40, padding: '0 12px 0 34px', border: '0.5px solid #E8E2DA', borderRadius: 7, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' as const }} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value as FilterType)} className="claims-filter-select" style={{ height: 40, padding: '0 10px', border: '0.5px solid #E8E2DA', borderRadius: 7, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', background: '#FFFFFF', cursor: 'pointer', outline: 'none', boxSizing: 'border-box' as const }}>
          <option value="all">All status ({totalClaims})</option>
          <option value="open">Open ({openClaims})</option>
          <option value="resolved">Resolved ({resolvedClaims})</option>
          <option value="high">High priority ({highPriority})</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 12, overflow: 'hidden' }}>
        <div className="claims-table-header">
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
          const sLabel = statusLabelFn(claim.status)
          const sStyle = statusColor(claim.status)
          const priorityS = priorityColor(claim.priority)
          return (
            <div key={claim.id} className="claims-row" style={{ borderBottom: expandedClaim !== claim.id && i < filtered.length - 1 ? '0.5px solid #F1EFE8' : 'none' }}>
              <div className="claims-row-client">
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#1A1410' }}>{client?.name || '—'}</div>
                {client?.company && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#5F5A57' }}>{client.company}</div>}
              </div>
              <div className="claims-row-desc">
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', marginBottom: 3 }}>{claim.title}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#5F5A57', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{claim.body}</div>
              </div>
              <div className="claims-row-meta">
                <div>{pill(sLabel, sStyle)}</div>
                <div>{pill(priorityLabel(claim.priority), priorityS)}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#5F5A57' }}>{daysAgoFn(claim.created_at)}</div>
              </div>
              <div className="claims-row-actions">
                <Link href={`/dashboard/clients/${claim.client_id}`} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#BA7517', textDecoration: 'none' }}>View client →</Link>
                <button onClick={() => openMayaModal(claim)} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#5F5A57', textAlign: 'left' }}>
                  Ask Maya to follow up
                </button>
                <button onClick={() => setExpandedClaim(expandedClaim === claim.id ? null : claim.id)} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#BA7517', textAlign: 'left' }}>
                  {expandedClaim === claim.id ? 'Hide attachments ↑' : '📎 Attachments'}
                </button>
                <select
                  value={claim.status}
                  disabled={updatingStatus === claim.id || !ifaId}
                  onChange={e => updateStatus(claim.id, e.target.value as Claim['status'])}
                  style={{ fontSize: 11, fontFamily: 'DM Sans, sans-serif', border: '0.5px solid #E8E2DA', borderRadius: 6, padding: '3px 6px', background: '#FFFFFF', color: '#1A1410', cursor: updatingStatus === claim.id ? 'wait' : 'pointer', opacity: updatingStatus === claim.id ? 0.6 : 1 }}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="approved">Approved</option>
                  <option value="denied">Denied</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            {/* Expanded attachments */}
            {expandedClaim === claim.id && (
              <div style={{ gridColumn: '1 / -1', padding: '12px 20px 16px', borderTop: '0.5px solid #F1EFE8', background: '#FAFAF8' }}>
                <DocList parentId={claim.id} apiEndpoint="/api/claim-doc" parentParam="claimId" editable label="Attachments" />
              </div>
            )}
          </div>
          )
        })}
      </div>
    </div>
  )
}
