'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const WORKSTREAMS = ['marketing', 'fa_app', 'admin_dashboard', 'agents', 'meta']

export interface ActiveDirective {
  id: string
  title: string
  description: string | null
  workstream: string
  expires_at: string
  created_at: string
  status: string
}

interface DirectivePanelProps {
  active: ActiveDirective | null
}

export default function DirectivePanel({ active }: DirectivePanelProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    workstream: WORKSTREAMS[0],
    duration_hours: 12,
  })

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/brain/directive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          workstream: form.workstream,
          duration_hours: form.duration_hours,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setError(json.error || 'failed to create directive')
        return
      }
      setForm({ title: '', description: '', workstream: WORKSTREAMS[0], duration_hours: 12 })
      router.refresh()
    } catch (e: any) {
      setError(e?.message || 'network error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEnd() {
    if (!confirm('End the active directive now?')) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/brain/directive/end', { method: 'POST' })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setError(json.error || 'failed to end directive')
        return
      }
      router.refresh()
    } catch (e: any) {
      setError(e?.message || 'network error')
    } finally {
      setSubmitting(false)
    }
  }

  // Active state: show card with title, workstream, countdown, End button.
  if (active) {
    const expires = new Date(active.expires_at)
    const hoursLeft = Math.max(0, (expires.getTime() - Date.now()) / 3600000)
    const hoursLeftText = hoursLeft < 1
      ? `${Math.round(hoursLeft * 60)} min`
      : `${hoursLeft.toFixed(1)} h`

    return (
      <div style={{
        background: '#FFFFFF', border: '1px solid #BA7517', borderRadius: 8,
        padding: '16px 20px', marginBottom: 24,
        fontFamily: 'DM Sans, sans-serif',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#BA7517', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, fontWeight: 500 }}>
              Active directive
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: '#1A1410', fontWeight: 500, marginBottom: 6, lineHeight: 1.2 }}>
              {active.title}
            </div>
            {active.description && (
              <div style={{ fontSize: 13, color: '#6B6460', marginBottom: 10, lineHeight: 1.5 }}>
                {active.description}
              </div>
            )}
            <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#6B6460' }}>
              <span>Workstream: <strong style={{ color: '#1A1410', fontFamily: 'DM Mono, monospace' }}>{active.workstream}</strong></span>
              <span>Expires in: <strong style={{ color: '#1A1410', fontFamily: 'DM Mono, monospace' }}>{hoursLeftText}</strong></span>
            </div>
          </div>
          <button
            onClick={handleEnd}
            disabled={submitting}
            style={{
              background: 'transparent', border: '1px solid #E8E2DA',
              borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#1A1410',
              cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif',
              opacity: submitting ? 0.5 : 1,
              flexShrink: 0,
            }}
          >
            End now
          </button>
        </div>
        {error && (
          <div style={{ marginTop: 10, padding: '8px 10px', background: '#FCEBEB', border: '1px solid #F7C1C1', color: '#A32D2D', borderRadius: 6, fontSize: 12 }}>
            {error}
          </div>
        )}
      </div>
    )
  }

  // No active directive: show set form.
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E8E2DA', borderRadius: 8,
      padding: '16px 20px', marginBottom: 24,
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <div style={{ fontSize: 11, color: '#9B9088', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 500 }}>
        Set directive
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 110px auto', gap: 10, alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#9B9088', marginBottom: 4 }}>Title</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="What should Brain focus on?"
            style={{
              width: '100%', padding: '8px 12px', border: '1px solid #E8E2DA',
              borderRadius: 8, fontSize: 13, background: '#FFFFFF', color: '#1A1410', outline: 'none',
              fontFamily: 'DM Sans, sans-serif',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#9B9088', marginBottom: 4 }}>Workstream</label>
          <select
            value={form.workstream}
            onChange={e => setForm(f => ({ ...f, workstream: e.target.value }))}
            style={{
              width: '100%', padding: '8px 12px', border: '1px solid #E8E2DA',
              borderRadius: 8, fontSize: 13, background: '#FFFFFF', color: '#1A1410', outline: 'none',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {WORKSTREAMS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#9B9088', marginBottom: 4 }}>Hours</label>
          <input
            type="number"
            min={1}
            max={168}
            value={form.duration_hours}
            onChange={e => setForm(f => ({ ...f, duration_hours: Number(e.target.value) }))}
            style={{
              width: '100%', padding: '8px 12px', border: '1px solid #E8E2DA',
              borderRadius: 8, fontSize: 13, background: '#FFFFFF', color: '#1A1410', outline: 'none',
              fontFamily: 'DM Sans, sans-serif',
            }}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || !form.title.trim()}
          style={{
            background: '#1A1410', color: '#FFFFFF', border: 'none',
            borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 500,
            cursor: (submitting || !form.title.trim()) ? 'not-allowed' : 'pointer',
            opacity: (submitting || !form.title.trim()) ? 0.5 : 1,
            fontFamily: 'DM Sans, sans-serif', height: 36,
          }}
        >
          {submitting ? 'Setting...' : 'Set'}
        </button>
      </div>

      <div style={{ marginTop: 10 }}>
        <label style={{ display: 'block', fontSize: 11, color: '#9B9088', marginBottom: 4 }}>Description (optional)</label>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Why this focus, what success looks like..."
          rows={2}
          style={{
            width: '100%', padding: '8px 12px', border: '1px solid #E8E2DA',
            borderRadius: 8, fontSize: 13, background: '#FFFFFF', color: '#1A1410', outline: 'none',
            fontFamily: 'DM Sans, sans-serif', resize: 'vertical',
          }}
        />
      </div>

      {error && (
        <div style={{ marginTop: 10, padding: '8px 10px', background: '#FCEBEB', border: '1px solid #F7C1C1', color: '#A32D2D', borderRadius: 6, fontSize: 12 }}>
          {error}
        </div>
      )}
    </div>
  )
}
