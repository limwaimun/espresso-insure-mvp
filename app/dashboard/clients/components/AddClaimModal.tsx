// AddClaimModal — new-claim creation flow.
//
// Fourth of the planned modal extractions from ClientDetailPage.tsx.
// Self-contained: owns form state, doc upload queue, save flow,
// retains the existing API integration (POST /api/claim-create then
// POST /api/claim-doc for each queued file).
//
// Data-model note: claims are currently stored in the `alerts` table
// with type='claim', and claim_type (Health/Life/Motor/etc) is stuffed
// into the body text as a '[Type] body' prefix because alerts has no
// dedicated column for it. This is preserved exactly as the inline
// version did. A separate Phase B effort will design a proper claims
// schema (likely a dedicated `claims` table) before adding fields like
// claim amount, payout date, insurer, policy linkage. Not addressed
// in this batch.
//
// Cream styled: shared <Modal> wrapper, inputStyle/labelStyle/
// btnPrimary/btnOutline from @/lib/styles, matches HoldingForm and
// AddClientModal.

'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import Modal from '@/components/Modal'
import DocUploadField from '@/components/DocUploadField'
import { inputStyle, labelStyle, btnPrimary, btnOutline } from '@/lib/styles'

const CLAIM_TYPES = ['Health', 'Life', 'Critical Illness', 'Disability', 'Motor', 'Travel', 'Property', 'Other']

interface AddClaimModalProps {
  clientId: string
  ifaId: string
  onClose: () => void
  /**
   * Called after the claim and any queued documents have been created
   * successfully. Receives the human-readable activity string the parent
   * can append to its in-page activity feed.
   */
  onCreated: (activityText: string) => void
}

export default function AddClaimModal({ clientId, ifaId, onClose, onCreated }: AddClaimModalProps) {
  const [form, setForm] = useState({ title: '', type: 'Health', priority: 'medium', body: '' })
  const [files, setFiles] = useState<File[]>([])
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
      const res = await fetch('/api/claim-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          ifaId,
          title: form.title,
          type: 'claim',
          priority: form.priority,
          body: form.body,
          claim_type: form.type,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed to create claim')
        setSaving(false)
        return
      }

      // Grab the new claim ID for doc upload. Route may return { claim: {...} }
      // or the row directly — handle both shapes.
      const payload = await res.json().catch(() => ({}))
      console.log('[claim-create] response payload:', payload)
      const newClaimId: string | undefined =
        payload?.claim?.id ?? payload?.id ?? payload?.alert?.id ?? payload?.data?.id

      // If files were queued but we couldn't get the new claim's ID, stop
      // here and tell the user loudly — silently dropping uploads is the
      // bug we're fixing.
      if (files.length > 0 && !newClaimId) {
        const keys = Object.keys(payload || {}).join(', ') || 'empty'
        setError(`Claim created but attachments could not be uploaded — server response shape was unexpected (keys: ${keys}). Please close this dialog and use "Edit claim" on the new claim to add documents.`)
        setSaving(false)
        return
      }

      // Upload queued documents sequentially.
      if (newClaimId && files.length > 0) {
        const failures: string[] = []
        for (const file of files) {
          const fd = new FormData()
          fd.append('file', file)
          fd.append('claimId', newClaimId)
          const up = await fetch('/api/claim-doc', { method: 'POST', body: fd })
          if (!up.ok) {
            const d = await up.json().catch(() => ({}))
            failures.push(`${file.name}: ${d.error ?? up.statusText ?? `HTTP ${up.status}`}`)
          }
        }
        if (failures.length) {
          setError(`Claim created, but some uploads failed — ${failures.join('; ')}`)
          setSaving(false)
          return
        }
      }

      onCreated(`Claim opened: ${form.title}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <Modal title="New claim" onClose={onClose}>
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
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
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

        <DocUploadField
          multi
          label="Documents"
          files={files}
          onFilesChange={setFiles}
          onError={msg => setError(msg)}
        />

        {error && <p style={{ fontSize: 12, color: '#A32D2D', margin: 0 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ ...btnPrimary, flex: 1, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}
          >
            <Plus size={14} />
            {saving ? 'Creating…' : 'Create claim'}
          </button>
          <button onClick={onClose} style={btnOutline}>Cancel</button>
        </div>
      </div>
    </Modal>
  )
}
