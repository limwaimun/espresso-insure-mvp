'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, Save, Upload, Download, Check, Loader, MessageCircle, Copy } from 'lucide-react'

interface Policy {
  id: string
  insurer: string
  type: string
  premium: number
  renewal_date: string
  status: string
  document_name?: string | null
  document_url?: string | null
}

interface Props {
  clientId: string
  clientName: string
  clientWhatsApp?: string | null
  clientEmail?: string | null
  clientBirthday?: string | null
  clientAddress?: string | null
  clientCompany?: string | null
  clientType: string
  ifaId: string
  ifaName: string
  connectionStatus: 'connected' | 'pending' | 'not_connected'
  policies: Policy[]
}

const formatDate = (d: string) => {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return '—' }
}

const INSURERS = ['AIA', 'Great Eastern', 'Prudential', 'NTUC Income', 'Manulife', 'AXA', 'Aviva', 'Tokio Marine', 'Singlife', 'FWD', 'Etiqa', 'Other']
const POLICY_TYPES = ['Life', 'Health', 'Critical Illness', 'Disability', 'Motor', 'Travel', 'Property', 'Professional Indemnity', 'Group Health', 'Group Life', 'Fire', 'Business Interruption', 'Keyman', 'D&O', 'Cyber', 'Workers Compensation', 'Public Liability', 'Marine']

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#1C0F0A', border: '1px solid #2E1A0E',
  borderRadius: 8, padding: '10px 13px', fontSize: 13, color: '#F5ECD7',
  outline: 'none', fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, color: '#C9B99A', textTransform: 'uppercase',
  letterSpacing: '0.08em', marginBottom: 5, display: 'block',
}

const btnPrimary: React.CSSProperties = {
  background: '#C8813A', color: '#120A06', border: 'none',
  borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
  display: 'flex', alignItems: 'center', gap: 6,
}

const btnOutline: React.CSSProperties = {
  background: 'transparent', color: '#C9B99A', border: '1px solid #2E1A0E',
  borderRadius: 8, padding: '10px 20px', fontSize: 13,
  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
}

// ── Policy Doc Cell — proper useRef ────────────────────────────────────────

function PolicyDocCell({ policyId, ifaId, existingFileName }: {
  policyId: string
  ifaId: string
  existingFileName?: string | null
}) {
  const [state, setState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [fileName, setFileName] = useState(existingFileName ?? null)
  const [errMsg, setErrMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') {
      setState('error'); setErrMsg('PDF only')
      setTimeout(() => setState('idle'), 2000)
      return
    }
    setState('uploading')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('policyId', policyId)
    fd.append('ifaId', ifaId)
    try {
      const res = await fetch('/api/policy-doc', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setState('error'); setErrMsg(data.error ?? 'Upload failed')
        setTimeout(() => setState('idle'), 2500)
        return
      }
      setFileName(data.fileName)
      setState('success')
      setTimeout(() => setState('idle'), 1500)
    } catch {
      setState('error'); setErrMsg('Upload failed')
      setTimeout(() => setState('idle'), 2500)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDownload() {
    try {
      const res = await fetch(`/api/policy-doc?policyId=${policyId}`)
      const data = await res.json()
      if (data.downloadUrl) window.open(data.downloadUrl, '_blank')
    } catch {
      console.error('Download failed')
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />

      {state === 'uploading' && (
        <Loader size={13} color="#C8813A" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
      )}
      {state === 'success' && <Check size={13} color="#5AB87A" />}
      {state === 'error' && (
        <span style={{ fontSize: 11, color: '#D06060' }}>{errMsg}</span>
      )}

      {state === 'idle' && fileName ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <button
            onClick={handleDownload}
            title={`Download ${fileName}`}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
          >
            <Download size={12} color="#C8813A" />
            <span style={{ fontSize: 11, color: '#C8813A', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fileName}
            </span>
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            title="Replace document"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.45 }}
          >
            <Upload size={11} color="#C9B99A" />
          </button>
        </div>
      ) : state === 'idle' ? (
        <button
          onClick={() => fileRef.current?.click()}
          style={{ background: 'transparent', border: '1px dashed #2E1A0E', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Upload size={11} color="#C9B99A" />
          <span style={{ fontSize: 11, color: '#C9B99A' }}>Upload</span>
        </button>
      ) : null}
    </div>
  )
}

// ── Modal helper ───────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: 14, padding: '28px', width: 500, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#F5ECD7' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
            <X size={18} color="#C9B99A" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function ClientDetailInteractive({
  clientId, clientName, clientWhatsApp, clientEmail, clientBirthday,
  clientAddress, clientCompany, clientType, ifaId, ifaName,
  connectionStatus, policies,
}: Props) {
  const router = useRouter()

  const [showEdit, setShowEdit] = useState(false)
  const [showAddPolicy, setShowAddPolicy] = useState(false)
  const [showWAInstructions, setShowWAInstructions] = useState(false)
  const [copied, setCopied] = useState(false)

  const [editForm, setEditForm] = useState({
    name: clientName, company: clientCompany ?? '',
    whatsapp: clientWhatsApp ?? '', email: clientEmail ?? '',
    birthday: clientBirthday ?? '', address: clientAddress ?? '',
  })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const [policyForm, setPolicyForm] = useState({ insurer: '', type: '', premium: '', renewal_date: '', status: 'active' })
  const [policySaving, setPolicySaving] = useState(false)
  const [policyError, setPolicyError] = useState('')

  const setupMessage = `Hi ${clientName.split(' ')[0]}! I've set up a WhatsApp group for us with Maya, my AI assistant. She'll help manage your insurance — renewals, claims, and any questions — 24/7. I'll add you now!`

  async function saveEdit() {
    if (!editForm.name.trim()) { setEditError('Name is required'); return }
    setEditSaving(true)
    try {
      const res = await fetch('/api/client-update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, ifaId, ...editForm }),
      })
      if (!res.ok) { const d = await res.json(); setEditError(d.error ?? 'Failed'); setEditSaving(false); return }
      setShowEdit(false); router.refresh()
    } catch { setEditError('Something went wrong'); setEditSaving(false) }
  }

  async function savePolicy() {
    if (!policyForm.insurer || !policyForm.type || !policyForm.premium || !policyForm.renewal_date) {
      setPolicyError('Please fill in all fields'); return
    }
    setPolicySaving(true)
    try {
      const res = await fetch('/api/policy-add', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, ifaId, ...policyForm, premium: parseFloat(policyForm.premium) }),
      })
      if (!res.ok) { const d = await res.json(); setPolicyError(d.error ?? 'Failed'); setPolicySaving(false); return }
      setShowAddPolicy(false); router.refresh()
    } catch { setPolicyError('Something went wrong'); setPolicySaving(false) }
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(setupMessage)
    setCopied(true); setTimeout(() => setCopied(false), 2500)
  }

  return (
    <>
      {/* ── Header action buttons (Edit + WhatsApp) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => setShowEdit(true)}
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#C8813A', padding: '8px 16px', border: '1px solid #C8813A', borderRadius: 4, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ✏️ Edit
        </button>

        {connectionStatus !== 'connected' && (
          <button
            onClick={() => setShowWAInstructions(v => !v)}
            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#fff', padding: '8px 16px', border: 'none', borderRadius: 4, background: '#25D366', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
          >
            <MessageCircle size={14} />
            Set up WhatsApp group
          </button>
        )}
      </div>

      {/* ── WhatsApp setup instructions panel (inline, no auto-open) ── */}
      {showWAInstructions && connectionStatus !== 'connected' && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#120A06', border: '1px solid #2E1A0E', borderRadius: 12, padding: 20, width: 340, zIndex: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: '#C8813A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>2 quick steps</span>
            <button onClick={() => setShowWAInstructions(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
              <X size={14} color="#C9B99A" />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#3D2215', border: '1px solid #C8813A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#C8813A', fontWeight: 700, flexShrink: 0 }}>1</div>
            <div>
              <p style={{ fontSize: 13, color: '#F5ECD7', margin: '0 0 2px', fontWeight: 500 }}>Create a WhatsApp group</p>
              <p style={{ fontSize: 12, color: '#C9B99A', margin: 0, lineHeight: 1.5 }}>
                Open WhatsApp → New Group → add <strong style={{ color: '#F5ECD7' }}>{clientName}</strong>
                {clientWhatsApp ? ` (${clientWhatsApp})` : ''} and your Espresso WhatsApp number
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#3D2215', border: '1px solid #C8813A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#C8813A', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>2</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: '#F5ECD7', margin: '0 0 6px', fontWeight: 500 }}>Send this message in the group</p>
              <div style={{ background: '#1C0F0A', border: '1px solid #2E1A0E', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#C9B99A', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 8 }}>
                "{setupMessage}"
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={copyMessage} style={{ background: 'transparent', border: '1px solid #2E1A0E', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: '#C9B99A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'DM Sans, sans-serif' }}>
                  {copied ? <Check size={12} color="#5AB87A" /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy message'}
                </button>
                {clientWhatsApp && (
                  <a href={`https://wa.me/${clientWhatsApp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    style={{ background: '#25D366', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'DM Sans, sans-serif', textDecoration: 'none', fontWeight: 500 }}>
                    Open WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Policies table (rendered here so PolicyDocCell works inline) ── */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="panel-title">Policies</span>
          <button
            onClick={() => setShowAddPolicy(true)}
            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#C8813A', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            + Add policy
          </button>
        </div>
        <div className="panel-body">
          {policies && policies.length > 0 ? (
            <div className="table">
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Insurer</th>
                    <th>Type</th>
                    <th>Premium</th>
                    <th>Renewal Date</th>
                    <th>Policy Doc</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map(policy => {
                    let pillClass = 'pill-ok'
                    let statusText = 'Active'
                    if (policy.renewal_date) {
                      const today = new Date(); today.setHours(0, 0, 0, 0)
                      const rd = new Date(policy.renewal_date); rd.setHours(0, 0, 0, 0)
                      const days = Math.ceil((rd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                      if (days < 0) { pillClass = 'pill-danger'; statusText = 'Lapsed' }
                      else if (days <= 30) { pillClass = 'pill-danger'; statusText = `Due in ${days} days` }
                      else if (days <= 90) { pillClass = 'pill-amber'; statusText = `Renews in ${days} days` }
                    }
                    return (
                      <tr key={policy.id}>
                        <td>{policy.insurer || '—'}</td>
                        <td>{policy.type || '—'}</td>
                        <td>${(Number(policy.premium) || 0).toLocaleString()}</td>
                        <td>{formatDate(policy.renewal_date)}</td>
                        <td>
                          <PolicyDocCell
                            policyId={policy.id}
                            ifaId={ifaId}
                            existingFileName={policy.document_name ?? null}
                          />
                        </td>
                        <td><span className={`pill ${pillClass}`}>{statusText}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#C9B99A' }}>
              No policies tracked yet.
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Client Modal ── */}
      {showEdit && (
        <Modal title="Edit Client" onClose={() => { setShowEdit(false); setEditError('') }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input style={inputStyle} value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Company</label>
                <input style={inputStyle} value={editForm.company} onChange={e => setEditForm(p => ({ ...p, company: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>WhatsApp</label>
                <input style={inputStyle} value={editForm.whatsapp} onChange={e => setEditForm(p => ({ ...p, whatsapp: e.target.value }))} placeholder="+65 9123 4567" />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Date of Birth</label>
              <input style={{ ...inputStyle, colorScheme: 'dark' } as React.CSSProperties} type="date" value={editForm.birthday} onChange={e => setEditForm(p => ({ ...p, birthday: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Address</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 } as React.CSSProperties} rows={2} value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            {editError && <p style={{ fontSize: 12, color: '#D06060', margin: 0 }}>{editError}</p>}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={saveEdit} disabled={editSaving} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', opacity: editSaving ? 0.7 : 1 }}>
                <Save size={14} />{editSaving ? 'Saving…' : 'Save changes'}
              </button>
              <button onClick={() => setShowEdit(false)} style={btnOutline}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Add Policy Modal ── */}
      {showAddPolicy && (
        <Modal title="Add Policy" onClose={() => { setShowAddPolicy(false); setPolicyError('') }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Insurer *</label>
              <select style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties} value={policyForm.insurer} onChange={e => setPolicyForm(p => ({ ...p, insurer: e.target.value }))}>
                <option value="">Select insurer…</option>
                {INSURERS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Policy Type *</label>
              <select style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties} value={policyForm.type} onChange={e => setPolicyForm(p => ({ ...p, type: e.target.value }))}>
                <option value="">Select type…</option>
                {POLICY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Annual Premium (SGD) *</label>
                <input style={inputStyle} type="number" placeholder="e.g. 3600" value={policyForm.premium} onChange={e => setPolicyForm(p => ({ ...p, premium: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Renewal Date *</label>
                <input style={{ ...inputStyle, colorScheme: 'dark' } as React.CSSProperties} type="date" value={policyForm.renewal_date} onChange={e => setPolicyForm(p => ({ ...p, renewal_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties} value={policyForm.status} onChange={e => setPolicyForm(p => ({ ...p, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="lapsed">Lapsed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {policyError && <p style={{ fontSize: 12, color: '#D06060', margin: 0 }}>{policyError}</p>}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={savePolicy} disabled={policySaving} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', opacity: policySaving ? 0.7 : 1 }}>
                <Plus size={14} />{policySaving ? 'Saving…' : 'Add Policy'}
              </button>
              <button onClick={() => setShowAddPolicy(false)} style={btnOutline}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
