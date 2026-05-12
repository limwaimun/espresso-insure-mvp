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
import { X, RefreshCw, AlertCircle, CheckCircle2, Clock, Loader2, Coffee, Check, Circle } from 'lucide-react'

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
  /**
   * B-pe-18e: when true, render admin-only debug info
   * (model name, token counts, cost). FA-facing views pass false or omit.
   */
  isAdmin?: boolean
}

// B-pe-18c — per-layer parse status (from /api/policy-parse/status)
type UnifiedStatus = 'pending' | 'running' | 'done' | 'failed'
interface LayerStatus {
  status: UnifiedStatus
  started_at: string | null
  completed_at: string | null
  error: string | null
}
interface ParseStatusResponse {
  ok: true
  policy_id: string
  brief: LayerStatus
  sections: LayerStatus
  chunks: LayerStatus
  overall: UnifiedStatus
}

function layerSubtext(l: LayerStatus, now: number): string {
  if (l.status === 'done' && l.started_at && l.completed_at) {
    const ms = +new Date(l.completed_at) - +new Date(l.started_at)
    return ms > 0 ? `${Math.round(ms / 1000)}s` : 'complete'
  }
  if (l.status === 'done') return 'complete'
  if (l.status === 'running' && l.started_at) {
    const elapsed = Math.max(0, Math.round((now - +new Date(l.started_at)) / 1000))
    return `${elapsed}s elapsed…`
  }
  if (l.status === 'running') return 'running…'
  if (l.status === 'failed') return 'failed'
  return 'waiting'
}

function layerIcon(status: UnifiedStatus): { icon: React.ReactNode; color: string } {
  switch (status) {
    case 'done':
      return { icon: <Check size={14} />, color: '#3A8A5B' }
    case 'running':
      return { icon: <Loader2 size={14} className="brief-spin" />, color: '#BA7517' }
    case 'failed':
      return { icon: <AlertCircle size={14} />, color: '#C15050' }
    case 'pending':
    default:
      return { icon: <Circle size={14} />, color: '#9B9088' }
  }
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

export default function BriefModal({ onClose, policyId, policyLabel, isAdmin = false }: Props) {
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

  // B-pe-18c — poll /api/policy-parse/status for per-layer state
  const [parseStatus, setParseStatus] = useState<ParseStatusResponse | null>(null)
  const [nowTick, setNowTick] = useState<number>(() => Date.now())

  // B-pe-18d — retry state for the failure-recovery button
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)
  const [retryMessage, setRetryMessage] = useState<string | null>(null)

  async function triggerRetry() {
    setRetrying(true)
    setRetryError(null)
    setRetryMessage(null)
    try {
      const res = await fetch('/api/policy-parse/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy_id: policyId }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setRetryError((json.error || `HTTP ${res.status}`).slice(0, 200))
      } else {
        setRetryMessage(json.message || 'Retry started.')
      }
    } catch (e) {
      setRetryError((e as Error).message.slice(0, 200))
    } finally {
      setRetrying(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    let interval: ReturnType<typeof setInterval> | null = null
    let inFlight: AbortController | null = null

    async function fetchOnce() {
      if (cancelled) return
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      inFlight?.abort()
      const ctl = new AbortController()
      inFlight = ctl
      try {
        const res = await fetch(
          `/api/policy-parse/status?policy_id=${encodeURIComponent(policyId)}`,
          { signal: ctl.signal },
        )
        if (cancelled) return
        if (!res.ok) return
        const json = (await res.json()) as ParseStatusResponse | { ok: false }
        if (cancelled || !('ok' in json) || !json.ok) return
        setParseStatus(json)
        if (json.overall === 'done' || json.overall === 'failed') {
          if (interval) { clearInterval(interval); interval = null }
        }
      } catch {
        // network error / aborted — swallow; next tick will retry
      }
    }

    fetchOnce()
    interval = setInterval(fetchOnce, 3000)

    function onVis() {
      if (document.visibilityState === 'visible') fetchOnce()
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
      inFlight?.abort()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [policyId])

  // Tick once a second to drive elapsed-time labels while anything is running.
  useEffect(() => {
    if (!parseStatus) return
    if (parseStatus.overall !== 'running' && parseStatus.overall !== 'pending') return
    const t = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(t)
  }, [parseStatus])

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
          {isAdmin && data?.model && (
            <span style={{ fontSize: 11, color: '#9B9088', fontFamily: 'DM Mono, monospace' }}>
              {data.model}
            </span>
          )}
          {isAdmin && data?.cost_usd != null && (
            <span style={{ fontSize: 11, color: '#9B9088' }}>
              ${Number(data.cost_usd).toFixed(4)} · {data.input_tokens}+{data.output_tokens} toks
            </span>
          )}
        </div>

        {parseStatus && (
          <div style={{
            background: '#FBFAF7', border: '1px solid #F1EFE8', borderRadius: 8,
            padding: '14px 16px', marginBottom: 16,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 10, color: '#1A1410',
            }}>
              <Coffee size={14} color="#BA7517" />
              <span style={{ fontSize: 12, fontWeight: 500 }}>
                {parseStatus.overall === 'done'
                  ? 'All three layers complete'
                  : parseStatus.overall === 'failed'
                  ? 'One or more layers failed'
                  : 'Brewing your policy intelligence'}
              </span>
              {parseStatus.overall === 'done' && (
                <Check size={14} color="#3A8A5B" />
              )}
            </div>

            {parseStatus.overall !== 'done' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {([
                  ['Reading the policy', parseStatus.brief],
                  ['Mapping the document', parseStatus.sections],
                  ['Preparing for Maya', parseStatus.chunks],
                ] as Array<[string, LayerStatus]>).map(([label, l]) => {
                  const { icon, color } = layerIcon(l.status)
                  return (
                    <div key={label} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      fontSize: 12,
                    }}>
                      <span style={{ color, display: 'inline-flex' }}>{icon}</span>
                      <span style={{
                        color: l.status === 'pending' ? '#9B9088' : '#1A1410',
                        flex: 1,
                      }}>
                        {label}
                      </span>
                      <span style={{
                        color: '#9B9088', fontFamily: 'DM Mono, monospace',
                        fontSize: 11,
                      }}>
                        {layerSubtext(l, nowTick)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {parseStatus.overall === 'failed' && (
              <div style={{
                marginTop: 10,
                padding: '10px 12px',
                background: 'rgba(193, 80, 80, 0.06)',
                border: '1px solid rgba(193, 80, 80, 0.18)',
                borderRadius: 6,
                fontSize: 12,
                color: '#1A1410',
                lineHeight: 1.5,
              }}>
                <div style={{ marginBottom: 8 }}>
                  Some details may be incomplete. The basic policy info above is ready,
                  but Maya may not have full context.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={triggerRetry}
                    disabled={retrying}
                    style={{
                      fontSize: 12, padding: '6px 12px', borderRadius: 6,
                      border: '1px solid #E8E2DA', background: '#FFFFFF', color: '#1A1410',
                      cursor: retrying ? 'not-allowed' : 'pointer',
                      opacity: retrying ? 0.5 : 1,
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <RefreshCw size={11} className={retrying ? 'brief-spin' : undefined} />
                    {retrying ? 'Retrying…' : 'Retry'}
                  </button>
                  {retryMessage && (
                    <span style={{ fontSize: 11, color: '#3A8A5B' }}>{retryMessage}</span>
                  )}
                  {retryError && (
                    <span style={{ fontSize: 11, color: '#A03838' }}>{retryError}</span>
                  )}
                  {!retryMessage && !retryError && (
                    <span style={{ fontSize: 11, color: '#6B6460' }}>
                      Or this will refresh automatically on the next view.
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* B-pe-18e: admin sees raw layer errors; FAs see the friendly message above */}
            {isAdmin && (['brief', 'sections', 'chunks'] as const).map((k) => {
              const l = parseStatus[k]
              if (l.status !== 'failed' || !l.error) return null
              const layerName = k === 'brief'
                ? 'Reading the policy'
                : k === 'sections' ? 'Mapping the document' : 'Preparing for Maya'
              return (
                <div key={k} style={{
                  marginTop: 8,
                  fontSize: 11, color: '#A03838',
                  fontFamily: 'DM Mono, monospace',
                  wordBreak: 'break-word',
                }}>
                  <strong>{layerName}:</strong> {l.error}
                </div>
              )
            })}
          </div>
        )}

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
            {parsing ? 'Analyzing…' : 'Analyze policy'}
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
              Re-analyze
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
            No brief yet. Click <strong>Analyze policy</strong> above to generate one.
          </div>
        )}
      </div>
    </div>
  )
}
