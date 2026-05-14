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

interface TokensByUser {
  user_id: string
  input_tokens: number
  output_tokens: number
  total_calls: number
}

interface TotalsByAgent {
  agent: string
  ok: number
  error: number
  rate_limited: number
  total: number
  p50_latency_ms: number | null
  total_input_tokens: number | null
  total_output_tokens: number | null
}

interface AgentInvocationsData {
  tokensByUser: TokensByUser[]
  totalsByAgent?: TotalsByAgent[]
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
  const [stats, setStats] = useState({ totalFAs: 0, totalClients: 0, totalPolicies: 0, activeFAs7d: 0, pendingProposed: 0, failedVerifications24h: 0 })
  const [workstreamStats, setWorkstreamStats] = useState<{ name: string; total: number; done: number; failed: number }[] | null>(null)
  const [recentFAs, setRecentFAs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [execData, setExecData] = useState<ExecData | null>(null)
  const [execLoading, setExecLoading] = useState(true)
  const [invocData, setInvocData] = useState<AgentInvocationsData | null>(null)

  useEffect(() => {
    fetch('/api/admin/accounts')
      .then(r => r.json())
      .then(data => {
        if (data.stats) setStats(data.stats)
        if (data.workstreamStats) setWorkstreamStats(data.workstreamStats)
        if (data.profiles) setRecentFAs(data.profiles.slice(0, 10))
        // Derive failed verifications from workstream failed totals (proxy)
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

  useEffect(() => {
    fetch('/api/admin/agent-invocations')
      .then(r => r.json())
      .then(data => setInvocData(data))
      .catch(() => {})
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Registered FAs', value: loading ? '…' : stats.totalFAs },
          { label: 'Total clients', value: loading ? '…' : stats.totalClients },
          { label: 'Total policies', value: loading ? '…' : stats.totalPolicies },
          { label: 'Active FAs (7d)', value: loading ? '…' : stats.activeFAs7d },
          { label: 'Pending approval', value: loading ? '…' : stats.pendingProposed, alert: !loading && stats.pendingProposed > 0 },
          { label: 'Failed verifs (24h)', value: loading ? '…' : (workstreamStats ? workstreamStats.reduce((s, w) => s + w.failed, 0) : 0), alert: !loading && workstreamStats != null && workstreamStats.reduce((s, w) => s + w.failed, 0) > 2 },
        ].map(k => (
          <div key={k.label} style={{ background: '#FFFFFF', border: `1px solid ${(k as any).alert ? 'rgba(186,117,23,0.4)' : '#E8E2DA'}`, borderRadius: 10, padding: '20px 24px' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: `${(k as any).alert ? '#854F0B' : '#1A1410'}` }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Workstream health (7d) */}
      {workstreamStats && workstreamStats.length > 0 && workstreamStats.some(w => w.total > 0) && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E8E2DA', borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
            Workstream health (7d)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {workstreamStats.filter(w => w.total > 0).map(ws => {
              const hasFailures = ws.failed > 0
              return (
                <div
                  key={ws.name}
                  style={{
                    background: hasFailures ? '#FCEBEB' : '#FBFAF7',
                    border: `1px solid ${hasFailures ? '#F7C1C1' : '#E8E2DA'}`,
                    borderRadius: 8, padding: '10px 14px', minWidth: 120,
                  }}
                >
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#1A1410', fontWeight: 500, marginBottom: 4 }}>
                    {ws.name}
                  </div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#6B6460' }}>
                    {ws.done}/{ws.total} done
                    {ws.failed > 0 && (
                      <span style={{ color: '#A32D2D', marginLeft: 6 }}>· {ws.failed} failed</span>
                    )}
                  </div>
                  <div style={{ marginTop: 6, height: 3, borderRadius: 2, background: '#E8E2DA', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 2, width: `${ws.total > 0 ? (ws.done / ws.total) * 100 : 0}%`, background: hasFailures ? '#D06060' : '#3A7D5A' }} />
                  </div>
                </div>
              )
            })}
          </div>
          <a href="/admin/brain" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#BA7517', textDecoration: 'none', marginTop: 10, display: 'inline-block' }}>View Brain Loop →</a>
        </div>
      )}

      {/* Anthropic API limit alert — shown when brain_tick failures contain the usage-limit error */}
      {!execLoading && execData && (() => {
        const limitError = (execData.recentFailures || []).find(
          f => f.action === 'brain_tick' && f.error.includes('API usage limits')
        )
        if (!limitError) return null
        // Extract the resume date from the error string if present
        const match = limitError.error.match(/You will regain access on ([^."]+)/)
        const resumeDate = match ? match[1].trim() : null
        return (
          <div style={{ background: 'rgba(186,117,23,0.08)', border: '1px solid rgba(186,117,23,0.35)', borderRadius: 10, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: '#854F0B', marginBottom: 4 }}>
                Anthropic API usage limit reached — Brain is paused
              </div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#6B6460' }}>
                {resumeDate
                  ? `Access resumes: ${resumeDate}`
                  : 'Check Anthropic console for plan limit details.'}
              </div>
              <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#BA7517', textDecoration: 'none', marginTop: 6, display: 'inline-block' }}>Open Anthropic Console →</a>
            </div>
          </div>
        )
      })()}

      {/* Failed verifications alert — shown when work orders have 3+ failed verifications in 24h */}
      {!loading && (() => {
        // Count work orders in 'failed' status — proxy for failed verifications visible to Wayne
        const failedCount = workstreamStats ? workstreamStats.reduce((s, w) => s + w.failed, 0) : 0
        if (failedCount < 3) return null
        return (
          <div style={{ background: 'rgba(208,96,96,0.07)', border: '1px solid rgba(208,96,96,0.3)', borderRadius: 10, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: '#A32D2D', marginBottom: 4 }}>
                {failedCount} work orders have failed in the last 7 days — Elon execution success rate is low
              </div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#6B6460' }}>
                Failed orders cannot be re-claimed until manually re-dispatched. Check Brain Loop for details.
              </div>
              <a href="/admin/brain" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#BA7517', textDecoration: 'none', marginTop: 6, display: 'inline-block' }}>View Brain Loop →</a>
            </div>
          </div>
        )
      })()}

      {/* Claim failure alert — shown when claim fail rate > 40% */}
      {!execLoading && execData && (() => {
        const claim = execData.byAction?.['claim']
        if (!claim) return null
        const total = claim.ok + claim.fail
        if (total === 0) return null
        const rate = claim.fail / total
        if (rate < 0.4) return null
        return (
          <div style={{ background: 'rgba(208,96,96,0.07)', border: '1px solid rgba(208,96,96,0.3)', borderRadius: 10, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 18 }}>🚨</span>
            <div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: '#A32D2D', marginBottom: 4 }}>
                Claim action failing at {Math.round(rate * 100)}% ({claim.fail}/{total} in last 24h)
              </div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#6B6460' }}>
                Most recent error: already_claimed_or_not_dispatched — orders stuck in 'running' or 'failed' status cannot be re-claimed by Elon. Check Brain Loop for stale running orders.
              </div>
              <a href="/admin/brain" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#BA7517', textDecoration: 'none', marginTop: 6, display: 'inline-block' }}>View Brain Loop →</a>
            </div>
          </div>
        )
      })()}

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

      {/* Per-agent invocation counts */}
      {invocData && invocData.totalsByAgent && invocData.totalsByAgent.length > 0 && (
        <div style={{ ...panelStyle, marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 400, color: '#1A1410', margin: '0 0 16px' }}>
            Agent invocations <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088' }}>(last 24h)</span>
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Agent', 'Total calls', 'OK', 'Errors', 'Error rate', 'Input tokens', 'Output tokens', 'p95 latency'].map(h => (
                    <th key={h} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#9B9088', textTransform: 'uppercase' as const, letterSpacing: '0.08em', textAlign: h === 'Agent' ? 'left' : 'right', padding: '6px 10px', borderBottom: '1px solid #E8E2DA' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invocData.totalsByAgent.map(a => {
                  const errorRate = a.total > 0 ? a.error / a.total : 0
                  const isHighError = errorRate >= 0.2
                  return (
                    <tr key={a.agent} style={{ background: isHighError ? 'rgba(208,96,96,0.04)' : 'transparent' }}>
                      <td style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', fontWeight: 500, padding: '7px 10px' }}>{a.agent}</td>
                      <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#6B6460', padding: '7px 10px', textAlign: 'right' }}>{a.total}</td>
                      <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#3A7D5A', padding: '7px 10px', textAlign: 'right' }}>{a.ok}</td>
                      <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: a.error > 0 ? '#D06060' : '#9B9088', fontWeight: a.error > 0 ? 600 : 400, padding: '7px 10px', textAlign: 'right' }}>{a.error}</td>
                      <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: isHighError ? '#D06060' : '#9B9088', fontWeight: isHighError ? 600 : 400, padding: '7px 10px', textAlign: 'right' }}>
                        {a.total > 0 ? `${Math.round(errorRate * 100)}%` : '—'}
                        {isHighError ? ' ⚠' : ''}
                      </td>
                      <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#6B6460', padding: '7px 10px', textAlign: 'right' }}>{a.total_input_tokens ? a.total_input_tokens.toLocaleString() : '0'}</td>
                      <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#6B6460', padding: '7px 10px', textAlign: 'right' }}>{(a as any).total_output_tokens ? (a as any).total_output_tokens.toLocaleString() : '0'}</td>
                      <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#6B6460', padding: '7px 10px', textAlign: 'right' }}>{(a as any).p95_latency_ms != null ? `${Math.round((a as any).p95_latency_ms)}ms` : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-FA token spend */}
      {invocData && invocData.tokensByUser && invocData.tokensByUser.length > 0 && (
        <div style={{ ...panelStyle, marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 400, color: '#1A1410', margin: '0 0 16px' }}>
            Token spend by FA <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088' }}>(last 24h)</span>
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['FA', 'Calls', 'Input tokens', 'Output tokens', 'Total tokens'].map(h => (
                    <th key={h} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#9B9088', textTransform: 'uppercase' as const, letterSpacing: '0.08em', textAlign: h === 'FA' ? 'left' : 'right', padding: '6px 10px', borderBottom: '1px solid #E8E2DA' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invocData.tokensByUser.map((u, i) => {
                  const total = u.input_tokens + u.output_tokens
                  const isHigh = total > 50000
                  return (
                    <tr key={u.user_id}>
                      <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#1A1410', padding: '7px 10px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                        {u.user_id === 'anonymous' ? <em style={{ color: '#9B9088' }}>anonymous</em> : u.user_id.slice(0, 8) + '…'}
                      </td>
                      <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#6B6460', padding: '7px 10px', textAlign: 'right' }}>{u.total_calls}</td>
                      <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#6B6460', padding: '7px 10px', textAlign: 'right' }}>{u.input_tokens.toLocaleString()}</td>
                      <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#6B6460', padding: '7px 10px', textAlign: 'right' }}>{u.output_tokens.toLocaleString()}</td>
                      <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: isHigh ? '#D06060' : '#1A1410', fontWeight: isHigh ? 600 : 400, padding: '7px 10px', textAlign: 'right' }}>
                        {total.toLocaleString()}{isHigh ? ' ⚠' : ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

