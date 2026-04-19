'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ParsedClient {
  name: string
  email: string | null
  phone: string | null
  company: string | null
  type: 'individual' | 'sme' | 'corporate'
  tier: 'gold' | 'silver' | 'bronze' | 'platinum'
  policies: ParsedPolicy[]
  _selected: boolean
  _error?: string
}

interface ParsedPolicy {
  insurer: string | null
  type: string | null
  premium: number | null
  renewal_date: string | null
  sum_assured: number | null
  policy_number: string | null
  status: string
}

type Step = 'upload' | 'parsing' | 'preview' | 'importing' | 'done'

const ACCEPTED = '.csv,.xlsx,.xls,.pdf,.txt'

export default function ImportClientsModal({
  ifaId, plan, currentCount, clientLimit,
  onClose, onImported,
}: {
  ifaId: string
  plan: string
  currentCount: number
  clientLimit: number
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
  const [warnings, setWarnings] = useState<string[]>([])

  const isSoftLimited = (plan === 'solo' || plan === 'trial')
  const slotsLeft = isSoftLimited ? clientLimit - currentCount : Infinity
  const selected = parsed.filter(c => c._selected)

  async function processFile(file: File) {
    setFileName(file.name)
    setStep('parsing')
    setParseError('')

    try {
      // Read file as base64 for PDFs/Excel, text for CSV/txt
      const isText = file.name.endsWith('.csv') || file.name.endsWith('.txt')
      let fileContent = ''
      let mediaType = 'text/plain'

      if (isText) {
        fileContent = await file.text()
      } else {
        // Base64 encode for binary files
        const buffer = await file.arrayBuffer()
        const bytes = new Uint8Array(buffer)
        let binary = ''
        bytes.forEach(b => binary += String.fromCharCode(b))
        fileContent = btoa(binary)
        mediaType = file.name.endsWith('.pdf') ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }

      // Call Claude to parse the file
      const response = await fetch('/api/import/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileContent,
          isBase64: !isText,
          mediaType,
        }),
      })

      if (!response.ok) throw new Error('Parsing failed')
      const data = await response.json()

      if (data.error) throw new Error(data.error)
      if (!data.clients?.length) throw new Error('No clients found in this file. Please check the file has client or policy data.')

      // Apply soft limit warning
      const newWarnings: string[] = []
      if (isSoftLimited && data.clients.length > slotsLeft) {
        newWarnings.push(`Your Solo plan allows ${clientLimit} clients. You have ${currentCount} — only ${slotsLeft} more can be imported. The rest will be skipped. Upgrade to Pro for unlimited clients.`)
      }
      if (data.warnings?.length) newWarnings.push(...data.warnings)
      setWarnings(newWarnings)

      const clients: ParsedClient[] = data.clients.map((c: any, i: number) => ({
        ...c,
        _selected: isSoftLimited ? i < slotsLeft : true,
      }))
      setParsed(clients)
      setStep('preview')
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse file. Please try a CSV format.')
      setStep('upload')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function toggleAll(val: boolean) {
    setParsed(prev => prev.map((c, i) => ({ ...c, _selected: isSoftLimited ? (i < slotsLeft ? val : false) : val })))
  }

  async function runImport() {
    setStep('importing')
    const toImport = parsed.filter(c => c._selected)
    let count = 0

    for (const client of toImport) {
      // Upsert client
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('ifa_id', ifaId)
        .eq('name', client.name)
        .single()

      let clientId = existingClient?.id

      if (!clientId) {
        const { data: newClient } = await supabase
          .from('clients')
          .insert({
            ifa_id: ifaId,
            name: client.name,
            email: client.email,
            whatsapp: client.phone,
            company: client.company,
            type: client.type || 'individual',
            tier: client.tier || 'silver',
          })
          .select('id')
          .single()
        clientId = newClient?.id
      }

      // Insert policies
      if (clientId && client.policies?.length) {
        for (const policy of client.policies) {
          await supabase.from('policies').insert({
            ifa_id: ifaId,
            client_id: clientId,
            insurer: policy.insurer,
            type: policy.type,
            premium: policy.premium,
            renewal_date: policy.renewal_date,
            sum_assured: policy.sum_assured,
            policy_number: policy.policy_number,
            status: 'active',
          }).select()
        }
      }

      count++
      setImportProgress(Math.round((count / toImport.length) * 100))
    }

    setImportedCount(count)
    setStep('done')
  }

  const inputStyle: React.CSSProperties = {
    background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 7,
    padding: '6px 10px', fontFamily: 'DM Sans, sans-serif', fontSize: 12,
    color: '#1A1410', outline: 'none', width: '100%',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#FFFFFF', borderRadius: 14, width: '100%', maxWidth: step === 'preview' ? 900 : 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 16px 48px rgba(0,0,0,0.14)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '0.5px solid #E8E2DA', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 17, fontWeight: 500, color: '#1A1410', margin: 0 }}>
              {step === 'upload' && 'Import clients'}
              {step === 'parsing' && 'Analysing your file…'}
              {step === 'preview' && `Review import — ${parsed.length} clients found`}
              {step === 'importing' && 'Importing…'}
              {step === 'done' && 'Import complete'}
            </h2>
            {step === 'upload' && <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#9B9088', margin: '2px 0 0' }}>Upload any format — Maya will map it automatically</p>}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9B9088', padding: 4 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* UPLOAD */}
          {step === 'upload' && (
            <>
              <input ref={fileRef} type="file" accept={ACCEPTED} onChange={handleFileChange} style={{ display: 'none' }} />
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current?.click()}
                style={{ border: `1.5px dashed ${dragOver ? '#BA7517' : '#E8E2DA'}`, borderRadius: 10, padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#FEF3E2' : '#FAFAF8', transition: 'all 0.15s' }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, color: '#1A1410', marginBottom: 6 }}>Drop your file here or click to browse</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#9B9088' }}>CSV, Excel (.xlsx), PDF — any format, any layout</div>
              </div>

              {parseError && (
                <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: 8, padding: '12px 14px', marginTop: 16, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#A32D2D' }}>{parseError}</div>
              )}

              <div style={{ marginTop: 24, background: '#F7F4F0', borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, color: '#1A1410', marginBottom: 8 }}>What Maya can read</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 24px' }}>
                  {['Agency system exports', 'Your own Excel files', 'Messy column names', 'Mixed date formats', 'Currency symbols ($3,200)', 'Multiple policies per client', 'Blank rows and headers', 'PDF policy schedules'].map(item => (
                    <div key={item} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#5F5A57', display: 'flex', gap: 6 }}>
                      <span style={{ color: '#0F6E56' }}>✓</span>{item}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* PARSING */}
          {step === 'parsing' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>☕</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, color: '#1A1410', marginBottom: 6 }}>Maya is reading your file…</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#9B9088' }}>{fileName}</div>
            </div>
          )}

          {/* PREVIEW */}
          {step === 'preview' && (
            <>
              {warnings.map((w, i) => (
                <div key={i} style={{ background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#854F0B' }}>⚠️ {w}</div>
              ))}

              {/* Summary bar */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ background: '#F7F4F0', borderRadius: 8, padding: '10px 16px', flex: 1 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Clients found</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 22, fontWeight: 500, color: '#1A1410' }}>{parsed.length}</div>
                </div>
                <div style={{ background: '#F7F4F0', borderRadius: 8, padding: '10px 16px', flex: 1 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Policies found</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 22, fontWeight: 500, color: '#1A1410' }}>{parsed.reduce((s, c) => s + (c.policies?.length || 0), 0)}</div>
                </div>
                <div style={{ background: '#F7F4F0', borderRadius: 8, padding: '10px 16px', flex: 1 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Selected</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 22, fontWeight: 500, color: '#BA7517' }}>{selected.length}</div>
                </div>
              </div>

              {/* Table */}
              <div style={{ border: '0.5px solid #E8E2DA', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '32px 180px 140px 130px 100px 80px 1fr', padding: '9px 14px', background: '#FAFAF8', borderBottom: '0.5px solid #E8E2DA', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={selected.length === parsed.filter((_, i) => !isSoftLimited || i < slotsLeft).length} onChange={e => toggleAll(e.target.checked)} style={{ cursor: 'pointer' }} />
                  {['Name', 'Email', 'Phone', 'Type', 'Policies', 'Notes'].map(h => (
                    <div key={h} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, fontWeight: 500, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
                  ))}
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {parsed.map((client, i) => {
                    const locked = isSoftLimited && i >= slotsLeft
                    return (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 180px 140px 130px 100px 80px 1fr', padding: '10px 14px', borderBottom: '0.5px solid #F1EFE8', alignItems: 'center', gap: 8, background: locked ? '#FAFAF8' : 'transparent', opacity: locked ? 0.5 : 1 }}>
                        <input type="checkbox" checked={client._selected} disabled={locked} onChange={e => setParsed(prev => prev.map((c, j) => j === i ? { ...c, _selected: e.target.checked } : c))} style={{ cursor: locked ? 'not-allowed' : 'pointer' }} />
                        <input value={client.name} onChange={e => setParsed(prev => prev.map((c, j) => j === i ? { ...c, name: e.target.value } : c))} style={{ ...inputStyle, fontWeight: 500 }} />
                        <input value={client.email || ''} onChange={e => setParsed(prev => prev.map((c, j) => j === i ? { ...c, email: e.target.value } : c))} style={inputStyle} placeholder="—" />
                        <input value={client.phone || ''} onChange={e => setParsed(prev => prev.map((c, j) => j === i ? { ...c, phone: e.target.value } : c))} style={inputStyle} placeholder="—" />
                        <select value={client.type} onChange={e => setParsed(prev => prev.map((c, j) => j === i ? { ...c, type: e.target.value as any } : c))} style={{ ...inputStyle }}>
                          <option value="individual">Individual</option>
                          <option value="sme">SME</option>
                          <option value="corporate">Corporate</option>
                        </select>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#3D3532' }}>{client.policies?.length || 0} {(client.policies?.length || 0) === 1 ? 'policy' : 'policies'}</div>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: locked ? '#A32D2D' : client._error ? '#A32D2D' : '#9B9088' }}>
                          {locked ? 'Over limit — upgrade to import' : client._error || client.policies?.map(p => `${p.type} · ${p.insurer}`).join(', ')}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* IMPORTING */}
          {step === 'importing' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, color: '#1A1410', marginBottom: 16 }}>Importing {selected.length} clients…</div>
              <div style={{ background: '#F1EFE8', borderRadius: 100, height: 6, overflow: 'hidden', maxWidth: 300, margin: '0 auto' }}>
                <div style={{ background: '#BA7517', height: '100%', width: `${importProgress}%`, borderRadius: 100, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#9B9088', marginTop: 10 }}>{importProgress}%</div>
            </div>
          )}

          {/* DONE */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 56, height: 56, background: '#E1F5EE', border: '0.5px solid #9FE1CB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>✓</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 500, color: '#1A1410', marginBottom: 8 }}>{importedCount} clients imported</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#5F5A57', lineHeight: 1.7 }}>
                Maya is now tracking all renewals.<br />
                You'll see alerts on your dashboard as renewal dates approach.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '0.5px solid #E8E2DA', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
          {step === 'upload' && (
            <button onClick={onClose} style={{ background: 'transparent', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57' }}>Cancel</button>
          )}
          {step === 'preview' && (
            <>
              <button onClick={() => { setStep('upload'); setParsed([]); setWarnings([]) }} style={{ background: 'transparent', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57' }}>← Upload different file</button>
              <button onClick={runImport} disabled={selected.length === 0} style={{ background: selected.length === 0 ? '#D3D1C7' : '#BA7517', border: 'none', borderRadius: 8, padding: '9px 22px', cursor: selected.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#FFFFFF' }}>
                Import {selected.length} client{selected.length !== 1 ? 's' : ''} →
              </button>
            </>
          )}
          {step === 'done' && (
            <button onClick={() => { onImported(); onClose() }} style={{ background: '#BA7517', border: 'none', borderRadius: 8, padding: '9px 22px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#FFFFFF' }}>
              Go to clients →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
