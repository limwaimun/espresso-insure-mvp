'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import HoldingsSection from '@/components/HoldingsSection'
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
      {state === 'uploading' && <Loader size={13} color="#BA7517" style={{ animation: 'spin 1s linear infinite' }} />}
      {state === 'success' && <Check size={13} color="#0F6E56" />}
      {state === 'error' && <span style={{ fontSize: 11, color: '#A32D2D' }}>{errMsg}</span>}
      {state === 'idle' && fileName ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <button onClick={handleDownload} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
            <Download size={12} color="#BA7517" />
            <span style={{ fontSize: 11, color: '#BA7517', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
          </button>
          <button onClick={() => fileRef.current?.click()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.45 }}>
            <Upload size={11} color="#6B6460" />
          </button>
        </div>
      ) : state === 'idle' && (
        <button onClick={() => fileRef.current?.click()} style={{ background: 'transparent', border: '1px dashed #E8E2DA', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Upload size={11} color="#6B6460" />
          <span style={{ fontSize: 11, color: '#6B6460' }}>Upload</span>
        </button>
      )}
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#F7F4F0', border: '0.5px solid #E8E2DA', borderRadius: 14, padding: '28px', width: 500, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, color: '#1A1410' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><X size={18} color="#6B6460" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── ClaimCard ──────────────────────────────────────────────────────────────

function ClaimCard({ claim, ifaId, onUpdated }: { claim: Alert; ifaId: string; onUpdated: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(claim.title || '')
  const [editBody, setEditBody] = useState(claim.body || '')
  const [saving, setSaving] = useState(false)

  // Optimistic local state — updates instantly, syncs to server in background
  const [localStatus, setLocalStatus] = useState(
    claim.resolved ? 'resolved' : (claim.status === 'in_progress' ? 'in_progress' : 'open')
  )
  const [localPriority, setLocalPriority] = useState(claim.priority || 'medium')

  const claimDate = claim.created_at
    ? new Date(claim.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  const TRUNCATE = 150
  const bodyText = claim.body || ''
  const isTruncated = bodyText.length > TRUNCATE

  async function saveToServer(patch: Record<string, unknown>) {
    // Fire and forget — don't await, don't block UI
    fetch('/api/claim-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claimId: claim.id, ifaId, ...patch }),
    }).catch(err => console.error('[claim-update] failed:', err))
  }

  function handleStatusChange(status: string) {
    setLocalStatus(status) // instant UI update
    saveToServer({ status, resolved: status === 'resolved' })
  }

  function handlePriorityChange(priority: string) {
    setLocalPriority(priority) // instant UI update
    saveToServer({ priority })
  }

  async function saveEdit() {
    setSaving(true)
    await fetch('/api/claim-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claimId: claim.id, ifaId, title: editTitle, body: editBody }),
    })
    setEditing(false)
    setSaving(false)
    onUpdated() // refresh only after text edit save
  }

  return (
    <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '14px 16px' }}>

      {/* Top row: date + edit button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#6B6460' }}>{claimDate}</span>
        {!editing && (
          <button onClick={() => setEditing(true)}
            style={{ background: 'transparent', border: '0.5px solid #E8E2DA', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: 11, color: '#6B6460', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
            ✏️ Edit
          </button>
        )}
      </div>

      {/* Content */}
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
            style={{ ...inputStyle, fontSize: 13, fontWeight: 500 }} placeholder="Claim title" />
          <textarea value={editBody} onChange={e => setEditBody(e.target.value)}
            rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, fontSize: 12 } as React.CSSProperties}
            placeholder="Description" />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveEdit} disabled={saving} style={{ ...btnPrimary, fontSize: 12, padding: '6px 14px', opacity: saving ? 0.7 : 1 }}>
              <Save size={12} />{saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => { setEditing(false); setEditTitle(claim.title || ''); setEditBody(claim.body || '') }}
              style={{ ...btnOutline, fontSize: 12, padding: '6px 14px' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', fontWeight: 500, marginBottom: 4 }}>
            {claim.title || 'Untitled claim'}
          </div>
          {bodyText && (
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460', lineHeight: 1.6 }}>
              {expanded || !isTruncated ? bodyText : bodyText.slice(0, TRUNCATE) + '…'}
              {isTruncated && (
                <button onClick={() => setExpanded(v => !v)}
                  style={{ background: 'transparent', border: 'none', color: '#BA7517', fontSize: 11, cursor: 'pointer', padding: '0 4px', fontFamily: 'DM Sans, sans-serif' }}>
                  {expanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bottom row: status dropdown + priority dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#6B6460' }}>Status:</span>
          <select
            value={localStatus}
            onChange={e => handleStatusChange(e.target.value)}
            style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 11,
              background: '#F7F4F0', border: '0.5px solid #E8E2DA', borderRadius: 5,
              padding: '4px 8px', cursor: 'pointer', outline: 'none',
              color: localStatus === 'resolved' ? '#0F6E56' : localStatus === 'in_progress' ? '#4A9EBF' : '#854F0B',
            }}>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#6B6460' }}>Priority:</span>
          <select
            value={localPriority}
            onChange={e => handlePriorityChange(e.target.value)}
            style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 11,
              background: '#F7F4F0', border: '0.5px solid #E8E2DA', borderRadius: 5,
              padding: '4px 8px', cursor: 'pointer', outline: 'none',
              color: localPriority === 'high' ? '#A32D2D' : localPriority === 'medium' ? '#854F0B' : '#6B6460',
            }}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

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
  const [policyFile, setPolicyFile] = useState<File | null>(null)
  const policyFileRef = useRef<HTMLInputElement>(null)
  const [localActivity, setLocalActivity] = useState<{ date: string; text: string; type: string }[]>([])

  // Compass state
  const [compassGap, setCompassGap] = useState<{ key: string; label: string } | null>(null)
  const [compassResult, setCompassResult] = useState<any>(null)
  const [compassLoading, setCompassLoading] = useState(false)

  useEffect(() => {
    if (!compassGap || !resolvedIfaId) return
    setCompassResult(null)
    setCompassLoading(true)
    fetch('/api/compass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ifaId: resolvedIfaId,
        clientId: client.id,
        client,
        policies,
        query: `What ${compassGap.label} coverage should ${client.name} consider?`,
        mode: 'comparison',
        coverageType: compassGap.label,
      }),
    })
      .then(r => r.json())
      .then(data => { setCompassResult(data); setCompassLoading(false) })
      .catch(() => setCompassLoading(false))
  }, [compassGap])

  const setupMessage = `Hi ${client.name.split(' ')[0]}! I've set up a WhatsApp group for us with Maya, my AI assistant. She'll help manage your insurance — renewals, claims, and any questions — 24/7. I'll add you now!`

  const tierColor = calculatedTier === 'platinum' ? '#E5E4E2' : calculatedTier === 'gold' ? '#BA7517' : calculatedTier === 'silver' ? '#6B6460' : '#CD7F32'

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
      const newPolicy = await res.json()

      // If a PDF was selected, upload it now
      if (policyFile && newPolicy.policy?.id) {
        const fd = new FormData()
        fd.append('file', policyFile)
        fd.append('policyId', newPolicy.policy.id)
        fd.append('ifaId', resolvedIfaId)
        await fetch('/api/policy-doc', { method: 'POST', body: fd })
      }

      setShowAddPolicy(false)
      setPolicyFile(null)
      setPolicySaving(false)

      // Optimistically add to activity immediately
      setLocalActivity(prev => [{
        date: new Date().toISOString(),
        text: `${policyForm.insurer} ${policyForm.type} added ($${parseFloat(policyForm.premium).toLocaleString()}/yr)`,
        type: 'policy',
      }, ...prev])

      router.refresh()
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
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#E8E2DA', border: '1px solid #BA7517', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 22, color: '#BA7517', flexShrink: 0 }}>
            {client.name?.charAt(0) || '?'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 400, color: '#1A1410', margin: 0 }}>{client.name}</h1>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: tierColor, textTransform: 'uppercase', letterSpacing: '0.08em', background: '#E8E2DA', padding: '2px 8px', borderRadius: 100 }}>{calculatedTier}</span>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#6B6460', background: '#FFFFFF', border: '0.5px solid #E8E2DA', padding: '2px 8px', borderRadius: 100, textTransform: 'capitalize' }}>{client.type}</span>
            </div>
            {client.company && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#6B6460', marginBottom: 6 }}>{client.company}</div>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460', alignItems: 'center' }}>
              {client.whatsapp && <span>📱 {client.whatsapp}</span>}
              {client.email && <span>✉️ {client.email}</span>}
              {client.type === 'individual' && client.birthday && <span>🎂 {birthdayDisplay}</span>}
              {client.address && <span>📍 {client.address}</span>}
            </div>
          </div>
        </div>

        {/* Right: action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button onClick={() => setShowEdit(true)} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#BA7517', padding: '8px 16px', border: '1px solid #BA7517', borderRadius: 4, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            ✏️ Edit
          </button>
          <a href={`/dashboard/maya-playground?clientId=${client.id}`}
            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', padding: '8px 16px', border: '0.5px solid #E8E2DA', borderRadius: 4, background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            🤖 Test with Maya
          </a>
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
          <div key={i} style={{ background: '#F7F4F0', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '20px 24px' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#6B6460', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{m.label}</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 28, fontWeight: 400, color: '#1A1410', lineHeight: 1 }}>{m.value}</div>
            {m.subtitle && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#5F5A57', marginTop: 6 }}>{m.subtitle}</div>}
          </div>
        ))}
      </div>

      {/* == SECTION 3: WHATSAPP == */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="panel-title">WhatsApp</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: connectionStatus === 'connected' ? '#0F6E56' : connectionStatus === 'pending' ? '#F6AD55' : '#6B6460' }} />
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: connectionStatus === 'connected' ? '#0F6E56' : connectionStatus === 'pending' ? '#F6AD55' : '#6B6460', fontWeight: 500 }}>
                {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'pending' ? 'Pending' : 'Not connected'}
              </span>
            </div>
          </div>
          {conversations && (
            <Link href={`/dashboard/conversations/${conversations.id}`} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#BA7517', textDecoration: 'none' }}>
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
                        <div style={{ maxWidth: '70%', padding: '8px 12px', borderRadius: 12, background: message.role === 'client' ? '#E8E2DA' : '#BA7517', color: message.role === 'client' ? '#1A1410' : '#F7F4F0', fontFamily: 'DM Sans, sans-serif', fontSize: 13, lineHeight: 1.4 }}>
                          <div style={{ marginBottom: 2 }}>{message.content}</div>
                          <div style={{ fontSize: 10, color: message.role === 'client' ? '#6B6460' : 'rgba(18,10,6,0.7)', textAlign: 'right' }}>
                            {new Date(message.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460' }}>No messages yet.</div>
              )}
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <Link href={`/dashboard/conversations/${conversations.id}`} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#BA7517', textDecoration: 'none', padding: '8px 16px', border: '1px solid #BA7517', borderRadius: 4, display: 'inline-block' }}>
                  View full conversation →
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 24, fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#6B6460' }}>
              This client is not yet connected to Maya on WhatsApp.
            </div>
          )}
        </div>
      </div>

      {/* == SECTION 4: POLICIES TABLE == */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="panel-title">Policies</span>
          <button onClick={() => { setPolicyForm({ insurer: '', type: '', premium: '', renewal_date: '', status: 'active' }); setPolicyFile(null); setPolicyError(''); setPolicySaving(false); setShowAddPolicy(true) }} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#BA7517', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
            + Add policy
          </button>
        </div>
        <div className="panel-body">
          {policies.length > 0 ? (
            <div className="table">
              <table style={{ width: '100%', tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>Insurer</th>
                    <th style={{ width: '15%' }}>Type</th>
                    <th style={{ width: '10%' }}>Premium</th>
                    <th style={{ width: '13%' }}>Renewal Date</th>
                    <th style={{ width: '16%' }}>Policy Doc</th>
                    <th style={{ width: '18%' }}>Status</th>
                    <th style={{ width: '8%' }}></th>
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
                        <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{policy.insurer || '—'}</td>
                        <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{policy.type || '—'}</td>
                        <td>${(Number(policy.premium) || 0).toLocaleString()}</td>
                        <td>{formatDate(policy.renewal_date)}</td>
                        <td><PolicyDocCell policyId={policy.id} ifaId={resolvedIfaId} existingFileName={policy.document_name} /></td>
                        <td><span className={`pill ${pillClass}`}>{statusText}</span></td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {isConfirming ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                              <button onClick={() => deletePolicy(policy.id)} disabled={deleting}
                                style={{ fontSize: 10, color: '#A32D2D', background: 'rgba(208,96,96,0.1)', border: '1px solid #A32D2D', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                                {deleting ? '…' : 'Delete'}
                              </button>
                              <button onClick={() => setConfirmDeleteId(null)}
                                style={{ fontSize: 10, color: '#6B6460', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', padding: 0 }}>
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDeleteId(policy.id)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, opacity: 0.35, display: 'flex', alignItems: 'center', marginLeft: 'auto' }}
                              title="Delete policy">
                              <Trash2 size={13} color="#A32D2D" />
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
            <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460' }}>No policies tracked yet.</div>
          )}
        </div>
      </div>

      {/* == SECTION 5: COVERAGE ANALYSIS == */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header">
          <span className="panel-title">Coverage analysis</span>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#6B6460' }}>Click a gap for Compass recommendations</span>
        </div>
        <div className="panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {coverageAnalysis.map(coverage => (
              <div
                key={coverage.key}
                onClick={() => !coverage.hasCoverage && setCompassGap(coverage)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 4,
                  background: coverage.hasCoverage ? 'rgba(90,184,122,0.1)' : 'rgba(200,129,58,0.1)',
                  cursor: coverage.hasCoverage ? 'default' : 'pointer',
                  border: compassGap?.key === coverage.key ? '1px solid #BA7517' : '1px solid transparent',
                  transition: 'border 0.15s',
                }}
              >
                <div style={{ fontSize: 16, color: coverage.hasCoverage ? '#0F6E56' : '#6B6460' }}>{coverage.hasCoverage ? '✓' : '—'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', fontWeight: 500 }}>{coverage.label}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: coverage.hasCoverage ? '#0F6E56' : '#BA7517' }}>
                    {coverage.hasCoverage ? (coverage.insurer || 'Covered') : 'Tap for recommendations'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Compass panel - shows inline below the grid */}
          {compassGap && (
            <div style={{ marginTop: 20, background: '#F7F4F0', border: '0.5px solid #E8E2DA', borderRadius: 10, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', fontWeight: 500 }}>
                  🧭 Compass — {compassGap.label} recommendations
                </div>
                <button onClick={() => { setCompassGap(null); setCompassResult(null) }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B6460', fontSize: 16 }}>✕</button>
              </div>
              {compassLoading ? (
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460', padding: '12px 0' }}>
                  Compass is analysing…
                </div>
              ) : compassResult ? (
                <div>
                  {/* Maya summary */}
                  {compassResult.mayaSummary && (
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460', lineHeight: 1.6, margin: '0 0 16px' }}>
                      {compassResult.mayaSummary}
                    </p>
                  )}
                  {/* Comparison cards */}
                  {compassResult.analysis?.comparison && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {compassResult.analysis.comparison.map((item: any, i: number) => (
                        <div key={i} style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '12px 14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <div>
                              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', fontWeight: 500 }}>{item.insurer}</div>
                              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#6B6460' }}>{item.product_name}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#BA7517' }}>
                                ${item.premium_range?.min?.toLocaleString()}–${item.premium_range?.max?.toLocaleString()}/yr
                              </div>
                              {item.claim_rating && (
                                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: item.claim_rating === 'excellent' ? '#0F6E56' : '#6B6460', textTransform: 'uppercase' }}>
                                  {item.claim_rating} claims
                                </div>
                              )}
                            </div>
                          </div>
                          {item.key_benefits?.length > 0 && (
                            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#6B6460' }}>
                              {item.key_benefits.slice(0, 2).join(' · ')}
                            </div>
                          )}
                          {item.verdict && (
                            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#0F6E56', marginTop: 6 }}>
                              {item.verdict}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Gap analysis */}
                  {compassResult.analysis?.gaps && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {compassResult.analysis.gaps.map((gap: any, i: number) => (
                        <div key={i} style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '12px 14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', fontWeight: 500 }}>{gap.coverage_type}</div>
                            <span style={{ fontSize: 10, color: gap.urgency === 'high' ? '#A32D2D' : gap.urgency === 'medium' ? '#854F0B' : '#6B6460', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif' }}>{gap.urgency}</span>
                          </div>
                          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460', marginBottom: 6 }}>{gap.reason}</div>
                          {gap.recommended_insurers?.length > 0 && (
                            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#BA7517' }}>
                              Recommended: {gap.recommended_insurers.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* == SECTION 5.5: HOLDINGS == */}
      <HoldingsSection clientId={client.id} ifaId={resolvedIfaId} />

      {/* == SECTION 6: CLAIMS == */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header"><span className="panel-title">Claims</span></div>
        <div className="panel-body">
          {claims.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {claims.map(claim => (
                <ClaimCard key={claim.id} claim={claim} ifaId={resolvedIfaId} onUpdated={() => router.refresh()} />
              ))}
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460' }}>No claims history.</div>
          )}
        </div>
      </div>

      {/* == SECTION 7: ACTIVITY == */}
      <div className="panel">
        <div className="panel-header"><span className="panel-title">Activity</span></div>
        <div className="panel-body">
          {(() => {
            // Merge local optimistic entries with server timeline, deduplicate by text
            const merged = [...localActivity, ...timeline]
              .filter((item, idx, arr) =>
                idx === arr.findIndex(t => t.text === item.text && t.type === item.type)
              )
            return merged.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {merged.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: item.type === 'message' ? '#BA7517' : item.type === 'alert' ? '#A32D2D' : '#0F6E56' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410' }}>{item.text}</div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#5F5A57', marginTop: 2 }}>{formatRelativeTime(item.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 20, textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460' }}>No activity recorded yet.</div>
            )
          })()}
        </div>
      </div>

      {/* == WHATSAPP SETUP PANEL == */}
      {showWAInstructions && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#F7F4F0', border: '0.5px solid #E8E2DA', borderRadius: 12, padding: 20, width: 340, zIndex: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: '#BA7517', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>2 quick steps</span>
            <button onClick={() => setShowWAInstructions(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><X size={14} color="#6B6460" /></button>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#E8E2DA', border: '1px solid #BA7517', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#BA7517', fontWeight: 700, flexShrink: 0 }}>1</div>
            <div>
              <p style={{ fontSize: 13, color: '#1A1410', margin: '0 0 2px', fontWeight: 500 }}>Create a WhatsApp group</p>
              <p style={{ fontSize: 12, color: '#6B6460', margin: 0, lineHeight: 1.5 }}>
                Open WhatsApp → New Group → add <strong style={{ color: '#1A1410' }}>{client.name}</strong>
                {client.whatsapp ? ` (${client.whatsapp})` : ''} and your Espresso number
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#E8E2DA', border: '1px solid #BA7517', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#BA7517', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>2</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: '#1A1410', margin: '0 0 6px', fontWeight: 500 }}>Send this intro message</p>
              <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#6B6460', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 8 }}>"{setupMessage}"</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={async () => { await navigator.clipboard.writeText(setupMessage); setCopied(true); setTimeout(() => setCopied(false), 2500) }}
                  style={{ background: 'transparent', border: '0.5px solid #E8E2DA', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: '#6B6460', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'DM Sans, sans-serif' }}>
                  {copied ? <Check size={12} color="#0F6E56" /> : <Copy size={12} />}
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
            {editError && <p style={{ fontSize: 12, color: '#A32D2D', margin: 0 }}>{editError}</p>}
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
        <Modal title="Add Policy" onClose={() => { setShowAddPolicy(false); setPolicyError(''); setPolicyFile(null) }}>
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
            {/* Optional PDF upload */}
            <div>
              <label style={labelStyle}>Policy Document (optional)</label>
              <input ref={policyFileRef} type="file" accept="application/pdf" style={{ display: 'none' }}
                onChange={e => setPolicyFile(e.target.files?.[0] ?? null)} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => policyFileRef.current?.click()}
                  style={{ background: 'transparent', border: '1px dashed #E8E2DA', borderRadius: 6, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460' }}>
                  <Upload size={12} /> {policyFile ? policyFile.name : 'Upload PDF'}
                </button>
                {policyFile && (
                  <button onClick={() => { setPolicyFile(null); if (policyFileRef.current) policyFileRef.current.value = '' }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: '#6B6460', fontSize: 11, fontFamily: 'DM Sans, sans-serif' }}>
                    Remove
                  </button>
                )}
              </div>
            </div>
            {policyError && <p style={{ fontSize: 12, color: '#A32D2D', margin: 0 }}>{policyError}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={savePolicy} disabled={policySaving} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', opacity: policySaving ? 0.7 : 1 }}>
                <Plus size={14} />{policySaving ? 'Saving…' : 'Add Policy'}
              </button>
              <button onClick={() => { setShowAddPolicy(false); setPolicyFile(null) }} style={btnOutline}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
