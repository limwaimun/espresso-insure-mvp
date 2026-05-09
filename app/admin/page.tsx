'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ExecData {
  byAction: Record<string, { ok: number; fail: number; deferred?: number }>
  recentFailures: { action: string; error: string; created_at: string }[]
  total: number
  totalFail: number
  failRate: number
  windowHours: number
}

const AGENTS = [
  { name: 'Maya', route: '/api/maya-playground', status: 'live', role: 'Client relationship' },
  { name: 'Relay', route: '/api/relay', status: 'live', role: 'Orchestrator' },
  { name: 'Scout', route: '/api/scout', status: 'live', role: 'Product research' },
  { name: 'Sage', route: '/api/sage', status: 'live', role: 'Premium estimates' },
  { name: 'Compass', route: '/api/compass', status: 'live', role: 'Policy comparison' },
  { name: 'Atlas', route: '/api/atlas', status: 'live', role: 'Claims pre-fill' },
  { name: 'Lens', route: '/api/lens', status: 'live', role: 'FA analytics' },
  { name: 'Harvester', route: '/api/forms/harvest', status: 'live', role: 'Form collection' },
  { name: 'Webhook', route: '/api/whatsapp/webhook', status: 'pending_meta', role: 'WhatsApp handler' },
]

export default function AdminPage() {
  const [stats, setStats] = useState({ totalFAs: 0, totalClients: 0, totalPolicies: 0 })
  const [recentFAs, setRecentFAs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [execData, setExecData] = useState<ExecData | null>(null)
  const [execLoading, setExecLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/accounts')
      .then(r => r.json())
      .then(data => {
        if (data.stats) setStats(data.stats)
        if (data.profiles) setRecentFAs(data.profiles.slice(0, 10))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch('/api/admin/executions')
      .then(r => r.json())
      .then(data => { setExecData(data); setExecLoading(false) })
      .catch(() => setExecLoading(false))
  }, [])

  const panelStyle = {
    background: '#FFFFFF',
    border: '1px solid #E8E2DA',
    borderRadius: 12,
    padding: 24,
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, background: '#F7F4F0', minHeight: '100vh' }}>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 400, color: '#1A1410', margin: '0 0 8px' }}>
        Admin Overview
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#6B6460', margin: '0 0 28px' }}>
        espresso. system status
      </p>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Registered FAs', value: loading ? '…' : stats.totalFAs },
          { label: 'Total clients', value: loading ? '…' : stats.totalClients },
          { label: 'Total policies', value: loading ? '…' : stats.totalPolicies },
        ].map(k => (
          <div key={k.label} style={{ background: '#FFFFFF', border: '1px solid #E8E2DA', borderRadius: 10, padding: '20px 24px' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: '#1A1410' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Execution health */}
      <div style={{ ...panelStyle, marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 400, color: '#1A1410', margin: '0 0 16px' }}>
          Execution health <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088' }}>(last 24h)</span>
        </h2>
        {execLoading && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460' }}>Loading…</div>}
        {!execLoading && execData && !(execData as any).error && (
          <>
            {/* Fail rate banner if > 20% */}
            {typeof execData.failRate === 'number' && execData.failRate > 0.2 && (
              <div style={{ background: 'rgba(208,96,96,0.08)', border: '1px solid rgba(208,96,96,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#D06060' }}>
                  ⚠ Elevated failure rate: {Math.round(execData.failRate * 100)}% ({execData.totalFail}/{execData.total} executions)
                </span>
              </div>
            )}
            {/* Per-action summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 16 }}>
              {Object.entries(execData.byAction || {}).sort((a, b) => (b[1].ok + b[1].fail) - (a[1].ok + a[1].fail)).map(([action, counts]) => (
                <div key={action} style={{ background: '#FBFAF7', border: '1px solid #E8E2DA', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{action.replace(/_/g, ' ')}</div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#1A1410' }}>
                    <span style={{ color: '#3A7D5A', fontWeight: 600 }}>{counts.ok}</span>
                    <span style={{ color: '#9B9088' }}> / </span>
                    <span style={{ color: counts.fail > 0 ? '#D06060' : '#9B9088', fontWeight: counts.fail > 0 ? 600 : 400 }}>{counts.fail}</span>
                    {(counts.deferred ?? 0) > 0 && (
                      <>
                        <span style={{ color: '#9B9088' }}> · </span>
                        <span style={{ color: '#854F0B' }} title="Intentional deferrals — not failures">{counts.deferred}d</span>
                      </>
                    )}
                  </div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#6B6460', marginTop: 2 }}>
                    ok / fail{(counts.deferred ?? 0) > 0 ? ' / deferred' : ''}
                  </div>
                </div>
              ))}
            </div>
            {/* Recent failures */}
            {(execData.recentFailures || []).length > 0 && (
              <div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Recent failures</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(execData.recentFailures || []).slice(0, 5).map((f, i) => (
                    <div key={i} style={{ background: '#FBFAF7', border: '1px solid #E8E2DA', borderRadius: 6, padding: '8px 12px' }}>
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#D06060', marginRight: 8 }}>{f.action}</span>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#6B6460', wordBreak: 'break-all' }}>{f.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        {!execLoading && execData && (execData as any).error && (
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#D06060' }}>
            Failed to load execution metrics: {String((execData as any).error).slice(0, 200)}
          </div>
        )}
      </div>

      {/* Agent status */}
      <div style={{ ...panelStyle, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 400, color: '#1A1410', margin: 0 }}>
            Agent fleet
          </h2>
          <Link href="/admin/agents" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#BA7517', textDecoration: 'none' }}>
            View all →
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {AGENTS.map(agent => (
            <div key={agent.name} style={{ background: '#FBFAF7', border: '1px solid #E8E2DA', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1A1410', fontWeight: 500 }}>{agent.name}</span>
                <span style={{
                  fontSize: 9, padding: '2px 6px', borderRadius: 100,
                  fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase' as const,
                  background: agent.status === 'live' ? 'rgba(58,125,90,0.1)' : 'rgba(186,117,23,0.1)',
                  color: agent.status === 'live' ? '#3A7D5A' : '#854F0B',
                  border: `1px solid ${agent.status === 'live' ? 'rgba(58,125,90,0.25)' : 'rgba(133,79,11,0.25)'}`,
                }}>
                  {agent.status === 'live' ? 'Live' : 'Pending'}
                </span>
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#6B6460' }}>{agent.role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent FA signups */}
      <div style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 400, color: '#1A1410', margin: 0 }}>
            FA accounts
          </h2>
          <Link href="/admin/accounts" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#BA7517', textDecoration: 'none' }}>
            View all →
          </Link>
        </div>
        {loading ? (
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460' }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentFAs.map(fa => (
              <div key={fa.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#FBFAF7', borderRadius: 8, border: '1px solid #E8E2DA' }}>
                <div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1A1410', fontWeight: 500 }}>{fa.name || 'Unnamed'}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#6B6460' }}>{fa.company || 'No company'}</div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, fontFamily: 'DM Sans, sans-serif', textTransform: 'capitalize' as const, background: 'rgba(186,117,23,0.08)', color: '#854F0B', border: '1px solid rgba(186,117,23,0.2)' }}>
                    {fa.plan || 'trial'}
                  </span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#6B6460' }}>
                    {new Date(fa.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

