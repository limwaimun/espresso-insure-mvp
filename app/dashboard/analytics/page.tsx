'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface LensMetrics {
  portfolio: {
    totalClients: number
    totalPolicies: number
    totalAnnualPremium: number
    avgPremiumPerClient: number
    avgPoliciesPerClient: number
  }
  renewals: {
    next30Days: {
      count: number
      totalPremium: number
      policies: { client: string; insurer: string; type: string; premium: number; renewalDate: string }[]
    }
    next90Days: { count: number; totalPremium: number }
  }
  claims: {
    open: number
    highPriority: number
    details: { client: string; title: string; priority: string; daysOpen: number }[]
  }
  tiers: Record<string, number>
  topClients: { name: string; company?: string; totalPremium: number; policyCount: number }[]
  insurerBreakdown: Record<string, { count: number; premium: number }>
  coverageBreakdown: Record<string, number>
}

const TIER_COLORS: Record<string, string> = {
  platinum: '#E5E4E2',
  gold: '#BA7517',
  silver: '#6B6460',
  bronze: '#CD7F32',
}

export default function AnalyticsPage() {
  const supabase = createClient()
  const [metrics, setMetrics] = useState<LensMetrics | null>(null)
  const [narrative, setNarrative] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [ifaId, setIfaId] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setIfaId(user.id)

      const res = await fetch('/api/lens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ifaId: user.id, reportType: 'portfolio' }),
      })
      const data = await res.json()
      if (data.metrics) setMetrics(data.metrics)
      if (data.narrative) setNarrative(data.narrative)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -800px 0 }
          100% { background-position: 800px 0 }
        }
        .shimmer {
          background: linear-gradient(90deg, #FFFFFF 25%, #E8E2DA 50%, #FFFFFF 75%);
          background-size: 800px 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
        }
      `}</style>

      {/* Title skeleton */}
      <div className="shimmer" style={{ height: 36, width: 180, marginBottom: 8 }} />
      <div className="shimmer" style={{ height: 16, width: 280, marginBottom: 28 }} />

      {/* Narrative skeleton */}
      <div style={{ background: '#F7F4F0', border: '0.5px solid #E8E2DA', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div className="shimmer" style={{ height: 12, width: 100, marginBottom: 14 }} />
        <div className="shimmer" style={{ height: 14, width: '100%', marginBottom: 8 }} />
        <div className="shimmer" style={{ height: 14, width: '95%', marginBottom: 8 }} />
        <div className="shimmer" style={{ height: 14, width: '88%', marginBottom: 8 }} />
        <div className="shimmer" style={{ height: 14, width: '92%' }} />
      </div>

      {/* KPI row skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ background: '#F7F4F0', border: '0.5px solid #E8E2DA', borderRadius: 10, padding: '20px 22px' }}>
            <div className="shimmer" style={{ height: 11, width: 80, marginBottom: 10 }} />
            <div className="shimmer" style={{ height: 32, width: 120 }} />
          </div>
        ))}
      </div>

      {/* Two-col skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {[1,2].map(i => (
          <div key={i} style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 12, padding: 24 }}>
            <div className="shimmer" style={{ height: 22, width: 160, marginBottom: 20 }} />
            {[1,2,3].map(j => (
              <div key={j} style={{ background: '#F7F4F0', borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
                <div className="shimmer" style={{ height: 14, width: '70%', marginBottom: 6 }} />
                <div className="shimmer" style={{ height: 11, width: '40%' }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )

  if (!metrics) return (
    <div style={{ padding: 40, color: '#6B6460', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
      No data available yet.
    </div>
  )

  const panelStyle = {
    background: '#FFFFFF',
    border: '0.5px solid #E8E2DA',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: 11,
    color: '#6B6460',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: 4,
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 500, color: '#1A1410', margin: '0 0 4px' }}>
        Analytics
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#6B6460', margin: '0 0 28px' }}>
        Portfolio overview powered by Lens
      </p>

      {/* Narrative */}
      {narrative && (
        <div style={{ ...panelStyle, background: '#F7F4F0', borderColor: '#E8E2DA', marginBottom: 24 }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            🔍 Lens insight
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#6B6460', lineHeight: 1.8 }}>
            {narrative
              .replace(/^##\s*/gm, '')        // remove ## headers
              .replace(/^#\s*/gm, '')          // remove # headers
              .split('\n')
              .filter(line => line.trim())
              .map((line, i) => {
                // Split on **bold** and render inline
                const parts = line.split(/\*\*(.*?)\*\*/g)
                return (
                  <p key={i} style={{ margin: '0 0 10px' }}>
                    {parts.map((part, j) =>
                      j % 2 === 1
                        ? <strong key={j} style={{ color: '#1A1410', fontWeight: 600 }}>{part}</strong>
                        : <span key={j}>{part}</span>
                    )}
                  </p>
                )
              })
            }
          </div>
        </div>
      )}

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total clients', value: metrics.portfolio.totalClients, mono: false },
          { label: 'Total policies', value: metrics.portfolio.totalPolicies, mono: false },
          { label: 'Annual premium', value: `$${metrics.portfolio.totalAnnualPremium.toLocaleString()}`, mono: true },
          { label: 'Avg per client', value: `$${metrics.portfolio.avgPremiumPerClient.toLocaleString()}`, mono: true },
        ].map(k => (
          <div key={k.label} style={{ background: '#F7F4F0', border: '0.5px solid #E8E2DA', borderRadius: 10, padding: '20px 22px' }}>
            <div style={labelStyle}>{k.label}</div>
            <div style={{ fontFamily: k.mono ? 'DM Mono, monospace' : 'DM Sans, sans-serif', fontSize: 26, fontWeight: 500, color: '#1A1410' }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Renewal pipeline */}
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 500, color: '#1A1410', margin: 0 }}>
              Renewal pipeline
            </h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, color: metrics.renewals.next30Days.count > 0 ? '#854F0B' : '#1D9E75' }}>
                  {metrics.renewals.next30Days.count}
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#3D3532' }}>next 30d</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, color: '#3D3532' }}>
                  {metrics.renewals.next90Days.count}
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#3D3532' }}>next 90d</div>
              </div>
            </div>
          </div>
          {metrics.renewals.next30Days.policies.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {metrics.renewals.next30Days.policies.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#F7F4F0', borderRadius: 8, border: '0.5px solid #E8E2DA' }}>
                  <div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', fontWeight: 500 }}>{p.client}</div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#5F5A57' }}>{p.insurer} · {p.type}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#BA7517' }}>
                      {new Date(p.renewalDate).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}
                    </div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#5F5A57' }}>${Number(p.premium).toLocaleString()}/yr</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460', textAlign: 'center', padding: '20px 0' }}>
              No renewals in the next 30 days ✓
            </div>
          )}
        </div>

        {/* Claims + tiers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Open claims */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 500, color: '#1A1410', margin: 0 }}>
                Open claims
              </h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, color: metrics.claims.open > 0 ? '#854F0B' : '#1D9E75' }}>
                  {metrics.claims.open}
                </span>
                {metrics.claims.highPriority > 0 && (
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, color: '#A32D2D' }}>
                    {metrics.claims.highPriority} high
                  </span>
                )}
              </div>
            </div>
            {metrics.claims.details.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {metrics.claims.details.slice(0, 4).map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#F7F4F0', borderRadius: 6, border: '0.5px solid #E8E2DA' }}>
                    <div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#1A1410' }}>{c.client}</div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#6B6460', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{c.title}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: c.priority === 'high' ? '#A32D2D' : c.priority === 'medium' ? '#854F0B' : '#6B6460', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif' }}>{c.priority}</span>
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#3D3532' }}>{c.daysOpen}d</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460', textAlign: 'center', padding: '12px 0' }}>
                No open claims ✓
              </div>
            )}
          </div>

          {/* Client tiers */}
          <div style={panelStyle}>
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 500, color: '#1A1410', margin: '0 0 16px' }}>
              Client tiers
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {['platinum', 'gold', 'silver', 'bronze'].map(tier => (
                <div key={tier} style={{ background: '#F7F4F0', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: TIER_COLORS[tier], textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontWeight: 500, fontSize: 11 }}>{tier}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, color: '#1A1410', fontWeight: 400 }}>
                    {metrics.tiers[tier] || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top clients + insurer breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Top clients */}
        <div style={panelStyle}>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 500, color: '#1A1410', margin: '0 0 16px' }}>
            Top clients
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {metrics.topClients.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#F7F4F0', borderRadius: 8, border: '0.5px solid #E8E2DA' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#5F5A57', width: 16 }}>{i + 1}</span>
                  <div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', fontWeight: 500 }}>{c.name}</div>
                    {c.company && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#5F5A57' }}>{c.company}</div>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#BA7517' }}>${c.totalPremium.toLocaleString()}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#5F5A57' }}>{c.policyCount} {c.policyCount === 1 ? 'policy' : 'policies'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insurer breakdown */}
        <div style={panelStyle}>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 500, color: '#1A1410', margin: '0 0 16px' }}>
            By insurer
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(metrics.insurerBreakdown)
              .sort(([, a], [, b]) => b.premium - a.premium)
              .map(([insurer, data]) => {
                const maxPremium = Math.max(...Object.values(metrics.insurerBreakdown).map(d => d.premium))
                const pct = maxPremium > 0 ? (data.premium / maxPremium) * 100 : 0
                return (
                  <div key={insurer} style={{ padding: '10px 12px', background: '#F7F4F0', borderRadius: 8, border: '0.5px solid #E8E2DA' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410' }}>{insurer}</span>
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#BA7517' }}>${data.premium.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 4, background: '#E8E2DA', borderRadius: 2 }}>
                      <div style={{ height: '100%', borderRadius: 2, background: '#BA7517', width: `${pct}%` }} />
                    </div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#6B6460', marginTop: 4 }}>
                      {data.count} {data.count === 1 ? 'policy' : 'policies'}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
