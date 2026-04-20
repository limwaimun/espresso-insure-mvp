'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import PortalMenu from '@/components/PortalMenu'
import Modal from '@/components/Modal'
import {
  Plus, Save, Bot, Pencil, Trash2, Check, Copy, Compass,
  ChevronDown, ChevronRight, MoreVertical,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface Holding {
  id: string
  product_type: string
  product_name: string
  provider: string
  platform: string | null
  units_held: number | null
  last_nav: number | null
  last_nav_date: string | null
  current_value: number | null
  currency: string
  risk_rating: string | null
  last_reviewed_at: string | null
  inception_date: string | null
  notes: string | null
}

// ── Constants ──────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  unit_trust: 'Unit trust',
  etf: 'ETF',
  ilp: 'ILP',
  annuity: 'Annuity',
  structured_product: 'Structured',
  other: 'Other',
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  unit_trust: { bg: '#E6F1FB', text: '#185FA5' },
  etf:        { bg: '#EAF3DE', text: '#27500A' },
  ilp:        { bg: '#FAEEDA', text: '#854F0B' },
  annuity:    { bg: '#EEEDFE', text: '#3C3489' },
  structured_product: { bg: '#FCEBEB', text: '#A32D2D' },
  other:      { bg: '#F1EFE8', text: '#5F5E5A' },
}

const RISK_LABELS: Record<string, string> = {
  low: 'Low risk',
  medium: 'Moderate risk',
  high: 'High risk',
  very_high: 'Very high risk',
}

// ── Styles — matched 1:1 to ClientDetailPage so Holdings looks native to the card ──

// Column header cell — exact match to Policies table <th> styling
const thBase: React.CSSProperties = {
  textAlign: 'left', padding: '10px', fontSize: 10, color: '#9B9088',
  textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500,
  borderBottom: '0.5px solid #E8E2DA',
}
const thCell = (widthPct: number, rightAlign = false): React.CSSProperties => ({
  ...thBase, width: `${widthPct}%`, textAlign: rightAlign ? 'right' : 'left',
})

// Outlined amber "+ Add X" button — exact match to ClientDetailPage's btnAddSection
const btnAddSection: React.CSSProperties = {
  fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#BA7517',
  background: 'transparent', border: '1px solid #BA7517', borderRadius: 6,
  padding: '6px 12px', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 4,
}

// Modal form styles — match ClientDetailPage exactly
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#FFFFFF', border: '0.5px solid #E8E2DA',
  borderRadius: 8, padding: '10px 13px', fontSize: 13, color: '#1A1410',
  outline: 'none', fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  fontSize: 11, color: '#6B6460', textTransform: 'uppercase',
  letterSpacing: '0.08em', marginBottom: 5, display: 'block',
}
const btnPrimary: React.CSSProperties = {
  background: '#BA7517', color: '#F7F4F0', border: 'none',
  borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
  display: 'flex', alignItems: 'center', gap: 6,
}
const btnOutline: React.CSSProperties = {
  background: 'transparent', color: '#6B6460', border: '0.5px solid #E8E2DA',
  borderRadius: 8, padding: '10px 20px', fontSize: 13,
  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
}

// ── Helpers ────────────────────────────────────────────────────────────────

// Returns a pill class name matching the global pill-* CSS classes Policies uses.
function reviewPill(last_reviewed_at: string | null): { cls: string; text: string } {
  if (!last_reviewed_at) return { cls: 'pill-red', text: 'Never reviewed' }
  const days = Math.floor((Date.now() - new Date(last_reviewed_at).getTime()) / 86400000)
  if (days <= 30)  return { cls: 'pill-green', text: days === 0 ? 'Today' : `Reviewed ${days}d ago` }
  if (days <= 180) return { cls: 'pill-amber', text: `Reviewed ${days}d ago` }
  return                   { cls: 'pill-red',   text: `Reviewed ${days}d ago` }
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── HoldingRow ─────────────────────────────────────────────────────────────

function HoldingRow({ holding, onEdit, onAskMaya, onMarkReviewed, onDelete }: {
  holding: Holding
  onEdit: (h: Holding) => void
  onAskMaya: (h: Holding, action: 'review' | 'client_update') => void
  onMarkReviewed: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLButtonElement>(null)

  const typeColor = TYPE_COLORS[holding.product_type] || TYPE_COLORS.other
  const typeLabel = TYPE_LABELS[holding.product_type] || 'Other'
  const pill = reviewPill(holding.last_reviewed_at)

  return (
    <>
      {/* Main row */}
      <tr
        onClick={() => setExpanded(v => !v)}
        style={{ cursor: 'pointer', borderBottom: expanded ? 'none' : '0.5px solid #F1EFE8' }}
      >
        {/* Product (chevron + name + provider/platform subtitle) */}
        <td style={{ padding: '12px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {expanded
              ? <ChevronDown size={12} color="#9B9088" />
              : <ChevronRight size={12} color="#9B9088" />}
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 500, color: '#1A1410',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {holding.product_name}
              </div>
              <div style={{ fontSize: 11, color: '#6B6460', marginTop: 2 }}>
                {holding.provider}{holding.platform ? ` · ${holding.platform}` : ''}
              </div>
            </div>
          </div>
        </td>

        {/* Type · Risk */}
        <td style={{ padding: '12px 10px' }}>
          <span style={{
            background: typeColor.bg, color: typeColor.text,
            fontSize: 11, fontWeight: 500,
            padding: '3px 9px', borderRadius: 4, display: 'inline-block',
          }}>
            {typeLabel}
          </span>
          {holding.risk_rating && (
            <div style={{ fontSize: 11, color: '#6B6460', marginTop: 4 }}>
              {RISK_LABELS[holding.risk_rating] || holding.risk_rating}
            </div>
          )}
        </td>

        {/* Value */}
        <td style={{ padding: '12px 10px' }}>
          <div style={{ fontSize: 13, color: '#1A1410' }}>
            {holding.current_value != null
              ? `${holding.currency} ${Number(holding.current_value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
              : '—'}
          </div>
        </td>

        {/* Units @ NAV */}
        <td style={{ padding: '12px 10px' }}>
          {holding.units_held != null && holding.last_nav != null ? (
            <>
              <div style={{ fontSize: 13, color: '#1A1410' }}>
                {Number(holding.units_held).toLocaleString(undefined, { maximumFractionDigits: 3 })}
              </div>
              <div style={{ fontSize: 11, color: '#6B6460', marginTop: 2 }}>
                @ {Number(holding.last_nav).toFixed(4)}
              </div>
            </>
          ) : (
            <span style={{ fontSize: 13, color: '#9B9088' }}>—</span>
          )}
        </td>

        {/* Reviewed pill — uses global pill classes for parity with Policies status pill */}
        <td style={{ padding: '12px 10px' }}>
          <span className={`pill ${pill.cls}`}>{pill.text}</span>
        </td>

        {/* ⋮ menu */}
        <td style={{ padding: '12px 10px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
          <button
            ref={menuRef}
            onClick={() => setMenuOpen(o => !o)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: 4, opacity: 0.5, display: 'flex', alignItems: 'center',
              marginLeft: 'auto',
            }}
            title="Actions"
          >
            <MoreVertical size={14} color="#6B6460" />
          </button>
          <PortalMenu
            anchorRef={menuRef as React.RefObject<HTMLElement>}
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            items={[
              { icon: <Bot size={12} color="#BA7517" />, label: 'Review with Maya',       onClick: () => onAskMaya(holding, 'review'),        accent: true },
              { icon: <Bot size={12} color="#BA7517" />, label: 'Draft client update',    onClick: () => onAskMaya(holding, 'client_update'), accent: true },
              { icon: <Check size={12} color="#0F6E56" />,  label: 'Mark reviewed',       onClick: () => onMarkReviewed(holding.id),          dividerBefore: true },
              { icon: <Pencil size={12} color="#6B6460" />, label: 'Edit holding',        onClick: () => onEdit(holding) },
              { icon: <Trash2 size={12} />,                 label: 'Delete holding',      onClick: () => onDelete(holding.id),                danger: true, dividerBefore: true },
            ]}
          />
        </td>
      </tr>

      {/* Expanded detail — fields spread evenly via auto-fit grid so 5+ fields balance */}
      {expanded && (
        <tr style={{ borderBottom: '0.5px solid #F1EFE8', background: '#FBFAF7' }}>
          <td colSpan={6} style={{ padding: '20px 24px 22px 34px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '16px 24px',
              marginBottom: holding.notes ? 16 : 0,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Inception</span>
                <span style={{ fontSize: 13, color: '#1A1410' }}>{formatDate(holding.inception_date)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Currency</span>
                <span style={{ fontSize: 13, color: '#1A1410' }}>{holding.currency}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Platform</span>
                <span style={{ fontSize: 13, color: '#1A1410' }}>{holding.platform || '—'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Risk rating</span>
                <span style={{ fontSize: 13, color: '#1A1410' }}>{holding.risk_rating ? (RISK_LABELS[holding.risk_rating] || holding.risk_rating) : '—'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Last NAV date</span>
                <span style={{ fontSize: 13, color: '#1A1410' }}>{formatDate(holding.last_nav_date)}</span>
              </div>
            </div>
            {holding.notes && (
              <div style={{ paddingTop: 14, borderTop: '0.5px solid #F1EFE8' }}>
                <div style={{ fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Notes</div>
                <div style={{ fontSize: 13, color: '#6B6460', lineHeight: 1.6 }}>{holding.notes}</div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

// ── Main section ───────────────────────────────────────────────────────────

const DEFAULT_FORM = {
  product_type: 'unit_trust',
  product_name: '',
  provider: '',
  platform: '',
  units_held: '',
  last_nav: '',
  current_value: '',
  currency: 'SGD',
  risk_rating: 'medium',
  inception_date: '',
  notes: '',
}

export default function HoldingsSection({ clientId, ifaId }: { clientId: string; ifaId: string }) {
  const supabase = createClient()
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)

  // Form modal state — handles both add and edit
  const [showForm, setShowForm] = useState(false)
  const [editingHoldingId, setEditingHoldingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [formError, setFormError] = useState('')

  // Harbour review script
  const [harbourScript, setHarbourScript] = useState<string | null>(null)
  const [loadingHarbour, setLoadingHarbour] = useState(false)
  const [copiedHarbour, setCopiedHarbour] = useState(false)

  // Maya action stub — preview of the prompt that will be sent
  const [mayaStub, setMayaStub] = useState<{ title: string; prompt: string } | null>(null)

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadHoldings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  async function loadHoldings() {
    const { data } = await supabase
      .from('holdings')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    setHoldings(data || [])
    setLoading(false)
  }

  function openAdd() {
    setForm(DEFAULT_FORM)
    setEditingHoldingId(null)
    setFormError('')
    setShowForm(true)
  }

  function openEdit(h: Holding) {
    setForm({
      product_type: h.product_type,
      product_name: h.product_name,
      provider: h.provider,
      platform: h.platform ?? '',
      units_held: h.units_held != null ? String(h.units_held) : '',
      last_nav: h.last_nav != null ? String(h.last_nav) : '',
      current_value: h.current_value != null ? String(h.current_value) : '',
      currency: h.currency,
      risk_rating: h.risk_rating ?? 'medium',
      inception_date: h.inception_date ?? '',
      notes: h.notes ?? '',
    })
    setEditingHoldingId(h.id)
    setFormError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingHoldingId(null)
    setForm(DEFAULT_FORM)
    setFormError('')
  }

  async function saveHolding() {
    if (!form.product_name.trim()) { setFormError('Product name is required'); return }
    if (!form.provider.trim())     { setFormError('Provider is required'); return }
    setSaving(true)
    setFormError('')
    const autoValue = form.units_held && form.last_nav
      ? Number(form.units_held) * Number(form.last_nav)
      : null
    const payload: any = {
      client_id: clientId,
      ifa_id: ifaId,
      product_type: form.product_type,
      product_name: form.product_name,
      provider: form.provider,
      platform: form.platform || null,
      units_held: form.units_held ? Number(form.units_held) : null,
      last_nav: form.last_nav ? Number(form.last_nav) : null,
      current_value: form.current_value ? Number(form.current_value) : autoValue,
      currency: form.currency,
      risk_rating: form.risk_rating,
      inception_date: form.inception_date || null,
      notes: form.notes || null,
    }
    try {
      if (editingHoldingId) {
        await supabase.from('holdings').update(payload).eq('id', editingHoldingId)
      } else {
        await supabase.from('holdings').insert(payload)
      }
      closeForm()
      loadHoldings()
    } catch {
      setFormError('Something went wrong — please try again')
    } finally {
      setSaving(false)
    }
  }

  async function markReviewed(holdingId: string) {
    await supabase.from('holdings').update({ last_reviewed_at: new Date().toISOString() }).eq('id', holdingId)
    loadHoldings()
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return
    setDeleting(true)
    await supabase.from('holdings').delete().eq('id', confirmDeleteId)
    setConfirmDeleteId(null)
    setDeleting(false)
    loadHoldings()
  }

  // Maya stubs — preview of the prompt that will be sent once agent wiring is done (Batch 3)
  function askMayaStub(h: Holding, action: 'review' | 'client_update') {
    if (action === 'review') {
      setMayaStub({
        title: `Review ${h.product_name} with Maya`,
        prompt: `Please review this holding for my client and share:
1. A short plain-English explanation of what this fund/product is
2. Its suitability given the client's risk rating (${h.risk_rating || 'unspecified'})
3. Any recent market context I should know before the next client review
4. Suggested talking points for the conversation

Holding: ${h.product_name}
Provider: ${h.provider}${h.platform ? ` (${h.platform})` : ''}
Type: ${TYPE_LABELS[h.product_type] || h.product_type}
Current value: ${h.currency} ${Number(h.current_value || 0).toLocaleString()}
Units: ${h.units_held ?? '—'} @ ${h.last_nav ?? '—'} (last NAV)
Inception: ${h.inception_date || '—'}
Last reviewed: ${h.last_reviewed_at ? new Date(h.last_reviewed_at).toLocaleDateString() : 'Never'}
Notes: ${h.notes || 'None'}`,
      })
    } else {
      setMayaStub({
        title: `Draft client update for ${h.product_name}`,
        prompt: `Draft a warm, concise update message I can send to my client about their ${h.product_name} holding.

Include:
- A friendly greeting using the client's first name
- A brief note on recent performance (current value ${h.currency} ${Number(h.current_value || 0).toLocaleString()})
- Any relevant market context for ${TYPE_LABELS[h.product_type] || h.product_type}
- An offer to discuss at the next review
- A warm sign-off

Keep it under 150 words. Tone: professional but personal.`,
      })
    }
  }

  async function getHarbourScript() {
    setLoadingHarbour(true)
    try {
      const res = await fetch('/api/harbour', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ifaId, clientId, mode: 'client_review' }),
      })
      const data = await res.json()
      setHarbourScript(data.review?.mayaScript || null)
    } catch { /* silent */ }
    setLoadingHarbour(false)
  }

  async function copyHarbour() {
    if (!harbourScript) return
    await navigator.clipboard.writeText(harbourScript)
    setCopiedHarbour(true)
    setTimeout(() => setCopiedHarbour(false), 1800)
  }

  const totalValue = holdings.reduce((s, h) => s + (Number(h.current_value) || 0), 0)
  const headerCurrency = holdings[0]?.currency || 'SGD'

  if (loading) return null

  const hasRows = holdings.length > 0

  return (
    <div className="panel" style={{ marginBottom: 24 }}>
      {/* Header — matches Policies panel-header structure */}
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span className="panel-title">Investments &amp; holdings</span>
          {hasRows && (
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460' }}>
              {headerCurrency} {totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {hasRows && (
            <button
              onClick={getHarbourScript}
              disabled={loadingHarbour}
              style={{ ...btnAddSection, opacity: loadingHarbour ? 0.6 : 1 }}
            >
              <Compass size={12} />
              {loadingHarbour ? 'Loading…' : 'Review script'}
            </button>
          )}
          <button onClick={openAdd} style={btnAddSection}>
            <Plus size={12} />
            Add holding
          </button>
        </div>
      </div>

      <div className="panel-body">
        {/* Harbour review script card — cream palette matching Coverage analysis */}
        {harbourScript && (
          <div style={{ padding: '14px 16px', background: '#FAEEDA', borderRadius: 8, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Bot size={12} color="#BA7517" />
              <span style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#854F0B',
                fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>
                Harbour · review script for Maya
              </span>
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410',
              lineHeight: 1.6, fontStyle: 'italic', marginBottom: 10,
            }}>
              &ldquo;{harbourScript}&rdquo;
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={copyHarbour} style={{ ...btnAddSection, padding: '5px 12px', fontSize: 11 }}>
                {copiedHarbour ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
              </button>
              <button
                onClick={() => setHarbourScript(null)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088',
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Holdings table — exact parity with Policies table structure */}
        {hasRows ? (
          <div className="table">
            <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thCell(28)}>Product</th>
                  <th style={thCell(18)}>Type · Risk</th>
                  <th style={thCell(16)}>Value</th>
                  <th style={thCell(14)}>Units @ NAV</th>
                  <th style={thCell(18)}>Reviewed</th>
                  <th style={{ ...thBase, width: '6%' }}></th>
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => (
                  <HoldingRow
                    key={h.id}
                    holding={h}
                    onEdit={openEdit}
                    onAskMaya={askMayaStub}
                    onMarkReviewed={markReviewed}
                    onDelete={(id) => setConfirmDeleteId(id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            padding: 20, textAlign: 'center',
            fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460',
          }}>
            No investment holdings recorded yet
          </div>
        )}
      </div>

      {/* == ADD / EDIT HOLDING MODAL == */}
      {showForm && (
        <Modal title={editingHoldingId ? 'Edit holding' : 'Add holding'} onClose={closeForm}>
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
                  <option value="low">Low</option>
                  <option value="medium">Moderate</option>
                  <option value="high">High</option>
                  <option value="very_high">Very High</option>
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
                  onChange={e => setForm(p => ({ ...p, units_held: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Last NAV</label>
                <input
                  type="number"
                  placeholder="e.g. 1.2340"
                  value={form.last_nav}
                  onChange={e => setForm(p => ({ ...p, last_nav: e.target.value }))}
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
                  onChange={e => setForm(p => ({ ...p, current_value: e.target.value }))}
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
              <button onClick={closeForm} style={btnOutline}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* == MAYA STUB MODAL == */}
      {mayaStub && (
        <Modal title={mayaStub.title} onClose={() => setMayaStub(null)}>
          <div style={{ background: '#FAEEDA', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <Bot size={14} color="#BA7517" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12, color: '#854F0B', lineHeight: 1.5 }}>
              Coming soon — Maya agent integration in progress. Preview of the prompt that will be sent:
            </span>
          </div>
          <pre style={{
            background: '#FBFAF7', border: '0.5px solid #F1EFE8', borderRadius: 8,
            padding: '12px 14px', fontSize: 12, color: '#1A1410', lineHeight: 1.6,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            {mayaStub.prompt}
          </pre>
        </Modal>
      )}

      {/* == DELETE CONFIRM MODAL == */}
      {confirmDeleteId && (
        <Modal title="Delete this holding?" onClose={() => { if (!deleting) setConfirmDeleteId(null) }}>
          <div style={{ fontSize: 13, color: '#6B6460', marginBottom: 20, lineHeight: 1.6 }}>
            This will permanently remove the holding from the client record. You can&apos;t undo this.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setConfirmDeleteId(null)}
              disabled={deleting}
              style={{ ...btnOutline, opacity: deleting ? 0.6 : 1 }}
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              style={{ ...btnPrimary, background: '#A32D2D', opacity: deleting ? 0.6 : 1 }}
            >
              <Trash2 size={13} />
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
