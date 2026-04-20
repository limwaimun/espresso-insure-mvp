'use client'

import { X } from 'lucide-react'

// Shared modal dialog. Dark overlay, white card, 500px default width, X close.
// Used by add/edit forms, delete confirms, Maya stubs — any time we need
// the "Add policy" pattern from the client detail page.

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFFFFF', border: '0.5px solid #E8E2DA',
          borderRadius: 14, padding: 28,
          width: 500, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, color: '#1A1410' }}>{title}</span>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
            aria-label="Close"
          >
            <X size={18} color="#6B6460" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
