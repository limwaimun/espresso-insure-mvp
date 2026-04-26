// EditClaimModal — edit existing claim, with full Phase B field set.
//
// B59b-1 extracted the modal as a self-contained component preserving
// the original ~5-field shape (title, type, priority, body, docs).
// B59b-2 expands to capture the 10 new claim columns introduced by the
// schema redesign, plus a 5-state status dropdown that exposes the
// claim-update API's status-transition timestamp logic.
//
// Form structure mirrors AddClaimModal:
//   - Required: title, status, type, priority
//   - Optional under "More details (optional)" collapsible: description,
//     amounts, dates, insurer fields
//   - Conditional: denial_reason renders only when status='denied'
//   - Documents: live DocList (unchanged)
//   - Read-only: status timestamps shown when set
//
// Type debt: claim is typed as Alert with the new claims-table fields
// declared as optional via type intersection. lib/types.ts still has
// Alert as the canonical type for both alerts and claims; a dedicated
// Claim interface is queued for a future cleanup batch.

'use client'

import { useState, useEffect } from 'react'
import { Save, ChevronDown, ChevronRight } from 'lucide-react'
import Modal from '@/components/Modal'
import DocList from '@/components/DocList'
import { inputStyle, labelStyle, btnPrimary, btnOutline } from '@/lib/styles'
import { formatDate } from '@/lib/dates'
import type { Alert } from '@/lib/types'

const CLAIM_TYPES = ['Health', 'Life', 'Critical Illness', 'Disability', 'Personal Accident', 'Motor', 'Travel', 'Property', 'Other']
const STATUSES: Array<{ value: string; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied', label: 'Denied' },
  { value: 'paid', label: 'Paid' },
]

// Local extension type — until lib/types.ts gets a proper Claim interface.
type ClaimRow = Alert & {
  claim_type?: string
  status?: string
  estimated_amount?: string | number | null
  approved_amount?: string | number | null
  deductible_amount?: string | number | null
  incident_date?: string | null
  filed_date?: string | null
  insurer_claim_ref?: string | null
  insurer_handler_name?: string | null
  insurer_handler_contact?: string | null
  denial_reason?: string | null
  approved_at?: string | null
  denied_at?: string | null
  paid_at?: string | null
  closed_at?: string | null
}

interface EditClaimModalProps {
  claim: Alert
  ifaId: string
  cardRefreshKey: number
  onClose: () => void
  onSaved: () => void
}

// Helper: today's date in YYYY-MM-DD format for HTML date input max= attribute.
function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

// Helper: format a string-or-number value as 'SGD X,XXX' or '—'.
function fmtMoney(v: string | number | null | undefined): string {
  if (v == null || v === '') return '—'
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (isNaN(n)) return '—'
  return `SGD ${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

// Helper: integer days between two dates (later - earlier).
function daysBetween(later: string | Date, earlier: string | Date): number {
  const a = new Date(later).getTime()
  const b = new Date(earlier).getTime()
  return Math.floor((a - b) / 86400000)
}

// Helper: convert a numeric DB value to a string suitable for an input.
// numeric(12,2) comes back as a string from postgres ("5000.00").
function numToStr(v: string | number | null | undefined): string {
  if (v == null || v === '') return ''
  return String(v)
}

export default function EditClaimModal({ claim, ifaId, cardRefreshKey, onClose, onSaved }: EditClaimModalProps) {
  const c = claim as ClaimRow

  const [form, setForm] = useState({
    title: c.title ?? '',
    type: c.claim_type ?? 'Health',
    priority: c.priority ?? 'medium',
    status: c.status ?? 'open',
    body: c.body ?? '',
    estimated_amount: numToStr(c.estimated_amount),
    approved_amount: numToStr(c.approved_amount),
    deductible_amount: numToStr(c.deductible_amount),
    incident_date: c.incident_date ?? '',
    filed_date: c.filed_date ?? '',
    insurer_claim_ref: c.insurer_claim_ref ?? '',
    insurer_handler_name: c.insurer_handler_name ?? '',
    insurer_handler_contact: c.insurer_handler_contact ?? '',
    denial_reason: c.denial_reason ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showMore, setShowMore] = useState(false)

  // Re-seed form state when parent passes a different claim.
  useEffect(() => {
    setForm({
      title: c.title ?? '',
      type: c.claim_type ?? 'Health',
      priority: c.priority ?? 'medium',
      status: c.status ?? 'open',
      body: c.body ?? '',
      estimated_amount: numToStr(c.estimated_amount),
      approved_amount: numToStr(c.approved_amount),
      deductible_amount: numToStr(c.deductible_amount),
      incident_date: c.incident_date ?? '',
      filed_date: c.filed_date ?? '',
      insurer_claim_ref: c.insurer_claim_ref ?? '',
      insurer_handler_name: c.insurer_handler_name ?? '',
      insurer_handler_contact: c.insurer_handler_contact ?? '',
      denial_reason: c.denial_reason ?? '',
    })
    setError('')
  }, [claim])

  function set<K extends keyof typeof form>(field: K, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('Title is required'); return }
    if (!ifaId)             { setError('Session error — please refresh'); return }
    if (form.incident_date && form.filed_date && form.incident_date > form.filed_date) {
      setError('Incident date cannot be later than filed date')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/claim-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId: claim.id,
          ifaId,
          title: form.title,
          claim_type: form.type,
          priority: form.priority,
          status: form.status,
          body: form.body || null,
          estimated_amount: form.estimated_amount || null,
          approved_amount: form.approved_amount || null,
          deductible_amount: form.deductible_amount || null,
          incident_date: form.incident_date || null,
          filed_date: form.filed_date || null,
          insurer_claim_ref: form.insurer_claim_ref || null,
          insurer_handler_name: form.insurer_handler_name || null,
          insurer_handler_contact: form.insurer_handler_contact || null,
          denial_reason: form.denial_reason || null,
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

  // Status timestamp display rows — only show ones that are actually set
  const timestampRows = [
    { label: 'Approved', value: c.approved_at },
    { label: 'Denied', value: c.denied_at },
    { label: 'Paid', value: c.paid_at },
    { label: 'Closed', value: c.closed_at },
  ].filter(r => r.value)

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
            <label style={labelStyle}>Status</label>
            <select
              style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
              value={form.status}
              onChange={e => set('status', e.target.value)}
            >
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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
          <label style={labelStyle}>Claim type</label>
          <select
            style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
            value={form.type}
            onChange={e => set('type', e.target.value)}
          >
            {CLAIM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Denial reason — only shown when status is denied */}
        {form.status === 'denied' && (
          <div>
            <label style={labelStyle}>Denial reason</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 } as React.CSSProperties}
              rows={2}
              value={form.denial_reason}
              onChange={e => set('denial_reason', e.target.value)}
              placeholder="Why was the claim denied?"
            />
          </div>
        )}

        {/* Collapsible "More details" — optional fields */}
        <div style={{ borderTop: '0.5px solid #F1EFE8', paddingTop: 14 }}>
          <button
            type="button"
            onClick={() => setShowMore(s => !s)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Estimated (SGD)</label>
                  <input
                    style={inputStyle}
                    type="number"
                    placeholder="e.g. 1500"
                    value={form.estimated_amount}
                    onChange={e => set('estimated_amount', e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Approved (SGD)</label>
                  <input
                    style={inputStyle}
                    type="number"
                    placeholder="e.g. 1200"
                    value={form.approved_amount}
                    onChange={e => set('approved_amount', e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Deductible (SGD)</label>
                  <input
                    style={inputStyle}
                    type="number"
                    placeholder="e.g. 100"
                    value={form.deductible_amount}
                    onChange={e => set('deductible_amount', e.target.value)}
                  />
                </div>
              </div>

              {/* Net payout — derived read-only display: approved - deductible */}
              {(() => {
                const a = form.approved_amount
                const d = form.deductible_amount
                if (!a) return null
                const aN = parseFloat(a)
                if (isNaN(aN)) return null
                const dN = d ? parseFloat(d) : 0
                const net = aN - (isNaN(dN) ? 0 : dN)
                return (
                  <div>
                    <label style={labelStyle}>Net payout (auto)</label>
                    <div style={{
                      ...inputStyle,
                      background: '#FBFAF7',
                      color: '#6B6460',
                      cursor: 'default',
                    } as React.CSSProperties}>
                      {fmtMoney(net)}
                    </div>
                  </div>
                )
              })()}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Incident date</label>
                  <input
                    style={inputStyle}
                    type="date"
                    max={todayISO()}
                    value={form.incident_date}
                    onChange={e => set('incident_date', e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Filed date</label>
                  <input
                    style={inputStyle}
                    type="date"
                    max={todayISO()}
                    value={form.filed_date}
                    onChange={e => set('filed_date', e.target.value)}
                  />
                </div>
              </div>

              {/* Derived lifecycle values — read-only. Days open derives
                  from today vs filed_date. Days to resolve from paid_at vs
                  filed_date. Both show '—' when the underlying date isn't
                  set yet. */}
              {(() => {
                const daysOpen = form.filed_date ? daysBetween(new Date(), form.filed_date) : null
                const daysToResolve = (form.filed_date && c.paid_at)
                  ? daysBetween(c.paid_at, form.filed_date)
                  : null
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Days open (auto)</label>
                      <div style={{
                        ...inputStyle,
                        background: '#FBFAF7',
                        color: '#6B6460',
                        cursor: 'default',
                      } as React.CSSProperties}>
                        {daysOpen != null ? `${daysOpen} days` : '—'}
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Days to resolve (auto)</label>
                      <div style={{
                        ...inputStyle,
                        background: '#FBFAF7',
                        color: '#6B6460',
                        cursor: 'default',
                      } as React.CSSProperties}>
                        {daysToResolve != null ? `${daysToResolve} days` : '—'}
                      </div>
                    </div>
                  </div>
                )
              })()}

              <div>
                <label style={labelStyle}>Insurer claim ref</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. AIA-CLM-2026-0042"
                  value={form.insurer_claim_ref}
                  onChange={e => set('insurer_claim_ref', e.target.value)}
                />
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

        {/* Documents — managed inline. Add/delete fire immediately
            against the server; no 'save' gesture for docs. */}
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

        {/* Status timestamps — read-only audit trail when set */}
        {timestampRows.length > 0 && (
          <div style={{ borderTop: '0.5px solid #F1EFE8', paddingTop: 12 }}>
            <div style={{ fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              Status history
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {timestampRows.map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B6460' }}>
                  <span>{r.label}</span>
                  <span style={{ fontFamily: 'DM Mono, monospace' }}>{formatDate(r.value!)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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
