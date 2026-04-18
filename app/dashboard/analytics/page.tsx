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
  gold: '#C8813A',
  silver: '#C9B99A',
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
    <div style={{ padding: 40, color: '#C9B99A', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
      Loading analytics…
    </div>
  )

  if (!metrics) return (
    <div style={{ padding: 40, color: '#C9B99A', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
      No data available yet.
    </div>
  )

  const panelStyle = {
    background: '#1C0F0A',
    border: '1px solid #2E1A0E',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: 11,
    color: '#C9B99A',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: 4,
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 400, color: '#F5ECD7', margin: '0 0 8px' }}>
        Analytics
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#C9B99A', margin: '0 0 28px' }}>
        Portfolio overview powered by Lens
      </p>

      {/* Narrative */}
      {narrative && (
        <div style={{ ...panelStyle, background: '#120A06', borderColor: '#3D2215', marginBottom: 24 }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#C8813A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            🔍 Lens insight
          </div>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#F5ECD7', lineHeight: 1.7, margin: 0 }}>
            {narrative}
          </p>
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
          <div key={k.label} style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: 10, padding: '20px 22px' }}>
            <div style={labelStyle}>{k.label}</div>
            <div style={{ fontFamily: k.mono ? 'DM Mono, monospace' : 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#F5ECD7' }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Renewal pipeline */}
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 400, color: '#F5ECD7', margin: 0 }}>
              Renewal pipeline
            </h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 18, color: metrics.renewals.next30Days.count > 0 ? '#D4A030' : '#5AB87A' }}>
                  {metrics.renewals.next30Days.count}
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#C9B99A' }}>next 30d</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 18, color: '#C9B99A' }}>
                  {metrics.renewals.next90Days.count}
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#C9B99A' }}>next 90d</div>
              </div>
            </div>
          </div>
          {metrics.renewals.next30Days.policies.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {metrics.renewals.next30Days.policies.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#120A06', borderRadius: 8, border: '1px solid #2E1A0E' }}>
                  <div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#F5ECD7', fontWeight: 500 }}>{p.client}</div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#C9B99A' }}>{p.insurer} · {p.type}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#C8813A' }}>
                      {new Date(p.renewalDate).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}
                    </div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#C9B99A' }}>${Number(p.premium).toLocaleString()}/yr</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#C9B99A', textAlign: 'center', padding: '20px 0' }}>
              No renewals in the next 30 days ✓
            </div>
          )}
        </div>

        {/* Claims + tiers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Open claims */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 400, color: '#F5ECD7', margin: 0 }}>
                Open claims
              </h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 18, color: metrics.claims.open > 0 ? '#D4A030' : '#5AB87A' }}>
                  {metrics.claims.open}
                </span>
                {metrics.claims.highPriority > 0 && (
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 18, color: '#D06060' }}>
                    {metrics.claims.highPriority} high
                  </span>
                )}
              </div>
            </div>
            {metrics.claims.details.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {metrics.claims.details.slice(0, 4).map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#120A06', borderRadius: 6, border: '1px solid #2E1A0E' }}>
                    <div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#F5ECD7' }}>{c.client}</div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#C9B99A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{c.title}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: c.priority === 'high' ? '#D06060' : c.priority === 'medium' ? '#D4A030' : '#C9B99A', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif' }}>{c.priority}</span>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#C9B99A' }}>{c.daysOpen}d</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#C9B99A', textAlign: 'center', padding: '12px 0' }}>
                No open claims ✓
              </div>
            )}
          </div>

          {/* Client tiers */}
          <div style={panelStyle}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 400, color: '#F5ECD7', margin: '0 0 16px' }}>
              Client tiers
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {['platinum', 'gold', 'silver', 'bronze'].map(tier => (
                <div key={tier} style={{ background: '#120A06', border: `1px solid ${TIER_COLORS[tier]}33`, borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: TIER_COLORS[tier], textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{tier}</div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, color: '#F5ECD7', fontWeight: 300 }}>
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
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 400, color: '#F5ECD7', margin: '0 0 16px' }}>
            Top clients
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {metrics.topClients.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#120A06', borderRadius: 8, border: '1px solid #2E1A0E' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#C9B99A', width: 16 }}>{i + 1}</span>
                  <div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#F5ECD7', fontWeight: 500 }}>{c.name}</div>
                    {c.company && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#C9B99A' }}>{c.company}</div>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#C8813A' }}>${c.totalPremium.toLocaleString()}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#C9B99A' }}>{c.policyCount} {c.policyCount === 1 ? 'policy' : 'policies'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insurer breakdown */}
        <div style={panelStyle}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 400, color: '#F5ECD7', margin: '0 0 16px' }}>
            By insurer
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(metrics.insurerBreakdown)
              .sort(([, a], [, b]) => b.premium - a.premium)
              .map(([insurer, data]) => {
                const maxPremium = Math.max(...Object.values(metrics.insurerBreakdown).map(d => d.premium))
                const pct = maxPremium > 0 ? (data.premium / maxPremium) * 100 : 0
                return (
                  <div key={insurer} style={{ padding: '10px 12px', background: '#120A06', borderRadius: 8, border: '1px solid #2E1A0E' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#F5ECD7' }}>{insurer}</span>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#C8813A' }}>${data.premium.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 4, background: '#2E1A0E', borderRadius: 2 }}>
                      <div style={{ height: '100%', borderRadius: 2, background: '#C8813A', width: `${pct}%` }} />
                    </div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#C9B99A', marginTop: 4 }}>
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
