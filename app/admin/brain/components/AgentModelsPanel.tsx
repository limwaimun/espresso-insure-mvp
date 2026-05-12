'use client'

import { useEffect, useState } from 'react'

type AgentModelEntry = { agent: string; model: string }

export default function AgentModelsPanel() {
  const [models, setModels] = useState<AgentModelEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/agent-models')
      .then(r => r.json())
      .then(data => {
        setModels(data.models || [])
        setLoading(false)
      })
      .catch(e => {
        setError(e?.message || 'Failed to load')
        setLoading(false)
      })
  }, [])

  return (
    <section
      style={{
        background: '#FFFFFF',
        border: '1px solid #E8E2DA',
        borderRadius: 10,
        padding: '18px 22px',
        marginBottom: 20,
      }}
    >
      <div
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 11,
          color: '#9B9088',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 14,
        }}
      >
        Agent Models
      </div>

      {loading && (
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460' }}>Loading…</div>
      )}

      {!loading && error && (
        <div
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            color: '#A32D2D',
            background: '#FCEBEB',
            border: '1px solid #F7C1C1',
            padding: '10px 12px',
            borderRadius: 6,
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {models.map(({ agent, model }) => (
            <div
              key={agent}
              style={{
                background: '#FBFAF7',
                border: '1px solid #E8E2DA',
                borderRadius: 8,
                padding: '8px 14px',
                minWidth: 140,
              }}
            >
              <div
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 12,
                  color: '#1A1410',
                  fontWeight: 500,
                  textTransform: 'capitalize',
                  marginBottom: 3,
                }}
              >
                {agent}
              </div>
              <div
                style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: 11,
                  color: '#6B6460',
                  wordBreak: 'break-all',
                }}
              >
                {model}
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 11,
          color: '#9B9088',
          marginTop: 10,
        }}
      >
        To change a model, set the <code style={{ fontFamily: 'DM Mono, monospace', background: '#F0EDE8', padding: '1px 4px', borderRadius: 3 }}>AGENT_MODEL_&lt;NAME&gt;</code> env var and redeploy.
      </div>
    </section>
  )
}
