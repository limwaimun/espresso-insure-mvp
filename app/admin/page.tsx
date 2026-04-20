'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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

  const panelStyle = {
    background: '#1C0F0A',
    border: '1px solid #2E1A0E',
    borderRadius: 12,
    padding: 24,
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100 }}>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 400, color: '#F5ECD7', margin: '0 0 8px' }}>
        Admin Overview
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#C9B99A', margin: '0 0 28px' }}>
        espresso. system status
      </p>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Registered FAs', value: loading ? '…' : stats.totalFAs },
          { label: 'Total clients', value: loading ? '…' : stats.totalClients },
          { label: 'Total policies', value: loading ? '…' : stats.totalPolicies },
        ].map(k => (
          <div key={k.label} style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: 10, padding: '20px 24px' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#C9B99A', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: '#F5ECD7' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Agent status */}
      <div style={{ ...panelStyle, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 400, color: '#F5ECD7', margin: 0 }}>
            Agent fleet
          </h2>
          <Link href="/admin/agents" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#C8813A', textDecoration: 'none' }}>
            View all →
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {AGENTS.map(agent => (
            <div key={agent.name} style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#F5ECD7', fontWeight: 500 }}>{agent.name}</span>
                <span style={{
                  fontSize: 9, padding: '2px 6px', borderRadius: 100,
                  fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase' as const,
                  background: agent.status === 'live' ? 'rgba(90,184,122,0.15)' : 'rgba(200,129,58,0.15)',
                  color: agent.status === 'live' ? '#5AB87A' : '#D4A030',
                  border: `1px solid ${agent.status === 'live' ? '#2E5A3A' : '#3D2215'}`,
                }}>
                  {agent.status === 'live' ? 'Live' : 'Pending'}
                </span>
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#C9B99A' }}>{agent.role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent FA signups */}
      <div style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 400, color: '#F5ECD7', margin: 0 }}>
            FA accounts
          </h2>
          <Link href="/admin/accounts" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#C8813A', textDecoration: 'none' }}>
            View all →
          </Link>
        </div>
        {loading ? (
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#C9B99A' }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentFAs.map(fa => (
              <div key={fa.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#120A06', borderRadius: 8, border: '1px solid #2E1A0E' }}>
                <div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#F5ECD7', fontWeight: 500 }}>{fa.name || 'Unnamed'}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#C9B99A' }}>{fa.company || 'No company'}</div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, fontFamily: 'DM Sans, sans-serif', textTransform: 'capitalize' as const, background: 'rgba(200,129,58,0.1)', color: '#C8813A', border: '1px solid #3D2215' }}>
                    {fa.plan || 'trial'}
                  </span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#C9B99A' }}>
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
