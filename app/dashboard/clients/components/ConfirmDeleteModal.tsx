// ConfirmDeleteModal — shared confirmation dialog for destructive actions.
//
// Used twice in ClientDetailPage today (delete policy, delete claim) and
// designed to be reusable for any future destructive flow on this page.
//
// Pure presentational: parent owns the confirm-id state and the actual
// delete handler. This component just renders the dialog and forwards
// the click events. Cream styled, danger button is red.
//
// Extracted from ClientDetailPage.tsx in Batch 51 — second of seven
// inline-modal extractions planned for that file.

'use client'

import { Trash2 } from 'lucide-react'
import Modal from '@/components/Modal'
import { btnOutline } from '@/lib/styles'

interface ConfirmDeleteModalProps {
  title: string                  // e.g., 'Delete policy?'
  body: string                   // explanation of what will be deleted
  confirmLabel: string           // e.g., 'Delete policy'
  busy: boolean                  // disable confirm button + show 'Deleting…'
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmDeleteModal({
  title, body, confirmLabel, busy, onConfirm, onClose,
}: ConfirmDeleteModalProps) {
  return (
    <Modal title={title} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1A1410', margin: 0, lineHeight: 1.5 }}>
          {body}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onConfirm}
            disabled={busy}
            style={{
              flex: 1, background: '#A32D2D', color: '#FFFFFF', border: 'none',
              borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 500,
              cursor: busy ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
              opacity: busy ? 0.7 : 1,
            }}
          >
            <Trash2 size={14} /> {busy ? 'Deleting…' : confirmLabel}
          </button>
          <button onClick={onClose} style={btnOutline}>Cancel</button>
        </div>
      </div>
    </Modal>
  )
}
