'use client'

/**
 * B-pe-4 — BriefModal
 *
 * Modal for viewing the cached policy brief and triggering manual
 * parse / re-parse. Admin-only by virtue of the underlying API
 * endpoints; the modal trusts the API to enforce auth.
 *
 * Self-contained (does not use components/Modal) because Modal is
 * fixed at 500px width and the brief markdown reads better at ~720px.
 * Visual tokens (border colors, radius, padding) mirror Modal.tsx
 * exactly so it doesn't look out of place.
 *
 * Conditionally rendered by parent — no isOpen prop, just don't render
 * the component when you don't want it shown (matches Modal.tsx pattern).
 */

import { useEffect, useState } from 'react'
import { X, RefreshCw, AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react'

type ParseStatus = 'pending' | 'parsing' | 'done' | 'failed' | 'stale'

interface BriefData {
  ok: true
  policy_id: string
  parse_status: ParseStatus
  schema_version: number | null
  brief: string | null
  summary: Record<string, unknown> | null
  model: string | null
  parsed_at: string | null
  cost_usd: number | null
  input_tokens: number | null
  output_tokens: number | null
  last_error: string | null
  attempt_count: number | null
}

interface Props {
  onClose: () => void
  policyId: string
  policyLabel: string
}

function statusPill(status: ParseStatus): { bg: string; text: string; icon: React.ReactNode; label: string } {
  switch (status) {
    case 'done':
      return { bg: 'rgba(58, 138, 91, 0.10)', text: '#3A8A5B', icon: <CheckCircle2 size={11} />, label: 'Brief ready' }
    case 'parsing':
      return { bg: 'rgba(186, 117, 23, 0.10)', text: '#BA7517', icon: <Loader2 size={11} className="brief-spin" />, label: 'Parsing…' }
    case 'failed':
      return { bg: 'rgba(193, 80, 80, 0.10)', text: '#C15050', icon: <AlertCircle size={11} />, label: 'Parse failed' }
    case 'stale':
      return { bg: 'rgba(155, 144, 136, 0.15)', text: '#6B6460', icon: <Clock size={11} />, label: 'Stale (re-parse pending)' }
    case 'pending':
    default:
      return { bg: 'rgba(155, 144, 136, 0.10)', text: '#9B9088', icon: <Clock size={11} />, label: 'Not yet parsed' }
  }
}

export default function BriefModal({ onClose, policyId, policyLabel }: Props) {
  const [data, setData] = useState<BriefData | null>(null)
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/policy-parse/brief?policy_id=${encodeURIComponent(policyId)}`)
        const json = await res.json()
        if (cancelled) return
        if (!res.ok || !json.ok) {
          setError(json.error || `HTTP ${res.status}`)
          setData(null)
        } else {
          setData(json as BriefData)
        }
      } catch (e) {
        if (cancelled) return
        setError((e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [policyId])

  async function triggerParse(force: boolean) {
    setParsing(true)
    setError(null)
    try {
      const res = await fetch('/api/policy-parse/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy_id: policyId, force }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setError(json.error || `HTTP ${res.status}`)
      } else {
        const refresh = await fetch(`/api/policy-parse/brief?policy_id=${encodeURIComponent(policyId)}`)
        const refreshJson = await refresh.json()
        if (refresh.ok && refreshJson.ok) setData(refreshJson as BriefData)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setParsing(false)
    }
  }

  const status: ParseStatus = data?.parse_status ?? 'pending'
  const pill = statusPill(status)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <style jsx>{`
        @keyframes brief-spin { to { transform: rotate(360deg) } }
        :global(.brief-spin) { animation: brief-spin 1s linear infinite; }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFFFFF', border: '0.5px solid #E8E2DA',
          borderRadius: 14, padding: 28,
          width: 720, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, color: '#1A1410' }}>Policy brief</span>
            <div style={{ fontSize: 12, color: '#9B9088', marginTop: 4 }}>{policyLabel}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
            aria-label="Close"
          >
            <X size={18} color="#6B6460" />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{
            background: pill.bg, color: pill.text,
            fontSize: 11, fontWeight: 500, padding: '4px 10px',
            borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap',
          }}>
            {pill.icon}
            {pill.label}
          </span>

          {data?.parsed_at && (
            <span style={{ fontSize: 11, color: '#9B9088' }}>
              Parsed {new Date(data.parsed_at).toLocaleString()}
            </span>
          )}
          {data?.model && (
            <span style={{ fontSize: 11, color: '#9B9088', fontFamily: 'DM Mono, monospace' }}>
              {data.model}
            </span>
          )}
          {data?.cost_usd != null && (
            <span style={{ fontSize: 11, color: '#9B9088' }}>
              ${Number(data.cost_usd).toFixed(4)} · {data.input_tokens}+{data.output_tokens} toks
            </span>
          )}
        </div>

        {error && (
          <div style={{
            background: 'rgba(193, 80, 80, 0.06)',
            border: '1px solid rgba(193, 80, 80, 0.2)',
            color: '#A03838', padding: '10px 12px', borderRadius: 6,
            fontSize: 12, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {data?.last_error && status === 'failed' && (
          <div style={{
            background: 'rgba(193, 80, 80, 0.06)',
            border: '1px solid rgba(193, 80, 80, 0.2)',
            color: '#A03838', padding: '10px 12px', borderRadius: 6,
            fontSize: 12, marginBottom: 16,
            fontFamily: 'DM Mono, monospace',
          }}>
            <strong>Last error:</strong> {data.last_error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => triggerParse(false)}
            disabled={parsing || loading || status === 'parsing'}
            style={{
              fontSize: 12, padding: '6px 12px', borderRadius: 6,
              border: '1px solid #E8E2DA', background: '#FFFFFF', color: '#1A1410',
              cursor: (parsing || loading || status === 'parsing') ? 'not-allowed' : 'pointer',
              opacity: (parsing || loading || status === 'parsing') ? 0.5 : 1,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            <RefreshCw size={11} className={parsing ? 'brief-spin' : undefined} />
            {parsing ? 'Parsing…' : 'Parse'}
          </button>

          {status === 'done' && (
            <button
              onClick={() => triggerParse(true)}
              disabled={parsing}
              style={{
                fontSize: 12, padding: '6px 12px', borderRadius: 6,
                border: '1px solid #E8E2DA', background: 'transparent', color: '#6B6460',
                cursor: parsing ? 'not-allowed' : 'pointer',
                opacity: parsing ? 0.5 : 1,
              }}
            >
              Force re-parse
            </button>
          )}
        </div>

        {loading && !data && (
          <div style={{ padding: 24, textAlign: 'center', color: '#9B9088', fontSize: 12 }}>
            Loading brief…
          </div>
        )}

        {data?.brief && (
          <div style={{
            background: '#FBFAF7', border: '1px solid #F1EFE8',
            borderRadius: 6, padding: '16px 20px',
            maxHeight: '50vh', overflowY: 'auto',
          }}>
            <pre style={{
              fontFamily: 'DM Sans, system-ui, sans-serif',
              fontSize: 13, lineHeight: 1.6, color: '#1A1410',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
            }}>
              {data.brief}
            </pre>
          </div>
        )}

        {data && !data.brief && status !== 'parsing' && (
          <div style={{
            padding: 24, textAlign: 'center', color: '#9B9088', fontSize: 12,
            background: '#FBFAF7', border: '1px solid #F1EFE8', borderRadius: 6,
          }}>
            No brief yet. Click <strong>Parse</strong> above to generate one.
          </div>
        )}
      </div>
    </div>
  )
}
