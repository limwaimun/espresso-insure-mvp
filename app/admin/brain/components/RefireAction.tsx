'use client'

import { useState } from 'react'

type Result = {
  ok: boolean
  action?: 'reconciled' | 'redispatched'
  commit_sha?: string
  telegram_sent?: boolean
  message?: string
  error?: string
}

export default function RefireAction({ orderId, orderTitle, onSuccess }: { orderId: string; orderTitle: string; onSuccess?: (newStatus: 'dispatched' | 'done') => void }) {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  async function trigger() {
    setRunning(true)
    setResult(null)
    try {
      const res = await fetch('/api/brain/redispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setResult({ ok: false, error: json?.error || `HTTP ${res.status}` })
      } else {
        setResult(json as Result)
        if (json?.action === 'reconciled') onSuccess?.('done')
        else if (json?.action === 'redispatched') onSuccess?.('dispatched')
      }
    } catch (e: any) {
      setResult({ ok: false, error: e?.message || 'Network error' })
    } finally {
      setRunning(false)
    }
  }

  if (result?.ok && result.action === 'reconciled') {
    return (
      <div style={{ marginTop: 14, padding: '10px 12px', background: '#E1F5EE', border: '1px solid #9FE1CB', borderRadius: 6, fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#0F6E56' }}>
        ✓ Already shipped as <span style={{ fontFamily: 'DM Mono, monospace' }}>{result.commit_sha}</span> — marked done. Reload to refresh.
      </div>
    )
  }

  if (result?.ok && result.action === 'redispatched') {
    return (
      <div style={{ marginTop: 14, padding: '10px 12px', background: '#FAEEDA', border: '1px solid #FAC775', borderRadius: 6, fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#854F0B' }}>
        ↻ Redispatched. {result.telegram_sent ? 'Elon notified.' : 'Telegram failed — check logs.'} Reload to refresh.
      </div>
    )
  }

  if (result && !result.ok) {
    return (
      <div style={{ marginTop: 14, padding: '10px 12px', background: '#FCEBEB', border: '1px solid #F7C1C1', borderRadius: 6, fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#A32D2D' }}>
        ✗ {result.error}
      </div>
    )
  }

  return (
    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        type="button"
        onClick={trigger}
        disabled={running}
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 12,
          padding: '7px 14px',
          borderRadius: 6,
          border: 'none',
          cursor: running ? 'not-allowed' : 'pointer',
          background: running ? '#E8E2DA' : '#1A1410',
          color: running ? '#9B9088' : '#FFFFFF',
          fontWeight: 500,
        }}
      >
        {running ? 'Re-firing…' : '↻ Re-fire'}
      </button>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088' }}>
        Checks git first — if shipped, marks done. Otherwise re-dispatches to Elon.
      </div>
    </div>
  )
}
