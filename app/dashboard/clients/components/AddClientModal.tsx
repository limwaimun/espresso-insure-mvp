// Add Client modal — manual single-client onboarding.
//
// Sibling to ImportClientsModal (CSV batch import). Same DB write target
// (clients table, direct supabase.from('clients').insert), same RLS-gated
// authorization (ifa_id), but designed for the FA who wants to type one
// client in by hand instead of preparing a CSV.
//
// Visually mirrors HoldingForm: cream palette, shared <Modal> wrapper,
// inputStyle/labelStyle/btnPrimary/btnOutline from @/lib/styles. The
// inline modals in ClientDetailPage.tsx still use the older dark palette
// — that's tech debt to clean up via inline-modal extraction work, NOT here.
//
// On successful save, returns the new client's id via onAdded() so the
// parent can router.push to the new client's detail page.

'use client'

import { useState } from 'react'
import { Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/Modal'
import { inputStyle, labelStyle, btnPrimary, btnOutline } from '@/lib/styles'

interface AddClientModalProps {
  faId: string
  onClose: () => void
  onAdded: (newClientId: string) => void
}

const DEFAULT_FORM = {
  name: '',
  type: 'individual',
  company: '',
  email: '',
  whatsapp: '',
  birthday: '',
  address: '',
}

export default function AddClientModal({ faId, onClose, onAdded }: AddClientModalProps) {
  const supabase = createClient()
  const [form, setForm] = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof typeof DEFAULT_FORM, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Client name is required'); return }
    if (!form.type)        { setError('Type is required'); return }

    setSaving(true)
    try {
      const { data, error: dbError } = await supabase
        .from('clients')
        .insert({
          ifa_id: faId,
          name: form.name.trim(),
          type: form.type,
          company: form.company.trim() || null,
          email: form.email.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
          birthday: form.birthday || null,
          address: form.address.trim() || null,
          // tier intentionally omitted — clients page computes tier live
          // from policy premium totals; setting it here would write a
          // snapshot that goes stale as soon as a policy is added.
        })
        .select('id')
        .single()

      if (dbError) {
        setError('Failed to save: ' + dbError.message)
        setSaving(false)
        return
      }
      if (!data?.id) {
        setError('Save returned no client ID')
        setSaving(false)
        return
      }
      onAdded(data.id)
    } catch {
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <Modal title="Add client" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>Name *</label>
          <input
            placeholder="e.g. Tan Ah Kow"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            style={inputStyle}
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

        <div>
          <label style={labelStyle}>Company</label>
          <input
            placeholder="e.g. Acme Pte Ltd"
            value={form.company}
            onChange={e => set('company', e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              placeholder="e.g. tan@example.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>WhatsApp</label>
            <input
              type="tel"
              placeholder="e.g. 91234567"
              value={form.whatsapp}
              onChange={e => set('whatsapp', e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Birthday</label>
          <input
            type="date"
            value={form.birthday}
            onChange={e => set('birthday', e.target.value)}
            style={{ ...inputStyle, colorScheme: 'dark' } as React.CSSProperties}
          />
        </div>

        <div>
          <label style={labelStyle}>Address</label>
          <textarea
            placeholder="Optional"
            rows={2}
            value={form.address}
            onChange={e => set('address', e.target.value)}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 } as React.CSSProperties}
          />
        </div>

        {error && <p style={{ fontSize: 12, color: '#A32D2D', margin: 0 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ ...btnPrimary, flex: 1, justifyContent: 'center', opacity: saving ? 0.6 : 1 }}
          >
            <Save size={14} />
            {saving ? 'Saving…' : 'Save client'}
          </button>
          <button onClick={onClose} style={btnOutline}>Cancel</button>
        </div>
      </div>
    </Modal>
  )
}
