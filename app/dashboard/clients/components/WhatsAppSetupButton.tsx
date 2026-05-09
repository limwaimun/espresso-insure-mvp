'use client'

import { useState } from 'react'
import { MessageCircle, Copy, Check } from 'lucide-react'

interface WhatsAppSetupButtonProps {
  clientName: string
  clientWhatsApp?: string | null
  faName: string
  connectionStatus: 'connected' | 'pending' | 'not_connected'
}

export default function WhatsAppSetupButton({
  clientName,
  clientWhatsApp,
  faName,
  connectionStatus,
}: WhatsAppSetupButtonProps) {
  const [copied, setCopied] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  const firstName = clientName.split(' ')[0]

  const setupMessage = `Hi ${firstName}! I've set up a WhatsApp group for us with Maya, my AI assistant. She'll help manage your insurance — renewals, claims, and any questions — 24/7. I'll add you now!`

  async function handleSetup() {
    // Copy message to clipboard
    try {
      await navigator.clipboard.writeText(setupMessage)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback — show instructions anyway
    }
    setShowInstructions(true)

    // If we have their number, open WhatsApp with it
    if (clientWhatsApp) {
      const cleaned = clientWhatsApp.replace(/\D/g, '')
      const waUrl = `https://wa.me/${cleaned}`
      setTimeout(() => window.open(waUrl, '_blank'), 300)
    }
  }

  // Already connected
  if (connectionStatus === 'connected') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#0A1A10', border: '1px solid #2A5A3A', borderRadius: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#5AB87A', flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: '#5AB87A', fontWeight: 500 }}>Connected to Maya on WhatsApp</span>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={handleSetup}
        style={{
          background: '#25D366',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '10px 18px',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'DM Sans, sans-serif',
          transition: 'opacity 0.12s',
        }}
      >
        <MessageCircle size={15} />
        {connectionStatus === 'pending' ? 'Continue WhatsApp setup' : 'Set up WhatsApp group'}
      </button>

      {showInstructions && (
        <div style={{
          marginTop: 12,
          background: '#120A06',
          border: '1px solid #2E1A0E',
          borderRadius: 10,
          padding: '16px 16px 14px',
        }}>
          <p style={{ fontSize: 12, color: '#C8813A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
            2 quick steps
          </p>

          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#3D2215', border: '1px solid #C8813A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#C8813A', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>1</div>
            <div>
              <p style={{ fontSize: 13, color: '#F5ECD7', margin: '0 0 3px', fontWeight: 500 }}>Create a WhatsApp group</p>
              <p style={{ fontSize: 12, color: '#C9B99A', margin: 0, lineHeight: 1.5 }}>
                Open WhatsApp → New Group → add <strong style={{ color: '#F5ECD7' }}>{clientName}</strong>
                {clientWhatsApp ? ` (${clientWhatsApp})` : ''} and your Espresso WhatsApp number
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#3D2215', border: '1px solid #C8813A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#C8813A', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>2</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: '#F5ECD7', margin: '0 0 6px', fontWeight: 500 }}>
                Send this message in the group
                {copied && <span style={{ marginLeft: 6, fontSize: 11, color: '#5AB87A' }}>✓ copied</span>}
              </p>
              <div style={{
                background: '#1C0F0A',
                border: '1px solid #2E1A0E',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 12,
                color: '#C9B99A',
                lineHeight: 1.6,
                fontStyle: 'italic',
                marginBottom: 8,
              }}>
                "{setupMessage}"
              </div>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(setupMessage)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #2E1A0E',
                  borderRadius: 6,
                  padding: '5px 12px',
                  fontSize: 12,
                  color: '#C9B99A',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {copied ? <Check size={12} color="#5AB87A" /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
