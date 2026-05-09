// ClaimCard — claim row, two-tr structure (collapsed + expanded).
//
// B61 redesign: converts from card-style <div> stack to <tr>-based
// table rows, mirroring HoldingRow/PolicyRow. Visual consistency
// across Investments / Policies / Claims tables on the client detail
// page.
//
// Structure:
//   <>
//     <tr onClick={toggle}>...6 cells...</tr>           // collapsed
//     {expanded && (<tr><td colSpan=6>sections</td></tr>)}  // expanded
//   </>
//
// B60's expanded section content (Context / Money / Lifecycle /
// optional Denial reason / optional Status history) is preserved
// verbatim — it lives inside the expanded <tr> now.
//
// Body (description) and Documents move into the expanded view since
// the collapsed row is now a table-style summary, not a card with
// always-visible body.

'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PortalMenu from '@/components/PortalMenu'
import DocList from '@/components/DocList'
import { KV } from '@/components/HoldingsDisplayPrimitives'
import { formatDate } from '@/lib/dates'
import { ChevronDown, ChevronRight, MoreVertical, Bot, Pencil, Trash2, User } from 'lucide-react'
import type { Alert } from '@/lib/types'
import {
  statusColor,
  fmtMoney,
  daysBetween,
  netPayout as netPayoutFn,
  freshLabelsForStatus,
  type Claim,
} from '@/lib/claims'

// Re-exports: keep ClientDetailPage's existing import paths working.
export type { Alert } from '@/lib/types'



const TRUNCATE_TITLE = 60  // body shows in expanded view; collapsed row only shows title

// ── Component ──────────────────────────────────────────────────────────────

export default function ClaimCard({ claim, faId, onEdit, onAskMaya, onDelete, cardRefreshKey, clientInfo }: {
  claim: Alert
  faId: string
  onEdit: (claim: Alert) => void
  onAskMaya: (c: Alert, action: 'status_update' | 'message_insurer' | 'message_client') => void
  onDelete: (id: string) => void
  cardRefreshKey: number
  /**
   * When provided, ClaimCard renders an additional Client column at the start
   * of the collapsed row and adds a "View client →" item to the kebab menu.
   * Used by the multi-client claims-list page; omitted on the per-client
   * detail page (where the client context is already known).
   */
  clientInfo?: { name: string; company: string | null; id: string }
}) {
  const c = claim as Claim

  const router = useRouter()

  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLButtonElement>(null)

  const [localPriority, setLocalPriority] = useState(c.priority || 'medium')
  const [localStatus, setLocalStatus] = useState(c.status || 'open')

  // Sync local state from props on parent re-render — fixes stale
  // dropdown values after router.refresh().
  useEffect(() => {
    setLocalPriority(c.priority || 'medium')
  }, [c.priority])
  useEffect(() => {
    setLocalStatus(c.status || 'open')
  }, [c.status])

  // Status used for both the row dropdown's value and the pill display
  // in the expanded view's status history. Driven by localStatus so the
  // dropdown reflects in-flight changes immediately.
  const status = localStatus
  const { bg: statusBg, text: statusFg } = statusColor(status)

  const claimDate = formatDate(c.filed_date || c.created_at)

  async function saveToServer(patch: Record<string, unknown>) {
    try {
      const res = await fetch('/api/claim-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId: c.id, faId, ...patch }),
      })
      if (res.ok) {
        // Re-fetch parent so EditClaimModal opens with current values
        // (fixes stale-state when FA card-edits then opens Edit modal).
        router.refresh()
      }
    } catch (err) {
      console.error('[claim-update] failed:', err)
    }
  }

  function handlePriorityChange(priority: string) {
    setLocalPriority(priority)
    saveToServer({ priority })
  }

  function handleStatusChange(status: string) {
    setLocalStatus(status)
    saveToServer({ status })
  }

  // Derived values for the expanded sections
  const netPayoutValue = netPayoutFn(c)

  const daysOpen = c.filed_date ? daysBetween(new Date(), c.filed_date) : null
  // Days to resolve = closed_at - filed_date (terminal: denied OR paid).
  const daysToResolve = (c.filed_date && c.closed_at) ? daysBetween(c.closed_at, c.filed_date) : null

  const freshLabels = freshLabelsForStatus(status)

  const timestampRows = [
    { label: 'Approved', value: c.approved_at },
    { label: 'Denied', value: c.denied_at },
    { label: 'Paid', value: c.paid_at },
    { label: 'Closed', value: c.closed_at },
  ].filter(r => r.value).map(r => ({ ...r, stale: !freshLabels.has(r.label) }))

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

  const titleText = c.title || 'Untitled claim'
  const titleDisplay = titleText.length > TRUNCATE_TITLE
    ? titleText.slice(0, TRUNCATE_TITLE) + '…'
    : titleText

  return (
    <>
      {/* Collapsed row — 6 cells (or 7 with clientInfo): [Client], Title, Type, Status, Priority, Date, ⋮ */}
      <tr onClick={() => setExpanded(e => !e)} style={{ cursor: 'pointer', borderBottom: expanded ? 'none' : '0.5px solid #F1EFE8' }}>
        {clientInfo && (
          <td style={{ padding: '12px 10px' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1410' }}>{clientInfo.name}</div>
            {clientInfo.company && (
              <div style={{ fontSize: 11, color: '#6B6460' }}>{clientInfo.company}</div>
            )}
          </td>
        )}
        <td style={{ padding: '12px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {expanded ? <ChevronDown size={12} color="#9B9088" /> : <ChevronRight size={12} color="#9B9088" />}
            <span style={{ fontSize: 13, fontWeight: 500, color: '#1A1410' }}>{titleDisplay}</span>
          </div>
        </td>
        <td style={{ padding: '12px 10px', fontSize: 12, color: '#6B6460' }}>
          {c.claim_type || '—'}
        </td>
        <td style={{ padding: '12px 10px' }} onClick={e => e.stopPropagation()}>
          <select
            value={localStatus}
            onChange={e => handleStatusChange(e.target.value)}
            style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 11,
              background: '#F7F4F0', border: '0.5px solid #E8E2DA', borderRadius: 5,
              padding: '4px 8px', cursor: 'pointer', outline: 'none',
              color: statusFg,
              fontWeight: 500,
            }}>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
            <option value="paid">Paid</option>
          </select>
        </td>
        <td style={{ padding: '12px 10px' }} onClick={e => e.stopPropagation()}>
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
        </td>
        <td style={{ padding: '12px 10px', fontSize: 13, color: '#1A1410' }}>
          {claimDate}
        </td>
        <td style={{ padding: '12px 10px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
          <button ref={menuRef as React.RefObject<HTMLButtonElement>} onClick={() => setMenuOpen(o => !o)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, opacity: 0.5, display: 'flex', alignItems: 'center', marginLeft: 'auto' }} title="Actions">
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
              ...(clientInfo ? [{
                icon: <User size={12} color="#6B6460" />,
                label: 'View client',
                onClick: () => router.push(`/dashboard/clients/${clientInfo.id}`),
                dividerBefore: true,
              }] : []),
              { icon: <Pencil size={12} color="#6B6460" />, label: 'Edit claim', onClick: () => onEdit(claim), dividerBefore: !clientInfo },
              { icon: <Trash2 size={12} />, label: 'Delete claim', onClick: () => onDelete(c.id), danger: true, dividerBefore: true },
            ]}
          />
        </td>
      </tr>

      {/* Expanded row — sections + body + docs */}
      {expanded && (
        <tr style={{ borderBottom: '0.5px solid #F1EFE8', background: '#FBFAF7' }}>
          <td colSpan={clientInfo ? 7 : 6} style={{ padding: '20px 24px 22px 34px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Body (description) — first since it's the most-referenced text */}
              {/* B65: color #6B6460 -> #1A1410 to match KV value color in adjacent sections */}
              {c.body && (
                <div>
                  <div style={sectionHeaderStyle}>Description</div>
                  <div style={{ fontSize: 13, color: '#1A1410', lineHeight: 1.6 }}>
                    {c.body}
                  </div>
                </div>
              )}

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
                  <KV label="Net payout" value={netPayoutValue != null ? fmtMoney(netPayoutValue) : '—'} />
                </div>
              </div>

              {/* LIFECYCLE — B65 #C: status-conditional cells. Always shows */}
              {/* incident + filed + days metrics. Status-conditional adds: */}
              {/*   approved -> Approved date */}
              {/*   denied   -> Denied date   */}
              {/*   paid     -> Approved date + Paid date */}
              {/* Grid wraps automatically (4-col -> 4 or 6 cells, two rows for 6). */}
              <div>
                <div style={sectionHeaderStyle}>Lifecycle</div>
                <div style={gridStyle}>
                  {(() => {
                    const lifecycleCells: Array<{ label: string; value: string }> = [
                      { label: 'Incident date', value: c.incident_date ? formatDate(c.incident_date) : '—' },
                      { label: 'Filed date',    value: c.filed_date    ? formatDate(c.filed_date)    : '—' },
                    ]
                    if (status === 'approved' || status === 'paid') {
                      lifecycleCells.push({ label: 'Approved', value: c.approved_at ? formatDate(c.approved_at) : '—' })
                    }
                    if (status === 'denied') {
                      lifecycleCells.push({ label: 'Denied', value: c.denied_at ? formatDate(c.denied_at) : '—' })
                    }
                    if (status === 'paid') {
                      lifecycleCells.push({ label: 'Paid', value: c.paid_at ? formatDate(c.paid_at) : '—' })
                    }
                    lifecycleCells.push({ label: 'Days open',       value: daysOpen      != null ? `${daysOpen} days`      : '—' })
                    lifecycleCells.push({ label: 'Days to resolve', value: daysToResolve != null ? `${daysToResolve} days` : '—' })
                    return lifecycleCells.map(cell => <KV key={cell.label} label={cell.label} value={cell.value} />)
                  })()}
                </div>
              </div>

              {/* DENIAL REASON — only if status='denied' AND reason set */}
              {status === 'denied' && c.denial_reason && (
                <div>
                  <div style={sectionHeaderStyle}>Denial reason</div>
                  <div style={{ fontSize: 13, color: '#6B6460', lineHeight: 1.6 }}>
                    {c.denial_reason}
                  </div>
                </div>
              )}

              {/* STATUS HISTORY — only if any timestamps set */}
              {/* B65: stale rows (transitions row passed through but not in current state) */}
              {/* render in muted #9B9088 instead of secondary #6B6460. Audit trail kept */}
              {/* fully visible, just visually de-emphasized so current state stands out. */}
              {timestampRows.length > 0 && (
                <div>
                  <div style={sectionHeaderStyle}>Status history</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {timestampRows.map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: r.stale ? '#9B9088' : '#6B6460' }}>
                        <span>{r.label}</span>
                        <span style={{ fontFamily: 'DM Mono, monospace' }}>{formatDate(r.value!)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DOCUMENTS — moved into expanded view since the collapsed row
                  is now table-cell-sized and has no room for an inline doc list */}
              <div>
                <div style={sectionHeaderStyle}>Documents</div>
                <DocList
                  key={`claim-doc-${c.id}-${cardRefreshKey}`}
                  parentId={c.id}
                  apiEndpoint="/api/claim-doc"
                  parentParam="claimId"
                  label=""
                />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
