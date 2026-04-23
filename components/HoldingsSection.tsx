'use client'

import type { Holding } from '@/lib/types'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import PortalMenu from '@/components/PortalMenu'
import Modal from '@/components/Modal'
import DocUploadField from '@/components/DocUploadField'
import DocList from '@/components/DocList'
import {
  Plus, Save, Bot, Pencil, Trash2, Check, Copy, Compass,
  ChevronDown, ChevronRight, MoreVertical,
} from 'lucide-react'
import { inputStyle, labelStyle, btnPrimary, btnOutline, btnAddSection } from '@/lib/styles'
import { formatDate } from '@/lib/dates'
import { formatMoney, formatPct } from '@/lib/money'
import { calcPnl, calcAnnualIncome, reviewPill, heldDuration } from '@/lib/holdings'

// ── Types ──────────────────────────────────────────────────────────────────

// Holding now imported from lib/types (canonical DB row shape)

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
  conservative: 'Conservative',
  moderate: 'Moderate',
  aggressive: 'Aggressive',
}

// ── Batch 8: classification dropdowns ──────────────────────────────────────

const ASSET_CLASSES = [
  'Equity',
  'Fixed Income',
  'Multi-Asset',
  'Cash',
  'REIT',
  'Alternatives',
  'Structured',
  'Crypto',
  'Other',
] as const

const GEOGRAPHIES = [
  'Global',
  'Singapore',
  'Asia ex-Japan',
  'Emerging Markets',
  'US',
  'Europe',
  'Japan',
  'Greater China',
  'ASEAN',
  'Other',
] as const

const SECTORS = [
  'Diversified',
  'Corp credit',
  'Technology',
  'Financials',
  'Healthcare',
  'Consumer',
  'Energy',
  'Industrials',
  'Real estate',
  'Utilities',
  'Materials',
  'Communications',
  'Other',
] as const

// ── Batch 8: P&L + yield calculation helpers ───────────────────────────────

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
// Shared styles imported from @/lib/styles (see imports below)

// ── Helpers ────────────────────────────────────────────────────────────────

// Returns a pill class name matching the global pill-* CSS classes Policies uses.
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

  const pnl = calcPnl(holding)
  const income = calcAnnualIncome(holding)
  const yieldPct = holding.distribution_yield != null ? Number(holding.distribution_yield) : null

  // Classification tags under product subtitle. Resolve "Other" -> custom text.
  const assetLabel = holding.asset_class === 'Other' ? holding.asset_class_other : holding.asset_class
  const regionLabel = holding.geography === 'Other' ? holding.geography_other : holding.geography
  const sectorLabel = holding.sector === 'Other' ? holding.sector_other : holding.sector
  const tags = [assetLabel, regionLabel, sectorLabel].filter(Boolean) as string[]

  const tagStyle: React.CSSProperties = {
    fontSize: 10, background: '#F1EFE8', color: '#5F5E5A',
    padding: '2px 7px', borderRadius: 3, letterSpacing: '0.01em',
    display: 'inline-block',
  }

  // Subtitle line: provider · [platform] · [units @ NAV currency]
  const subParts: string[] = []
  if (holding.provider) subParts.push(holding.provider)
  if (holding.platform) subParts.push(holding.platform)
  if (holding.units_held != null && holding.last_nav != null) {
    subParts.push(
      `${Number(holding.units_held).toLocaleString(undefined, { maximumFractionDigits: 3 })} @ ${Number(holding.last_nav).toFixed(4)} ${holding.currency}`
    )
  }
  const subtitle = subParts.join(' · ')

  return (
    <>
      {/* Main row — 5 columns: Product, Value, P&L, Yield, ⋮ */}
      <tr
        onClick={() => setExpanded(v => !v)}
        style={{ cursor: 'pointer', borderBottom: expanded ? 'none' : '0.5px solid #F1EFE8' }}
      >
        {/* Product (chevron + name + subtitle + classification tags) */}
        <td style={{ padding: '13px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <div style={{ paddingTop: 3 }}>
              {expanded
                ? <ChevronDown size={12} color="#9B9088" />
                : <ChevronRight size={12} color="#9B9088" />}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 13, fontWeight: 500, color: '#1A1410',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                marginBottom: 3,
              }}>
                {holding.product_name}
              </div>
              {subtitle && (
                <div style={{ fontSize: 11, color: '#6B6460', marginBottom: tags.length ? 6 : 0 }}>
                  {subtitle}
                </div>
              )}
              {tags.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {tags.map((t, i) => <span key={i} style={tagStyle}>{t}</span>)}
                </div>
              )}
            </div>
          </div>
        </td>

        {/* Value */}
        <td style={{ padding: '13px 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          <div style={{ fontSize: 13, color: '#1A1410' }}>
            {holding.current_value != null
              ? Number(holding.current_value).toLocaleString(undefined, { maximumFractionDigits: 0 })
              : '—'}
          </div>
        </td>

        {/* P&L */}
        <td style={{ padding: '13px 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          {pnl ? (
            <>
              <div style={{
                fontSize: 13, fontWeight: 500,
                color: pnl.absolute >= 0 ? '#0F6E56' : '#A32D2D',
              }}>
                {pnl.absolute >= 0 ? '+' : '−'}{Math.abs(Math.round(pnl.absolute)).toLocaleString()}
              </div>
              <div style={{
                fontSize: 10, marginTop: 2,
                color: pnl.absolute >= 0 ? '#0F6E56' : '#A32D2D',
              }}>
                {formatPct(pnl.percent)}{pnl.annualized != null ? ` · ${formatPct(pnl.annualized)} p.a.` : ''}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, color: '#BFB9B1' }}>—</div>
              {holding.current_value != null && (
                <div style={{ fontSize: 10, color: '#BFB9B1', marginTop: 2 }}>
                  Cost not entered
                </div>
              )}
            </>
          )}
        </td>

        {/* Yield */}
        <td style={{ padding: '13px 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          {yieldPct != null ? (
            <>
              <div style={{ fontSize: 13, color: '#1A1410' }}>
                {yieldPct.toFixed(1)}%
              </div>
              {income != null && (
                <div style={{ fontSize: 10, color: '#6B6460', marginTop: 2 }}>
                  {holding.currency} {Math.round(income).toLocaleString()}/yr
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 13, color: '#BFB9B1' }}>—</div>
          )}
        </td>

        {/* ⋮ menu */}
        <td style={{ padding: '13px 10px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
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

      {/* Expanded detail — performance block on top, then the existing KV grid + docs + notes */}
      {expanded && (
        <tr style={{ borderBottom: '0.5px solid #F1EFE8', background: '#FBFAF7' }}>
          <td colSpan={5} style={{ padding: '18px 24px 22px 34px' }}>

            {/* Performance block (cream) — only show if any perf signal exists */}
            {(pnl || yieldPct != null) && (
              <div style={{
                background: '#FAEEDA', borderRadius: 8,
                padding: '14px 18px',
                display: 'flex', gap: 32, flexWrap: 'wrap',
                marginBottom: 16,
              }}>
                {pnl && (
                  <>
                    <PerfItem label="Unrealized gain" value={
                      <span style={{ color: pnl.absolute >= 0 ? '#0F6E56' : '#A32D2D' }}>
                        {pnl.absolute >= 0 ? '+' : '−'}{holding.currency} {Math.abs(Math.round(pnl.absolute)).toLocaleString()}
                      </span>
                    } />
                    <PerfItem label="Return" value={
                      <span style={{ color: pnl.absolute >= 0 ? '#0F6E56' : '#A32D2D' }}>
                        {formatPct(pnl.percent)}
                      </span>
                    } />
                    {pnl.annualized != null && (
                      <PerfItem label="Annualized" value={
                        <span style={{ color: pnl.annualized >= 0 ? '#0F6E56' : '#A32D2D' }}>
                          {formatPct(pnl.annualized)} p.a.
                        </span>
                      } />
                    )}
                  </>
                )}
                {yieldPct != null && (
                  <PerfItem label="Distribution yield" value={`${yieldPct.toFixed(2)}%`} />
                )}
                {income != null && (
                  <PerfItem label="Annual income" value={`${holding.currency} ${Math.round(income).toLocaleString()}`} />
                )}
                {holding.inception_date && (
                  <PerfItem label="Held" value={heldDuration(holding.inception_date)} />
                )}
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '16px 24px',
              marginBottom: 16,
            }}>
              {holding.avg_cost_price != null && (
                <>
                  <KV label="Avg. cost price" value={Number(holding.avg_cost_price).toFixed(4)} />
                  {holding.units_held != null && (
                    <KV label="Total invested" value={
                      `${holding.currency} ${(Number(holding.avg_cost_price) * Number(holding.units_held))
                        .toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    } />
                  )}
                </>
              )}
              <KV label="Inception" value={formatDate(holding.inception_date)} />
              <KV label="Last NAV date" value={formatDate(holding.last_nav_date)} />
              <KV label="Currency" value={holding.currency} />
              <KV label="Platform" value={holding.platform || '—'} />
              <KV label="Risk rating" value={holding.risk_rating ? (RISK_LABELS[holding.risk_rating] || holding.risk_rating) : '—'} />
              <KV label="Last reviewed" value={formatDate(holding.last_reviewed_at)} />
            </div>

            <DocList
              parentId={holding.id}
              apiEndpoint="/api/holding-doc"
              parentParam="holdingId"
              label="Documents"
            />

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

// Small helpers for the expanded row
function PerfItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: 10, color: '#854F0B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 500, color: '#1A1410', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  )
}
function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      <span style={{ fontSize: 13, color: '#1A1410' }}>{value}</span>
    </div>
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
  risk_rating: 'moderate',
  inception_date: '',
  notes: '',
  // Batch 8
  asset_class: '',
  asset_class_other: '',
  geography: '',
  geography_other: '',
  sector: '',
  sector_other: '',
  avg_cost_price: '',
  distribution_yield: '',
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
  // Document upload queue for the Add/Edit modal. Single-mode = 0 or 1 file.
  // Uploaded after the holding row is saved (we need the ID).
  const [holdingFiles, setHoldingFiles] = useState<File[]>([])

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
    setHoldingFiles([])
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
      risk_rating: h.risk_rating ?? 'moderate',
      inception_date: h.inception_date ?? '',
      notes: h.notes ?? '',
      // Batch 8
      asset_class: h.asset_class ?? '',
      asset_class_other: h.asset_class_other ?? '',
      geography: h.geography ?? '',
      geography_other: h.geography_other ?? '',
      sector: h.sector ?? '',
      sector_other: h.sector_other ?? '',
      avg_cost_price: h.avg_cost_price != null ? String(h.avg_cost_price) : '',
      distribution_yield: h.distribution_yield != null ? String(h.distribution_yield) : '',
    })
    setEditingHoldingId(h.id)
    setFormError('')
    setHoldingFiles([])
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingHoldingId(null)
    setForm(DEFAULT_FORM)
    setFormError('')
    setHoldingFiles([])
  }

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
      // Batch 8 classification + cost basis + yield
      asset_class:       form.asset_class       || null,
      asset_class_other: form.asset_class === 'Other' ? (form.asset_class_other || null) : null,
      geography:         form.geography         || null,
      geography_other:   form.geography === 'Other' ? (form.geography_other || null) : null,
      sector:            form.sector            || null,
      sector_other:      form.sector === 'Other' ? (form.sector_other || null) : null,
      avg_cost_price:    form.avg_cost_price    ? Number(form.avg_cost_price) : null,
      distribution_yield: form.distribution_yield ? Number(form.distribution_yield) : null,
    }
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
          setFormError(`Holding saved, but some uploads failed — ${failures.join('; ')}`)
          setSaving(false)
          loadHoldings()
          return
        }
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
                  <th style={thCell(44)}>Product</th>
                  <th style={thCell(14, true)}>Value</th>
                  <th style={thCell(18, true)}>P&amp;L</th>
                  <th style={thCell(18, true)}>Yield</th>
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
