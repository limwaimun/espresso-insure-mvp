'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface BrainFlag {
  enabled: boolean
  last_toggled_by: string | null
  last_toggled_at: string | null
  last_toggle_reason: string | null
}

interface Props {
  initial: BrainFlag | null
}

export default function BrainKillSwitch({ initial }: Props) {
  const router = useRouter()
  const [flag, setFlag] = useState<BrainFlag | null>(initial)
  const [busy, setBusy] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Default to enabled if no row exists (migration not run yet, or table empty).
  const isEnabled = flag?.enabled !== false
  const targetState = !isEnabled

  async function handleToggle() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/brain/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: targetState,
          reason: reason.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to toggle')
        return
      }
      setFlag(json.flag)
      setShowConfirm(false)
      setReason('')
      router.refresh()
    } catch (e: any) {
      setError(e?.message ?? 'Network error')
    } finally {
      setBusy(false)
    }
  }

  const accent = isEnabled ? '#2A7A4F' : '#A32D2D'
  const bgAccent = isEnabled ? '#EAF4EE' : '#FCEBEB'
  const borderAccent = isEnabled ? '#C8E2D2' : '#F7C1C1'
  const buttonBg = isEnabled ? '#A32D2D' : '#2A7A4F'
  const buttonLabel = isEnabled ? 'Pause Brain' : 'Resume Brain'

  return (
    <div
      style={{
        background: bgAccent,
        border: `1px solid ${borderAccent}`,
        borderRadius: 8,
        padding: '18px 22px',
        marginBottom: 20,
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                background: accent,
                boxShadow: isEnabled ? `0 0 8px ${accent}` : 'none',
              }}
            />
            <div style={{ fontSize: 11, color: '#9B9088', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Brain status
            </div>
          </div>
          <div
            style={{
              fontSize: 20,
              fontFamily: 'Cormorant Garamond, serif',
              color: '#1A1410',
              fontWeight: 500,
              lineHeight: 1.2,
            }}
          >
            {isEnabled
              ? 'Running — next tick fires at :15 SGT'
              : 'Paused — no ticks will fire'}
          </div>
          {flag?.last_toggled_at && (
            <div style={{ fontSize: 12, color: '#6B6460', marginTop: 4 }}>
              Last changed{' '}
              {new Date(flag.last_toggled_at).toLocaleString('en-SG', {
                timeZone: 'Asia/Singapore',
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
              {flag.last_toggle_reason ? ` · ${flag.last_toggle_reason}` : ''}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={busy}
          style={{
            background: buttonBg,
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 500,
            cursor: busy ? 'wait' : 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            opacity: busy ? 0.6 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {buttonLabel}
        </button>
      </div>

      {showConfirm && (
        <div
          style={{
            marginTop: 18,
            padding: '16px 18px',
            background: '#fff',
            border: `1px solid ${borderAccent}`,
            borderRadius: 6,
          }}
        >
          <div style={{ fontSize: 13, color: '#1A1410', marginBottom: 10, lineHeight: 1.5 }}>
            {targetState
              ? 'Resume Brain? The next scheduled tick will run normally.'
              : 'Pause Brain? Scheduled ticks will be skipped (logged as tick_skipped_brain_paused). In-flight work orders are unaffected — only future proposals stop.'}
          </div>
          <input
            type="text"
            placeholder="Reason (optional, e.g. 'investigating duplicate proposals')"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: 13,
              border: '1px solid #D8D2CC',
              borderRadius: 4,
              fontFamily: 'DM Sans, sans-serif',
              marginBottom: 12,
              boxSizing: 'border-box',
            }}
          />
          {error && (
            <div style={{ fontSize: 12, color: '#A32D2D', marginBottom: 10 }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleToggle}
              disabled={busy}
              style={{
                background: buttonBg,
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                padding: '8px 16px',
                fontSize: 13,
                cursor: busy ? 'wait' : 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                opacity: busy ? 0.6 : 1,
              }}
            >
              {busy ? 'Working…' : `Confirm ${targetState ? 'resume' : 'pause'}`}
            </button>
            <button
              onClick={() => {
                setShowConfirm(false)
                setReason('')
                setError(null)
              }}
              disabled={busy}
              style={{
                background: 'transparent',
                color: '#6B6460',
                border: '1px solid #D8D2CC',
                borderRadius: 4,
                padding: '8px 16px',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
