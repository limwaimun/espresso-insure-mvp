'use client'

import { useState } from 'react'

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

export default function AdminAgentsPage() {
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, string>>({})

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
    <div style={{ padding: '32px 40px', maxWidth: 1000 }}>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 400, color: '#F5ECD7', margin: '0 0 8px' }}>
        Agent fleet
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#C9B99A', margin: '0 0 28px' }}>
        {AGENTS.filter(a => a.status === 'live').length} of {AGENTS.length} agents live
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {AGENTS.map(agent => (
          <div key={agent.name} style={{ background: '#1C0F0A', border: '1px solid #2E1A0E', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#F5ECD7' }}>{agent.name}</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#C9B99A' }}>{agent.version}</span>
                  <span style={{
                    fontSize: 9, padding: '2px 8px', borderRadius: 100,
                    fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase',
                    background: agent.status === 'live' ? 'rgba(90,184,122,0.15)' : 'rgba(212,160,48,0.15)',
                    color: agent.status === 'live' ? '#5AB87A' : '#D4A030',
                    border: `1px solid ${agent.status === 'live' ? '#2E5A3A' : '#4A3A10'}`,
                  }}>
                    {agent.status === 'live' ? 'Live' : 'Pending Meta'}
                  </span>
                  {testResult[agent.name] && (
                    <span style={{ fontSize: 10, color: testResult[agent.name] === 'reachable' ? '#5AB87A' : '#D06060', fontFamily: 'DM Sans, sans-serif' }}>
                      {testResult[agent.name] === 'reachable' ? '✓ Reachable' : '✗ ' + testResult[agent.name]}
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#C9B99A', marginBottom: 4 }}>{agent.role}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B5444', lineHeight: 1.5 }}>{agent.description}</div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#3D2215', marginTop: 8 }}>{agent.route}</div>
              </div>
              <button
                onClick={() => pingAgent(agent.route, agent.name)}
                disabled={testing === agent.name}
                style={{ background: 'transparent', border: '1px solid #2E1A0E', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#C9B99A', flexShrink: 0, marginLeft: 16 }}>
                {testing === agent.name ? 'Pinging…' : 'Ping'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
