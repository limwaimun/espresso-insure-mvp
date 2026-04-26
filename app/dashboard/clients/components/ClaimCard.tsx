// ClaimCard — display a claim with collapsible details section.
//
// B60 redesign:
// - Removes the card-level Status dropdown (status changes go through
//   EditClaimModal where denial_reason can be captured properly when
//   transitioning to denied).
// - Status now displayed as a read-only color-coded pill.
// - Priority dropdown stays — it's a quick inline action with no
//   workflow gap.
// - Adds "Details" expand toggle revealing three sections (Context /
//   Money / Lifecycle) with the new B57 schema fields, mirroring
//   PolicyRow's B56 layout pattern. Plus optional Denial Reason and
//   Status History sections.
// - Fixes stale-state bug: localPriority now syncs from the claim
//   prop on every parent re-render (useEffect).

'use client'

import { useState, useRef, useEffect } from 'react'
import PortalMenu from '@/components/PortalMenu'
import DocList from '@/components/DocList'
import { KV } from '@/components/HoldingsDisplayPrimitives'
import { formatDate } from '@/lib/dates'
import { MoreVertical, Bot, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import type { Alert } from '@/lib/types'

// Re-exports: keep ClientDetailPage's existing `import { Alert } from './ClaimCard'`
// working during the unification transition.
export type { Alert } from '@/lib/types'

// Local extension type for new schema fields — until lib/types.ts gets
// a proper Claim interface.
type ClaimRow = Alert & {
  claim_type?: string
  policy_id?: string | null
  estimated_amount?: string | number | null
  approved_amount?: string | number | null
  deductible_amount?: string | number | null
  incident_date?: string | null
  filed_date?: string | null
  insurer_claim_ref?: string | null
  insurer_handler_name?: string | null
  insurer_handler_contact?: string | null
  denial_reason?: string | null
  approved_at?: string | null
  denied_at?: string | null
  paid_at?: string | null
  closed_at?: string | null
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  approved: 'Approved',
  denied: 'Denied',
  paid: 'Paid',
}

function statusColor(status: string): { bg: string; text: string } {
  if (status === 'paid' || status === 'approved') return { bg: '#E5F0EB', text: '#0F6E56' }
  if (status === 'denied') return { bg: '#F8E0E0', text: '#A32D2D' }
  if (status === 'in_progress') return { bg: '#E0EAF5', text: '#4A9EBF' }
  return { bg: '#FBF7EE', text: '#854F0B' }  // open
}

function fmtMoney(v: string | number | null | undefined): string {
  if (v == null || v === '') return '—'
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (isNaN(n)) return '—'
  return `SGD ${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function daysBetween(later: string | Date, earlier: string | Date): number {
  const a = new Date(later).getTime()
  const b = new Date(earlier).getTime()
  return Math.floor((a - b) / 86400000)
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ClaimCard({ claim, ifaId, onEdit, onAskMaya, onDelete, cardRefreshKey }: {
  claim: Alert
  ifaId: string
  onEdit: (claim: Alert) => void
  onAskMaya: (c: Alert, action: 'status_update' | 'message_insurer' | 'message_client') => void
  onDelete: (id: string) => void
  cardRefreshKey: number
}) {
  const c = claim as ClaimRow

  const [bodyExpanded, setBodyExpanded] = useState(false)
  const [detailsExpanded, setDetailsExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLButtonElement>(null)

  const [localPriority, setLocalPriority] = useState(c.priority || 'medium')

  // Sync localPriority from prop when parent re-renders (e.g., after
  // router.refresh()). Without this, the dropdown shows stale value
  // until full page reload.
  useEffect(() => {
    setLocalPriority(c.priority || 'medium')
  }, [c.priority])

  const status = c.status || 'open'
  const { bg: statusBg, text: statusFg } = statusColor(status)

  const claimDate = c.created_at
    ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  const TRUNCATE = 150
  const bodyText = c.body || ''
  const isTruncated = bodyText.length > TRUNCATE

  async function saveToServer(patch: Record<string, unknown>) {
    fetch('/api/claim-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claimId: c.id, ifaId, ...patch }),
    }).catch(err => console.error('[claim-update] failed:', err))
  }

  function handlePriorityChange(priority: string) {
    setLocalPriority(priority)
    saveToServer({ priority })
  }

  // Derived values for the expanded sections
  const netPayout = (() => {
    const a = c.approved_amount
    const d = c.deductible_amount
    if (a == null || a === '') return null
    const aN = typeof a === 'string' ? parseFloat(a) : a
    if (isNaN(aN)) return null
    const dN = d == null || d === '' ? 0 : (typeof d === 'string' ? parseFloat(d) : d)
    return aN - (isNaN(dN) ? 0 : dN)
  })()

  const daysOpen = c.filed_date ? daysBetween(new Date(), c.filed_date) : null
  const daysToResolve = (c.filed_date && c.paid_at) ? daysBetween(c.paid_at, c.filed_date) : null

  const timestampRows = [
    { label: 'Approved', value: c.approved_at },
    { label: 'Denied', value: c.denied_at },
    { label: 'Paid', value: c.paid_at },
    { label: 'Closed', value: c.closed_at },
  ].filter(r => r.value)

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: 10,
    color: '#9B9088',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    fontWeight: 500,
    marginBottom: 12,
  }
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px 24px',
  }

  return (
    <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '14px 16px' }}>

      {/* Top bar: date · status pill · ⋮ menu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#6B6460' }}>{claimDate}</span>
          <span style={{
            fontSize: 10,
            fontFamily: 'DM Sans, sans-serif',
            background: statusBg,
            color: statusFg,
            padding: '2px 8px',
            borderRadius: 10,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {STATUS_LABELS[status] ?? status}
          </span>
        </div>
        <button ref={menuRef as React.RefObject<HTMLButtonElement>} onClick={() => setMenuOpen(o => !o)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, opacity: 0.5, display: 'flex', alignItems: 'center' }} title="Actions">
          <MoreVertical size={14} color="#6B6460" />
        </button>
        <PortalMenu
          anchorRef={menuRef as React.RefObject<HTMLElement>}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          items={[
            { icon: <Bot size={12} color="#BA7517" />, label: 'Draft status update', onClick: () => onAskMaya(claim, 'status_update'), accent: true },
            { icon: <Bot size={12} color="#BA7517" />, label: 'Draft message to insurer', onClick: () => onAskMaya(claim, 'message_insurer'), accent: true },
            { icon: <Bot size={12} color="#BA7517" />, label: 'Draft message to client', onClick: () => onAskMaya(claim, 'message_client'), accent: true },
            { icon: <Pencil size={12} color="#6B6460" />, label: 'Edit claim', onClick: () => onEdit(claim), dividerBefore: true },
            { icon: <Trash2 size={12} />, label: 'Delete claim', onClick: () => onDelete(c.id), danger: true, dividerBefore: true },
          ]}
        />
      </div>

      {/* Title + body (with truncation) */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', fontWeight: 500, marginBottom: 4 }}>
          {c.title || 'Untitled claim'}
        </div>
        {bodyText && (
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460', lineHeight: 1.6 }}>
            {bodyExpanded || !isTruncated ? bodyText : bodyText.slice(0, TRUNCATE) + '…'}
            {isTruncated && (
              <button onClick={() => setBodyExpanded(v => !v)}
                style={{ background: 'transparent', border: 'none', color: '#BA7517', fontSize: 11, cursor: 'pointer', padding: '0 4px', fontFamily: 'DM Sans, sans-serif' }}>
                {bodyExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Documents — read-only; manage via Edit modal */}
      <DocList
        key={`claim-doc-${c.id}-${cardRefreshKey}`}
        parentId={c.id}
        apiEndpoint="/api/claim-doc"
        parentParam="claimId"
        label="Documents"
      />

      {/* Priority dropdown only (status moved to Edit modal) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#6B6460' }}>Priority:</span>
          <select
            value={localPriority}
            onChange={e => handlePriorityChange(e.target.value)}
            style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 11,
              background: '#F7F4F0', border: '0.5px solid #E8E2DA', borderRadius: 5,
              padding: '4px 8px', cursor: 'pointer', outline: 'none',
              color: localPriority === 'high' ? '#A32D2D' : localPriority === 'medium' ? '#854F0B' : '#6B6460',
            }}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Details toggle + expanded section */}
      <div style={{ borderTop: '0.5px solid #F1EFE8', paddingTop: 12, marginTop: 12 }}>
        <button
          type="button"
          onClick={() => setDetailsExpanded(s => !s)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: '#6B6460',
            fontFamily: 'inherit',
          }}
        >
          {detailsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {detailsExpanded ? 'Hide details' : 'Details'}
        </button>

        {detailsExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 16 }}>

            {/* CONTEXT */}
            <div>
              <div style={sectionHeaderStyle}>Context</div>
              <div style={gridStyle}>
                <KV label="Type" value={c.claim_type || '—'} />
                <KV label="Policy ID" value={c.policy_id ? c.policy_id.slice(0, 8) + '…' : '—'} />
                <KV label="Insurer ref" value={c.insurer_claim_ref || '—'} />
                <KV label="Handler" value={c.insurer_handler_name || '—'} />
              </div>
            </div>

            {/* MONEY */}
            <div>
              <div style={sectionHeaderStyle}>Money</div>
              <div style={gridStyle}>
                <KV label="Estimated" value={fmtMoney(c.estimated_amount)} />
                <KV label="Approved" value={fmtMoney(c.approved_amount)} />
                <KV label="Deductible" value={fmtMoney(c.deductible_amount)} />
                <KV label="Net payout" value={netPayout != null ? fmtMoney(netPayout) : '—'} />
              </div>
            </div>

            {/* LIFECYCLE */}
            <div>
              <div style={sectionHeaderStyle}>Lifecycle</div>
              <div style={gridStyle}>
                <KV label="Incident date" value={c.incident_date ? formatDate(c.incident_date) : '—'} />
                <KV label="Filed date" value={c.filed_date ? formatDate(c.filed_date) : '—'} />
                <KV label="Days open" value={daysOpen != null ? `${daysOpen} days` : '—'} />
                <KV label="Days to resolve" value={daysToResolve != null ? `${daysToResolve} days` : '—'} />
              </div>
            </div>

            {/* DENIAL REASON — only if status='denied' AND reason is set */}
            {status === 'denied' && c.denial_reason && (
              <div>
                <div style={sectionHeaderStyle}>Denial reason</div>
                <div style={{ fontSize: 13, color: '#6B6460', lineHeight: 1.6 }}>
                  {c.denial_reason}
                </div>
              </div>
            )}

            {/* STATUS HISTORY — only if any timestamps set */}
            {timestampRows.length > 0 && (
              <div>
                <div style={sectionHeaderStyle}>Status history</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {timestampRows.map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B6460' }}>
                      <span>{r.label}</span>
                      <span style={{ fontFamily: 'DM Mono, monospace' }}>{formatDate(r.value!)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
