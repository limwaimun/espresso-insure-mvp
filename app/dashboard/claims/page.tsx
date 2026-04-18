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
  clients: { name: string; company: string | null } | null
}

const STATUS_STYLE = {
  open:     { bg: '#FAEEDA', color: '#854F0B', border: '#FAC775' },
  urgent:   { bg: '#FCEBEB', color: '#A32D2D', border: '#F7C1C1' },
  resolved: { bg: '#E1F5EE', color: '#0F6E56', border: '#9FE1CB' },
}
const PRIORITY_STYLE = {
  high:   { bg: '#FCEBEB', color: '#A32D2D', border: '#F7C1C1' },
  medium: { bg: '#FAEEDA', color: '#854F0B', border: '#FAC775' },
  info:   { bg: '#E6F1FB', color: '#185FA5', border: '#B5D4F4' },
}

export default function ClaimsPage() {
  const supabase = createClient()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('alerts')
        .select('id, title, body, resolved, priority, created_at, client_id, clients(name, company)')
        .order('created_at', { ascending: false })
      setClaims((data || []) as any)
      setLoading(false)
    }
    load()
  }, [])

  const totalClaims = claims.length
  const openClaims = claims.filter(c => !c.resolved).length
  const resolvedClaims = claims.filter(c => c.resolved).length
  const highPriority = claims.filter(c => c.priority === 'high' && !c.resolved).length

  const filtered = claims.filter(c => {
    if (filter === 'open') return !c.resolved
    if (filter === 'resolved') return c.resolved
    if (filter === 'high') return c.priority === 'high' && !c.resolved
    return true
  })

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })
  const daysAgo = (d: string) => {
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
    return days === 0 ? 'Today' : `${days}d ago`
  }

  const pill = (label: string, s: { bg: string; color: string; border: string }) => (
    <span style={{ background: s.bg, color: s.color, border: `0.5px solid ${s.border}`, fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 100, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )

  const tab = (label: string, f: FilterType, count?: number) => (
    <button onClick={() => setFilter(f)} style={{ background: filter === f ? '#1A1410' : 'transparent', color: filter === f ? '#FFFFFF' : '#6B6460', border: `0.5px solid ${filter === f ? '#1A1410' : '#E8E2DA'}`, borderRadius: 100, padding: '5px 14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
      {label}
      {count !== undefined && count > 0 && <span style={{ background: filter === f ? 'rgba(255,255,255,0.2)' : '#F1EFE8', color: filter === f ? '#FFFFFF' : '#6B6460', fontSize: 10, fontWeight: 500, padding: '1px 6px', borderRadius: 100 }}>{count}</span>}
    </button>
  )

  return (
    <div style={{ padding: '24px 28px', background: '#F7F4F0', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 500, color: '#1A1410', margin: 0 }}>Claims</h1>
        <button style={{ background: '#BA7517', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#FFFFFF', fontWeight: 500 }}>
          + New claim
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total claims', value: totalClaims },
          { label: 'Open', value: openClaims, warn: openClaims > 0 },
          { label: 'Resolved', value: resolvedClaims, green: true },
          { label: 'High priority', value: highPriority, danger: highPriority > 0 },
        ].map(k => (
          <div key={k.label} style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 28, fontWeight: 500, color: k.danger ? '#A32D2D' : k.green ? '#0F6E56' : k.warn ? '#854F0B' : '#1A1410', lineHeight: 1 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tab('All', 'all', totalClaims)}
        {tab('Open', 'open', openClaims)}
        {tab('Resolved', 'resolved', resolvedClaims)}
        {tab('High priority', 'high', highPriority)}
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 120px 100px 80px 160px', padding: '10px 20px', borderBottom: '0.5px solid #E8E2DA', background: '#FAFAF8' }}>
          {['Client', 'Description', 'Status', 'Priority', 'Filed', 'Action'].map(h => (
            <div key={h} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500 }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#9B9088' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#9B9088' }}>No claims found</div>
        ) : (
          filtered.map((claim, i) => {
            const statusStyle = claim.resolved ? STATUS_STYLE.resolved : claim.priority === 'high' ? STATUS_STYLE.urgent : STATUS_STYLE.open
            const statusLabel = claim.resolved ? 'Resolved' : claim.priority === 'high' ? 'Urgent' : 'Open'
            const priorityStyle = PRIORITY_STYLE[claim.priority] || PRIORITY_STYLE.info
            const client = claim.clients as any

            return (
              <div key={claim.id} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 120px 100px 80px 160px', padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '0.5px solid #F1EFE8' : 'none', alignItems: 'start' }}>
                <div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#1A1410' }}>{client?.name || 'Unknown'}</div>
                  {client?.company && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088', marginTop: 2 }}>{client.company}</div>}
                </div>
                <div style={{ paddingRight: 16 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', marginBottom: 3 }}>{claim.title}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 360 }}>{claim.body}</div>
                </div>
                <div>{pill(statusLabel, statusStyle)}</div>
                <div>{pill(claim.priority.charAt(0).toUpperCase() + claim.priority.slice(1), priorityStyle)}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460' }}>{daysAgo(claim.created_at)}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Link href={`/dashboard/clients/${claim.client_id}`} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#BA7517', textDecoration: 'none' }}>View client →</Link>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#9B9088', cursor: 'pointer' }}>Ask Maya to follow up</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
