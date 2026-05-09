// EditClientModal — manual edit of an existing client's details.
//
// Sibling to AddClientModal (manual single-client onboarding). Same DB
// target (clients table), but updates an existing row via the
// /api/client-update route rather than direct Supabase insert.
//
// Adds the 'type' field as an editable dropdown. Previously the type
// could only be set at client creation time and was rendered as plain
// text in the original inline edit modal — there was no way to change
// a client's type via the UI once created. The accompanying API
// route update validates type as one of individual/sme/corporate.
//
// Visually mirrors HoldingForm / AddClientModal: cream palette, shared
// <Modal> wrapper, inputStyle/labelStyle/btnPrimary/btnOutline from
// @/lib/styles. WhatsApp uses CountryCodeSelect to preserve the
// existing flow's country-code prefix UX (different from AddClient's
// plain tel input — that inconsistency is tracked separately).
//
// On successful save, calls onSaved() so the parent can router.refresh()
// or otherwise pick up the updated row.

'use client'

import { useState } from 'react'
import { Save } from 'lucide-react'
import Modal from '@/components/Modal'
import CountryCodeSelect from '@/components/CountryCodeSelect'
import { inputStyle, labelStyle, btnPrimary, btnOutline } from '@/lib/styles'

interface ClientLike {
  id: string
  name: string
  type: string
  company?: string | null
  whatsapp?: string | null
  email?: string | null
  birthday?: string | null
  address?: string | null
}

interface EditClientModalProps {
  client: ClientLike
  faId: string
  onClose: () => void
  onSaved: () => void
}

export default function EditClientModal({ client, faId, onClose, onSaved }: EditClientModalProps) {
  const [form, setForm] = useState({
    name: client.name ?? '',
    type: client.type ?? 'individual',
    company: client.company ?? '',
    whatsapp: client.whatsapp ?? '',
    email: client.email ?? '',
    birthday: client.birthday ?? '',
    address: client.address ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof typeof form>(field: K, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Name is required'); return }
    if (!form.type)        { setError('Type is required'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/client-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, faId, ...form }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Failed to save')
        setSaving(false)
        return
      }
      onSaved()
    } catch {
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <Modal title="Edit client" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Full Name *</label>
            <input
              style={inputStyle}
              value={form.name}
              onChange={e => set('name', e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label style={labelStyle}>Type *</label>
            <select
              value={form.type}
              onChange={e => set('type', e.target.value)}
              style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
            >
              <option value="individual">Individual</option>
              <option value="sme">SME</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Company</label>
          <input
            style={inputStyle}
            value={form.company}
            onChange={e => set('company', e.target.value)}
            placeholder="e.g. Acme Pte Ltd"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <CountryCodeSelect
              value={form.whatsapp}
              onChange={v => set('whatsapp', v)}
              label="WhatsApp"
            />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              style={inputStyle}
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="email@example.com"
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Date of Birth</label>
          <input
            style={{ ...inputStyle, colorScheme: 'dark' } as React.CSSProperties}
            type="date"
            value={form.birthday}
            onChange={e => set('birthday', e.target.value)}
          />
        </div>

        <div>
          <label style={labelStyle}>Address</label>
          <textarea
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 } as React.CSSProperties}
            rows={2}
            value={form.address}
            onChange={e => set('address', e.target.value)}
            placeholder="Optional"
          />
        </div>

        {error && <p style={{ fontSize: 12, color: '#A32D2D', margin: 0 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ ...btnPrimary, flex: 1, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}
          >
            <Save size={14} />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button onClick={onClose} style={btnOutline}>Cancel</button>
        </div>
      </div>
    </Modal>
  )
}
