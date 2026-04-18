'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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

const TYPE_LABELS: Record<string, string> = {
  unit_trust: 'Unit Trust',
  etf: 'ETF',
  ilp: 'ILP',
  annuity: 'Annuity',
  structured_product: 'Structured',
  other: 'Other',
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  unit_trust: { bg: '#E6F1FB', text: '#185FA5', border: '#B5D4F4' },
  etf:        { bg: '#E1F5EE', text: '#0F6E56', border: '#9FE1CB' },
  ilp:        { bg: '#FAEEDA', text: '#854F0B', border: '#FAC775' },
  annuity:    { bg: '#EEEDFE', text: '#3C3489', border: '#AFA9EC' },
  structured_product: { bg: '#FCEBEB', text: '#A32D2D', border: '#F7C1C1' },
  other:      { bg: '#F1EFE8', text: '#5F5E5A', border: '#D3D1C7' },
}

const RISK_COLORS: Record<string, string> = {
  low: '#0F6E56', medium: '#854F0B', high: '#A32D2D', very_high: '#791F1F',
}

export default function HoldingsSection({ clientId, ifaId }: { clientId: string; ifaId: string }) {
  const supabase = createClient()
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [harbourScript, setHarbourScript] = useState<string | null>(null)
  const [loadingHarbour, setLoadingHarbour] = useState(false)

  const [form, setForm] = useState({
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
  })

  useEffect(() => {
    loadHoldings()
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

  async function saveHolding() {
    if (!form.product_name || !form.provider) return
    setSaving(true)
    const payload: any = {
      client_id: clientId,
      ifa_id: ifaId,
      product_type: form.product_type,
      product_name: form.product_name,
      provider: form.provider,
      platform: form.platform || null,
      units_held: form.units_held ? Number(form.units_held) : null,
      last_nav: form.last_nav ? Number(form.last_nav) : null,
      current_value: form.current_value ? Number(form.current_value) : (form.units_held && form.last_nav ? Number(form.units_held) * Number(form.last_nav) : null),
      currency: form.currency,
      risk_rating: form.risk_rating,
      inception_date: form.inception_date || null,
      notes: form.notes || null,
    }
    await supabase.from('holdings').insert(payload)
    setForm({ product_type: 'unit_trust', product_name: '', provider: '', platform: '', units_held: '', last_nav: '', current_value: '', currency: 'SGD', risk_rating: 'medium', inception_date: '', notes: '' })
    setShowAdd(false)
    setSaving(false)
    loadHoldings()
  }

  async function markReviewed(holdingId: string) {
    await supabase.from('holdings').update({ last_reviewed_at: new Date().toISOString() }).eq('id', holdingId)
    loadHoldings()
  }

  async function deleteHolding(holdingId: string) {
    if (!confirm('Remove this holding?')) return
    await supabase.from('holdings').delete().eq('id', holdingId)
    loadHoldings()
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

  const totalValue = holdings.reduce((s, h) => s + (Number(h.current_value) || 0), 0)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', border: '0.5px solid #E8E2DA',
    borderRadius: 6, fontFamily: 'DM Sans, sans-serif', fontSize: 13,
    background: '#FFFFFF', color: '#1A1410', outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#6B6460',
    marginBottom: 4, display: 'block',
  }

  if (loading) return null

  return (
    <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 12, marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: holdings.length > 0 || showAdd ? '0.5px solid #E8E2DA' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#1A1410' }}>
            Investments & holdings
          </span>
          {holdings.length > 0 && (
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088', background: '#F7F4F0', padding: '2px 8px', borderRadius: 100 }}>
              SGD {totalValue.toLocaleString()}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {holdings.length > 0 && (
            <button onClick={getHarbourScript} disabled={loadingHarbour} style={{ background: '#F0FDF7', border: '0.5px solid #9FE1CB', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#0F6E56' }}>
              {loadingHarbour ? 'Loading…' : '🧭 Review script'}
            </button>
          )}
          <button onClick={() => setShowAdd(v => !v)} style={{ background: showAdd ? '#F7F4F0' : '#BA7517', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: showAdd ? '#6B6460' : '#FFFFFF' }}>
            {showAdd ? 'Cancel' : '+ Add holding'}
          </button>
        </div>
      </div>

      {/* Harbour review script */}
      {harbourScript && (
        <div style={{ margin: '0 20px 0', padding: '12px 14px', background: '#F0FDF7', border: '0.5px solid #9FE1CB', borderRadius: 8, marginBottom: 12 }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#0F6E56', fontWeight: 500, marginBottom: 6 }}>
            💬 Harbour — portfolio review script for Maya
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', lineHeight: 1.6, fontStyle: 'italic' }}>
            "{harbourScript}"
          </div>
          <button onClick={async () => { await navigator.clipboard.writeText(harbourScript); }} style={{ marginTop: 8, background: 'transparent', border: '0.5px solid #9FE1CB', borderRadius: 5, padding: '3px 10px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#0F6E56' }}>
            Copy
          </button>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div style={{ padding: 20, borderBottom: holdings.length > 0 ? '0.5px solid #E8E2DA' : 'none', background: '#FAFAF8' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Type</label>
              <select value={form.product_type} onChange={e => setForm(p => ({ ...p, product_type: e.target.value }))} style={inputStyle}>
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
              <select value={form.risk_rating} onChange={e => setForm(p => ({ ...p, risk_rating: e.target.value }))} style={inputStyle}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="very_high">Very High</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Product name *</label>
              <input placeholder="e.g. Infinity US 500 Stock Index Fund" value={form.product_name} onChange={e => setForm(p => ({ ...p, product_name: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Provider / Fund house *</label>
              <input placeholder="e.g. Lion Global, BlackRock, GE" value={form.provider} onChange={e => setForm(p => ({ ...p, provider: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Platform</label>
              <input placeholder="e.g. FSMOne, Endowus, Phillip" value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Inception date</label>
              <input type="date" value={form.inception_date} onChange={e => setForm(p => ({ ...p, inception_date: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Units held</label>
              <input type="number" placeholder="e.g. 1234.56" value={form.units_held} onChange={e => setForm(p => ({ ...p, units_held: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Last NAV (SGD)</label>
              <input type="number" placeholder="e.g. 1.23" value={form.last_nav} onChange={e => setForm(p => ({ ...p, last_nav: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Current value (SGD)</label>
              <input type="number" placeholder="Auto-calculated or manual" value={form.current_value} onChange={e => setForm(p => ({ ...p, current_value: e.target.value }))} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Notes</label>
            <input placeholder="Any suitability notes or context" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={inputStyle} />
          </div>
          <button onClick={saveHolding} disabled={saving || !form.product_name || !form.provider} style={{ background: '#BA7517', border: 'none', borderRadius: 7, padding: '8px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#FFFFFF', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save holding'}
          </button>
        </div>
      )}

      {/* Holdings list */}
      {holdings.length === 0 && !showAdd ? (
        <div style={{ padding: '28px 20px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#B4B2A9' }}>
          No investment holdings recorded yet
        </div>
      ) : (
        <div>
          {holdings.map((h, i) => {
            const typeColor = TYPE_COLORS[h.product_type] || TYPE_COLORS.other
            const daysSinceReview = h.last_reviewed_at
              ? Math.floor((Date.now() - new Date(h.last_reviewed_at).getTime()) / (1000 * 60 * 60 * 24))
              : null
            const reviewOverdue = daysSinceReview === null || daysSinceReview > 180

            return (
              <div key={h.id} style={{ padding: '14px 20px', borderBottom: i < holdings.length - 1 ? '0.5px solid #F1EFE8' : 'none', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#1A1410' }}>{h.product_name}</span>
                    <span style={{ background: typeColor.bg, color: typeColor.text, border: `0.5px solid ${typeColor.border}`, fontSize: 10, fontWeight: 500, padding: '1px 7px', borderRadius: 100 }}>
                      {TYPE_LABELS[h.product_type]}
                    </span>
                    {h.risk_rating && (
                      <span style={{ fontSize: 10, color: RISK_COLORS[h.risk_rating] || '#6B6460', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {h.risk_rating.replace('_', ' ')} risk
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460' }}>{h.provider}{h.platform ? ` · ${h.platform}` : ''}</span>
                    {h.current_value && <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#1A1410', fontWeight: 500 }}>SGD {Number(h.current_value).toLocaleString()}</span>}
                    {h.units_held && h.last_nav && <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#9B9088' }}>{Number(h.units_held).toLocaleString()} units @ {Number(h.last_nav).toFixed(4)}</span>}
                  </div>
                  {h.notes && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088', marginTop: 4 }}>{h.notes}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: reviewOverdue ? '#A32D2D' : '#9B9088' }}>
                    {daysSinceReview === null ? 'Never reviewed' : `Reviewed ${daysSinceReview}d ago`}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => markReviewed(h.id)} style={{ background: '#F0FDF7', border: '0.5px solid #9FE1CB', borderRadius: 5, padding: '3px 9px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#0F6E56' }}>
                      Mark reviewed
                    </button>
                    <button onClick={() => deleteHolding(h.id)} style={{ background: 'transparent', border: '0.5px solid #E8E2DA', borderRadius: 5, padding: '3px 9px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088' }}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
