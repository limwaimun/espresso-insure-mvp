// EditClaimModal — edit existing claim form.
//
// Extracted from ClientDetailPage.tsx in B59b-1. Mirrors AddClaimModal's
// shape: self-contained component owning form state, save flow, error
// handling. Documents are managed live via DocList.editable (not queued
// like AddClaim).
//
// Type debt note: `claim` is typed as Alert | Record<string, unknown>
// (loose) because lib/types.ts doesn't yet have a dedicated Claim
// interface — the type-side of the schema migration is still TODO.
// B59b-2 will add new field access; a proper Claim interface should
// land before too long.

'use client'

import { useState } from 'react'
import { Save } from 'lucide-react'
import Modal from '@/components/Modal'
import DocList from '@/components/DocList'
import { inputStyle, labelStyle, btnPrimary, btnOutline } from '@/lib/styles'
import type { Alert } from '@/lib/types'

const CLAIM_TYPES = ['Health', 'Life', 'Critical Illness', 'Disability', 'Personal Accident', 'Motor', 'Travel', 'Property', 'Other']

interface EditClaimModalProps {
  claim: Alert
  ifaId: string
  cardRefreshKey: number
  onClose: () => void
  onSaved: () => void
}

export default function EditClaimModal({ claim, ifaId, cardRefreshKey, onClose, onSaved }: EditClaimModalProps) {
  // Loose type access for the claim_type column that lives on the new
  // claims table but isn't on Alert. Same pattern as the (claim as any)
  // access we had in the original openEditClaim.
  const claimAny = claim as Alert & { claim_type?: string }

  const [form, setForm] = useState({
    title: claim.title ?? '',
    type: claimAny.claim_type ?? 'Health',
    priority: claim.priority ?? 'medium',
    body: claim.body ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof typeof form>(field: K, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('Title is required'); return }
    if (!ifaId)             { setError('Session error — please refresh'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/claim-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId: claim.id,
          ifaId,
          title: form.title,
          body: form.body,
          priority: form.priority,
          claim_type: form.type,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? `Save failed (HTTP ${res.status})`)
        setSaving(false)
        return
      }
      onSaved()
    } catch {
      setError('Something went wrong — please try again')
      setSaving(false)
    }
  }

  return (
    <Modal title="Edit claim" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>Claim title *</label>
          <input
            style={inputStyle}
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Health claim — clinic visit"
            autoFocus
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Claim type</label>
            <select
              style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
              value={form.type}
              onChange={e => set('type', e.target.value)}
            >
              {CLAIM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Priority</label>
            <select
              style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
              value={form.priority}
              onChange={e => set('priority', e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 } as React.CSSProperties}
            rows={4}
            value={form.body}
            onChange={e => set('body', e.target.value)}
            placeholder="What happened? Any context that will help track this claim."
          />
        </div>

        {/* Documents — managed inline. Add/delete fire immediately
            against the server; there's no 'save' gesture for docs. */}
        <div>
          <label style={labelStyle}>Documents</label>
          <DocList
            key={`claim-doc-${claim.id}-${cardRefreshKey}`}
            parentId={claim.id}
            apiEndpoint="/api/claim-doc"
            parentParam="claimId"
            label="Documents"
            editable
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
