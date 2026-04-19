'use client'

import React, { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ParsedClient {
  name: string
  email: string | null
  phone: string | null
  company: string | null
  type: 'individual' | 'sme' | 'corporate'
  tier: 'gold' | 'silver' | 'bronze' | 'platinum'
  policies: ParsedPolicy[]
  holdings: ParsedHolding[]
  _selected: boolean
  _flagged: boolean
  _flagReasons: string[]
  _id: string
}

interface ParsedPolicy {
  policy_number: string | null
  insurer: string | null
  type: string | null
  premium: number | null
  premium_frequency: string | null
  sum_assured: number | null
  start_date: string | null
  renewal_date: string | null
  status: string
}

interface ParsedHolding {
  product_type: string
  product_name: string
  provider: string | null
  platform: string | null
  units_held: number | null
  last_nav: number | null
  current_value: number | null
  risk_rating: string | null
}

type Step = 'upload' | 'parsing' | 'summary' | 'flagged' | 'importing' | 'done'

function flagClient(client: ParsedClient, existingNames: Set<string>): string[] {
  const reasons: string[] = []
  if (!client.name || client.name.length < 2) reasons.push('Name missing or too short')
  if (existingNames.has(client.name?.toLowerCase())) reasons.push('Already in your book')
  if (!client.policies?.length && !client.holdings?.length) reasons.push('No policies or holdings found')
  client.policies?.forEach(p => {
    if (!p.premium || p.premium <= 0) reasons.push('Premium is zero or missing')
    if (!p.renewal_date) reasons.push('Renewal date missing')
    else if (new Date(p.renewal_date) < new Date()) reasons.push('Renewal date is in the past')
    if (!p.insurer) reasons.push('Insurer not identified')
  })
  return [...new Set(reasons)]
}

export default function ImportClientsModal({
  ifaId, plan, currentCount, clientLimit, existingClientNames,
  onClose, onImported,
}: {
  ifaId: string
  plan: string
  currentCount: number
  clientLimit: number
  existingClientNames: string[]
  onClose: () => void
  onImported: () => void
}) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [parsed, setParsed] = useState<ParsedClient[]>([])
  const [parseError, setParseError] = useState('')
  const [importProgress, setImportProgress] = useState(0)
  const [importedCount, setImportedCount] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)

  const isSoftLimited = plan === 'solo' || plan === 'trial'
  const slotsLeft = isSoftLimited ? clientLimit - currentCount : 9999
  const existingSet = new Set(existingClientNames.map(n => n.toLowerCase()))

  const clean = parsed.filter(c => !c._flagged && c._selected)
  const flagged = parsed.filter(c => c._flagged)
  const totalPremium = parsed.filter(c => c._selected).reduce((s, c) =>
    s + (c.policies || []).reduce((ps, p) => ps + (p.premium || 0), 0), 0)

  async function processFile(file: File) {
    setFileName(file.name)
    setStep('parsing')
    setParseError('')
    try {
      const isText = file.name.endsWith('.csv') || file.name.endsWith('.txt')
      let fileContent = ''
      let isBase64 = false
      let mediaType = 'text/plain'
      if (isText) {
        fileContent = await file.text()
      } else {
        const buf = await file.arrayBuffer()
        const bytes = new Uint8Array(buf)
        let bin = ''
        bytes.forEach(b => bin += String.fromCharCode(b))
        fileContent = btoa(bin)
        isBase64 = true
        mediaType = file.name.endsWith('.pdf') ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
      const res = await fetch('/api/import/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileContent, isBase64, mediaType }),
      })
      if (!res.ok) throw new Error('Parsing failed')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (!data.clients?.length) throw new Error('No clients found. Check the file has client or policy data.')

      const clients: ParsedClient[] = data.clients.map((c: any, i: number) => {
        const flagReasons = flagClient({ ...c, _flagged: false, _flagReasons: [], _selected: true, _id: '', holdings: c.holdings || [] }, existingSet)
        return {
          ...c,
          holdings: c.holdings || [],
          _id: `c${i}`,
          _flagged: flagReasons.length > 0,
          _flagReasons: flagReasons,
          _selected: isSoftLimited ? i < slotsLeft : true,
        }
      })
      setParsed(clients)
      setStep('summary')
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse file. Try saving as CSV.')
      setStep('upload')
    }
  }

  async function runImport(toImport: ParsedClient[]) {
    setStep('importing')
    let count = 0
    for (const client of toImport) {
      const { data: existing } = await supabase.from('clients').select('id').eq('ifa_id', ifaId).eq('name', client.name).single()
      let clientId = existing?.id
      if (!clientId) {
        const { data: newClient } = await supabase.from('clients').insert({
          ifa_id: ifaId, name: client.name, email: client.email,
          whatsapp: client.phone, company: client.company,
          type: client.type || 'individual', tier: client.tier || 'silver',
        }).select('id').single()
        clientId = newClient?.id
      }
      if (clientId && client.policies?.length) {
        for (const p of client.policies) {
          await supabase.from('policies').insert({
            ifa_id: ifaId,
            client_id: clientId,
            policy_number: p.policy_number,
            insurer: p.insurer,
            type: p.type,
            premium: p.premium,
            premium_frequency: p.premium_frequency,
            sum_assured: p.sum_assured,
            start_date: p.start_date,
            renewal_date: p.renewal_date,
            status: 'active',
          })
        }
      }
      // Write investment holdings
      if (clientId && client.holdings?.length) {
        for (const h of client.holdings) {
          await supabase.from('holdings').insert({
            ifa_id: ifaId,
            client_id: clientId,
            product_type: h.product_type || 'other',
            product_name: h.product_name,
            provider: h.provider,
            platform: h.platform,
            units_held: h.units_held,
            last_nav: h.last_nav,
            current_value: h.current_value || (h.units_held && h.last_nav ? h.units_held * h.last_nav : null),
            risk_rating: h.risk_rating,
          })
        }
      }
      count++
      setImportProgress(Math.round((count / toImport.length) * 100))
    }
    setImportedCount(count)
    setStep('done')
  }

  const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '0.5px solid #E8E2DA', borderRadius: 6, fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#1A1410', background: '#FFF', outline: 'none', boxSizing: 'border-box' as const }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#FFF', borderRadius: 14, width: '100%', maxWidth: step === 'flagged' ? 780 : 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 16px 48px rgba(0,0,0,0.14)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '0.5px solid #E8E2DA', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 17, fontWeight: 500, color: '#1A1410', margin: 0 }}>
            {step === 'upload' && 'Import clients'}
            {step === 'parsing' && 'Reading your file…'}
            {step === 'summary' && 'Ready to import'}
            {step === 'flagged' && `Review ${flagged.length} flagged client${flagged.length !== 1 ? 's' : ''}`}
            {step === 'importing' && 'Importing…'}
            {step === 'done' && 'Import complete'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9B9088' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* UPLOAD */}
          {step === 'upload' && (
            <>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.pdf,.txt" onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }} style={{ display: 'none' }} />
              <div
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) processFile(f) }}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current?.click()}
                style={{ border: `1.5px dashed ${dragOver ? '#BA7517' : '#E8E2DA'}`, borderRadius: 10, padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#FEF3E2' : '#FAFAF8' }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, color: '#1A1410', marginBottom: 6 }}>Drop your file here or click to browse</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#9B9088' }}>CSV, Excel, PDF — any format, any layout</div>
              </div>
              {parseError && <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: 8, padding: '12px 14px', marginTop: 16, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#A32D2D' }}>{parseError}</div>}
              <div style={{ marginTop: 20, background: '#F7F4F0', borderRadius: 10, padding: '14px 18px' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, color: '#1A1410', marginBottom: 8 }}>Maya can read</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' }}>
                  {['Agency system exports', 'Your own Excel files', 'Messy column names', 'Mixed date formats', 'Currency like $3,200', 'Multiple policies per client'].map(i => (
                    <div key={i} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#5F5A57', display: 'flex', gap: 6 }}><span style={{ color: '#0F6E56' }}>✓</span>{i}</div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* PARSING */}
          {step === 'parsing' && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>☕</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, color: '#1A1410', marginBottom: 6 }}>Maya is reading your file…</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#9B9088' }}>{fileName}</div>
            </div>
          )}

          {/* SUMMARY */}
          {step === 'summary' && (
            <>
              {isSoftLimited && parsed.filter(c => c._selected).length >= slotsLeft && (
                <div style={{ background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#854F0B' }}>
                  ⚠️ Solo plan allows {clientLimit} clients. You have {currentCount} — only {slotsLeft} more can be imported. Upgrade to Pro for unlimited.
                </div>
              )}

              {/* Big summary */}
              <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✨</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 500, color: '#1A1410', marginBottom: 6 }}>
                  Maya read your file
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#5F5A57' }}>
                  {fileName}
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Clients ready', value: clean.length, color: '#0F6E56' },
                  { label: 'Need a check', value: flagged.length, color: flagged.length > 0 ? '#854F0B' : '#9B9088' },
                  { label: 'Holdings found', value: parsed.reduce((s, c) => s + (c.holdings?.length || 0), 0), color: '#185FA5' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#F7F4F0', borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 22, fontWeight: 500, color: s.color }}>{s.value}</div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088', marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Clean clients preview */}
              {clean.length > 0 && (
                <div style={{ background: '#F7F4F0', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, color: '#1A1410', marginBottom: 8 }}>Ready to import</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
                    {clean.slice(0, 8).map((c, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#3D3532' }}>
                        <span>{c.name}{c.company ? ` · ${c.company}` : ''}</span>
                        <span style={{ color: '#9B9088' }}>{c.policies?.length || 0} polic{c.policies?.length === 1 ? 'y' : 'ies'}{c.holdings?.length ? ` · ${c.holdings.length} holding${c.holdings.length !== 1 ? 's' : ''}` : ''}</span>
                      </div>
                    ))}
                    {clean.length > 8 && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088' }}>+{clean.length - 8} more</div>}
                  </div>
                </div>
              )}

              {/* Flagged preview */}
              {flagged.length > 0 && (
                <div style={{ background: '#FEF3E2', border: '0.5px solid #FAC775', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, color: '#854F0B', marginBottom: 6 }}>⚠️ {flagged.length} need a quick check</div>
                  {flagged.slice(0, 3).map((c, i) => (
                    <div key={i} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#854F0B', marginBottom: 2 }}>
                      {c.name || '(no name)'} — {c._flagReasons[0]}
                    </div>
                  ))}
                  {flagged.length > 3 && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088', marginTop: 4 }}>+{flagged.length - 3} more</div>}
                </div>
              )}
            </>
          )}

          {/* FLAGGED REVIEW */}
          {step === 'flagged' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57', margin: 0 }}>
                Fix or skip these before importing. Untick any you want to skip.
              </p>
              {flagged.map((client) => (
                <div key={client._id} style={{ border: '0.5px solid #FAC775', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ background: '#FEF3E2', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" checked={client._selected} onChange={e => setParsed(prev => prev.map(c => c._id === client._id ? { ...c, _selected: e.target.checked } : c))} style={{ cursor: 'pointer' }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#1A1410' }}>{client.name || '(no name)'}</span>
                    </div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#854F0B' }}>
                      {client._flagReasons.join(' · ')}
                    </div>
                  </div>
                  {editingId === client._id ? (
                    <div style={{ padding: '12px 14px', background: '#FFFFFF', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#9B9088', display: 'block', marginBottom: 3 }}>NAME</label>
                        <input value={client.name} onChange={e => setParsed(prev => prev.map(c => c._id === client._id ? { ...c, name: e.target.value } : c))} style={inp} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#9B9088', display: 'block', marginBottom: 3 }}>PHONE</label>
                        <input value={client.phone || ''} onChange={e => setParsed(prev => prev.map(c => c._id === client._id ? { ...c, phone: e.target.value } : c))} style={inp} placeholder="+65..." />
                      </div>
                      {client.policies?.map((p, pi) => (
                        <React.Fragment key={pi}>
                          <div>
                            <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#9B9088', display: 'block', marginBottom: 3 }}>PREMIUM (SGD/yr)</label>
                            <input type="number" value={p.premium || ''} onChange={e => setParsed(prev => prev.map(c => c._id === client._id ? { ...c, policies: c.policies.map((pp, ppi) => ppi === pi ? { ...pp, premium: Number(e.target.value) } : pp) } : c))} style={inp} />
                          </div>
                          <div>
                            <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#9B9088', display: 'block', marginBottom: 3 }}>RENEWAL DATE</label>
                            <input type="date" value={p.renewal_date || ''} onChange={e => setParsed(prev => prev.map(c => c._id === client._id ? { ...c, policies: c.policies.map((pp, ppi) => ppi === pi ? { ...pp, renewal_date: e.target.value } : pp) } : c))} style={inp} />
                          </div>
                        </React.Fragment>
                      ))}
                      <div style={{ gridColumn: '1/-1' }}>
                        <button onClick={() => setEditingId(null)} style={{ background: '#1A1410', border: 'none', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#FFF' }}>Done editing</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '8px 14px', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#5F5A57' }}>
                        {client.policies?.map(p => `${p.type || 'Policy'} · ${p.insurer || '?'} · $${(p.premium || 0).toLocaleString()}/yr · ${p.renewal_date || 'no date'}`).join(', ') || 'No policies'}
                      </div>
                      <button onClick={() => setEditingId(client._id)} style={{ background: 'transparent', border: '0.5px solid #E8E2DA', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#3D3532' }}>Edit</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* IMPORTING */}
          {step === 'importing' && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, color: '#1A1410', marginBottom: 16 }}>Importing…</div>
              <div style={{ background: '#F1EFE8', borderRadius: 100, height: 6, overflow: 'hidden', maxWidth: 280, margin: '0 auto' }}>
                <div style={{ background: '#BA7517', height: '100%', width: `${importProgress}%`, borderRadius: 100, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#9B9088', marginTop: 10 }}>{importProgress}%</div>
            </div>
          )}

          {/* DONE */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ width: 56, height: 56, background: '#E1F5EE', border: '0.5px solid #9FE1CB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>✓</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 500, color: '#1A1410', marginBottom: 8 }}>{importedCount} clients imported</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#5F5A57', lineHeight: 1.7 }}>Maya is now tracking all renewals. You'll see alerts as dates approach.</div>
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
              <button onClick={() => { setStep('upload'); setParsed([]) }} style={{ background: 'transparent', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57' }}>← Upload different file</button>
              {flagged.length > 0 && (
                <button onClick={() => setStep('flagged')} style={{ background: 'transparent', border: '0.5px solid #FAC775', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#854F0B' }}>
                  Review {flagged.length} flagged
                </button>
              )}
              {flagged.length > 0 && clean.length > 0 && (
                <button onClick={() => runImport(clean)} style={{ background: 'transparent', border: '0.5px solid #0F6E56', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#0F6E56' }}>
                  Import {clean.length} clean now
                </button>
              )}
              <button onClick={() => runImport(parsed.filter(c => c._selected))} style={{ background: '#BA7517', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#FFF' }}>
                Import all {parsed.filter(c => c._selected).length} →
              </button>
            </>
          )}

          {step === 'flagged' && (
            <>
              <button onClick={() => setStep('summary')} style={{ background: 'transparent', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57' }}>← Back</button>
              <button onClick={() => runImport(parsed.filter(c => c._selected))} style={{ background: '#BA7517', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#FFF' }}>
                Import {parsed.filter(c => c._selected).length} clients →
              </button>
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
