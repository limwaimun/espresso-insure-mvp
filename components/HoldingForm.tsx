// Add/Edit holding modal — extracted from HoldingsSection in Batch 47.
//
// Self-contained component that owns:
//   - Form state (DEFAULT_FORM seeded from initialHolding when editing)
//   - Bidirectional units ↔ NAV ↔ value calculation
//   - Save flow (insert or update + doc upload queue for Add mode)
//   - Modal UI
//
// Parent (HoldingsSection) only needs to track which mode is open and
// which holding is being edited, then render <HoldingForm /> with the
// appropriate props. After successful save, parent's onSaved callback
// closes the modal and triggers loadHoldings().

'use client'

import type { Holding } from '@/lib/types'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/Modal'
import DocUploadField from '@/components/DocUploadField'
import DocList from '@/components/DocList'
import { Save } from 'lucide-react'
import { inputStyle, labelStyle, btnPrimary, btnOutline } from '@/lib/styles'
import {
  ASSET_CLASSES, GEOGRAPHIES, SECTORS,
  DEFAULT_FORM, holdingToFormValues, formToPayload,
} from '@/lib/holdings-form'

interface HoldingFormProps {
  mode: 'add' | 'edit'
  initialHolding?: Holding   // required when mode === 'edit'
  clientId: string
  faId: string
  onClose: () => void        // user clicked Cancel or X
  onSaved: () => void        // save succeeded — parent should close + reload
}

export default function HoldingForm({
  mode, initialHolding, clientId, faId, onClose, onSaved,
}: HoldingFormProps) {
  const supabase = createClient()
  const [form, setForm] = useState(
    mode === 'edit' && initialHolding
      ? holdingToFormValues(initialHolding)
      : DEFAULT_FORM
  )
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  // Document upload queue for Add mode (Edit mode uses <DocList editable /> instead).
  // Files are uploaded AFTER the holding insert returns the new ID.
  const [holdingFiles, setHoldingFiles] = useState<File[]>([])

  const editingHoldingId = mode === 'edit' && initialHolding ? initialHolding.id : null

  // ── Bidirectional calculation — units × NAV = value, pick any two ──────
  // Units are the fixed anchor (from statement), so when value changes we
  // back-calc NAV (not units). When units or NAV changes we recompute value.
  function setUnits(v: string) {
    setForm(p => {
      const next = { ...p, units_held: v }
      if (v && p.last_nav) {
        next.current_value = (Number(v) * Number(p.last_nav)).toFixed(2)
      }
      return next
    })
  }
  function setNav(v: string) {
    setForm(p => {
      const next = { ...p, last_nav: v }
      if (p.units_held && v) {
        next.current_value = (Number(p.units_held) * Number(v)).toFixed(2)
      }
      return next
    })
  }
  function setValue(v: string) {
    setForm(p => {
      const next = { ...p, current_value: v }
      if (v && p.units_held && Number(p.units_held) > 0) {
        next.last_nav = (Number(v) / Number(p.units_held)).toFixed(4)
      }
      return next
    })
  }

  async function saveHolding() {
    if (!form.product_name.trim()) { setFormError('Product name is required'); return }
    if (!form.provider.trim())     { setFormError('Provider is required'); return }
    setSaving(true)
    setFormError('')
    const payload = formToPayload(form, clientId, faId)
    try {
      let holdingId: string | null = editingHoldingId
      if (editingHoldingId) {
        const { error } = await supabase.from('holdings').update(payload).eq('id', editingHoldingId)
        if (error) throw error
      } else {
        // Insert and grab the new ID so we can attach the document
        const { data, error } = await supabase.from('holdings').insert(payload).select('id').single()
        if (error) throw error
        holdingId = data?.id ?? null
      }

      // Upload queued documents. Only relevant for Add mode — Edit mode
      // manages docs live via <DocList editable />, so the queue is empty there.
      if (!editingHoldingId && holdingFiles.length > 0 && holdingId) {
        const failures: string[] = []
        for (const file of holdingFiles) {
          const fd = new FormData()
          fd.append('file', file)
          fd.append('holdingId', holdingId)
          const res = await fetch('/api/holding-doc', { method: 'POST', body: fd })
          if (!res.ok) {
            const d = await res.json().catch(() => ({}))
            console.warn('[holdings] doc upload failed:', d)
            failures.push(`${file.name}: ${d.error ?? `HTTP ${res.status}`}`)
          }
        }
        if (failures.length) {
          // Partial success: holding saved, some docs failed. Keep modal open
          // with the error so user can retry uploads. Trigger parent reload
          // so the holdings table reflects the new row.
          setFormError(`Holding saved, but some uploads failed — ${failures.join('; ')}`)
          setSaving(false)
          onSaved()
          return
        }
      }

      onSaved()
    } catch {
      setFormError('Something went wrong — please try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={mode === 'edit' ? 'Edit holding' : 'Add holding'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Type</label>
            <select value={form.product_type} onChange={e => setForm(p => ({ ...p, product_type: e.target.value }))} style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}>
              <option value="unit_trust">Unit Trust</option>
              <option value="etf">ETF</option>
              <option value="ilp">ILP</option>
              <option value="annuity">Annuity</option>
              <option value="structured_product">Structured Product</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Risk rating</label>
            <select value={form.risk_rating} onChange={e => setForm(p => ({ ...p, risk_rating: e.target.value }))} style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}>
              <option value="">—</option>
              <option value="conservative">Conservative</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Product name *</label>
          <input
            placeholder="e.g. Infinity US 500 Stock Index Fund"
            value={form.product_name}
            onChange={e => setForm(p => ({ ...p, product_name: e.target.value }))}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Provider / Fund house *</label>
          <input
            placeholder="e.g. Lion Global, BlackRock, Schroders"
            value={form.provider}
            onChange={e => setForm(p => ({ ...p, provider: e.target.value }))}
            style={inputStyle}
          />
        </div>

        {/* Batch 8: Classification — Asset class / Region / Sector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Asset class</label>
            <select
              value={form.asset_class}
              onChange={e => setForm(p => ({ ...p, asset_class: e.target.value }))}
              style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
            >
              <option value="">—</option>
              {ASSET_CLASSES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Region</label>
            <select
              value={form.geography}
              onChange={e => setForm(p => ({ ...p, geography: e.target.value }))}
              style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
            >
              <option value="">—</option>
              {GEOGRAPHIES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Sector</label>
            <select
              value={form.sector}
              onChange={e => setForm(p => ({ ...p, sector: e.target.value }))}
              style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
            >
              <option value="">—</option>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Conditional "Other" text inputs — only when user selects Other */}
        {(form.asset_class === 'Other' || form.geography === 'Other' || form.sector === 'Other') && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>{form.asset_class === 'Other' && (
              <input placeholder="Specify asset class" value={form.asset_class_other}
                onChange={e => setForm(p => ({ ...p, asset_class_other: e.target.value }))}
                style={inputStyle} />
            )}</div>
            <div>{form.geography === 'Other' && (
              <input placeholder="Specify region" value={form.geography_other}
                onChange={e => setForm(p => ({ ...p, geography_other: e.target.value }))}
                style={inputStyle} />
            )}</div>
            <div>{form.sector === 'Other' && (
              <input placeholder="Specify sector" value={form.sector_other}
                onChange={e => setForm(p => ({ ...p, sector_other: e.target.value }))}
                style={inputStyle} />
            )}</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Platform</label>
            <input
              placeholder="e.g. FSMOne, Endowus, Phillip"
              value={form.platform}
              onChange={e => setForm(p => ({ ...p, platform: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Inception date</label>
            <input
              type="date"
              value={form.inception_date}
              onChange={e => setForm(p => ({ ...p, inception_date: e.target.value }))}
              style={{ ...inputStyle, colorScheme: 'dark' } as React.CSSProperties}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Units held</label>
            <input
              type="number"
              placeholder="e.g. 1234.56"
              value={form.units_held}
              onChange={e => setUnits(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Last NAV</label>
            <input
              type="number"
              placeholder="e.g. 1.2340"
              value={form.last_nav}
              onChange={e => setNav(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Current value</label>
            <input
              type="number"
              placeholder="Auto-calculated or manual"
              value={form.current_value}
              onChange={e => setValue(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Currency</label>
            <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}>
              <option value="SGD">SGD</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="AUD">AUD</option>
              <option value="HKD">HKD</option>
              <option value="CNY">CNY</option>
            </select>
          </div>
        </div>

        {/* Batch 8: Avg. cost price — with live "Total invested" readout */}
        <div>
          <label style={labelStyle}>Avg. cost price (per unit)</label>
          <input
            type="number"
            placeholder="From broker statement. Leave blank if unknown."
            value={form.avg_cost_price}
            onChange={e => setForm(p => ({ ...p, avg_cost_price: e.target.value }))}
            style={inputStyle}
          />
          {form.avg_cost_price && form.units_held && (
            <div style={{ fontSize: 11, color: '#6B6460', marginTop: 6, fontStyle: 'italic' }}>
              Total invested: {form.currency} {(Number(form.avg_cost_price) * Number(form.units_held))
                .toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          )}
        </div>

        {/* Batch 8: Distribution yield — with live "Est. annual income" readout */}
        <div>
          <label style={labelStyle}>Distribution yield (% p.a.)</label>
          <input
            type="number"
            placeholder="e.g. 5.2 — for income-paying funds"
            value={form.distribution_yield}
            onChange={e => setForm(p => ({ ...p, distribution_yield: e.target.value }))}
            style={inputStyle}
          />
          {form.distribution_yield && form.current_value && (
            <div style={{ fontSize: 11, color: '#6B6460', marginTop: 6, fontStyle: 'italic' }}>
              Est. annual income: {form.currency} {((Number(form.distribution_yield) / 100) * Number(form.current_value))
                .toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>Notes</label>
          <textarea
            placeholder="Any suitability notes or context"
            rows={2}
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 } as React.CSSProperties}
          />
        </div>

        {/* Document handling depends on mode:
             • Add: queue files with DocUploadField (multi), uploaded after the
               holding row is created (we need an ID first).
             • Edit: use live DocList against the existing holding — add and
               delete happen immediately. */}
        {editingHoldingId ? (
          <DocList
            parentId={editingHoldingId}
            apiEndpoint="/api/holding-doc"
            parentParam="holdingId"
            label="Documents"
            editable
          />
        ) : (
          <DocUploadField
            multi
            label="Documents"
            files={holdingFiles}
            onFilesChange={setHoldingFiles}
            onError={msg => setFormError(msg)}
          />
        )}

        {formError && <p style={{ fontSize: 12, color: '#A32D2D', margin: 0 }}>{formError}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={saveHolding}
            disabled={saving}
            style={{ ...btnPrimary, flex: 1, justifyContent: 'center', opacity: saving ? 0.6 : 1 }}
          >
            <Save size={14} />
            {saving ? 'Saving…' : (editingHoldingId ? 'Save changes' : 'Save holding')}
          </button>
          <button onClick={onClose} style={btnOutline}>Cancel</button>
        </div>
      </div>
    </Modal>
  )
}
