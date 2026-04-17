'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { X, Plus, Save, Upload, Download, Check, Loader, MessageCircle, Copy, Trash2 } from 'lucide-react'
import { createClient } from '../../../../lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────────────

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

interface Message {
  id: string
  role: string
  content: string
  created_at: string
}

interface Conversation {
  id: string
  status: string
  messages: Message[]
}

interface Alert {
  id: string
  type: string
  title: string
  body?: string
  resolved: boolean
  priority: string
  created_at: string
}

interface CoverageItem {
  key: string
  label: string
  hasCoverage: boolean
  insurer: string | null
}

interface TimelineItem {
  date: string
  text: string
  type: string
}

interface Metric {
  label: string
  value: string
  subtitle?: string
}

interface ClientData {
  id: string
  name: string
  company?: string
  type: string
  tier: string
  whatsapp?: string
  email?: string
  birthday?: string
  address?: string
}

interface Props {
  client: ClientData
  policies: Policy[]
  conversations: Conversation | null
  claims: Alert[]
  metrics: Metric[]
  birthdayDisplay: string
  coverageAnalysis: CoverageItem[]
  timeline: TimelineItem[]
  connectionStatus: 'connected' | 'pending' | 'not_connected'
  calculatedTier: string
  ifaId: string
  ifaName: string
}

// ── Constants ──────────────────────────────────────────────────────────────

const INSURERS = ['AIA', 'Great Eastern', 'Prudential', 'NTUC Income', 'Manulife', 'AXA', 'Aviva', 'Tokio Marine', 'Singlife', 'FWD', 'Etiqa', 'Other']
const POLICY_TYPES = ['Life', 'Health', 'Critical Illness', 'Disability', 'Motor', 'Travel', 'Property', 'Professional Indemnity', 'Group Health', 'Group Life', 'Fire', 'Business Interruption', 'Keyman', 'D&O', 'Cyber', 'Workers Compensation', 'Public Liability', 'Marine']

// ── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (d: string) => {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return '—' }
}

const formatRelativeTime = (dateStr: string) => {
  if (!dateStr) return '—'
  try {
    const now = new Date()
    const date = new Date(dateStr)
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return '—' }
}

// ── Styles ─────────────────────────────────────────────────────────────────

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

// ── PolicyDocCell ──────────────────────────────────────────────────────────

function PolicyDocCell({ policyId, ifaId, existingFileName }: {
  policyId: string; ifaId: string; existingFileName?: string | null
}) {
  const [state, setState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [fileName, setFileName] = useState(existingFileName ?? null)
  const [errMsg, setErrMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') { setState('error'); setErrMsg('PDF only'); setTimeout(() => setState('idle'), 2000); return }
    setState('uploading')
    const fd = new FormData()
    fd.append('file', file); fd.append('policyId', policyId); fd.append('ifaId', ifaId)
    try {
      const res = await fetch('/api/policy-doc', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setState('error'); setErrMsg(data.error ?? 'Failed'); setTimeout(() => setState('idle'), 2500); return }
      setFileName(data.fileName); setState('success'); setTimeout(() => setState('idle'), 1500)
    } catch { setState('error'); setErrMsg('Failed'); setTimeout(() => setState('idle'), 2500) }
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDownload() {
    try {
      // Get the signed URL from our API
      const res = await fetch(`/api/policy-doc?policyId=${policyId}`)
      const data = await res.json()
      if (!data.downloadUrl) return

      // Fetch the actual file as a blob (bypasses cross-origin download restrictions)
      const fileRes = await fetch(data.downloadUrl)
      const blob = await fileRes.blob()

      // Create a local blob URL and trigger download
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = data.fileName || 'policy.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      console.error('Download failed')
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input ref={fileRef} type="file" accept="application/pdf" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      {state === 'uploading' && <Loader size={13} color="#C8813A" style={{ animation: 'spin 1s linear infinite' }} />}
      {state === 'success' && <Check size={13} color="#5AB87A" />}
      {state === 'error' && <span style={{ fontSize: 11, color: '#D06060' }}>{errMsg}</span>}
      {state === 'idle' && fileName ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <button onClick={handleDownload} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
            <Download size={12} color="#C8813A" />
            <span style={{ fontSize: 11, color: '#C8813A', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
          </button>
          <button onClick={() => fileRef.current?.click()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.45 }}>
            <Upload size={11} color="#C9B99A" />
          </button>
        </div>
      ) : state === 'idle' && (
        <button onClick={() => fileRef.current?.click()} style={{ background: 'transparent', border: '1px dashed #2E1A0E', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Upload size={11} color="#C9B99A" />
          <span style={{ fontSize: 11, color: '#C9B99A' }}>Upload</span>
        </button>
      )}
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: 14, padding: '28px', width: 500, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#F5ECD7' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><X size={18} color="#C9B99A" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function ClientDetailPage({
  client, policies, conversations, claims, metrics, birthdayDisplay,
  coverageAnalysis, timeline, connectionStatus, calculatedTier, ifaId, ifaName,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  // Fetch ifaId client-side — more reliable than server prop in this architecture
  const [resolvedIfaId, setResolvedIfaId] = useState(ifaId)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) setResolvedIfaId(data.user.id)
    })
  }, [])

  const [showEdit, setShowEdit] = useState(false)
  const [showAddPolicy, setShowAddPolicy] = useState(false)
  const [showWAInstructions, setShowWAInstructions] = useState(false)
  const [copied, setCopied] = useState(false)

  const [editForm, setEditForm] = useState({
    name: client.name, company: client.company ?? '',
    whatsapp: client.whatsapp ?? '', email: client.email ?? '',
    birthday: client.birthday ?? '', address: client.address ?? '',
  })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const [policyForm, setPolicyForm] = useState({ insurer: '', type: '', premium: '', renewal_date: '', status: 'active' })
  const [policySaving, setPolicySaving] = useState(false)
  const [policyError, setPolicyError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const setupMessage = `Hi ${client.name.split(' ')[0]}! I've set up a WhatsApp group for us with Maya, my AI assistant. She'll help manage your insurance — renewals, claims, and any questions — 24/7. I'll add you now!`

  const tierColor = calculatedTier === 'platinum' ? '#E5E4E2' : calculatedTier === 'gold' ? '#C8813A' : calculatedTier === 'silver' ? '#C9B99A' : '#CD7F32'

  async function saveEdit() {
    if (!editForm.name.trim()) { setEditError('Name is required'); return }
    setEditSaving(true)
    try {
      const res = await fetch('/api/client-update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: client.id, ifaId: resolvedIfaId, ...editForm }) })
      if (!res.ok) { const d = await res.json(); setEditError(d.error ?? 'Failed'); setEditSaving(false); return }
      setShowEdit(false); router.refresh()
    } catch { setEditError('Something went wrong'); setEditSaving(false) }
  }

  async function savePolicy() {
    if (!policyForm.insurer || !policyForm.type || !policyForm.premium || !policyForm.renewal_date) { setPolicyError('Please fill in all fields'); return }
    if (!resolvedIfaId) { setPolicyError('Session error — please refresh the page'); return }
    setPolicySaving(true)
    try {
      const res = await fetch('/api/policy-add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: client.id, ifaId: resolvedIfaId, ...policyForm, premium: parseFloat(policyForm.premium) }) })
      if (!res.ok) { const d = await res.json(); setPolicyError(d.error ?? 'Failed'); setPolicySaving(false); return }
      setShowAddPolicy(false); router.refresh()
    } catch { setPolicyError('Something went wrong — please try again'); setPolicySaving(false) }
  }

  async function deletePolicy(policyId: string) {
    setDeleting(true)
    try {
      await fetch('/api/policy-delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyId, ifaId: resolvedIfaId }),
      })
      setConfirmDeleteId(null); router.refresh()
    } catch { console.error('Delete failed') }
    setDeleting(false)
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* == SECTION 1: CLIENT HEADER == */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>

        {/* Left: avatar + info */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#3D2215', border: '1px solid #C8813A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: '#C8813A', flexShrink: 0 }}>
            {client.name?.charAt(0) || '?'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 400, color: '#F5ECD7', margin: 0 }}>{client.name}</h1>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: tierColor, textTransform: 'uppercase', letterSpacing: '0.08em', background: '#2E1A0E', padding: '2px 8px', borderRadius: 100 }}>{calculatedTier}</span>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#C9B99A', background: '#1C0F0A', border: '1px solid #2E1A0E', padding: '2px 8px', borderRadius: 100, textTransform: 'capitalize' }}>{client.type}</span>
            </div>
            {client.company && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#C9B99A', marginBottom: 6 }}>{client.company}</div>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#C9B99A', alignItems: 'center' }}>
              {client.whatsapp && <span>📱 {client.whatsapp}</span>}
              {client.email && <span>✉️ {client.email}</span>}
              {client.type === 'individual' && client.birthday && <span>🎂 {birthdayDisplay}</span>}
              {client.address && <span>📍 {client.address}</span>}
            </div>
          </div>
        </div>

        {/* Right: action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button onClick={() => setShowEdit(true)} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#C8813A', padding: '8px 16px', border: '1px solid #C8813A', borderRadius: 4, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            ✏️ Edit
          </button>
          {connectionStatus !== 'connected' && (
            <button onClick={() => setShowWAInstructions(v => !v)} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#fff', padding: '8px 16px', border: 'none', borderRadius: 4, background: '#25D366', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
              <MessageCircle size={14} /> Set up WhatsApp group
            </button>
          )}
        </div>
      </div>

      {/* == SECTION 2: METRIC CARDS == */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: 8, padding: '20px 24px' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#C9B99A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{m.label}</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#F5ECD7', lineHeight: 1 }}>{m.value}</div>
            {m.subtitle && <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#C9B99A', marginTop: 6 }}>{m.subtitle}</div>}
          </div>
        ))}
      </div>

      {/* == SECTION 3: WHATSAPP == */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="panel-title">WhatsApp</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: connectionStatus === 'connected' ? '#5AB87A' : connectionStatus === 'pending' ? '#F6AD55' : '#C9B99A' }} />
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: connectionStatus === 'connected' ? '#5AB87A' : connectionStatus === 'pending' ? '#F6AD55' : '#C9B99A', fontWeight: 500 }}>
                {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'pending' ? 'Pending' : 'Not connected'}
              </span>
            </div>
          </div>
          {conversations && (
            <Link href={`/dashboard/conversations/${conversations.id}`} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#C8813A', textDecoration: 'none' }}>
              View full conversation →
            </Link>
          )}
        </div>
        <div className="panel-body">
          {conversations ? (
            <div>
              {conversations.messages?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {conversations.messages
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .slice(-3)
                    .map(message => (
                      <div key={message.id} style={{ display: 'flex', justifyContent: message.role === 'client' ? 'flex-start' : 'flex-end', marginBottom: 8 }}>
                        <div style={{ maxWidth: '70%', padding: '8px 12px', borderRadius: 12, background: message.role === 'client' ? '#2E1A0E' : '#C8813A', color: message.role === 'client' ? '#F5ECD7' : '#120A06', fontFamily: 'DM Sans, sans-serif', fontSize: 13, lineHeight: 1.4 }}>
                          <div style={{ marginBottom: 2 }}>{message.content}</div>
                          <div style={{ fontSize: 10, color: message.role === 'client' ? '#C9B99A' : 'rgba(18,10,6,0.7)', textAlign: 'right' }}>
                            {new Date(message.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#C9B99A' }}>No messages yet.</div>
              )}
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <Link href={`/dashboard/conversations/${conversations.id}`} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#C8813A', textDecoration: 'none', padding: '8px 16px', border: '1px solid #C8813A', borderRadius: 4, display: 'inline-block' }}>
                  View full conversation →
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 24, fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#C9B99A' }}>
              This client is not yet connected to Maya on WhatsApp.
            </div>
          )}
        </div>
      </div>

      {/* == SECTION 4: POLICIES TABLE == */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="panel-title">Policies</span>
          <button onClick={() => setShowAddPolicy(true)} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#C8813A', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
            + Add policy
          </button>
        </div>
        <div className="panel-body">
          {policies.length > 0 ? (
            <div className="table">
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Insurer</th><th>Type</th><th>Premium</th><th>Renewal Date</th><th>Policy Doc</th><th>Status</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map(policy => {
                    let pillClass = 'pill-ok', statusText = 'Active'
                    if (policy.renewal_date) {
                      const today = new Date(); today.setHours(0, 0, 0, 0)
                      const rd = new Date(policy.renewal_date); rd.setHours(0, 0, 0, 0)
                      const days = Math.ceil((rd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                      if (days < 0) { pillClass = 'pill-danger'; statusText = 'Lapsed' }
                      else if (days <= 30) { pillClass = 'pill-danger'; statusText = `Due in ${days} days` }
                      else if (days <= 90) { pillClass = 'pill-amber'; statusText = `Renews in ${days} days` }
                    }
                    const isConfirming = confirmDeleteId === policy.id
                    return (
                      <tr key={policy.id}>
                        <td>{policy.insurer || '—'}</td>
                        <td>{policy.type || '—'}</td>
                        <td>${(Number(policy.premium) || 0).toLocaleString()}</td>
                        <td>{formatDate(policy.renewal_date)}</td>
                        <td><PolicyDocCell policyId={policy.id} ifaId={ifaId} existingFileName={policy.document_name} /></td>
                        <td><span className={`pill ${pillClass}`}>{statusText}</span></td>
                        <td>
                          {isConfirming ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <button onClick={() => deletePolicy(policy.id)} disabled={deleting}
                                style={{ fontSize: 11, color: '#D06060', background: 'rgba(208,96,96,0.1)', border: '1px solid #D06060', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                                {deleting ? '…' : 'Confirm'}
                              </button>
                              <button onClick={() => setConfirmDeleteId(null)}
                                style={{ fontSize: 11, color: '#C9B99A', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDeleteId(policy.id)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, opacity: 0.4, display: 'flex', alignItems: 'center' }}
                              title="Delete policy">
                              <Trash2 size={13} color="#D06060" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#C9B99A' }}>No policies tracked yet.</div>
          )}
        </div>
      </div>

      {/* == SECTION 5: COVERAGE ANALYSIS == */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header"><span className="panel-title">Coverage analysis</span></div>
        <div className="panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {coverageAnalysis.map(coverage => (
              <div key={coverage.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 4, background: coverage.hasCoverage ? 'rgba(90,184,122,0.1)' : 'rgba(200,129,58,0.1)' }}>
                <div style={{ fontSize: 16, color: coverage.hasCoverage ? '#5AB87A' : '#C9B99A' }}>{coverage.hasCoverage ? '✓' : '—'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#F5ECD7', fontWeight: 500 }}>{coverage.label}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: coverage.hasCoverage ? '#5AB87A' : '#C8813A' }}>
                    {coverage.hasCoverage ? (coverage.insurer || 'Covered') : 'Not covered'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* == SECTION 6: CLAIMS == */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header"><span className="panel-title">Claims</span></div>
        <div className="panel-body">
          {claims.length > 0 ? (
            <div className="table">
              <table style={{ width: '100%' }}>
                <thead><tr><th>Date</th><th>Description</th><th>Status</th><th>Priority</th></tr></thead>
                <tbody>
                  {claims.map(claim => {
                    const claimDate = claim.created_at ? new Date(claim.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
                    const desc = claim.title || (claim.body ? claim.body.slice(0, 60) + (claim.body.length > 60 ? '...' : '') : 'No description')
                    const body = claim.body ? claim.body.slice(0, 100) + (claim.body.length > 100 ? '...' : '') : null
                    return (
                      <tr key={claim.id}>
                        <td style={{ verticalAlign: 'top' }}>{claimDate}</td>
                        <td style={{ verticalAlign: 'top' }}>
                          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#F5ECD7', fontWeight: 500, marginBottom: 4 }}>{desc}</div>
                          {body && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#C9B99A', lineHeight: 1.4 }}>{body}</div>}
                        </td>
                        <td style={{ verticalAlign: 'top' }}>
                          <span className={`pill ${claim.resolved ? 'pill-ok' : 'pill-amber'}`}>{claim.resolved ? 'Resolved' : 'Open'}</span>
                        </td>
                        <td style={{ verticalAlign: 'top' }}>
                          <span className={`pill ${claim.priority === 'high' ? 'pill-danger' : claim.priority === 'medium' ? 'pill-amber' : 'pill-info'}`}>
                            {claim.priority === 'high' ? 'High' : claim.priority === 'medium' ? 'Medium' : 'Info'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#C9B99A' }}>No claims history.</div>
          )}
        </div>
      </div>

      {/* == SECTION 7: ACTIVITY == */}
      <div className="panel">
        <div className="panel-header"><span className="panel-title">Activity</span></div>
        <div className="panel-body">
          {timeline.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {timeline.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: item.type === 'message' ? '#C8813A' : item.type === 'alert' ? '#D06060' : '#5AB87A' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#F5ECD7' }}>{item.text}</div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#C9B99A', marginTop: 2 }}>{formatRelativeTime(item.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#C9B99A' }}>No activity recorded yet.</div>
          )}
        </div>
      </div>

      {/* == WHATSAPP SETUP PANEL == */}
      {showWAInstructions && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#120A06', border: '1px solid #2E1A0E', borderRadius: 12, padding: 20, width: 340, zIndex: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: '#C8813A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>2 quick steps</span>
            <button onClick={() => setShowWAInstructions(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><X size={14} color="#C9B99A" /></button>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#3D2215', border: '1px solid #C8813A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#C8813A', fontWeight: 700, flexShrink: 0 }}>1</div>
            <div>
              <p style={{ fontSize: 13, color: '#F5ECD7', margin: '0 0 2px', fontWeight: 500 }}>Create a WhatsApp group</p>
              <p style={{ fontSize: 12, color: '#C9B99A', margin: 0, lineHeight: 1.5 }}>
                Open WhatsApp → New Group → add <strong style={{ color: '#F5ECD7' }}>{client.name}</strong>
                {client.whatsapp ? ` (${client.whatsapp})` : ''} and your Espresso number
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#3D2215', border: '1px solid #C8813A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#C8813A', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>2</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: '#F5ECD7', margin: '0 0 6px', fontWeight: 500 }}>Send this intro message</p>
              <div style={{ background: '#1C0F0A', border: '1px solid #2E1A0E', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#C9B99A', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 8 }}>"{setupMessage}"</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={async () => { await navigator.clipboard.writeText(setupMessage); setCopied(true); setTimeout(() => setCopied(false), 2500) }}
                  style={{ background: 'transparent', border: '1px solid #2E1A0E', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: '#C9B99A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'DM Sans, sans-serif' }}>
                  {copied ? <Check size={12} color="#5AB87A" /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy message'}
                </button>
                {client.whatsapp && (
                  <a href={`https://wa.me/${client.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    style={{ background: '#25D366', color: '#fff', borderRadius: 6, padding: '5px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'DM Sans, sans-serif', textDecoration: 'none', fontWeight: 500 }}>
                    Open WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* == EDIT CLIENT MODAL == */}
      {showEdit && (
        <Modal title="Edit Client" onClose={() => { setShowEdit(false); setEditError('') }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>Full Name *</label><input style={inputStyle} value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><label style={labelStyle}>Company</label><input style={inputStyle} value={editForm.company} onChange={e => setEditForm(p => ({ ...p, company: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>WhatsApp</label><input style={inputStyle} value={editForm.whatsapp} onChange={e => setEditForm(p => ({ ...p, whatsapp: e.target.value }))} placeholder="+65 9123 4567" /></div>
              <div><label style={labelStyle}>Email</label><input style={inputStyle} type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} /></div>
            </div>
            <div><label style={labelStyle}>Date of Birth</label><input style={{ ...inputStyle, colorScheme: 'dark' } as React.CSSProperties} type="date" value={editForm.birthday} onChange={e => setEditForm(p => ({ ...p, birthday: e.target.value }))} /></div>
            <div><label style={labelStyle}>Address</label><textarea style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 } as React.CSSProperties} rows={2} value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} /></div>
            {editError && <p style={{ fontSize: 12, color: '#D06060', margin: 0 }}>{editError}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveEdit} disabled={editSaving} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', opacity: editSaving ? 0.7 : 1 }}>
                <Save size={14} />{editSaving ? 'Saving…' : 'Save changes'}
              </button>
              <button onClick={() => setShowEdit(false)} style={btnOutline}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* == ADD POLICY MODAL == */}
      {showAddPolicy && (
        <Modal title="Add Policy" onClose={() => { setShowAddPolicy(false); setPolicyError('') }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label style={labelStyle}>Insurer *</label>
              <select style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties} value={policyForm.insurer} onChange={e => setPolicyForm(p => ({ ...p, insurer: e.target.value }))}>
                <option value="">Select insurer…</option>{INSURERS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Policy Type *</label>
              <select style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties} value={policyForm.type} onChange={e => setPolicyForm(p => ({ ...p, type: e.target.value }))}>
                <option value="">Select type…</option>{POLICY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>Annual Premium (SGD) *</label><input style={inputStyle} type="number" placeholder="e.g. 3600" value={policyForm.premium} onChange={e => setPolicyForm(p => ({ ...p, premium: e.target.value }))} /></div>
              <div><label style={labelStyle}>Renewal Date *</label><input style={{ ...inputStyle, colorScheme: 'dark' } as React.CSSProperties} type="date" value={policyForm.renewal_date} onChange={e => setPolicyForm(p => ({ ...p, renewal_date: e.target.value }))} /></div>
            </div>
            <div><label style={labelStyle}>Status</label>
              <select style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties} value={policyForm.status} onChange={e => setPolicyForm(p => ({ ...p, status: e.target.value }))}>
                <option value="active">Active</option><option value="lapsed">Lapsed</option><option value="cancelled">Cancelled</option>
              </select>
            </div>
            {policyError && <p style={{ fontSize: 12, color: '#D06060', margin: 0 }}>{policyError}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={savePolicy} disabled={policySaving} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', opacity: policySaving ? 0.7 : 1 }}>
                <Plus size={14} />{policySaving ? 'Saving…' : 'Add Policy'}
              </button>
              <button onClick={() => setShowAddPolicy(false)} style={btnOutline}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
