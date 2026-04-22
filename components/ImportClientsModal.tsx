'use client'

import React, { useState, useRef } from 'react'
import ConversationalReview, { extractIssues, ImportIssue } from '@/components/ConversationalReview'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────────────────
interface ParsedPolicy {
  policy_number: string | null
  insurer: string | null
  type: string | null
  premium: number | null
  premium_frequency: string | null
  sum_assured: number | null
  start_date: string | null
  renewal_date: string | null
}

interface ParsedHolding {
  product_type: string
  product_name: string
  provider: string | null
  platform: string | null
  units_held: number | null
  last_nav: number | null
  last_nav_date: string | null
  current_value: number | null
  currency: string | null
  inception_date: string | null
  risk_rating: string | null
  // Batch 8: classification + cost basis + yield
  avg_cost_price: number | null
  distribution_yield: number | null
  asset_class: string | null
  geography: string | null
  sector: string | null
}

interface ExistingClient {
  id: string
  name: string
  email: string | null
  whatsapp: string | null
  policies: { id: string; policy_number: string | null; insurer: string | null; type: string | null }[]
  holdings: { id: string; product_name: string; provider: string | null }[]
}

type MatchType = 'exact' | 'phone' | 'email' | 'fuzzy' | 'new'

interface ParsedClient {
  name: string
  email: string | null
  phone: string | null
  company: string | null
  type: string
  tier: string
  policies: ParsedPolicy[]
  holdings: ParsedHolding[]
  // dedup fields
  _id: string
  _selected: boolean
  _matchType: MatchType
  _matchScore: number
  _existingId: string | null
  _existingName: string | null
  _flagReasons: string[]
  _newPolicies: ParsedPolicy[]   // policies not yet in the book
  _newHoldings: ParsedHolding[]  // holdings not yet in the book
}

type Step = 'upload' | 'parsing' | 'summary' | 'review' | 'importing' | 'done'
type ImportMode = 'new_only' | 'new_and_update' | null

// ── Helpers ───────────────────────────────────────────────────────────────────
function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}
function normPhone(p: string) { return p.replace(/\D/g, '').replace(/^65/, '') }

function nameSimilarity(a: string, b: string) {
  const na = norm(a), nb = norm(b)
  if (na === nb) return 100
  if (na.includes(nb) || nb.includes(na)) return 85
  const ta = new Set(na.split(' ')), tb = new Set(nb.split(' '))
  const inter = [...ta].filter(t => tb.has(t)).length
  const union = new Set([...ta, ...tb]).size
  return Math.round((inter / union) * 100)
}

function findMatch(parsed: ParsedClient, existing: ExistingClient[]): { type: MatchType; score: number; match: ExistingClient | null } {
  for (const ec of existing) {
    if (norm(ec.name) === norm(parsed.name)) return { type: 'exact', score: 100, match: ec }
    if (parsed.phone && ec.whatsapp) {
      const pa = normPhone(parsed.phone), pb = normPhone(ec.whatsapp)
      if (pa && pb && pa === pb && pa.length >= 8) return { type: 'phone', score: 95, match: ec }
    }
    if (parsed.email && ec.email && parsed.email.toLowerCase() === ec.email.toLowerCase())
      return { type: 'email', score: 95, match: ec }
  }
  let best = { type: 'new' as MatchType, score: 0, match: null as ExistingClient | null }
  for (const ec of existing) {
    const score = nameSimilarity(parsed.name, ec.name)
    if (score >= 75 && score > best.score) best = { type: 'fuzzy', score, match: ec }
  }
  return best
}

function policyNew(p: ParsedPolicy, existing: ExistingClient['policies']) {
  if (p.policy_number) return !existing.some(e => e.policy_number?.toLowerCase().trim() === p.policy_number!.toLowerCase().trim())
  return !existing.some(e => e.insurer?.toLowerCase() === p.insurer?.toLowerCase() && e.type?.toLowerCase() === p.type?.toLowerCase())
}

function holdingNew(h: ParsedHolding, existing: ExistingClient['holdings']) {
  return !existing.some(e => norm(e.product_name) === norm(h.product_name))
}

// ── Batch 9: enum coercers for Claude-parsed holding fields ──────────────────

const ASSET_CLASS_ENUM = new Set(['Equity', 'Fixed Income', 'Multi-Asset', 'Cash', 'REIT', 'Alternatives', 'Structured', 'Crypto', 'Other'])
const GEOGRAPHY_ENUM   = new Set(['Global', 'Singapore', 'Asia ex-Japan', 'Emerging Markets', 'US', 'Europe', 'Japan', 'Greater China', 'ASEAN', 'Other'])
const SECTOR_ENUM      = new Set(['Diversified', 'Corp credit', 'Technology', 'Financials', 'Healthcare', 'Consumer', 'Energy', 'Industrials', 'Real estate', 'Utilities', 'Materials', 'Communications', 'Other'])

// Returns { value, other } — if Claude's value is in the enum, pass through;
// otherwise put the raw string in *_other so FA doesn't lose context.
function coerceEnum(raw: string | null | undefined, enumSet: Set<string>) {
  if (!raw || typeof raw !== 'string') return { value: null, other: null }
  const trimmed = raw.trim()
  if (!trimmed) return { value: null, other: null }
  if (enumSet.has(trimmed)) return { value: trimmed, other: null }
  return { value: 'Other', other: trimmed }
}

// Claude's risk_rating prompt output is conservative/moderate/aggressive,
// matching our DB CHECK constraint exactly. This coercer validates the value
// and maps common alternatives (e.g., "medium" → "moderate") in case Claude
// drifts from the prompt.
function coerceRiskRating(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null
  const s = raw.toLowerCase().trim()
  if (!s) return null
  if (s === 'conservative' || s === 'low' || s === 'cautious') return 'conservative'
  if (s === 'moderate' || s === 'medium' || s === 'balanced') return 'moderate'
  if (s === 'aggressive' || s === 'high' || s === 'growth' || s === 'very high' || s === 'very_high') return 'aggressive'
  return null
}

// Heuristic: Claude occasionally emits decimal yield (0.052) instead of percentage (5.2).
// Any realistic distribution yield is 0.5%–20%, so <0.5 means it's almost certainly a decimal.
function normalizeYield(raw: number | null | undefined): number | null {
  if (raw == null || isNaN(Number(raw))) return null
  const n = Number(raw)
  if (n <= 0) return null
  if (n > 0 && n < 0.5) return n * 100
  return n
}

// ── Batch 11: surface risk_rating values Claude couldn't map ────────────────
//
// Problem: the CSV parser (via coerceRiskRating) silently returns null when
// it encounters a risk_rating value outside its known synonym list. This
// means values like "Defensive", "PIRD 4", "Wealth Preservation" get dropped
// without the FA knowing.
//
// Fix: scan parsed holdings BEFORE import, collect unique unrecognized
// values, and surface one ConversationalReview issue per unique value.
// When the FA maps "Defensive" → "Moderate", that mapping is applied to
// ALL holdings carrying that raw value.
function extractRiskMismatches(clients: ParsedClient[]): ImportIssue[] {
  // Group affected holdings by normalized raw value.
  // Key: lowercased+trimmed raw value; value: display string + affected list.
  const byValue = new Map<string, {
    rawValue: string
    affected: Array<{ clientId: string; holdingIndex: number; label: string }>
  }>()

  for (const client of clients) {
    if (!client._selected) continue
    ;(client.holdings as any[]).forEach((h, hi) => {
      const raw = h.risk_rating
      if (!raw || typeof raw !== 'string') return
      const trimmed = raw.trim()
      if (!trimmed) return
      // If the coercer already handles this value, no question needed.
      if (coerceRiskRating(trimmed) !== null) return

      const key = trimmed.toLowerCase()
      if (!byValue.has(key)) {
        byValue.set(key, { rawValue: trimmed, affected: [] })
      }
      byValue.get(key)!.affected.push({
        clientId: client._id,
        holdingIndex: hi,
        label: `${h.product_name || 'holding'} (${client.name})`,
      })
    })
  }

  // One issue per unique unknown value.
  const issues: ImportIssue[] = []
  byValue.forEach(({ rawValue, affected }) => {
    const n = affected.length
    const preview = affected.slice(0, 3).map(a => a.label).join(', ') +
      (n > 3 ? ` +${n - 3} more` : '')
    issues.push({
      clientId: '_global',  // placeholder — this issue isn't tied to one client
      clientName: 'Risk rating mapping',
      policyIndex: null,
      field: '_risk_mismatch',
      label: n === 1 ? `Affects 1 holding: ${preview}` : `Affects ${n} holdings: ${preview}`,
      question: `Maya found "${rawValue}" in your CSV which isn't one of her standard risk levels (Conservative, Moderate, Aggressive). Should she map it to one of those?`,
      currentValue: rawValue,
      inputType: 'select',
      selectOptions: ['Conservative', 'Moderate', 'Aggressive'],
      severity: 'info',
      hideSkip: true,                     // skipping a cross-client field makes no sense
      confirmLabel: 'Leave blank for now', // clearer than "Import as-is" for this case
      affectedItems: affected,
    })
  })

  return issues
}

// Combine all issue sources. Used in 3 places in the UI so consolidating here.
function allIssues(clients: ParsedClient[]): ImportIssue[] {
  return [...extractIssues(clients), ...extractRiskMismatches(clients)]
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ImportClientsModal({
  ifaId, plan, currentCount, clientLimit,
  onClose, onImported,
}: {
  ifaId: string; plan: string; currentCount: number; clientLimit: number
  onClose: () => void; onImported: () => void
}) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [parsed, setParsed] = useState<ParsedClient[]>([])
  const [parseError, setParseError] = useState('')
  const [importMode, setImportMode] = useState<ImportMode>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [importedCount, setImportedCount] = useState(0)
  const [updatedCount, setUpdatedCount] = useState(0)
  const [issues, setIssues] = useState<ImportIssue[]>([])
  const [importErrors, setImportErrors] = useState<string[]>([])

  const isSoftLimited = plan === 'solo' || plan === 'trial'
  const slotsLeft = isSoftLimited ? clientLimit - currentCount : 9999

  // Derived groups
  const newClients    = parsed.filter(c => c._matchType === 'new' && c._selected)
  const exactMatches  = parsed.filter(c => (c._matchType === 'exact' || c._matchType === 'phone' || c._matchType === 'email') && c._selected)
  const fuzzyMatches  = parsed.filter(c => c._matchType === 'fuzzy')
  const withUpdates   = exactMatches.filter(c => c._newPolicies.length > 0 || c._newHoldings.length > 0)

  async function processFile(file: File) {
    setFileName(file.name)
    setStep('parsing')
    setParseError('')
    try {
      // 1. Parse file with Claude
      const isText = file.name.endsWith('.csv') || file.name.endsWith('.txt')
      let fileContent = '', isBase64 = false, mediaType = 'text/plain'
      if (isText) {
        fileContent = await file.text()
      } else {
        const buf = await file.arrayBuffer()
        let bin = ''; new Uint8Array(buf).forEach(b => bin += String.fromCharCode(b))
        fileContent = btoa(bin); isBase64 = true
        mediaType = file.name.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }

      let res: Response
      try {
        res = await fetch('/api/import/parse', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileContent, isBase64, mediaType }),
        })
      } catch (fetchErr: any) {
        throw new Error(`Network error — could not reach the server. Check your connection. (${fetchErr.message})`)
      }
      if (res.status === 404) throw new Error('Import API not found — ask Elon to check app/api/import/parse/route.ts exists.')
      if (res.status === 500) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(`Server error: ${errData.error || 'Unknown error on /api/import/parse'}`)
      }
      if (!res.ok) throw new Error(`Parse request failed (HTTP ${res.status})`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (!data.clients?.length) throw new Error('No clients found in this file. Check it has name, insurer, and premium columns.')

      // 2. Load existing clients from Supabase for dedup
      const { data: existing } = await supabase
        .from('clients')
        .select('id, name, email, whatsapp, policies(id, policy_number, insurer, type), holdings(id, product_name, provider)')
        .eq('ifa_id', ifaId)

      const existingClients: ExistingClient[] = (existing || []).map((c: any) => ({
        id: c.id, name: c.name, email: c.email, whatsapp: c.whatsapp,
        policies: c.policies || [], holdings: c.holdings || [],
      }))

      // 3. Match each parsed client against existing book
      const clients: ParsedClient[] = data.clients.map((c: any, i: number) => {
        const flagReasons: string[] = []
        if (!c.name || c.name.length < 2) flagReasons.push('Name missing')
        c.policies?.forEach((p: any) => {
          if (!p.premium || p.premium <= 0) flagReasons.push('Premium missing')
          if (p.renewal_date && new Date(p.renewal_date) < new Date()) flagReasons.push('Renewal date in past')
        })

        const { type: matchType, score: matchScore, match } = findMatch(
          { ...c, _id: '', _selected: true, _matchType: 'new', _matchScore: 0, _existingId: null, _existingName: null, _flagReasons: [], _newPolicies: [], _newHoldings: [], holdings: c.holdings || [] },
          existingClients
        )

        const newPolicies = match ? (c.policies || []).filter((p: any) => policyNew(p, match.policies)) : (c.policies || [])
        const newHoldings = match ? (c.holdings || []).filter((h: any) => holdingNew(h, match.holdings)) : (c.holdings || [])

        return {
          ...c,
          holdings: c.holdings || [],
          _id: `c${i}`,
          _selected: isSoftLimited && matchType === 'new' ? i < slotsLeft : true,
          _matchType: matchType as MatchType,
          _matchScore: matchScore,
          _existingId: match?.id || null,
          _existingName: match?.name || null,
          _flagReasons: flagReasons,
          _newPolicies: newPolicies,
          _newHoldings: newHoldings,
        }
      })

      setParsed(clients)
      setStep('summary')
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse. Try saving as CSV.')
      setStep('upload')
    }
  }

  async function runImport(mode: ImportMode, overrideParsed?: typeof parsed) {
    setImportMode(mode)
    setStep('importing')
    let imported = 0, updated = 0
    const errors: string[] = []

    // Guard: ensure ifaId is set
    if (!ifaId) {
      setImportErrors(['Not logged in — please refresh and try again'])
      setStep('summary')
      return
    }

    const source = overrideParsed || parsed
    const toProcess = mode === 'new_only'
      ? source.filter(c => c._matchType === 'new' && c._selected)
      : source.filter(c => c._selected)

    for (const client of toProcess) {
      const isNew = client._matchType === 'new' || client._matchType === 'fuzzy'
      let clientId = client._existingId

      if (isNew) {
        // Insert new client
        const { data: nc, error: clientErr } = await supabase.from('clients').insert({
          ifa_id: ifaId, name: client.name, email: client.email,
          whatsapp: client.phone, company: client.company,
          type: client.type || 'individual', tier: client.tier || 'silver',
          dob: (client as any).dob || null,
          notes: (client as any).notes || null,
          nok_name: (client as any).nok_name || null,
          nok_relationship: (client as any).nok_relationship || null,
          nok_phone: (client as any).nok_phone || null,
        }).select('id').single()
        if (clientErr) { errors.push(`${client.name}: ${clientErr.message}`); continue }
        clientId = nc?.id
        if (clientId) imported++
      } else if (mode === 'new_and_update' && clientId) {
        // Update existing client contact info if we have better data
        const updates: any = {}
        if (client.email && !client._existingId) updates.email = client.email
        if (client.phone) updates.whatsapp = client.phone
        if (Object.keys(updates).length) await supabase.from('clients').update(updates).eq('id', clientId)
        updated++
      }

      if (!clientId) continue

      // Add new policies only
      const policiesToAdd = isNew ? client.policies : client._newPolicies
      for (const p of (policiesToAdd || [])) {
        console.log('[MODAL-INSERT]', client.name, p.insurer, 'raw policy:', JSON.stringify(p))
        const { error: pErr } = await supabase.from('policies').insert({
          ifa_id: ifaId, client_id: clientId,
          policy_number: p.policy_number,
          product_name: (p as any).product_name || null,
          insurer: p.insurer, type: p.type,
          premium: p.premium, premium_frequency: p.premium_frequency,
          sum_assured: p.sum_assured, start_date: p.start_date,
          renewal_date: p.renewal_date,
          notes: (p as any).notes || null,
          status: (p as any).status || 'active',
        })
        if (pErr) errors.push(`${client.name} policy (${p.insurer}): ${pErr.message}`)
      }

      // Add new holdings only
      const holdingsToAdd = isNew ? client.holdings : client._newHoldings
      for (const h of (holdingsToAdd || [])) {
        // Batch 9: coerce Claude-parsed enums to DB-valid values; raw values
        // that don't match an enum get preserved in *_other fields.
        const ac = coerceEnum((h as any).asset_class, ASSET_CLASS_ENUM)
        const gg = coerceEnum((h as any).geography,   GEOGRAPHY_ENUM)
        const sc = coerceEnum((h as any).sector,      SECTOR_ENUM)

        const { error: hErr } = await supabase.from('holdings').insert({
          ifa_id: ifaId, client_id: clientId,
          product_type: h.product_type || 'other', product_name: h.product_name,
          provider: h.provider, platform: h.platform,
          units_held: h.units_held, last_nav: h.last_nav,
          last_nav_date: (h as any).last_nav_date || null,
          current_value: h.current_value || (h.units_held && h.last_nav ? h.units_held * h.last_nav : null),
          currency: (h as any).currency || 'SGD',
          inception_date: (h as any).inception_date || null,
          risk_rating: coerceRiskRating(h.risk_rating),
          // Batch 8 classification + cost basis + yield
          avg_cost_price: (h as any).avg_cost_price ?? null,
          distribution_yield: normalizeYield((h as any).distribution_yield),
          asset_class:        ac.value,
          asset_class_other:  ac.other,
          geography:          gg.value,
          geography_other:    gg.other,
          sector:             sc.value,
          sector_other:       sc.other,
        })
        if (hErr) errors.push(`${client.name} holding (${h.product_name}): ${hErr.message}`)
      }

      setImportProgress(Math.round((toProcess.indexOf(client) + 1) / toProcess.length * 100))
    }

    setImportedCount(imported)
    setUpdatedCount(updated)
    setImportErrors(errors)
    setStep('done')
  }

  const cardStyle: React.CSSProperties = { background: '#F7F4F0', borderRadius: 8, padding: '12px 16px' }
  const matchBadge = (type: MatchType) => {
    const s: Record<MatchType, { label: string; bg: string; color: string }> = {
      exact: { label: 'Exact match', bg: '#E1F5EE', color: '#0F6E56' },
      phone: { label: 'Phone match', bg: '#E1F5EE', color: '#0F6E56' },
      email: { label: 'Email match', bg: '#E1F5EE', color: '#0F6E56' },
      fuzzy: { label: 'Possible match', bg: '#FAEEDA', color: '#854F0B' },
      new:   { label: 'New client', bg: '#E6F1FB', color: '#185FA5' },
    }
    const st = s[type]
    return <span style={{ background: st.bg, color: st.color, fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 100 }}>{st.label}</span>
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#FFF', borderRadius: 14, width: '100%', maxWidth: 580, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 16px 48px rgba(0,0,0,0.14)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '0.5px solid #E8E2DA', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 17, fontWeight: 500, color: '#1A1410', margin: 0 }}>
              {step === 'upload' && 'Import clients'}
              {step === 'parsing' && 'Reading your file…'}
              {step === 'summary' && 'Review import'}
              {step === 'review' && `Review ${issues.length} issue${issues.length !== 1 ? 's' : ''}`}
              {step === 'importing' && 'Importing…'}
              {step === 'done' && 'Import complete'}
            </h2>
            {step === 'summary' && <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#9B9088', margin: '2px 0 0' }}>{fileName}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9B9088' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* ── UPLOAD ── */}
          {step === 'upload' && (
            <>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.pdf,.txt" onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }} style={{ display: 'none' }} />
              <div
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) processFile(f) }}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current?.click()}
                style={{ border: `1.5px dashed ${dragOver ? '#BA7517' : '#E8E2DA'}`, borderRadius: 10, padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#FEF3E2' : '#FAFAF8', transition: 'all 0.15s' }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, color: '#1A1410', marginBottom: 6 }}>Drop your file here or click to browse</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#9B9088' }}>CSV, Excel, PDF — any format, any layout</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#BA7517', marginTop: 8 }}>Existing clients will be detected and updated — no duplicates</div>
              </div>
              {parseError && <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: 8, padding: '12px 14px', marginTop: 16, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#A32D2D' }}>{parseError}</div>}
              <div style={{ marginTop: 20, background: '#F7F4F0', borderRadius: 10, padding: '14px 18px' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, color: '#1A1410', marginBottom: 8 }}>Maya handles</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 20px' }}>
                  {['Any column names', 'Any date format', 'Currency symbols', 'Multiple policies per client', 'Investment holdings', 'Duplicate detection'].map(i => (
                    <div key={i} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#5F5A57', display: 'flex', gap: 6 }}><span style={{ color: '#0F6E56' }}>✓</span>{i}</div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── PARSING ── */}
          {step === 'parsing' && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>☕</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, color: '#1A1410', marginBottom: 6 }}>Maya is reading your file…</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#9B9088', marginBottom: 4 }}>{fileName}</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#9B9088' }}>Matching against your existing book…</div>
            </div>
          )}

          {/* ── SUMMARY ── */}
          {step === 'summary' && (
            <>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'New clients', value: newClients.length, color: '#185FA5', sub: 'will be added' },
                  { label: 'Existing clients', value: exactMatches.length, color: '#0F6E56', sub: `${withUpdates.length} have updates` },
                  { label: 'Need review', value: fuzzyMatches.length, color: fuzzyMatches.length > 0 ? '#854F0B' : '#9B9088', sub: 'possible duplicates' },
                ].map(s => (
                  <div key={s.label} style={cardStyle}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 500, color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, color: '#1A1410', marginTop: 4 }}>{s.label}</div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088' }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Limit warning */}
              {isSoftLimited && newClients.length > slotsLeft && (
                <div style={{ background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#854F0B' }}>
                  ⚠️ Solo plan allows {clientLimit} clients. You have {currentCount} — only {slotsLeft} new clients can be imported. Updates to existing clients are unlimited.
                </div>
              )}

              {/* New clients list */}
              {newClients.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, color: '#1A1410', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span>New clients</span>
                    <span style={{ color: '#9B9088', fontWeight: 400 }}>{newClients.length} will be added</span>
                  </div>
                  <div style={{ background: '#F7F4F0', borderRadius: 8, padding: '10px 14px', maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {newClients.slice(0, 10).map(c => (
                      <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410' }}>{c.name}</span>
                        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088' }}>{c.policies.length} polic{c.policies.length !== 1 ? 'ies' : 'y'}{c.holdings.length ? ` · ${c.holdings.length} holdings` : ''}</span>
                      </div>
                    ))}
                    {newClients.length > 10 && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088' }}>+{newClients.length - 10} more</div>}
                  </div>
                </div>
              )}

              {/* Existing clients with updates */}
              {withUpdates.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, color: '#1A1410', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Existing clients with new data</span>
                    <span style={{ color: '#9B9088', fontWeight: 400 }}>{withUpdates.length} clients</span>
                  </div>
                  <div style={{ background: '#F7F4F0', borderRadius: 8, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {withUpdates.slice(0, 5).map(c => (
                      <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410' }}>{c.name}</span>
                          {c._existingName && c._existingName !== c.name && <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088', marginLeft: 6 }}>→ {c._existingName}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {c._newPolicies.length > 0 && <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#185FA5', background: '#E6F1FB', padding: '1px 7px', borderRadius: 100 }}>+{c._newPolicies.length} polic{c._newPolicies.length !== 1 ? 'ies' : 'y'}</span>}
                          {c._newHoldings.length > 0 && <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#0F6E56', background: '#E1F5EE', padding: '1px 7px', borderRadius: 100 }}>+{c._newHoldings.length} holding{c._newHoldings.length !== 1 ? 's' : ''}</span>}
                          {matchBadge(c._matchType)}
                        </div>
                      </div>
                    ))}
                    {withUpdates.length > 5 && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088' }}>+{withUpdates.length - 5} more</div>}
                  </div>
                </div>
              )}

              {/* Fuzzy matches needing review */}
              {fuzzyMatches.length > 0 && (
                <div style={{ background: '#FEF3E2', border: '0.5px solid #FAC775', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, color: '#854F0B', marginBottom: 8 }}>
                    ⚠️ {fuzzyMatches.length} possible duplicate{fuzzyMatches.length !== 1 ? 's' : ''} — will be skipped
                  </div>
                  {fuzzyMatches.map(c => (
                    <div key={c._id} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#854F0B', marginBottom: 3 }}>
                      "{c.name}" looks like existing "{c._existingName}" ({c._matchScore}% match) — importing as new client anyway
                    </div>
                  ))}
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088', marginTop: 6 }}>These will be imported as new clients. You can merge them manually from the client detail page.</div>
                </div>
              )}
            </>
          )}

          {/* ── REVIEW ── */}
          {step === 'review' && (
            <ConversationalReview
              issues={issues}
              onComplete={(answers) => {
                // Apply fixes back to parsed clients
                const updated = [...parsed]
                answers.forEach(ans => {
                  const issue = issues[ans.issueIndex]

                  // Batch 11: _risk_mismatch applies to multiple holdings
                  // across multiple clients — uses issue.affectedItems, not
                  // issue.clientId. Handle this FIRST so the clientIdx
                  // lookup below doesn't silently skip these answers.
                  if (issue.field === '_risk_mismatch') {
                    if (ans.action === 'fixed' && ans.value && issue.affectedItems) {
                      // FA picked "Conservative" / "Moderate" / "Aggressive"
                      // from the dropdown — lowercase to match DB enum.
                      const mappedValue = ans.value.toLowerCase()
                      for (const aff of issue.affectedItems) {
                        const cIdx = updated.findIndex(c => c._id === aff.clientId)
                        if (cIdx === -1) continue
                        updated[cIdx] = {
                          ...updated[cIdx],
                          holdings: updated[cIdx].holdings.map((h: any, hi: number) =>
                            hi === aff.holdingIndex ? { ...h, risk_rating: mappedValue } : h
                          ),
                        }
                      }
                    }
                    // action === 'confirmed' → FA chose "Leave blank for now".
                    // No override needed; coerceRiskRating will return null at
                    // insert time, which the DB accepts (constraint is nullable).
                    return
                  }

                  const clientIdx = updated.findIndex(c => c._id === issue.clientId)
                  if (clientIdx === -1) return

                  if (ans.action === 'fixed' && ans.value) {
                    if (issue.field === '_duplicate') return
                    if (issue.policyIndex !== null) {
                      updated[clientIdx] = {
                        ...updated[clientIdx],
                        policies: updated[clientIdx].policies.map((p, pi) =>
                          pi === issue.policyIndex
                            ? { ...p, [issue.field]: issue.field === 'premium' ? Number(ans.value) : ans.value }
                            : p
                        )
                      }
                    }
                  } else if (ans.action === 'confirmed' && issue.field === '_duplicate') {
                    // FA said "different people" — promote fuzzy to new so it gets imported
                    updated[clientIdx] = {
                      ...updated[clientIdx],
                      _matchType: 'new',
                      _existingId: null,
                    }
                  } else if (ans.action === 'skipped') {
                    updated[clientIdx] = { ...updated[clientIdx], _selected: false }
                  }
                })
                setParsed(updated)
                // Pass updated array directly — setParsed is async so state
                // won't be updated by the time runImport reads it
                runImport(importMode || 'new_and_update', updated)
              }}
            />
          )}

          {/* ── IMPORTING ── */}
          {step === 'importing' && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, color: '#1A1410', marginBottom: 16 }}>
                {importMode === 'new_only' ? 'Adding new clients…' : 'Importing and updating…'}
              </div>
              <div style={{ background: '#F1EFE8', borderRadius: 100, height: 6, overflow: 'hidden', maxWidth: 280, margin: '0 auto' }}>
                <div style={{ background: '#BA7517', height: '100%', width: `${importProgress}%`, borderRadius: 100, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#9B9088', marginTop: 10 }}>{importProgress}%</div>
            </div>
          )}

          {/* ── DONE ── */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 56, height: 56, background: '#E1F5EE', border: '0.5px solid #9FE1CB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24 }}>✓</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 500, color: '#1A1410', marginBottom: 8 }}>Done</div>
              <div style={{ display: 'flex', gap: 24, justifyContent: 'center', margin: '16px 0' }}>
                {importedCount > 0 && <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 500, color: '#185FA5' }}>{importedCount}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#9B9088' }}>new clients added</div>
                </div>}
                {updatedCount > 0 && <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 500, color: '#0F6E56' }}>{updatedCount}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#9B9088' }}>existing updated</div>
                </div>}
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#5F5A57', lineHeight: 1.7 }}>
                Maya is now tracking all renewals. Alerts will appear on your dashboard as dates approach.
              </div>
              {importErrors.length > 0 && (
                <div style={{ marginTop: 20, background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: 8, padding: '12px 14px', textAlign: 'left' }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, color: '#A32D2D', marginBottom: 6 }}>
                    {importErrors.length} item{importErrors.length !== 1 ? 's' : ''} could not be saved:
                  </div>
                  {importErrors.slice(0, 5).map((e, i) => (
                    <div key={i} style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#A32D2D', marginBottom: 2 }}>{e}</div>
                  ))}
                  {importErrors.length > 5 && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088' }}>+{importErrors.length - 5} more — check Supabase SQL migration was run</div>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '0.5px solid #E8E2DA', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0, flexWrap: 'wrap' }}>
          {step === 'upload' && (
            <button onClick={onClose} style={{ background: 'transparent', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57' }}>Cancel</button>
          )}

          {step === 'summary' && (
            <>
              <button onClick={() => { setStep('upload'); setParsed([]) }} style={{ background: 'transparent', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57' }}>← Different file</button>

              {allIssues(parsed).length > 0 && (
                <button onClick={() => { setIssues(allIssues(parsed)); setStep('review') }} style={{ background: 'transparent', border: '0.5px solid #854F0B', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#854F0B' }}>
                  Review {allIssues(parsed).length} issue{allIssues(parsed).length !== 1 ? 's' : ''} first
                </button>
              )}
              {newClients.length > 0 && exactMatches.length === 0 && (
                <button onClick={() => runImport('new_only')} style={{ background: '#BA7517', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#FFF' }}>
                  Import {newClients.length} new clients →
                </button>
              )}

              {exactMatches.length > 0 && newClients.length === 0 && (
                <button onClick={() => runImport('new_and_update')} style={{ background: '#BA7517', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#FFF' }}>
                  Update {withUpdates.length} existing clients →
                </button>
              )}

              {newClients.length > 0 && exactMatches.length > 0 && (
                <>
                  <button onClick={() => runImport('new_only')} style={{ background: 'transparent', border: '0.5px solid #185FA5', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#185FA5' }}>
                    New only ({newClients.length})
                  </button>
                  <button onClick={() => runImport('new_and_update')} style={{ background: '#BA7517', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#FFF' }}>
                    Import + update all →
                  </button>
                </>
              )}
            </>
          )}

          {step === 'done' && (
            <button onClick={() => { onImported(); onClose() }} style={{ background: '#BA7517', border: 'none', borderRadius: 8, padding: '9px 22px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#FFF' }}>
              Go to clients →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
