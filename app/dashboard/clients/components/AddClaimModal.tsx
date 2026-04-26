// AddClaimModal — new-claim creation flow.
//
// Post-B58: writes to the dedicated `claims` table with claim_type as a
// real column (no [Type] body prefix).
//
// Post-B59: policy_id is required (per spec — every claim ties to a policy).
// New fields exposed under a collapsible "More details" section so the
// common case stays lean: title / policy / type / priority + optional
// description and metadata.
//
// Cream styled: shared <Modal>, lib/styles primitives.

'use client'

import { useState } from 'react'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'
import Modal from '@/components/Modal'
import DocUploadField from '@/components/DocUploadField'
import { inputStyle, labelStyle, btnPrimary, btnOutline } from '@/lib/styles'
import type { Policy } from '@/lib/types'

const CLAIM_TYPES = ['Health', 'Life', 'Critical Illness', 'Disability', 'Personal Accident', 'Motor', 'Travel', 'Property', 'Other']

interface AddClaimModalProps {
  clientId: string
  ifaId: string
  policies: Policy[]
  onClose: () => void
  /**
   * Called after the claim and any queued documents have been created
   * successfully. Receives the human-readable activity string the parent
   * can append to its in-page activity feed.
   */
  onCreated: (activityText: string) => void
}

const DEFAULT_FORM = {
  title: '',
  policy_id: '',
  type: 'Health',
  priority: 'medium',
  body: '',
  estimated_amount: '',
  incident_date: '',
  filed_date: '',
  insurer_claim_ref: '',
  insurer_handler_name: '',
  insurer_handler_contact: '',
}

export default function AddClaimModal({ clientId, ifaId, policies, onClose, onCreated }: AddClaimModalProps) {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [files, setFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showMore, setShowMore] = useState(false)

  const noPolicies = policies.length === 0

  function set<K extends keyof typeof form>(field: K, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('Title is required'); return }
    if (!form.policy_id)    { setError('Please select a policy'); return }
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
          claim_type: form.type,
          priority: form.priority,
          body: form.body || null,
          policy_id: form.policy_id,
          estimated_amount: form.estimated_amount || null,
          incident_date: form.incident_date || null,
          filed_date: form.filed_date || null,
          insurer_claim_ref: form.insurer_claim_ref || null,
          insurer_handler_name: form.insurer_handler_name || null,
          insurer_handler_contact: form.insurer_handler_contact || null,
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

      if (files.length > 0 && !newClaimId) {
        const keys = Object.keys(payload || {}).join(', ') || 'empty'
        setError(`Claim created but attachments could not be uploaded — server response shape was unexpected (keys: ${keys}). Please close this dialog and use "Edit claim" on the new claim to add documents.`)
        setSaving(false)
        return
      }

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

        {noPolicies && (
          <div style={{
            background: '#FBF7EE',
            border: '0.5px solid #E8E2DA',
            borderRadius: 6,
            padding: '10px 12px',
            fontSize: 12,
            color: '#854F0B',
            lineHeight: 1.5,
          }}>
            This client has no policies yet. Add a policy first, then come back to create a claim.
          </div>
        )}

        <div>
          <label style={labelStyle}>Claim title *</label>
          <input
            style={inputStyle}
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Health claim — clinic visit"
            autoFocus
            disabled={noPolicies}
          />
        </div>

        <div>
          <label style={labelStyle}>Policy *</label>
          <select
            style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
            value={form.policy_id}
            onChange={e => set('policy_id', e.target.value)}
            disabled={noPolicies}
          >
            <option value="">{noPolicies ? 'No policies available' : 'Select a policy…'}</option>
            {policies.map(p => {
              // Display: "Insurer · Type · Product Name" or "Insurer · Type"
              const label = [p.insurer, p.type, p.product_name].filter(Boolean).join(' · ') || p.id
              return <option key={p.id} value={p.id}>{label}</option>
            })}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Claim type</label>
            <select
              style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
              value={form.type}
              onChange={e => set('type', e.target.value)}
              disabled={noPolicies}
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
              disabled={noPolicies}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* Collapsible "More details" — optional fields */}
        <div style={{ borderTop: '0.5px solid #F1EFE8', paddingTop: 14 }}>
          <button
            type="button"
            onClick={() => setShowMore(s => !s)}
            disabled={noPolicies}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: noPolicies ? 'not-allowed' : 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: '#6B6460',
              fontFamily: 'inherit',
            }}
          >
            {showMore ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            More details (optional)
          </button>

          {showMore && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 } as React.CSSProperties}
                  rows={3}
                  value={form.body}
                  onChange={e => set('body', e.target.value)}
                  placeholder="What happened? Any context that will help track this claim."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Estimated amount (SGD)</label>
                  <input
                    style={inputStyle}
                    type="number"
                    placeholder="e.g. 1500"
                    value={form.estimated_amount}
                    onChange={e => set('estimated_amount', e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Insurer claim ref</label>
                  <input
                    style={inputStyle}
                    placeholder="e.g. AIA-CLM-2026-0042"
                    value={form.insurer_claim_ref}
                    onChange={e => set('insurer_claim_ref', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Incident date</label>
                  <input
                    style={inputStyle}
                    type="date"
                    value={form.incident_date}
                    onChange={e => set('incident_date', e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Filed date</label>
                  <input
                    style={inputStyle}
                    type="date"
                    value={form.filed_date}
                    onChange={e => set('filed_date', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Insurer handler</label>
                  <input
                    style={inputStyle}
                    placeholder="e.g. Mary Tan"
                    value={form.insurer_handler_name}
                    onChange={e => set('insurer_handler_name', e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Handler contact</label>
                  <input
                    style={inputStyle}
                    placeholder="email or phone"
                    value={form.insurer_handler_contact}
                    onChange={e => set('insurer_handler_contact', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
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
            disabled={saving || noPolicies}
            style={{
              ...btnPrimary,
              flex: 1,
              justifyContent: 'center',
              opacity: (saving || noPolicies) ? 0.5 : 1,
              cursor: (saving || noPolicies) ? 'not-allowed' : 'pointer',
            }}
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
