// PolicyForm — add or edit a policy.
//
// Sixth of seven planned modal extractions from ClientDetailPage.tsx.
// Mirrors HoldingForm: dual-mode (add | edit), doc upload queue for add,
// live DocList for edit, identical field layout in both modes.
//
// Self-contained: owns form state, validation, two-endpoint save flow,
// doc upload queue. Parent owns the trigger state (showAddPolicy +
// editingPolicy) and calls back into bumpCardRefresh on close + appends
// to localActivity on add success.
//
// Save endpoints differ by mode:
//   - Add:  POST /api/policy-add    -> grab policy.id from response
//                                    -> sequential POST /api/policy-doc
//                                       for each queued file
//   - Edit: POST /api/policy-update (DocList handles docs live)

'use client'

import { useState } from 'react'
import { Save, Plus } from 'lucide-react'
import Modal from '@/components/Modal'
import DocUploadField from '@/components/DocUploadField'
import DocList from '@/components/DocList'
import { inputStyle, labelStyle, btnPrimary, btnOutline } from '@/lib/styles'
import type { Policy } from './PolicyRow'

const INSURERS = ['AIA', 'Great Eastern', 'Prudential', 'NTUC Income', 'Manulife', 'AXA', 'Aviva', 'Tokio Marine', 'Singlife', 'FWD', 'Etiqa', 'Other']
const POLICY_TYPES = ['Life', 'Health', 'Critical Illness', 'Disability', 'Motor', 'Travel', 'Property', 'Professional Indemnity', 'Group Health', 'Group Life', 'Fire', 'Business Interruption', 'Keyman', 'D&O', 'Cyber', 'Workers Compensation', 'Public Liability', 'Marine']

const DEFAULT_FORM = {
  insurer: '',
  product_name: '',
  policy_number: '',
  type: '',
  premium: '',
  premium_frequency: 'annual',
  sum_assured: '',
  start_date: '',
  renewal_date: '',
  status: 'active',
  notes: '',
}

interface PolicyFormProps {
  mode: 'add' | 'edit'
  initialPolicy?: Policy
  clientId: string
  ifaId: string
  onClose: () => void
  /**
   * Called after a successful save. For add mode, includes the human-readable
   * activity string the parent appends to localActivity. For edit mode,
   * the activityText is undefined.
   */
  onSaved: (activityText?: string) => void
}

function policyToFormValues(policy: Policy) {
  return {
    insurer: policy.insurer ?? '',
    product_name: policy.product_name ?? '',
    policy_number: policy.policy_number ?? '',
    type: policy.type ?? '',
    premium: policy.premium != null ? String(policy.premium) : '',
    premium_frequency: policy.premium_frequency ?? 'annual',
    sum_assured: policy.sum_assured != null ? String(policy.sum_assured) : '',
    start_date: policy.start_date ?? '',
    renewal_date: policy.renewal_date ?? '',
    status: policy.status ?? 'active',
    notes: policy.notes ?? '',
  }
}

export default function PolicyForm({
  mode, initialPolicy, clientId, ifaId, onClose, onSaved,
}: PolicyFormProps) {
  const [form, setForm] = useState(
    mode === 'edit' && initialPolicy
      ? policyToFormValues(initialPolicy)
      : DEFAULT_FORM
  )
  const [files, setFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const editingPolicyId = mode === 'edit' && initialPolicy ? initialPolicy.id : null

  function set<K extends keyof typeof form>(field: K, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  async function handleSave() {
    if (!form.insurer || !form.type || !form.premium) {
      setError('Insurer, type and premium are required')
      return
    }
    if (!ifaId) {
      setError('Session error — please refresh the page')
      return
    }
    setSaving(true)
    try {
      const isEdit = !!editingPolicyId
      const endpoint = isEdit ? '/api/policy-update' : '/api/policy-add'
      const payload = isEdit
        ? {
            policyId: editingPolicyId,
            ifaId,
            ...form,
            premium: parseFloat(form.premium),
            sum_assured: form.sum_assured ? parseFloat(form.sum_assured) : null,
          }
        : {
            clientId,
            ifaId,
            ...form,
            premium: parseFloat(form.premium),
            sum_assured: form.sum_assured ? parseFloat(form.sum_assured) : null,
          }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed')
        setSaving(false)
        return
      }

      // Upload queued docs. Add mode queues via DocUploadField; Edit mode
      // manages docs live via <DocList editable /> so queue is always empty.
      const newPolicy = isEdit ? null : await res.json()
      const targetPolicyId = isEdit ? editingPolicyId : newPolicy?.policy?.id
      if (!isEdit && files.length > 0 && targetPolicyId) {
        const failures: string[] = []
        for (const file of files) {
          const fd = new FormData()
          fd.append('file', file)
          fd.append('policyId', targetPolicyId)
          fd.append('ifaId', ifaId)
          const r = await fetch('/api/policy-doc', { method: 'POST', body: fd })
          if (!r.ok) {
            const d = await r.json().catch(() => ({}))
            console.error('[policy-doc POST] failed:', r.status, d)
            failures.push(`${file.name}: ${d.error ?? `HTTP ${r.status}`}`)
          }
        }
        if (failures.length) {
          setError(`Policy created, but some uploads failed — ${failures.join('; ')}`)
          setSaving(false)
          return
        }
      }

      // Activity text — only on add. Edits don't get a timeline line.
      const activityText = !isEdit
        ? `${form.insurer} ${form.type} added ($${parseFloat(form.premium).toLocaleString()}/yr)`
        : undefined

      onSaved(activityText)
    } catch {
      setError('Something went wrong — please try again')
      setSaving(false)
    }
  }

  return (
    <Modal title={mode === 'edit' ? 'Edit policy' : 'Add policy'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Group 1: Identifiers */}
        <div>
          <label style={labelStyle}>Insurer *</label>
          <select
            style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
            value={form.insurer}
            onChange={e => set('insurer', e.target.value)}
          >
            <option value="">Select insurer…</option>
            {INSURERS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Product name</label>
          <input
            style={inputStyle}
            placeholder="e.g. AIA Life Treasure II"
            value={form.product_name}
            onChange={e => set('product_name', e.target.value)}
          />
        </div>

        <div>
          <label style={labelStyle}>Policy number</label>
          <input
            style={inputStyle}
            placeholder="e.g. AIA-2024-12345"
            value={form.policy_number}
            onChange={e => set('policy_number', e.target.value)}
          />
        </div>

        <div>
          <label style={labelStyle}>Policy type *</label>
          <select
            style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
            value={form.type}
            onChange={e => set('type', e.target.value)}
          >
            <option value="">Select type…</option>
            {POLICY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Group 2: Money */}
        <div style={{ borderTop: '0.5px solid #E8E2DA', paddingTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Annual premium (SGD) *</label>
            <input
              style={inputStyle}
              type="number"
              placeholder="e.g. 3600"
              value={form.premium}
              onChange={e => set('premium', e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Frequency</label>
            <select
              style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
              value={form.premium_frequency}
              onChange={e => set('premium_frequency', e.target.value)}
            >
              <option value="annual">Annual</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="half-yearly">Half-yearly</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Sum assured (SGD)</label>
            <input
              style={inputStyle}
              type="number"
              placeholder="e.g. 500000"
              value={form.sum_assured}
              onChange={e => set('sum_assured', e.target.value)}
            />
          </div>
        </div>

        {/* Group 3: Dates */}
        <div style={{ borderTop: '0.5px solid #E8E2DA', paddingTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Start date</label>
            <input
              style={inputStyle}
              type="date"
              value={form.start_date}
              onChange={e => set('start_date', e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Renewal date</label>
            <input
              style={inputStyle}
              type="date"
              value={form.renewal_date}
              onChange={e => set('renewal_date', e.target.value)}
            />
          </div>
        </div>

        {/* Group 4: Metadata */}
        <div style={{ borderTop: '0.5px solid #E8E2DA', paddingTop: 14 }}>
          <label style={labelStyle}>Status</label>
          <select
            style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
            value={form.status}
            onChange={e => set('status', e.target.value)}
          >
            <option value="active">Active</option>
            <option value="lapsed">Lapsed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Notes</label>
          <textarea
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 } as React.CSSProperties}
            rows={2}
            placeholder="e.g. Single mother, 2 young kids"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </div>

        {/* Document handling depends on mode */}
        {editingPolicyId ? (
          <DocList
            parentId={editingPolicyId}
            apiEndpoint="/api/policy-doc"
            parentParam="policyId"
            label="Documents"
            editable
          />
        ) : (
          <DocUploadField
            multi
            label="Documents"
            files={files}
            onFilesChange={setFiles}
            onError={msg => setError(msg)}
          />
        )}

        {error && <p style={{ fontSize: 12, color: '#A32D2D', margin: 0 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ ...btnPrimary, flex: 1, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}
          >
            {editingPolicyId ? <Save size={14} /> : <Plus size={14} />}
            {saving ? 'Saving…' : (editingPolicyId ? 'Save changes' : 'Add policy')}
          </button>
          <button onClick={onClose} style={btnOutline}>Cancel</button>
        </div>
      </div>
    </Modal>
  )
}
