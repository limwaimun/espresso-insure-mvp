// MayaStubModal — preview-only modal showing the prompt that will be
// sent to Maya once agent integration ships. Currently used as a stub
// when an FA clicks an action that's slated for Maya generation.
//
// Pure presentational: receives the stub payload from parent state,
// renders title + context, has a single Close button. No DB, no forms.
//
// Extracted from ClientDetailPage.tsx in Batch 50 — first of seven
// inline-modal extractions planned for that file.

'use client'

import { Bot } from 'lucide-react'
import Modal from '@/components/Modal'
import { btnOutline } from '@/lib/styles'

export interface MayaStub {
  title: string
  context: string
}

interface MayaStubModalProps {
  stub: MayaStub
  onClose: () => void
}

export default function MayaStubModal({ stub, onClose }: MayaStubModalProps) {
  return (
    <Modal title={stub.title} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: 8, padding: '12px 14px' }}>
          <Bot size={18} color="#BA7517" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#854F0B', marginBottom: 4 }}>Coming soon</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460', lineHeight: 1.5 }}>
              Maya will draft this for you in the next update. Here&apos;s the prompt we&apos;re preparing to send:
            </div>
          </div>
        </div>
        <div style={{ background: '#FBFAF7', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Prompt preview</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#1A1410', lineHeight: 1.6, fontStyle: 'italic' }}>&ldquo;{stub.context}&rdquo;</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnOutline}>Close</button>
        </div>
      </div>
    </Modal>
  )
}
