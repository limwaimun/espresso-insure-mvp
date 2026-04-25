'use client'

import { useState, useRef } from 'react'
import { formatDate } from '@/lib/dates'
import PortalMenu from '@/components/PortalMenu'
import DocList from '@/components/DocList'
import { KV } from '@/components/HoldingsDisplayPrimitives'
import { ChevronDown, ChevronRight, MoreVertical, Bot, Pencil, Trash2 } from 'lucide-react'
import type { Policy } from '@/lib/types'

export type { Policy }  // re-export: kept so ClientDetailPage's `import { Policy } from './PolicyRow'` keeps working during the unification transition.

// ── Helpers ────────────────────────────────────────────────────────────────
// Duplicated from ClientDetailPage for the same reason. TODO: consolidate.

// ── Component ──────────────────────────────────────────────────────────────

export default function PolicyRow({ policy, ifaId, onEdit, onAskMaya, confirmingDelete, setConfirming, cardRefreshKey }: {
  policy: Policy
  ifaId: string
  onEdit: (p: Policy) => void
  onAskMaya: (p: Policy, action: 'summarize' | 'renewal_reminder') => void
  confirmingDelete: boolean
  setConfirming: (id: string | null) => void
  cardRefreshKey: number
}) {
  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLButtonElement>(null)

  function renderStatus() {
    if (policy.status === 'lapsed') return { cls: 'pill-red', text: 'Lapsed' }
    if (policy.status === 'cancelled') return { cls: 'pill-neutral', text: 'Cancelled' }
    if (policy.status === 'pending') return { cls: 'pill-amber', text: 'Pending' }
    if (!policy.renewal_date) return { cls: 'pill-green', text: 'Active' }
    const days = Math.ceil((new Date(policy.renewal_date).getTime() - Date.now()) / 86400000)
    if (days < 0) return { cls: 'pill-amber', text: 'Overdue renewal' }
    if (days <= 30) return { cls: 'pill-red', text: `Due in ${days}d` }
    if (days <= 90) return { cls: 'pill-amber', text: `${days}d to renewal` }
    return { cls: 'pill-green', text: `Renews in ${days}d` }
  }
  const { cls, text } = renderStatus()

  return (
    <>
      {/* Main row — 6 columns: Product (+ policy#), Insurer (+ type), Premium (+ SA), Renewal, Status, ⋮ */}
      <tr onClick={() => setExpanded(e => !e)} style={{ cursor: 'pointer', borderBottom: expanded ? 'none' : '0.5px solid #F1EFE8' }}>
        <td style={{ padding: '12px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {expanded ? <ChevronDown size={12} color="#9B9088" /> : <ChevronRight size={12} color="#9B9088" />}
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1410' }}>{policy.product_name || policy.type || '—'}</div>
              {policy.policy_number && (
                <div style={{ fontSize: 10, color: '#9B9088', fontFamily: 'DM Mono, monospace', marginTop: 2 }}>{policy.policy_number}</div>
              )}
            </div>
          </div>
        </td>
        <td style={{ padding: '12px 10px' }}>
          <div style={{ fontSize: 13, color: '#1A1410' }}>{policy.insurer || '—'}</div>
          <div style={{ fontSize: 11, color: '#6B6460', marginTop: 2 }}>{policy.type || '—'}</div>
        </td>
        <td style={{ padding: '12px 10px' }}>
          <div style={{ fontSize: 13, color: '#1A1410' }}>
            ${(Number(policy.premium) || 0).toLocaleString()}
            {policy.premium_frequency && policy.premium_frequency !== 'annual' && (
              <span style={{ fontSize: 10, color: '#9B9088' }}> /{policy.premium_frequency.slice(0, 1)}</span>
            )}
          </div>
          {policy.sum_assured ? (
            <div style={{ fontSize: 11, color: '#6B6460', marginTop: 2 }}>${(Number(policy.sum_assured) / 1000).toFixed(0)}k SA</div>
          ) : null}
        </td>
        <td style={{ padding: '12px 10px', fontSize: 13, color: '#1A1410' }}>{formatDate(policy.renewal_date)}</td>
        <td style={{ padding: '12px 10px' }}><span className={`pill ${cls}`}>{text}</span></td>
        <td style={{ padding: '12px 10px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
          <button ref={menuRef as any} onClick={() => setMenuOpen(o => !o)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, opacity: 0.5, display: 'flex', alignItems: 'center', marginLeft: 'auto' }} title="Actions">
            <MoreVertical size={14} color="#6B6460" />
          </button>
          <PortalMenu
            anchorRef={menuRef as React.RefObject<HTMLElement>}
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            items={[
              { icon: <Bot size={12} color="#BA7517" />, label: 'Summarize with Maya', onClick: () => onAskMaya(policy, 'summarize'), accent: true },
              { icon: <Bot size={12} color="#BA7517" />, label: 'Draft renewal reminder', onClick: () => onAskMaya(policy, 'renewal_reminder'), accent: true },
              { icon: <Pencil size={12} color="#6B6460" />, label: 'Edit policy', onClick: () => onEdit(policy), dividerBefore: true },
              { icon: <Trash2 size={12} />, label: 'Delete policy', onClick: () => setConfirming(policy.id), danger: true, dividerBefore: true },
            ]}
          />
        </td>
      </tr>

      {/* Expanded detail — three sections (Coverage / Money / Lifecycle) +
          Documents and Identifiers + optional Notes. Mirrors HoldingRow's
          B46 layout: 4-column grids, cream palette, section headers in
          muted grey uppercase. */}
      {expanded && (() => {
        // Derive money + lifecycle data
        const FREQ_MULT: Record<string, number> = {
          'monthly': 12, 'quarterly': 4, 'half-yearly': 2, 'annual': 1, 'single': 1,
        }
        const freq = (policy.premium_frequency || 'annual').toLowerCase()
        const annualTotal = (Number(policy.premium) || 0) * (FREQ_MULT[freq] ?? 1)

        const daysLeft = policy.renewal_date
          ? Math.ceil((new Date(policy.renewal_date).getTime() - Date.now()) / 86400000)
          : null
        const daysLeftDisplay = daysLeft == null
          ? '—'
          : daysLeft < 0
            ? `${Math.abs(daysLeft)} days overdue`
            : daysLeft === 0
              ? 'Today'
              : `${daysLeft} days`

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
          <tr style={{ borderBottom: '0.5px solid #F1EFE8', background: '#FBFAF7' }}>
            <td colSpan={6} style={{ padding: '20px 24px 22px 34px' }}>

              {/* COVERAGE — what's being insured. Insurer omitted since
                  it's already prominent in the collapsed row. Policy #
                  moved here from a separate Identifiers section so the
                  4-column grid fills cleanly. */}
              <div style={{ marginBottom: 24 }}>
                <div style={sectionHeaderStyle}>Coverage</div>
                <div style={gridStyle}>
                  <KV label="Type" value={policy.type || '—'} />
                  <KV label="Sum assured" value={policy.sum_assured ? `SGD ${Number(policy.sum_assured).toLocaleString()}` : '—'} />
                  <KV label="Product name" value={policy.product_name || '—'} />
                  <KV label="Policy #" value={policy.policy_number || '—'} />
                </div>
              </div>

              {/* MONEY — what it costs. Strict 4-column grid; the empty
                  cell keeps column boundaries aligned with Coverage and
                  Lifecycle above/below. */}
              <div style={{ marginBottom: 24 }}>
                <div style={sectionHeaderStyle}>Money</div>
                <div style={gridStyle}>
                  <KV label="Premium" value={policy.premium != null ? `SGD ${Number(policy.premium).toLocaleString()}` : '—'} />
                  <KV label="Frequency" value={<span style={{ textTransform: 'capitalize' }}>{policy.premium_frequency || 'Annual'}</span>} />
                  <KV label="Annual total" value={annualTotal > 0 ? `SGD ${annualTotal.toLocaleString()}` : '—'} />
                  <div />
                </div>
              </div>

              {/* LIFECYCLE — is it active and current */}
              <div style={{ marginBottom: 24 }}>
                <div style={sectionHeaderStyle}>Lifecycle</div>
                <div style={gridStyle}>
                  <KV label="Status" value={<span style={{ textTransform: 'capitalize' }}>{policy.status || 'active'}</span>} />
                  <KV label="Start date" value={policy.start_date ? formatDate(policy.start_date) : '—'} />
                  <KV label="Renewal date" value={policy.renewal_date ? formatDate(policy.renewal_date) : '—'} />
                  <KV label="Days left" value={daysLeftDisplay} />
                </div>
              </div>

              {/* DOCUMENTS — full-width below the three semantic sections.
                  Identifiers section dropped; Policy # now sits in Coverage. */}
              <div style={{ marginBottom: policy.notes ? 20 : 0 }}>
                <div style={sectionHeaderStyle}>Documents</div>
                <DocList
                  key={`policy-doc-${policy.id}-${cardRefreshKey}`}
                  parentId={policy.id}
                  apiEndpoint="/api/policy-doc"
                  parentParam="policyId"
                  label=""
                />
              </div>

              {/* NOTES — full-width if present */}
              {policy.notes && (
                <div style={{ paddingTop: 14, borderTop: '0.5px solid #F1EFE8' }}>
                  <div style={{ fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Notes</div>
                  <div style={{ fontSize: 13, color: '#6B6460', lineHeight: 1.6 }}>{policy.notes}</div>
                </div>
              )}
            </td>
          </tr>
        )
      })()}    </>
  )
}
