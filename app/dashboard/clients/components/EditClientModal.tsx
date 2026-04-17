'use client'

import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { createClient } from '../../../../lib/supabase/client'

interface Client {
  id: string
  name: string
  company?: string
  type: string
  whatsapp?: string
  email?: string
  birthday?: string
  address?: string
}

interface EditClientModalProps {
  client: Client
  onClose: () => void
  onSaved: () => void
}

export default function EditClientModal({ client, onClose, onSaved }: EditClientModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: client.name ?? '',
    company: client.company ?? '',
    whatsapp: client.whatsapp ?? '',
    email: client.email ?? '',
    birthday: client.birthday ?? '',
    address: client.address ?? '',
  })

  const supabase = createClient()

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError('Client name is required')
      return
    }

    setSaving(true)
    try {
      const { error: dbError } = await supabase
        .from('clients')
        .update({
          name: form.name.trim(),
          company: form.company.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
          email: form.email.trim() || null,
          birthday: form.birthday || null,
          address: form.address.trim() || null,
        })
        .eq('id', client.id)

      if (dbError) {
        setError('Failed to save: ' + dbError.message)
        setSaving(false)
        return
      }

      onSaved()
      onClose()
    } catch {
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%',
    background: '#1C0F0A',
    border: '1px solid #2E1A0E',
    borderRadius: 8,
    padding: '10px 13px',
    fontSize: 13,
    color: '#F5ECD7',
    outline: 'none',
    fontFamily: 'DM Sans, sans-serif',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    fontSize: 11,
    color: '#C9B99A',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: 5,
    display: 'block',
  }

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
          background: '#120A06',
          border: '1px solid #2E1A0E',
          borderRadius: 14,
          padding: '28px 28px 24px',
          width: 520,
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#F5ECD7' }}>
              Edit Client
            </span>
            <span style={{ fontSize: 12, color: '#C9B99A', marginLeft: 10 }}>
              {client.type}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
            <X size={18} color="#C9B99A" />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Name + Company */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                style={inputStyle}
                placeholder="Full name"
              />
            </div>
            <div>
              <label style={labelStyle}>Company</label>
              <input
                type="text"
                value={form.company}
                onChange={e => set('company', e.target.value)}
                style={inputStyle}
                placeholder="Company name"
              />
            </div>
          </div>

          {/* WhatsApp + Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>WhatsApp Number</label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={e => set('whatsapp', e.target.value)}
                style={inputStyle}
                placeholder="+65 9123 4567"
              />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                style={inputStyle}
                placeholder="email@example.com"
              />
            </div>
          </div>

          {/* Birthday */}
          <div>
            <label style={labelStyle}>Date of Birth</label>
            <input
              type="date"
              value={form.birthday}
              onChange={e => set('birthday', e.target.value)}
              style={{ ...inputStyle, colorScheme: 'dark' }}
            />
          </div>

          {/* Address */}
          <div>
            <label style={labelStyle}>Address</label>
            <textarea
              value={form.address}
              onChange={e => set('address', e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' as const, lineHeight: 1.5 }}
              placeholder="Full address"
            />
          </div>

          {error && (
            <p style={{ fontSize: 12, color: '#D06060', margin: 0 }}>{error}</p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1,
                background: saving ? '#2E1A0E' : '#C8813A',
                color: saving ? '#C9B99A' : '#120A06',
                border: 'none',
                borderRadius: 8,
                padding: '10px 0',
                fontSize: 13,
                fontWeight: 500,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Save size={14} />
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid #2E1A0E',
                borderRadius: 8,
                padding: '10px 20px',
                fontSize: 13,
                color: '#C9B99A',
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
