'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { createClient } from '../../../../lib/supabase/client'

interface AddPolicyModalProps {
  clientId: string
  ifaId: string
  onClose: () => void
  onAdded: () => void
}

const INSURERS = [
  'AIA', 'Great Eastern', 'Prudential', 'NTUC Income',
  'Manulife', 'AXA', 'Aviva', 'Tokio Marine', 'Singlife', 'FWD', 'Etiqa', 'Other'
]

const POLICY_TYPES = [
  'Life', 'Health', 'Critical Illness', 'Disability',
  'Motor', 'Travel', 'Property', 'Professional Indemnity',
  'Group Health', 'Group Life', 'Fire', 'Business Interruption',
  'Keyman', 'D&O', 'Cyber', 'Workers Compensation',
  'Public Liability', 'Marine'
]

export default function AddPolicyModal({ clientId, ifaId, onClose, onAdded }: AddPolicyModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    insurer: '',
    type: '',
    premium: '',
    renewal_date: '',
    status: 'active',
  })

  const supabase = createClient()

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  async function handleSave() {
    if (!form.insurer || !form.type || !form.premium || !form.renewal_date) {
      setError('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      const { error: dbError } = await supabase.from('policies').insert({
        client_id: clientId,
        ifa_id: ifaId,
        insurer: form.insurer,
        type: form.type,
        premium: parseFloat(form.premium),
        renewal_date: form.renewal_date,
        status: form.status,
      })

      if (dbError) {
        setError('Failed to save policy: ' + dbError.message)
        setSaving(false)
        return
      }

      onAdded()
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
    // Backdrop
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
          width: 480,
          maxWidth: '95vw',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#F5ECD7' }}>
            Add Policy
          </span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
            <X size={18} color="#C9B99A" />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Insurer */}
          <div>
            <label style={labelStyle}>Insurer *</label>
            <select value={form.insurer} onChange={e => set('insurer', e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
              <option value="">Select insurer…</option>
              {INSURERS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          {/* Policy Type */}
          <div>
            <label style={labelStyle}>Policy Type *</label>
            <select value={form.type} onChange={e => set('type', e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
              <option value="">Select type…</option>
              {POLICY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Premium + Renewal in a row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Annual Premium (SGD) *</label>
              <input
                type="number"
                placeholder="e.g. 3600"
                value={form.premium}
                onChange={e => set('premium', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Renewal Date *</label>
              <input
                type="date"
                value={form.renewal_date}
                onChange={e => set('renewal_date', e.target.value)}
                style={{ ...inputStyle, colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label style={labelStyle}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
              <option value="active">Active</option>
              <option value="lapsed">Lapsed</option>
              <option value="cancelled">Cancelled</option>
            </select>
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
              <Plus size={14} />
              {saving ? 'Saving…' : 'Add Policy'}
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
