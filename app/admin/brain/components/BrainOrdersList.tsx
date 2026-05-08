'use client'

import React, { useState, useMemo } from 'react'
import type { WorkOrder } from '../page'
import RefireAction from './RefireAction'

type Filter = 'all' | 'active' | 'done' | 'failed'

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  proposed:   { bg: '#E6F1FB', color: '#185FA5', border: '#B5D4F4' },
  dispatched: { bg: '#FAEEDA', color: '#854F0B', border: '#FAC775' },
  done:       { bg: '#E1F5EE', color: '#0F6E56', border: '#9FE1CB' },
  verified:   { bg: '#E1F5EE', color: '#0F6E56', border: '#9FE1CB' },
  failed:     { bg: '#FCEBEB', color: '#A32D2D', border: '#F7C1C1' },
  blocked:    { bg: '#FCEBEB', color: '#A32D2D', border: '#F7C1C1' },
  reverted:   { bg: '#F1EFE8', color: '#6B6460', border: '#E8E2DA' },
  rejected:   { bg: '#F1EFE8', color: '#6B6460', border: '#E8E2DA' },
}

const RISK_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  low:    { bg: '#E1F5EE', color: '#0F6E56', border: '#9FE1CB' },
  medium: { bg: '#FAEEDA', color: '#854F0B', border: '#FAC775' },
  high:   { bg: '#FCEBEB', color: '#A32D2D', border: '#F7C1C1' },
}

function pill(label: string, s: { bg: string; color: string; border: string }) {
  return (
    <span style={{
      background: s.bg, color: s.color, border: `0.5px solid ${s.border}`,
      fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 100,
      whiteSpace: 'nowrap', fontFamily: 'DM Sans, sans-serif',
    }}>
      {label}
    </span>
  )
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })
}

const ACTIVE_STATUSES = new Set(['proposed', 'dispatched'])
const DONE_STATUSES = new Set(['done', 'verified'])
const FAILED_STATUSES = new Set(['failed', 'blocked', 'reverted', 'rejected'])

export default function BrainOrdersList({ orders }: { orders: WorkOrder[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({})
  const [refireResults, setRefireResults] = useState<Record<string, { action: 'reconciled' | 'redispatched'; sha?: string }>>({})

  const stats = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 86400 * 1000
    const recent = orders.filter(o => new Date(o.created_at).getTime() > oneWeekAgo)
    return {
      total: recent.length,
      done: recent.filter(o => DONE_STATUSES.has(o.status)).length,
      failed: recent.filter(o => FAILED_STATUSES.has(o.status)).length,
    }
  }, [orders])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter(o => {
      const eff = statusOverrides[o.id] ?? o.status
      if (filter === 'active' && !ACTIVE_STATUSES.has(eff)) return false
      if (filter === 'done' && !DONE_STATUSES.has(eff)) return false
      if (filter === 'failed' && !FAILED_STATUSES.has(eff)) return false
      if (q) {
        const hay = `${o.title} ${o.workstream ?? ''} ${o.category ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [orders, filter, search, statusOverrides])

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Last 7 days" value={stats.total} />
        <StatCard label="Done" value={stats.done} accent="#0F6E56" />
        <StatCard label="Failed / blocked" value={stats.failed} accent={stats.failed > 0 ? '#A32D2D' : undefined} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'active', 'done', 'failed'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? '#1A1410' : '#FFFFFF',
                color: filter === f ? '#FFFFFF' : '#1A1410',
                border: `1px solid ${filter === f ? '#1A1410' : '#E8E2DA'}`,
                borderRadius: 100, padding: '6px 14px', fontSize: 12, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search title, workstream, category…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 220, padding: '8px 12px',
            border: '1px solid #E8E2DA', borderRadius: 8, fontSize: 13,
            fontFamily: 'DM Sans, sans-serif', color: '#1A1410', background: '#FFFFFF',
            outline: 'none',
          }}
        />
        <div style={{ fontSize: 12, color: '#9B9088' }}>
          {filtered.length} of {orders.length}
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E8E2DA', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 110px 90px 110px 100px 32px',
          gap: 12, alignItems: 'center',
          padding: '10px 16px', borderBottom: '1px solid #F1EFE8',
          fontSize: 11, color: '#9B9088', letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          <div>Title</div>
          <div>Workstream</div>
          <div>Risk</div>
          <div>Status</div>
          <div>Created</div>
          <div></div>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: '#9B9088', fontSize: 13 }}>
            No work orders match this filter.
          </div>
        )}

        {filtered.map(o => {
          const isOpen = expanded === o.id
          const effectiveStatus = statusOverrides[o.id] ?? o.status
          const statusS = STATUS_STYLE[effectiveStatus] ?? STATUS_STYLE.proposed
          const riskS = RISK_STYLE[o.risk_level ?? 'low'] ?? RISK_STYLE.low
          return (
            <div key={o.id} style={{ borderBottom: '1px solid #F1EFE8' }}>
              <div
                onClick={() => setExpanded(isOpen ? null : o.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 110px 90px 110px 100px 32px',
                  gap: 12, alignItems: 'center',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: isOpen ? '#FBFAF7' : '#FFFFFF',
                  fontSize: 13, color: '#1A1410',
                }}
              >
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {o.title}
                </div>
                <div>{o.workstream ? pill(o.workstream, { bg: '#F1EFE8', color: '#6B6460', border: '#E8E2DA' }) : <span style={{ color: '#9B9088' }}>—</span>}</div>
                <div>{o.risk_level ? pill(o.risk_level, riskS) : <span style={{ color: '#9B9088' }}>—</span>}</div>
                <div>{pill(effectiveStatus, statusS)}</div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#6B6460' }}>
                  {relativeTime(o.created_at)}
                </div>
                <div style={{ color: '#9B9088', fontSize: 14, textAlign: 'right' }}>
                  {isOpen ? '−' : '+'}
                </div>
              </div>

              {isOpen && (
                <div style={{ background: '#FBFAF7', padding: '14px 18px 18px', borderTop: '1px solid #F1EFE8', fontSize: 13, color: '#1A1410' }}>
                  {o.intent && <Section label="Intent">{o.intent}</Section>}
                  {o.rationale && <Section label="Rationale">{o.rationale}</Section>}
                  {o.files_to_change && o.files_to_change.length > 0 && (
                    <Section label="Files">
                      <ul style={{ margin: 0, padding: '0 0 0 18px', fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#6B6460' }}>
                        {o.files_to_change.map(f => <li key={f}>{f}</li>)}
                      </ul>
                    </Section>
                  )}
                  {Array.isArray(o.spec?.operations) && o.spec.operations.length > 0 && (
                    <Section label="Operations">
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#6B6460' }}>
                        {summarizeOps(o.spec.operations)}
                      </span>
                    </Section>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 12 }}>
                    <KV label="Dispatched" value={o.dispatched_at ? new Date(o.dispatched_at).toLocaleString('en-SG') : '—'} />
                    <KV label="Completed" value={o.completed_at ? new Date(o.completed_at).toLocaleString('en-SG') : '—'} />
                    <KV label="Verified" value={o.verified_at ? new Date(o.verified_at).toLocaleString('en-SG') : '—'} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    {o.auto_approved && pill('auto-approved', { bg: '#F1EFE8', color: '#6B6460', border: '#E8E2DA' })}
                    {o.verification_result?.verified === true && pill('verified', { bg: '#E1F5EE', color: '#0F6E56', border: '#9FE1CB' })}
                    {o.verification_result?.verified === false && pill('verify failed', { bg: '#FCEBEB', color: '#A32D2D', border: '#F7C1C1' })}
                    {o.reverted_at && pill('reverted', { bg: '#F1EFE8', color: '#6B6460', border: '#E8E2DA' })}
                  </div>
                  {(effectiveStatus === 'failed' || effectiveStatus === 'blocked') && (
                    <RefireAction
                      orderId={o.id}
                      orderTitle={o.title}
                      onSuccess={(newStatus, action, sha) => {
                        setStatusOverrides(prev => ({ ...prev, [o.id]: newStatus }))
                        setRefireResults(prev => ({ ...prev, [o.id]: { action, sha } }))
                      }}
                    />
                  )}
                  {refireResults[o.id]?.action === 'reconciled' && (
                    <div style={{ marginTop: 14, padding: '10px 12px', background: '#E1F5EE', border: '1px solid #9FE1CB', borderRadius: 6, fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#0F6E56' }}>
                      ✓ Already shipped as <span style={{ fontFamily: 'DM Mono, monospace' }}>{refireResults[o.id].sha}</span> — marked done. No Telegram sent (safety check).
                    </div>
                  )}
                  {refireResults[o.id]?.action === 'redispatched' && (
                    <div style={{ marginTop: 14, padding: '10px 12px', background: '#FAEEDA', border: '1px solid #FAC775', borderRadius: 6, fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#854F0B' }}>
                      ↻ Redispatched. Elon notified via Telegram.
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E8E2DA', borderRadius: 8, padding: '14px 18px' }}>
      <div style={{ fontSize: 11, color: '#9B9088', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, color: accent ?? '#1A1410', fontWeight: 500, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: '#9B9088', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: '#1A1410', lineHeight: 1.55 }}>{children}</div>
    </div>
  )
}

function KV({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#9B9088', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: '#1A1410', fontFamily: mono ? 'DM Mono, monospace' : 'DM Sans, sans-serif' }}>
        {value}
      </div>
    </div>
  )
}

function summarizeOps(ops: any[]): string {
  const counts: Record<string, number> = {}
  for (const op of ops) {
    const t = String(op?.type ?? 'unknown')
    counts[t] = (counts[t] ?? 0) + 1
  }
  return Object.entries(counts).map(([t, n]) => `${n}× ${t}`).join(', ')
}
