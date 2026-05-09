'use client'

import { useState, useEffect } from 'react'

const AGENTS = [
  { name: 'Maya', route: '/api/maya-playground', status: 'live', role: 'Client relationship & WhatsApp', version: 'v7', description: 'Handles client conversations, collects claim info, updates claim status via WhatsApp.' },
  { name: 'Relay', route: '/api/relay', status: 'live', role: 'Orchestrator', version: 'v1', description: 'Classifies intent from natural language and routes to the appropriate agent.' },
  { name: 'Scout', route: '/api/scout', status: 'live', role: 'Product research & PDF extraction', version: 'v2', description: 'Researches insurance products and extracts structured data from PDFs.' },
  { name: 'Sage', route: '/api/sage', status: 'live', role: 'Premium estimation', version: 'v2', description: 'Estimates premiums across insurers based on client profile and coverage type.' },
  { name: 'Compass', route: '/api/compass', status: 'live', role: 'Policy comparison & gap analysis', version: 'v1', description: 'Compares policies across insurers and identifies coverage gaps for clients.' },
  { name: 'Atlas', route: '/api/atlas', status: 'live', role: 'Claims form pre-fill', version: 'v2', description: 'Pre-fills claim forms from the database and asks Maya to collect missing fields.' },
  { name: 'Lens', route: '/api/lens', status: 'live', role: 'FA portfolio analytics', version: 'v1', description: 'Computes portfolio metrics, renewal pipeline, and generates narrative insights.' },
  { name: 'Harvester', route: '/api/forms/harvest', status: 'live', role: 'Claim form downloader', version: 'v3', description: 'Downloads claim forms from insurer websites monthly and stores in Supabase Storage.' },
  { name: 'Webhook', route: '/api/webhook/whatsapp', status: 'pending_meta', role: 'WhatsApp message handler', version: 'v1', description: 'Verifies sender identity, detects injection attempts, notifies FA on client messages.' },
]

interface AgentTotal {
  agent: string
  ok: number
  error: number
  rate_limited: number
  unauthorized: number
  total: number
  p50_latency_ms: number | null
  p95_latency_ms: number | null
  total_input_tokens: number | null
  total_output_tokens: number | null
}

interface RecentError {
  created_at: string
  agent: string
  user_id: string | null
  status_code: number | null
  error_message: string | null
}

interface InvocationsData {
  totalsByAgent: AgentTotal[]
  recentErrors: RecentError[]
  windowHours: number
}

const cellStyle: React.CSSProperties = {
  fontFamily: 'DM Sans, sans-serif',
  fontSize: 12,
  color: '#6B6460',
  padding: '6px 10px',
  textAlign: 'right',
}

const cellLeft: React.CSSProperties = {
  ...cellStyle,
  textAlign: 'left',
}

const headerStyle: React.CSSProperties = {
  fontFamily: 'DM Sans, sans-serif',
  fontSize: 11,
  color: '#9B9088',
  textTransform: 'uppercase',
  padding: '6px 10px',
  textAlign: 'right',
  borderBottom: '1px solid #E8E2DA',
}

const headerLeft: React.CSSProperties = {
  ...headerStyle,
  textAlign: 'left',
}

function formatNumber(n: number | null | undefined): string {
  if (n == null) return '—'
  return n.toLocaleString()
}

function formatMs(ms: number | null | undefined): string {
  if (ms == null) return '—'
  return `${ms}ms`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
}

export default function AdminAgentsPage() {
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, string>>({})
  const [invocationsData, setInvocationsData] = useState<InvocationsData | null>(null)
  const [invocationsError, setInvocationsError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/agent-invocations')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        setInvocationsData(data)
        setLoading(false)
      })
      .catch(err => {
        setInvocationsError(err.message)
        setLoading(false)
      })
  }, [])

  async function pingAgent(route: string, name: string) {
    setTesting(name)
    try {
      const res = await fetch(route, { method: 'GET' })
      setTestResult(prev => ({ ...prev, [name]: res.ok || res.status === 405 ? 'reachable' : `error ${res.status}` }))
    } catch {
      setTestResult(prev => ({ ...prev, [name]: 'unreachable' }))
    }
    setTesting(null)
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000, background: '#F7F4F0', minHeight: '100vh' }}>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 400, color: '#1A1410', margin: '0 0 8px' }}>
        Agent fleet
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#6B6460', margin: '0 0 28px' }}>
        {AGENTS.filter(a => a.status === 'live').length} of {AGENTS.length} agents live
      </p>

      {/* ── Last 24h activity ── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E8E2DA', borderRadius: 12, padding: '20px 24px', marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 400, color: '#1A1410', margin: '0 0 16px' }}>
          Last 24h activity
        </h2>

        {loading && (
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#9B9088' }}>
            Loading invocations…
          </p>
        )}

        {invocationsError && (
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#D06060' }}>
            Could not load invocations: {invocationsError}
          </p>
        )}

        {!loading && !invocationsError && invocationsData && (
          <>
            {invocationsData.totalsByAgent.length === 0 ? (
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#9B9088', fontStyle: 'italic' }}>
                No invocations recorded in the last 24h
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={headerLeft}>Agent</th>
                      <th style={headerStyle}>Calls</th>
                      <th style={headerStyle}>OK</th>
                      <th style={headerStyle}>Errors</th>
                      <th style={headerStyle}>p50 latency</th>
                      <th style={headerStyle}>p95 latency</th>
                      <th style={headerStyle}>In tokens</th>
                      <th style={headerStyle}>Out tokens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invocationsData.totalsByAgent.map(a => (
                      <tr key={a.agent}>
                        <td style={{ ...cellLeft, color: '#1A1410', textTransform: 'capitalize' }}>{a.agent}</td>
                        <td style={cellStyle}>{formatNumber(a.total)}</td>
                        <td style={{ ...cellStyle, color: a.ok > 0 ? '#3A7D5A' : undefined }}>{formatNumber(a.ok)}</td>
                        <td style={{ ...cellStyle, color: a.error > 0 ? '#D06060' : undefined }}>{formatNumber(a.error)}</td>
                        <td style={cellStyle}>{formatMs(a.p50_latency_ms)}</td>
                        <td style={cellStyle}>{formatMs(a.p95_latency_ms)}</td>
                        <td style={cellStyle}>{formatNumber(a.total_input_tokens)}</td>
                        <td style={cellStyle}>{formatNumber(a.total_output_tokens)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {invocationsData.recentErrors.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, fontWeight: 400, color: '#D06060', margin: '0 0 8px' }}>
                  Recent errors
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {invocationsData.recentErrors.slice(0, 5).map((e, i) => (
                    <div key={i} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#6B6460', lineHeight: 1.5 }}>
                      <span style={{ color: '#9B9088' }}>[{formatTime(e.created_at)}]</span>{' '}
                      <span style={{ color: '#D06060' }}>{e.agent}</span>
                      {e.status_code && <span style={{ color: '#9B9088' }}> ({e.status_code})</span>}
                      : <span style={{ color: '#6B6460' }}>{e.error_message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Agent fleet list ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {AGENTS.map(agent => (
          <div key={agent.name} style={{ background: '#FFFFFF', border: '1px solid #E8E2DA', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#1A1410' }}>{agent.name}</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#6B6460' }}>{agent.version}</span>
                  <span style={{
                    fontSize: 9, padding: '2px 8px', borderRadius: 100,
                    fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase',
                    background: agent.status === 'live' ? 'rgba(58,125,90,0.10)' : 'rgba(186,117,23,0.10)',
                    color: agent.status === 'live' ? '#3A7D5A' : '#854F0B',
                    border: `1px solid ${agent.status === 'live' ? 'rgba(58,125,90,0.25)' : 'rgba(133,79,11,0.25)'}`,
                  }}>
                    {agent.status === 'live' ? 'Live' : 'Pending Meta'}
                  </span>
                  {testResult[agent.name] && (
                    <span style={{ fontSize: 10, color: testResult[agent.name] === 'reachable' ? '#3A7D5A' : '#D06060', fontFamily: 'DM Sans, sans-serif' }}>
                      {testResult[agent.name] === 'reachable' ? '✓ Reachable' : '✗ ' + testResult[agent.name]}
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460', marginBottom: 4 }}>{agent.role}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#9B9088', lineHeight: 1.5 }}>{agent.description}</div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#9B9088', marginTop: 8 }}>{agent.route}</div>
              </div>
              <button
                onClick={() => pingAgent(agent.route, agent.name)}
                disabled={testing === agent.name}
                style={{ background: 'transparent', border: '1px solid #E8E2DA', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460', flexShrink: 0, marginLeft: 16 }}>
                {testing === agent.name ? 'Pinging…' : 'Ping'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
