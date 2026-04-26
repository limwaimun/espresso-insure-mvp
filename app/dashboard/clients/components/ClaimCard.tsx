'use client'

import { useState, useRef } from 'react'
import PortalMenu from '@/components/PortalMenu'
import DocList from '@/components/DocList'
import { MoreVertical, Bot, Pencil, Trash2 } from 'lucide-react'
import type { Alert } from '@/lib/types'

// Re-exports: keep ClientDetailPage's existing `import { Alert } from './ClaimCard'`
// working during the unification transition.
export type { Alert } from '@/lib/types'

// ── Component ──────────────────────────────────────────────────────────────

export default function ClaimCard({ claim, ifaId, onEdit, onAskMaya, onDelete, cardRefreshKey }: {
  claim: Alert
  ifaId: string
  onEdit: (claim: Alert) => void
  onAskMaya: (c: Alert, action: 'status_update' | 'message_insurer' | 'message_client') => void
  onDelete: (id: string) => void
  cardRefreshKey: number
}) {
  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLButtonElement>(null)

  const [localStatus, setLocalStatus] = useState(claim.status || 'open')
  const [localPriority, setLocalPriority] = useState(claim.priority || 'medium')

  const claimDate = claim.created_at
    ? new Date(claim.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  const TRUNCATE = 150
  const bodyText = claim.body || ''
  const isTruncated = bodyText.length > TRUNCATE

  async function saveToServer(patch: Record<string, unknown>) {
    fetch('/api/claim-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claimId: claim.id, ifaId, ...patch }),
    }).catch(err => console.error('[claim-update] failed:', err))
  }

  function handleStatusChange(status: string) {
    setLocalStatus(status)
    saveToServer({ status })
  }

  function handlePriorityChange(priority: string) {
    setLocalPriority(priority)
    saveToServer({ priority })
  }

  return (
    <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '14px 16px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#6B6460' }}>{claimDate}</span>
        <button ref={menuRef as any} onClick={() => setMenuOpen(o => !o)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, opacity: 0.5, display: 'flex', alignItems: 'center' }} title="Actions">
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
            { icon: <Trash2 size={12} />, label: 'Delete claim', onClick: () => onDelete(claim.id), danger: true, dividerBefore: true },
          ]}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', fontWeight: 500, marginBottom: 4 }}>
          {claim.title || 'Untitled claim'}
        </div>
        {bodyText && (
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460', lineHeight: 1.6 }}>
            {expanded || !isTruncated ? bodyText : bodyText.slice(0, TRUNCATE) + '…'}
            {isTruncated && (
              <button onClick={() => setExpanded(v => !v)}
                style={{ background: 'transparent', border: 'none', color: '#BA7517', fontSize: 11, cursor: 'pointer', padding: '0 4px', fontFamily: 'DM Sans, sans-serif' }}>
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Read-only docs on the card. Add/delete lives in the Edit claim modal. */}
      <DocList
        key={`claim-doc-${claim.id}-${cardRefreshKey}`}
        parentId={claim.id}
        apiEndpoint="/api/claim-doc"
        parentParam="claimId"
        label="Documents"
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#6B6460' }}>Status:</span>
          <select
            value={localStatus}
            onChange={e => handleStatusChange(e.target.value)}
            style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 11,
              background: '#F7F4F0', border: '0.5px solid #E8E2DA', borderRadius: 5,
              padding: '4px 8px', cursor: 'pointer', outline: 'none',
              color: localStatus === 'paid' ? '#0F6E56'
                : localStatus === 'approved' ? '#0F6E56'
                : localStatus === 'denied' ? '#A32D2D'
                : localStatus === 'in_progress' ? '#4A9EBF'
                : '#854F0B',
            }}>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
            <option value="paid">Paid</option>
          </select>
        </div>

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
    </div>
  )
}
