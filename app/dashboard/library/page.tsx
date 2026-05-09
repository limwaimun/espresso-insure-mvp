'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

type TabType = 'products' | 'claims-forms';

interface ClaimForm {
  id: string;
  insurer: string;
  form_type: string;
  form_name: string;
  filename: string;
  storage_url: string | null;
  status: string;
  last_fetched: string | null;
}

interface Client {
  id: string;
  name: string;
  company?: string;
}

interface MissingField {
  field: string;
  label: string;
  required: boolean;
  collected: boolean;
}

interface AtlasResult {
  form: { id: string; insurer: string; type: string; name: string; available: boolean; storageUrl?: string }
  client: { name: string; id: string }
  policy: { insurer: string; type: string; premium: number } | null
  prefill: {
    knownFields: Record<string, string>
    missingFields: MissingField[]
    requiredMissingCount: number
    completionPercent: number
  }
  mayaCollectionScript: string | null
  faFormRequestScript: string | null
  claimAttachments: { name: string; type: string; description: string }[]
  attachmentCount: number
  readyToGenerate: boolean
}

// Static fallback list in case DB not yet populated
const STATIC_FORMS: ClaimForm[] = [
  { id: 'aia-life-tpd', insurer: 'AIA', form_type: 'Life/TPD', form_name: 'AIA Life & TPD Claim Form', filename: 'aia-life-tpd.pdf', storage_url: null, status: 'pending', last_fetched: null },
  { id: 'aia-medical', insurer: 'AIA', form_type: 'Medical/Health', form_name: 'AIA Medical Claim Form', filename: 'aia-medical.pdf', storage_url: null, status: 'pending', last_fetched: null },
  { id: 'aia-ci', insurer: 'AIA', form_type: 'Critical Illness', form_name: 'AIA Critical Illness Claim Form', filename: 'aia-ci.pdf', storage_url: null, status: 'pending', last_fetched: null },
  { id: 'ge-life', insurer: 'Great Eastern', form_type: 'Life/TPD', form_name: 'GE Life & TPD Claim Form', filename: 'ge-life-tpd.pdf', storage_url: null, status: 'pending', last_fetched: null },
  { id: 'ge-medical', insurer: 'Great Eastern', form_type: 'Medical/Health', form_name: 'GE Medical Claim Form', filename: 'ge-medical.pdf', storage_url: null, status: 'pending', last_fetched: null },
  { id: 'ge-ci', insurer: 'Great Eastern', form_type: 'Critical Illness', form_name: 'GE Critical Illness Claim Form', filename: 'ge-ci.pdf', storage_url: null, status: 'pending', last_fetched: null },
  { id: 'pru-life', insurer: 'Prudential', form_type: 'Life/TPD', form_name: 'PRULife Claim Form', filename: 'pru-life.pdf', storage_url: null, status: 'pending', last_fetched: null },
  { id: 'pru-medical', insurer: 'Prudential', form_type: 'Medical/Health', form_name: 'PRUShield/Medical Claim Form', filename: 'pru-medical.pdf', storage_url: null, status: 'pending', last_fetched: null },
  { id: 'pru-ci', insurer: 'Prudential', form_type: 'Critical Illness', form_name: 'PRUCritical Illness Claim Form', filename: 'pru-ci.pdf', storage_url: null, status: 'pending', last_fetched: null },
  { id: 'income-life', insurer: 'NTUC Income', form_type: 'Life/TPD', form_name: 'Income Life Claim Form', filename: 'income-life.pdf', storage_url: null, status: 'pending', last_fetched: null },
  { id: 'income-medical', insurer: 'NTUC Income', form_type: 'Medical/Health', form_name: 'Income MediShield Claim Form', filename: 'income-medical.pdf', storage_url: null, status: 'pending', last_fetched: null },
  { id: 'income-motor', insurer: 'NTUC Income', form_type: 'Motor', form_name: 'Income Motor Claim Form', filename: 'income-motor.pdf', storage_url: null, status: 'pending', last_fetched: null },
  { id: 'income-travel', insurer: 'NTUC Income', form_type: 'Travel', form_name: 'Income Travel Claim Form', filename: 'income-travel.pdf', storage_url: null, status: 'pending', last_fetched: null },
  { id: 'manulife-life', insurer: 'Manulife', form_type: 'Life/TPD', form_name: 'Manulife Life Claim Form', filename: 'manulife-life.pdf', storage_url: null, status: 'pending', last_fetched: null },
  { id: 'manulife-medical', insurer: 'Manulife', form_type: 'Medical/Health', form_name: 'Manulife ManuMedicare Claim Form', filename: 'manulife-medical.pdf', storage_url: null, status: 'pending', last_fetched: null },
  { id: 'singlife-life', insurer: 'Singlife', form_type: 'Life/TPD', form_name: 'Singlife Life Claim Form', filename: 'singlife-life.pdf', storage_url: null, status: 'pending', last_fetched: null },
  { id: 'singlife-medical', insurer: 'Singlife', form_type: 'Medical/Health', form_name: 'Singlife Shield Medical Claim Form', filename: 'singlife-medical.pdf', storage_url: null, status: 'pending', last_fetched: null },
  { id: 'fwd-life', insurer: 'FWD', form_type: 'Life/TPD', form_name: 'FWD Life Claim Form', filename: 'fwd-life.pdf', storage_url: null, status: 'pending', last_fetched: null },
  { id: 'fwd-medical', insurer: 'FWD', form_type: 'Medical/Health', form_name: 'FWD Medical Claim Form', filename: 'fwd-medical.pdf', storage_url: null, status: 'pending', last_fetched: null },
]

export default function LibraryPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<TabType>('claims-forms')
  const [forms, setForms] = useState<ClaimForm[]>(STATIC_FORMS)
  const [clients, setClients] = useState<Client[]>([])
  const [faId, setFaId] = useState('')

  // Pre-fill modal state
  const [showPrefill, setShowPrefill] = useState(false)
  const [selectedForm, setSelectedForm] = useState<ClaimForm | null>(null)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [atlasLoading, setAtlasLoading] = useState(false)
  const [atlasResult, setAtlasResult] = useState<AtlasResult | null>(null)
  const [copiedScript, setCopiedScript] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setFaId(user.id)

    // Load clients
    const { data: clientData } = await supabase.from('clients').select('id, name, company').eq('ifa_id', user.id).order('name')
    if (clientData) setClients(clientData)

    // Try to load forms from DB (if harvester has run)
    const { data: formData } = await supabase.from('claim_forms').select('*').order('insurer')
    if (formData && formData.length > 0) setForms(formData)
  }

  async function runAtlas(form: ClaimForm, clientId: string) {
    setAtlasLoading(true)
    setAtlasResult(null)
    try {
      const res = await fetch('/api/atlas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId: form.id, clientId, faId }),
      })
      const data = await res.json()
      setAtlasResult(data)
    } catch (err) {
      console.error('[atlas] error:', err)
    }
    setAtlasLoading(false)
  }

  function openPrefill(form: ClaimForm) {
    setSelectedForm(form)
    setSelectedClientId('')
    setAtlasResult(null)
    setShowPrefill(true)
  }

  const groupedForms = forms.reduce((acc, form) => {
    if (!acc[form.insurer]) acc[form.insurer] = []
    acc[form.insurer].push(form)
    return acc
  }, {} as Record<string, ClaimForm[]>)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', background: '#FFFFFF',
    border: '1px solid #E8E2DA', borderRadius: 8, color: '#1A1410',
    fontFamily: 'DM Sans, sans-serif', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ width: '100%', padding: '0', minHeight: '100vh' }}>
      <div className="px-8 py-6">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 400, color: '#1A1410', margin: 0 }}>Library</h1>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid #E8E2DA' }}>
          {(['products', 'claims-forms'] as TabType[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500,
              padding: '8px 16px', borderRadius: 6,
              background: activeTab === tab ? '#BA7517' : 'transparent',
              color: activeTab === tab ? '#F7F4F0' : '#6B6460',
              border: activeTab === tab ? 'none' : '1px solid #E8E2DA',
              cursor: 'pointer',
            }}>
              {tab === 'products' ? 'Products' : 'Claims Forms'}
            </button>
          ))}
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div style={{ background: '#F7F4F0', border: '1px solid #E8E2DA', borderRadius: 12, padding: '80px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 24, opacity: 0.5 }}>📚</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color: '#1A1410', marginBottom: 16 }}>No products in your library yet</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#6B6460', lineHeight: 1.6, maxWidth: 400, margin: '0 auto 24px' }}>
              Forward a product PDF to Maya on WhatsApp to get started. Maya will extract insurer details, benefits, premiums, and riders automatically.
            </div>
          </div>
        )}

        {/* Claims Forms Tab */}
        {activeTab === 'claims-forms' && (
          <>
            <div style={{ background: 'rgba(58,125,90,0.10)', border: '1px solid #3A7D5A', borderRadius: 8, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <span style={{ fontSize: 20 }}>🤖</span>
              <div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#1A1410', marginBottom: 4 }}>Atlas — Smart Claims Pre-fill</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460', lineHeight: 1.6 }}>
                  Click "Pre-fill for client" on any form. Atlas will pre-fill everything from your client database and tell Maya exactly what to collect from the client.
                </div>
              </div>
            </div>

            {Object.entries(groupedForms).map(([insurer, insurerForms]) => (
              <div key={insurer} style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 600 }}>
                  {insurer}
                </div>
                <div style={{ background: '#F7F4F0', border: '1px solid #E8E2DA', borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {insurerForms.map((form, i) => (
                        <tr key={form.id} style={{ borderBottom: i < insurerForms.length - 1 ? '1px solid #E8E2DA' : 'none' }}>
                          <td style={{ padding: '12px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', width: '35%' }}>
                            {form.form_name}
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460', width: '20%' }}>
                            {form.form_type}
                          </td>
                          <td style={{ padding: '12px 16px', width: '15%' }}>
                            <span style={{
                              fontSize: 10, padding: '2px 8px', borderRadius: 100, fontFamily: 'DM Sans, sans-serif',
                              background: form.storage_url ? 'rgba(58,125,90,0.10)' : 'rgba(186,117,23,0.10)',
                              color: form.storage_url ? '#3A7D5A' : '#6B6460',
                              border: `1px solid ${form.storage_url ? 'rgba(58,125,90,0.25)' : '#9B9088'}`,
                            }}>
                              {form.storage_url ? '✓ Available' : 'Pending'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                              {form.storage_url && (
                                <a href={form.storage_url} target="_blank" rel="noopener noreferrer"
                                  style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, padding: '4px 10px', borderRadius: 4, background: 'rgba(186,117,23,0.10)', color: '#BA7517', border: '1px solid #9B9088', textDecoration: 'none' }}>
                                  Download
                                </a>
                              )}
                              <button onClick={() => openPrefill(form)}
                                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 4, background: '#BA7517', color: '#F7F4F0', border: 'none', cursor: 'pointer' }}>
                                Pre-fill for client
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* ── Pre-fill Modal ── */}
      {showPrefill && selectedForm && (
        <div onClick={() => setShowPrefill(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#F7F4F0', border: '1px solid #E8E2DA', borderRadius: 14, padding: 28, width: 580, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#1A1410' }}>{selectedForm.form_name}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460', marginTop: 2 }}>{selectedForm.insurer} · {selectedForm.form_type}</div>
              </div>
              <button onClick={() => setShowPrefill(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B6460', fontSize: 18 }}>✕</button>
            </div>

            {/* Client selector */}
            {!atlasResult && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#6B6460', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Select client
                </label>
                <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}>
                  <option value="">Choose client…</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
                </select>
              </div>
            )}

            {!atlasResult && (
              <button
                onClick={() => selectedClientId && runAtlas(selectedForm, selectedClientId)}
                disabled={!selectedClientId || atlasLoading}
                style={{ width: '100%', background: selectedClientId ? '#BA7517' : '#E8E2DA', color: selectedClientId ? '#F7F4F0' : '#6B6460', border: 'none', borderRadius: 8, padding: '12px 0', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, cursor: selectedClientId ? 'pointer' : 'not-allowed' }}>
                {atlasLoading ? '🤖 Atlas is analysing…' : '🤖 Pre-fill with Atlas'}
              </button>
            )}

            {/* Atlas Result */}
            {atlasResult && (
              <div>
                {!atlasResult.form.available ? (
                  /* ── Form not in library — ask FA to upload it ── */
                  <div>
                    <div style={{ background: 'rgba(186,117,23,0.10)', border: '1px solid #9B9088', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#854F0B', fontWeight: 600, marginBottom: 6 }}>
                        ⚠ Form not in library yet
                      </div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460', lineHeight: 1.6 }}>
                        The <strong style={{ color: '#1A1410' }}>{atlasResult.form.name}</strong> hasn't been uploaded to your library. Download it from {atlasResult.form.insurer} and upload it here so Atlas can pre-fill it for your client.
                      </div>
                    </div>

                    {atlasResult.faFormRequestScript && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#BA7517', fontWeight: 600, marginBottom: 8 }}>
                          💬 Maya will send you this
                        </div>
                        <div style={{ background: '#FFFFFF', border: '1px solid #E8E2DA', borderRadius: 8, padding: 12, fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 8 }}>
                          "{atlasResult.faFormRequestScript}"
                        </div>
                        <button onClick={async () => { await navigator.clipboard.writeText(atlasResult.faFormRequestScript!); setCopiedScript(true); setTimeout(() => setCopiedScript(false), 2000) }}
                          style={{ background: 'transparent', border: '1px solid #E8E2DA', borderRadius: 6, padding: '5px 12px', fontSize: 11, color: '#6B6460', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                          {copiedScript ? '✓ Copied!' : 'Copy message'}
                        </button>
                      </div>
                    )}

                    <a href={`https://www.google.com/search?q=${encodeURIComponent(atlasResult.form.insurer + ' ' + atlasResult.form.type + ' claim form Singapore PDF')}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: 'block', textAlign: 'center', background: '#BA7517', color: '#F7F4F0', borderRadius: 8, padding: '10px 0', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                      Find {atlasResult.form.insurer} form →
                    </a>
                  </div>
                ) : (
                  /* ── Form available — show pre-fill details ── */
                  <div>
                {/* Completion bar */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460' }}>Form completion</span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: atlasResult.prefill!.completionPercent >= 80 ? '#3A7D5A' : '#BA7517' }}>
                      {atlasResult.prefill!.completionPercent}%
                    </span>
                  </div>
                  <div style={{ height: 6, background: '#E8E2DA', borderRadius: 3 }}>
                    <div style={{ height: '100%', borderRadius: 3, background: atlasResult.prefill!.completionPercent >= 80 ? '#3A7D5A' : '#BA7517', width: `${atlasResult.prefill!.completionPercent}%`, transition: 'width 0.5s' }} />
                  </div>
                </div>

                {/* Known fields */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#3A7D5A', fontWeight: 600, marginBottom: 8 }}>
                    ✓ Pre-filled from database ({Object.keys(atlasResult.prefill!.knownFields).length} fields)
                  </div>
                  <div style={{ background: '#FFFFFF', border: '1px solid #E8E2DA', borderRadius: 8, padding: 12, maxHeight: 140, overflowY: 'auto' }}>
                    {Object.entries(atlasResult.prefill!.knownFields).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 4, fontFamily: 'DM Sans, sans-serif', fontSize: 11 }}>
                        <span style={{ color: '#6B6460', minWidth: 140 }}>{k.replace(/_/g, ' ')}</span>
                        <span style={{ color: '#1A1410' }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing fields */}
                {atlasResult.prefill!.missingFields.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#854F0B', fontWeight: 600, marginBottom: 8 }}>
                      ⚠ Missing fields ({atlasResult.prefill!.requiredMissingCount} required)
                    </div>
                    <div style={{ background: '#FFFFFF', border: '1px solid #E8E2DA', borderRadius: 8, padding: 12 }}>
                      {atlasResult.prefill!.missingFields.map(f => (
                        <div key={f.field} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontFamily: 'DM Sans, sans-serif', fontSize: 11 }}>
                          <span style={{ color: f.required ? '#D06060' : '#6B6460' }}>{f.required ? '●' : '○'}</span>
                          <span style={{ color: '#1A1410' }}>{f.label}</span>
                          {f.required && <span style={{ color: '#D06060', fontSize: 9 }}>REQUIRED</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Maya collection script */}
                {atlasResult.mayaCollectionScript && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#BA7517', fontWeight: 600, marginBottom: 8 }}>
                      💬 Send to Maya — she'll collect the rest
                    </div>
                    <div style={{ background: '#FFFFFF', border: '1px solid #E8E2DA', borderRadius: 8, padding: 12, fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 8 }}>
                      "{atlasResult.mayaCollectionScript}"
                    </div>
                    <button
                      onClick={async () => { await navigator.clipboard.writeText(atlasResult.mayaCollectionScript!); setCopiedScript(true); setTimeout(() => setCopiedScript(false), 2000) }}
                      style={{ background: 'transparent', border: '1px solid #E8E2DA', borderRadius: 6, padding: '5px 12px', fontSize: 11, color: '#6B6460', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                      {copiedScript ? '✓ Copied!' : 'Copy message for Maya'}
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                  {atlasResult.form.available && atlasResult.form.storageUrl && (
                    <a href={atlasResult.form.storageUrl} target="_blank" rel="noopener noreferrer"
                      style={{ flex: 1, background: '#BA7517', color: '#F7F4F0', border: 'none', borderRadius: 8, padding: '10px 0', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', textAlign: 'center' }}>
                      Download blank form
                    </a>
                  )}
                  <button onClick={() => { setAtlasResult(null); setSelectedClientId('') }}
                    style={{ flex: 1, background: 'transparent', border: '1px solid #E8E2DA', borderRadius: 8, padding: '10px 0', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460', cursor: 'pointer' }}>
                    Try another client
                  </button>
                </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
