'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import HoldingsSection from '@/components/HoldingsSection'
import CountryCodeSelect from '@/components/CountryCodeSelect'
import PortalMenu from '@/components/PortalMenu'
import Modal from '@/components/Modal'
import DocUploadField from '@/components/DocUploadField'
import DocList from '@/components/DocList'
import {
  X, Plus, Save, Upload, Download, Check, MessageCircle, Copy, Trash2,
  Pencil, Bot, Phone, Mail, Cake, MapPin, ChevronDown, ChevronRight, MoreVertical,
} from 'lucide-react'
import { createClient } from '../../../../lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────────────

interface Policy {
  id: string
  policy_number?: string | null
  product_name?: string | null
  insurer: string
  type: string
  premium: number
  premium_frequency?: string | null
  sum_assured?: number | null
  start_date?: string | null
  renewal_date: string
  status: string
  notes?: string | null
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
  status?: string
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
  dob?: string | null
  notes?: string | null
  nok_name?: string | null
  nok_relationship?: string | null
  nok_phone?: string | null
}

interface Holding {
  id: string
  product_name?: string | null
  provider?: string | null
  platform?: string | null
  product_type?: string | null
  units?: number | null
  nav?: number | null
  units_held?: number | null
  last_nav?: number | null
  current_value: number | null
  risk_level?: string | null
  last_reviewed?: string | null
  reviewed_at?: string | null
  notes?: string | null
  // Batch 8
  avg_cost_price?: number | null
  distribution_yield?: number | null
  inception_date?: string | null
  currency?: string | null
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
  dob?: string | null
  notes?: string | null
  nok_name?: string | null
  nok_relationship?: string | null
  nok_phone?: string | null
  calculatedTier: string
  ifaId: string
  ifaName: string
  holdings: Holding[]
}

// ── Constants ──────────────────────────────────────────────────────────────

const INSURERS = ['AIA', 'Great Eastern', 'Prudential', 'NTUC Income', 'Manulife', 'AXA', 'Aviva', 'Tokio Marine', 'Singlife', 'FWD', 'Etiqa', 'Other']
const POLICY_TYPES = ['Life', 'Health', 'Critical Illness', 'Disability', 'Motor', 'Travel', 'Property', 'Professional Indemnity', 'Group Health', 'Group Life', 'Fire', 'Business Interruption', 'Keyman', 'D&O', 'Cyber', 'Workers Compensation', 'Public Liability', 'Marine']
const CLAIM_TYPES = ['Health', 'Life', 'Critical Illness', 'Disability', 'Motor', 'Travel', 'Property', 'Other']

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

// Outlined amber "+ Add X" button — used consistently across Policies, Holdings, Claims
const btnAddSection: React.CSSProperties = {
  fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#BA7517',
  background: 'transparent', border: '1px solid #BA7517', borderRadius: 6,
  padding: '6px 12px', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 4,
}

// ── Modal is now imported from @/components/Modal (shared with HoldingsSection)

// ── PortalMenu is now imported from @/components/PortalMenu (shared with HoldingsSection)

function PolicyRow({ policy, ifaId, onEdit, onAskMaya, confirmingDelete, setConfirming }: {
  policy: Policy
  ifaId: string
  onEdit: (p: Policy) => void
  onAskMaya: (p: Policy, action: 'summarize' | 'renewal_reminder') => void
  confirmingDelete: boolean
  setConfirming: (id: string | null) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLButtonElement>(null)

  function renderStatus() {
    if (policy.status === 'lapsed') return { cls: 'pill-red', text: 'Lapsed' }
    if (policy.status === 'cancelled') return { cls: 'pill-neutral', text: 'Cancelled' }
    if (policy.status === 'pending') return { cls: 'pill-amber', text: 'Pending' }
    if (!policy.renewal_date) return { cls: 'pill-green', text: 'Active' }
    const days = Math.ceil((new Date(policy.renewal_date).getTime() - Date.now()) / 86400000)
    if (days < 0) return { cls: 'pill-amber', text: 'Overdue renewal' }
    if (days <= 30) return { cls: 'pill-red', text: `Due in ${days}d` }
    if (days <= 90) return { cls: 'pill-amber', text: `${days}d to renewal` }
    return { cls: 'pill-green', text: `Renews in ${days}d` }
  }
  const { cls, text } = renderStatus()

  return (
    <>
      {/* Main row — 6 columns: Product (+ policy#), Insurer (+ type), Premium (+ SA), Renewal, Status, ⋮ */}
      <tr onClick={() => setExpanded(e => !e)} style={{ cursor: 'pointer', borderBottom: expanded ? 'none' : '0.5px solid #F1EFE8' }}>
        <td style={{ padding: '12px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {expanded ? <ChevronDown size={12} color="#9B9088" /> : <ChevronRight size={12} color="#9B9088" />}
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1410' }}>{policy.product_name || policy.type || '—'}</div>
              {policy.policy_number && (
                <div style={{ fontSize: 10, color: '#9B9088', fontFamily: 'DM Mono, monospace', marginTop: 2 }}>{policy.policy_number}</div>
              )}
            </div>
          </div>
        </td>
        <td style={{ padding: '12px 10px' }}>
          <div style={{ fontSize: 13, color: '#1A1410' }}>{policy.insurer || '—'}</div>
          <div style={{ fontSize: 11, color: '#6B6460', marginTop: 2 }}>{policy.type || '—'}</div>
        </td>
        <td style={{ padding: '12px 10px' }}>
          <div style={{ fontSize: 13, color: '#1A1410' }}>
            ${(Number(policy.premium) || 0).toLocaleString()}
            {policy.premium_frequency && policy.premium_frequency !== 'annual' && (
              <span style={{ fontSize: 10, color: '#9B9088' }}> /{policy.premium_frequency.slice(0, 1)}</span>
            )}
          </div>
          {policy.sum_assured ? (
            <div style={{ fontSize: 11, color: '#6B6460', marginTop: 2 }}>${(Number(policy.sum_assured) / 1000).toFixed(0)}k SA</div>
          ) : null}
        </td>
        <td style={{ padding: '12px 10px', fontSize: 13, color: '#1A1410' }}>{formatDate(policy.renewal_date)}</td>
        <td style={{ padding: '12px 10px' }}><span className={`pill ${cls}`}>{text}</span></td>
        <td style={{ padding: '12px 10px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
          <button ref={menuRef as any} onClick={() => setMenuOpen(o => !o)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, opacity: 0.5, display: 'flex', alignItems: 'center', marginLeft: 'auto' }} title="Actions">
            <MoreVertical size={14} color="#6B6460" />
          </button>
          <PortalMenu
            anchorRef={menuRef as React.RefObject<HTMLElement>}
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            items={[
              { icon: <Bot size={12} color="#BA7517" />, label: 'Summarize with Maya', onClick: () => onAskMaya(policy, 'summarize'), accent: true },
              { icon: <Bot size={12} color="#BA7517" />, label: 'Draft renewal reminder', onClick: () => onAskMaya(policy, 'renewal_reminder'), accent: true },
              { icon: <Pencil size={12} color="#6B6460" />, label: 'Edit policy', onClick: () => onEdit(policy), dividerBefore: true },
              { icon: <Trash2 size={12} />, label: 'Delete policy', onClick: () => setConfirming(policy.id), danger: true, dividerBefore: true },
            ]}
          />
        </td>
      </tr>

      {/* Expanded detail row — stacked metadata with generous breathing room */}
      {expanded && (
        <tr style={{ borderBottom: '0.5px solid #F1EFE8', background: '#FBFAF7' }}>
          <td colSpan={6} style={{ padding: '20px 24px 22px 34px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px 48px', alignItems: 'flex-start', marginBottom: policy.notes ? 20 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Start date</span>
                <span style={{ fontSize: 13, color: '#1A1410' }}>{policy.start_date ? formatDate(policy.start_date) : '—'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Frequency</span>
                <span style={{ fontSize: 13, color: '#1A1410', textTransform: 'capitalize' }}>{policy.premium_frequency || 'Annual'}</span>
              </div>
            </div>
            <DocList
              parentId={policy.id}
              apiEndpoint="/api/policy-doc"
              parentParam="policyId"
              label="Documents"
            />
            {policy.notes && (
              <div style={{ paddingTop: 14, borderTop: '0.5px solid #F1EFE8' }}>
                <div style={{ fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Notes</div>
                <div style={{ fontSize: 13, color: '#6B6460', lineHeight: 1.6 }}>{policy.notes}</div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

// ── ClaimCard ──────────────────────────────────────────────────────────────

function ClaimCard({ claim, ifaId, onEdit, onAskMaya, onDelete }: {
  claim: Alert
  ifaId: string
  onEdit: (claim: Alert) => void
  onAskMaya: (c: Alert, action: 'status_update' | 'message_insurer' | 'message_client') => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLButtonElement>(null)

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
    fetch('/api/claim-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claimId: claim.id, ifaId, ...patch }),
    }).catch(err => console.error('[claim-update] failed:', err))
  }

  function handleStatusChange(status: string) {
    setLocalStatus(status)
    saveToServer({ status, resolved: status === 'resolved' })
  }

  function handlePriorityChange(priority: string) {
    setLocalPriority(priority)
    saveToServer({ priority })
  }

  return (
    <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '14px 16px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#6B6460' }}>{claimDate}</span>
        <button ref={menuRef as any} onClick={() => setMenuOpen(o => !o)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, opacity: 0.5, display: 'flex', alignItems: 'center' }} title="Actions">
          <MoreVertical size={14} color="#6B6460" />
        </button>
        <PortalMenu
          anchorRef={menuRef as React.RefObject<HTMLElement>}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          items={[
            { icon: <Bot size={12} color="#BA7517" />, label: 'Draft status update', onClick: () => onAskMaya(claim, 'status_update'), accent: true },
            { icon: <Bot size={12} color="#BA7517" />, label: 'Draft message to insurer', onClick: () => onAskMaya(claim, 'message_insurer'), accent: true },
            { icon: <Bot size={12} color="#BA7517" />, label: 'Draft message to client', onClick: () => onAskMaya(claim, 'message_client'), accent: true },
            { icon: <Pencil size={12} color="#6B6460" />, label: 'Edit claim', onClick: () => onEdit(claim), dividerBefore: true },
            { icon: <Trash2 size={12} />, label: 'Delete claim', onClick: () => onDelete(claim.id), danger: true, dividerBefore: true },
          ]}
        />
      </div>

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

      {/* Read-only docs on the card. Add/delete lives in the Edit claim modal. */}
      <DocList
        parentId={claim.id}
        apiEndpoint="/api/claim-doc"
        parentParam="claimId"
        label="Documents"
      />

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
  coverageAnalysis, timeline, connectionStatus, calculatedTier, ifaId, ifaName, holdings,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [resolvedIfaId, setResolvedIfaId] = useState(ifaId)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) setResolvedIfaId(data.user.id)
    })
  }, [])

  const [showEdit, setShowEdit] = useState(false)
  const [showAddPolicy, setShowAddPolicy] = useState(false)
  const [showAddClaim, setShowAddClaim] = useState(false)
  const [showWAInstructions, setShowWAInstructions] = useState(false)
  const [copied, setCopied] = useState(false)

  const [editForm, setEditForm] = useState({
    name: client.name, company: client.company ?? '',
    whatsapp: client.whatsapp ?? '', email: client.email ?? '',
    birthday: client.birthday ?? '', address: client.address ?? '',
  })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const [policyForm, setPolicyForm] = useState({
    insurer: '', product_name: '', policy_number: '', type: '',
    premium: '', premium_frequency: 'annual', sum_assured: '',
    start_date: '', renewal_date: '', status: 'active', notes: '',
  })
  const [policySaving, setPolicySaving] = useState(false)
  const [policyError, setPolicyError] = useState('')
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [policyFiles, setPolicyFiles] = useState<File[]>([])

  // Claim modal state
  const [claimForm, setClaimForm] = useState({ title: '', type: 'Health', priority: 'medium', body: '' })
  const [claimFiles, setClaimFiles] = useState<File[]>([])
  const [claimSaving, setClaimSaving] = useState(false)
  const [claimError, setClaimError] = useState('')

  // Edit Claim modal — separate from Add Claim so the two flows don't collide
  const [editingClaim, setEditingClaim] = useState<Alert | null>(null)
  const [editClaimForm, setEditClaimForm] = useState({ title: '', type: 'Health', priority: 'medium', body: '' })
  const [editClaimSaving, setEditClaimSaving] = useState(false)
  const [editClaimError, setEditClaimError] = useState('')
  const [confirmDeleteClaimId, setConfirmDeleteClaimId] = useState<string | null>(null)
  const [claimDeleting, setClaimDeleting] = useState(false)

  // Maya action stub modal — fires when user clicks any "Draft X with Maya" menu item
  const [mayaStub, setMayaStub] = useState<{ title: string; context: string } | null>(null)

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
    if (!policyForm.insurer || !policyForm.type || !policyForm.premium) { setPolicyError('Insurer, type and premium are required'); return }
    if (!resolvedIfaId) { setPolicyError('Session error — please refresh the page'); return }
    setPolicySaving(true)
    try {
      const isEdit = !!editingPolicyId
      const endpoint = isEdit ? '/api/policy-update' : '/api/policy-add'
      const payload = isEdit
        ? {
            policyId: editingPolicyId,
            ifaId: resolvedIfaId,
            ...policyForm,
            premium: parseFloat(policyForm.premium),
            sum_assured: policyForm.sum_assured ? parseFloat(policyForm.sum_assured) : null,
          }
        : {
            clientId: client.id,
            ifaId: resolvedIfaId,
            ...policyForm,
            premium: parseFloat(policyForm.premium),
            sum_assured: policyForm.sum_assured ? parseFloat(policyForm.sum_assured) : null,
          }

      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) { const d = await res.json(); setPolicyError(d.error ?? 'Failed'); setPolicySaving(false); return }

      // Upload queued docs. Add mode queues via DocUploadField; Edit mode
      // manages docs live via <DocList editable /> so queue is always empty.
      const newPolicy = isEdit ? null : await res.json()
      const targetPolicyId = isEdit ? editingPolicyId : newPolicy?.policy?.id
      if (!isEdit && policyFiles.length > 0 && targetPolicyId) {
        const failures: string[] = []
        for (const file of policyFiles) {
          const fd = new FormData()
          fd.append('file', file)
          fd.append('policyId', targetPolicyId)
          fd.append('ifaId', resolvedIfaId)
          const r = await fetch('/api/policy-doc', { method: 'POST', body: fd })
          if (!r.ok) {
            const d = await r.json().catch(() => ({}))
            console.error('[policy-doc POST] failed:', r.status, d)
            failures.push(`${file.name}: ${d.error ?? `HTTP ${r.status}`}`)
          }
        }
        if (failures.length) {
          setPolicyError(`Policy created, but some uploads failed — ${failures.join('; ')}`)
          setPolicySaving(false)
          return
        }
      }

      setShowAddPolicy(false)
      setEditingPolicyId(null)
      setPolicyFiles([])
      setPolicySaving(false)

      // Optimistic activity entry (for add only — edits don't need a timeline line)
      if (!isEdit) {
        setLocalActivity(prev => [{
          date: new Date().toISOString(),
          text: `${policyForm.insurer} ${policyForm.type} added ($${parseFloat(policyForm.premium).toLocaleString()}/yr)`,
          type: 'policy',
        }, ...prev])
      }

      router.refresh()
    } catch { setPolicyError('Something went wrong — please try again'); setPolicySaving(false) }
  }

  function openEditPolicy(policy: Policy) {
    setPolicyForm({
      insurer: policy.insurer ?? '',
      product_name: policy.product_name ?? '',
      policy_number: policy.policy_number ?? '',
      type: policy.type ?? '',
      premium: policy.premium != null ? String(policy.premium) : '',
      premium_frequency: policy.premium_frequency ?? 'annual',
      sum_assured: policy.sum_assured != null ? String(policy.sum_assured) : '',
      start_date: policy.start_date ?? '',
      renewal_date: policy.renewal_date ?? '',
      status: policy.status ?? 'active',
      notes: policy.notes ?? '',
    })
    setEditingPolicyId(policy.id)
    setPolicyError('')
    setPolicySaving(false)
    setPolicyFiles([])
    setShowAddPolicy(true)
  }

  async function saveClaim() {
    if (!claimForm.title.trim()) { setClaimError('Title is required'); return }
    if (!resolvedIfaId) { setClaimError('Session error — please refresh'); return }
    setClaimSaving(true)
    try {
      const res = await fetch('/api/claim-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          ifaId: resolvedIfaId,
          title: claimForm.title,
          type: 'claim',
          priority: claimForm.priority,
          body: claimForm.body,
          claim_type: claimForm.type,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setClaimError(d.error ?? 'Failed to create claim')
        setClaimSaving(false)
        return
      }
      // Grab the new claim ID for doc upload. Route may return { claim: {...} }
      // or the row directly — handle both shapes.
      const payload = await res.json().catch(() => ({}))
      // Log so we can diagnose if uploads aren't attaching — the response
      // shape tells us which key holds the new claim ID.
      console.log('[claim-create] response payload:', payload)
      const newClaimId: string | undefined =
        payload?.claim?.id ?? payload?.id ?? payload?.alert?.id ?? payload?.data?.id

      // If files were queued but we couldn't get the new claim's ID, stop
      // here and tell the user loudly — silently dropping uploads is the
      // bug we're fixing.
      if (claimFiles.length > 0 && !newClaimId) {
        const keys = Object.keys(payload || {}).join(', ') || 'empty'
        setClaimError(`Claim created but attachments could not be uploaded — server response shape was unexpected (keys: ${keys}). Please close this dialog and use "Edit claim" on the new claim to add documents.`)
        setClaimSaving(false)
        return
      }

      // Upload queued documents sequentially.
      if (newClaimId && claimFiles.length > 0) {
        const failures: string[] = []
        for (const file of claimFiles) {
          const fd = new FormData()
          fd.append('file', file)
          fd.append('claimId', newClaimId)
          const up = await fetch('/api/claim-doc', { method: 'POST', body: fd })
          if (!up.ok) {
            const d = await up.json().catch(() => ({}))
            failures.push(`${file.name}: ${d.error ?? up.statusText ?? `HTTP ${up.status}`}`)
          }
        }
        if (failures.length) {
          setClaimError(`Claim created, but some uploads failed — ${failures.join('; ')}`)
          setClaimSaving(false)
          return
        }
      }

      setShowAddClaim(false)
      setClaimForm({ title: '', type: 'Health', priority: 'medium', body: '' })
      setClaimFiles([])
      setClaimSaving(false)
      setLocalActivity(prev => [{
        date: new Date().toISOString(),
        text: `Claim opened: ${claimForm.title}`,
        type: 'claim',
      }, ...prev])
      router.refresh()
    } catch {
      setClaimError('Something went wrong — please try again')
      setClaimSaving(false)
    }
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

  async function deleteClaim(claimId: string) {
    setClaimDeleting(true)
    try {
      await fetch('/api/claim-delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, ifaId: resolvedIfaId }),
      })
      setConfirmDeleteClaimId(null); router.refresh()
    } catch { console.error('Delete claim failed') }
    setClaimDeleting(false)
  }

  // ── Edit Claim modal handlers ──────────────────────────────────────────
  // Docs in the edit modal are managed inline via <DocList editable />
  // — add/delete happen immediately against the server. This Save button
  // only persists text-field changes (title, type, priority, body).
  function openEditClaim(c: Alert) {
    setEditClaimForm({
      title: c.title ?? '',
      type: (c as any).claim_type ?? 'Health',
      priority: c.priority ?? 'medium',
      body: c.body ?? '',
    })
    setEditClaimError('')
    setEditClaimSaving(false)
    setEditingClaim(c)
  }

  function closeEditClaim() {
    setEditingClaim(null)
    setEditClaimError('')
    setEditClaimSaving(false)
  }

  async function saveEditedClaim() {
    if (!editingClaim) return
    if (!editClaimForm.title.trim()) { setEditClaimError('Title is required'); return }
    if (!resolvedIfaId) { setEditClaimError('Session error — please refresh'); return }
    setEditClaimSaving(true)
    try {
      const res = await fetch('/api/claim-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId: editingClaim.id,
          ifaId: resolvedIfaId,
          title: editClaimForm.title,
          body: editClaimForm.body,
          priority: editClaimForm.priority,
          claim_type: editClaimForm.type,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setEditClaimError(d.error ?? `Save failed (HTTP ${res.status})`)
        setEditClaimSaving(false)
        return
      }
      closeEditClaim()
      router.refresh()
    } catch {
      setEditClaimError('Something went wrong — please try again')
      setEditClaimSaving(false)
    }
  }

  // Maya stubs — for now these just show a "Coming soon" preview modal.
  // Next batch will wire these to the Compass/Maya agents with proper prompts.
  function handlePolicyAskMaya(policy: Policy, action: 'summarize' | 'renewal_reminder') {
    const titles: Record<string, string> = {
      summarize: 'Summarize policy with Maya',
      renewal_reminder: 'Draft renewal reminder',
    }
    const contexts: Record<string, string> = {
      summarize: `Summarize the ${policy.insurer} ${policy.type} policy (${policy.product_name || policy.policy_number || 'unnamed'}) for ${client.name} in plain English — key benefits, exclusions, and anything the client should know at renewal.`,
      renewal_reminder: `Draft a warm WhatsApp renewal reminder for ${client.name} about their ${policy.insurer} ${policy.type} policy renewing on ${policy.renewal_date ? formatDate(policy.renewal_date) : 'an upcoming date'}. Premium is $${Number(policy.premium).toLocaleString()}/yr.`,
    }
    setMayaStub({ title: titles[action], context: contexts[action] })
  }

  function handleClaimAskMaya(claim: Alert, action: 'status_update' | 'message_insurer' | 'message_client') {
    const titles: Record<string, string> = {
      status_update: 'Draft status update for FA notes',
      message_insurer: 'Draft message to insurer',
      message_client: 'Draft message to client',
    }
    const contexts: Record<string, string> = {
      status_update: `Summarize the current status of the "${claim.title}" claim for ${client.name} as a short internal note. Current status: ${claim.status || 'open'}, priority: ${claim.priority || 'medium'}.`,
      message_insurer: `Draft a professional email to the insurer chasing an update on ${client.name}'s claim: "${claim.title}".`,
      message_client: `Draft a warm WhatsApp message to ${client.name} updating them on their claim: "${claim.title}". Current status: ${claim.status || 'open'}.`,
    }
    setMayaStub({ title: titles[action], context: contexts[action] })
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
              {client.whatsapp && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} />{client.whatsapp}</span>}
              {client.email && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={12} />{client.email}</span>}
              {client.type === 'individual' && client.birthday && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Cake size={12} />{birthdayDisplay}</span>}
              {client.address && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} />{client.address}</span>}
            </div>
          </div>
        </div>

        {/* Right: action buttons — all Lucide icons, consistent height */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button onClick={() => setShowEdit(true)} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#BA7517', padding: '8px 16px', border: '1px solid #BA7517', borderRadius: 6, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Pencil size={13} /> Edit
          </button>
          <a href={`/dashboard/maya-playground?clientId=${client.id}`}
            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', padding: '8px 16px', border: '0.5px solid #E8E2DA', borderRadius: 6, background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <Bot size={13} /> Test with Maya
          </a>
          {connectionStatus !== 'connected' && (
            <button onClick={() => setShowWAInstructions(v => !v)} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#fff', padding: '8px 16px', border: 'none', borderRadius: 6, background: '#25D366', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
              <MessageCircle size={14} /> Set up WhatsApp group
            </button>
          )}
        </div>
      </div>

      {/* Next of kin + DOB row */}
      {(client.nok_name || client.birthday || client.notes) && (
        <div style={{ display: 'flex', gap: 24, marginBottom: 20, padding: '12px 16px', background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 10, flexWrap: 'wrap' }}>
          {client.birthday && (
            <div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, fontWeight: 500, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Date of birth</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410' }}>{new Date(client.birthday).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
          )}
          {client.nok_name && (
            <div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, fontWeight: 500, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Next of kin</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410' }}>
                {client.nok_name}{client.nok_relationship ? ` (${client.nok_relationship})` : ''}
                {client.nok_phone && <span style={{ color: '#5F5A57', marginLeft: 8 }}>{client.nok_phone}</span>}
              </div>
            </div>
          )}
          {client.notes && (
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, fontWeight: 500, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Notes</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57', lineHeight: 1.5 }}>{client.notes}</div>
            </div>
          )}
        </div>
      )}

      {/* == SECTION 2: KPI CARDS == */}
      {(() => {
        const totalPremium = policies.reduce((s, p) => s + (Number(p.premium) || 0), 0)
        const totalSA = policies.reduce((s, p) => s + (Number(p.sum_assured) || 0), 0)
        const holdingsValue = holdings.reduce((s, h) => s + (Number(h.current_value) || 0), 0)
        const nextRenewal = policies.filter(p => p.renewal_date && new Date(p.renewal_date) >= new Date()).sort((a, b) => new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime())[0]
        const daysToRenewal = nextRenewal ? Math.ceil((new Date(nextRenewal.renewal_date).getTime() - Date.now()) / 86400000) : null
        const openClaimsCount = claims.filter(c => !c.resolved).length

        // Batch 8: aggregate P&L + income across holdings with the needed fields.
        // Only count holdings where cost basis is entered — avoids false zeros.
        let totalInvested = 0
        let totalCurrent = 0
        let holdingsWithCost = 0
        for (const h of holdings) {
          const units = Number(h.units_held ?? h.units) || 0
          const cost  = Number(h.avg_cost_price) || 0
          const value = Number(h.current_value) || 0
          if (units && cost && value) {
            totalInvested += cost * units
            totalCurrent  += value
            holdingsWithCost++
          }
        }
        const unrealizedGain = totalInvested > 0 ? totalCurrent - totalInvested : 0
        const unrealizedPct = totalInvested > 0 ? (unrealizedGain / totalInvested) * 100 : 0
        const totalAnnualIncome = holdings.reduce((s, h) => {
          const y = Number(h.distribution_yield) || 0
          const v = Number(h.current_value) || 0
          return s + (y && v ? (y / 100) * v : 0)
        }, 0)

        const kpis = [
          { label: 'Annual premium', value: totalPremium > 0 ? `$${totalPremium.toLocaleString()}` : '—', sub: `${policies.length} polic${policies.length !== 1 ? 'ies' : 'y'}` },
          { label: 'Sum assured', value: totalSA > 0 ? `$${(totalSA / 1000).toFixed(0)}k` : '—', sub: 'total coverage' },
          { label: 'Holdings AUM', value: holdingsValue > 0 ? `$${holdingsValue.toLocaleString()}` : '—', sub: holdingsValue > 0 ? `${holdings.length} holding${holdings.length !== 1 ? 's' : ''}` : 'no holdings' },
          { label: 'Unrealized gain',
            value: holdingsWithCost > 0
              ? `${unrealizedGain >= 0 ? '+' : '−'}$${Math.abs(Math.round(unrealizedGain)).toLocaleString()}`
              : '—',
            sub: holdingsWithCost > 0
              ? `${unrealizedPct >= 0 ? '+' : ''}${unrealizedPct.toFixed(1)}% · ${holdingsWithCost} of ${holdings.length}`
              : 'no cost basis entered',
            positive: holdingsWithCost > 0 && unrealizedGain > 0,
            danger: holdingsWithCost > 0 && unrealizedGain < 0 },
          { label: 'Annual income',
            value: totalAnnualIncome > 0 ? `$${Math.round(totalAnnualIncome).toLocaleString()}` : '—',
            sub: totalAnnualIncome > 0 ? 'from yielding funds' : 'no yields entered' },
          { label: 'Next renewal', value: nextRenewal ? (daysToRenewal !== null && daysToRenewal <= 30 ? `${daysToRenewal}d` : new Date(nextRenewal.renewal_date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })) : '—', sub: nextRenewal ? `${nextRenewal.insurer} · ${nextRenewal.type}` : 'no upcoming renewals', warn: daysToRenewal !== null && daysToRenewal <= 30 },
          { label: 'Open claims', value: openClaimsCount, sub: openClaimsCount > 0 ? `${claims.filter(c => !c.resolved && c.priority === 'high').length} high priority` : 'none open', danger: openClaimsCount > 0 },
          { label: 'Coverage gaps', value: coverageAnalysis?.filter(c => !c.hasCoverage).length ?? 0, sub: 'products not covered', info: true },
        ]
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {kpis.map((m: any, i) => (
              <div key={i} style={{ background: '#FFFFFF', border: `0.5px solid ${m.danger ? '#F7C1C1' : m.warn ? '#FAC775' : '#E8E2DA'}`, borderRadius: 8, padding: '16px 20px' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#6B6460', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{m.label}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 500, color: m.danger ? '#A32D2D' : m.warn ? '#854F0B' : m.positive ? '#0F6E56' : '#1A1410', lineHeight: 1 }}>{m.value}</div>
                {m.sub && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: m.positive ? '#0F6E56' : '#5F5A57', marginTop: 6 }}>{m.sub}</div>}
              </div>
            ))}
          </div>
        )
      })()}

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
          <button onClick={() => {
            setPolicyForm({ insurer: '', product_name: '', policy_number: '', type: '', premium: '', premium_frequency: 'annual', sum_assured: '', start_date: '', renewal_date: '', status: 'active', notes: '' })
            setEditingPolicyId(null); setPolicyFiles([]); setPolicyError(''); setPolicySaving(false); setShowAddPolicy(true)
          }} style={btnAddSection}>
            <Plus size={12} /> Add policy
          </button>
        </div>
        <div className="panel-body">
          {policies.length > 0 ? (
            <div className="table">
              <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ width: '28%', textAlign: 'left', padding: '10px', fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, borderBottom: '0.5px solid #E8E2DA' }}>Product</th>
                    <th style={{ width: '18%', textAlign: 'left', padding: '10px', fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, borderBottom: '0.5px solid #E8E2DA' }}>Insurer · Type</th>
                    <th style={{ width: '16%', textAlign: 'left', padding: '10px', fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, borderBottom: '0.5px solid #E8E2DA' }}>Premium</th>
                    <th style={{ width: '14%', textAlign: 'left', padding: '10px', fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, borderBottom: '0.5px solid #E8E2DA' }}>Renewal</th>
                    <th style={{ width: '18%', textAlign: 'left', padding: '10px', fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, borderBottom: '0.5px solid #E8E2DA' }}>Status</th>
                    <th style={{ width: '6%', borderBottom: '0.5px solid #E8E2DA' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map(policy => (
                    <PolicyRow
                      key={policy.id}
                      policy={policy}
                      ifaId={resolvedIfaId}
                      onEdit={openEditPolicy}
                      onAskMaya={handlePolicyAskMaya}
                      confirmingDelete={confirmDeleteId === policy.id}
                      setConfirming={setConfirmDeleteId}
                    />
                  ))}
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
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="panel-title">Coverage analysis</span>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#6B6460', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Bot size={11} color="#BA7517" /> Click a gap for Maya recommendations
          </span>
        </div>
        <div className="panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {coverageAnalysis.map(coverage => (
              <div
                key={coverage.key}
                onClick={() => !coverage.hasCoverage && setCompassGap(coverage)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderRadius: 6,
                  background: coverage.hasCoverage ? 'rgba(15,110,86,0.08)' : 'rgba(186,117,23,0.08)',
                  cursor: coverage.hasCoverage ? 'default' : 'pointer',
                  border: compassGap?.key === coverage.key ? '1px solid #BA7517' : '1px solid transparent',
                  transition: 'border 0.15s',
                }}
              >
                <div style={{ fontSize: 14, color: coverage.hasCoverage ? '#0F6E56' : '#9B9088', lineHeight: 1 }}>
                  {coverage.hasCoverage ? '✓' : '—'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', fontWeight: 500 }}>{coverage.label}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: coverage.hasCoverage ? '#0F6E56' : '#BA7517' }}>
                    {coverage.hasCoverage ? (coverage.insurer || 'Covered') : 'Tap for Maya'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Compass panel */}
          {compassGap && (
            <div style={{ marginTop: 20, background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 10, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Bot size={14} color="#BA7517" /> Maya — {compassGap.label} recommendations
                </div>
                <button onClick={() => { setCompassGap(null); setCompassResult(null) }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B6460', padding: 4, display: 'flex', alignItems: 'center' }}>
                  <X size={14} />
                </button>
              </div>
              {compassLoading ? (
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460', padding: '12px 0' }}>
                  Compass is analysing…
                </div>
              ) : compassResult ? (
                <div>
                  {compassResult.mayaSummary && (
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460', lineHeight: 1.6, margin: '0 0 16px' }}>
                      {compassResult.mayaSummary}
                    </p>
                  )}
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

      {/* == SECTION 6: CLAIMS == */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="panel-title">Claims</span>
          <button onClick={() => {
            setClaimForm({ title: '', type: 'Health', priority: 'medium', body: '' })
            setClaimFiles([])
            setClaimError(''); setShowAddClaim(true)
          }} style={btnAddSection}>
            <Plus size={12} /> New claim
          </button>
        </div>
        <div className="panel-body">
          {claims.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {claims.map(claim => (
                <ClaimCard
                  key={claim.id}
                  claim={claim}
                  ifaId={resolvedIfaId}
                  onEdit={openEditClaim}
                  onAskMaya={handleClaimAskMaya}
                  onDelete={(id) => setConfirmDeleteClaimId(id)}
                />
              ))}
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460' }}>No claims history.</div>
          )}
        </div>
      </div>

      {/* == SECTION 7: HOLDINGS (now below Claims — distinct product line) == */}
      <HoldingsSection clientId={client.id} ifaId={resolvedIfaId} />

      {/* == SECTION 8: ACTIVITY == */}
      <div className="panel">
        <div className="panel-header"><span className="panel-title">Activity</span></div>
        <div className="panel-body">
          {(() => {
            const merged = [...localActivity, ...timeline]
              .filter((item, idx, arr) =>
                idx === arr.findIndex(t => t.text === item.text && t.type === item.type)
              )
            return merged.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {merged.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: item.type === 'message' ? '#BA7517' : item.type === 'alert' || item.type === 'claim' ? '#A32D2D' : '#0F6E56' }} />
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
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 12, padding: 20, width: 340, zIndex: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
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
              <div><CountryCodeSelect value={editForm.whatsapp} onChange={v => setEditForm(p => ({ ...p, whatsapp: v }))} label="WhatsApp" /></div>
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

      {/* == ADD / EDIT POLICY MODAL == */}
      {showAddPolicy && (
        <Modal title={editingPolicyId ? 'Edit policy' : 'Add policy'} onClose={() => { setShowAddPolicy(false); setEditingPolicyId(null); setPolicyError(''); setPolicyFiles([]) }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Group 1: Identifiers */}
            <div>
              <label style={labelStyle}>Insurer *</label>
              <select style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties} value={policyForm.insurer} onChange={e => setPolicyForm(p => ({ ...p, insurer: e.target.value }))}>
                <option value="">Select insurer…</option>
                {INSURERS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Product name</label>
              <input style={inputStyle} placeholder="e.g. AIA Life Treasure II" value={policyForm.product_name} onChange={e => setPolicyForm(p => ({ ...p, product_name: e.target.value }))} />
            </div>

            <div>
              <label style={labelStyle}>Policy number</label>
              <input style={inputStyle} placeholder="e.g. AIA-2024-12345" value={policyForm.policy_number} onChange={e => setPolicyForm(p => ({ ...p, policy_number: e.target.value }))} />
            </div>

            <div>
              <label style={labelStyle}>Policy type *</label>
              <select style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties} value={policyForm.type} onChange={e => setPolicyForm(p => ({ ...p, type: e.target.value }))}>
                <option value="">Select type…</option>
                {POLICY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Group 2: Money — visual separator */}
            <div style={{ borderTop: '0.5px solid #E8E2DA', paddingTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Annual premium (SGD) *</label>
                <input style={inputStyle} type="number" placeholder="e.g. 3600" value={policyForm.premium} onChange={e => setPolicyForm(p => ({ ...p, premium: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Frequency</label>
                <select style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties} value={policyForm.premium_frequency} onChange={e => setPolicyForm(p => ({ ...p, premium_frequency: e.target.value }))}>
                  <option value="annual">Annual</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="half-yearly">Half-yearly</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Sum assured (SGD)</label>
                <input style={inputStyle} type="number" placeholder="e.g. 500000" value={policyForm.sum_assured} onChange={e => setPolicyForm(p => ({ ...p, sum_assured: e.target.value }))} />
              </div>
            </div>

            {/* Group 3: Dates */}
            <div style={{ borderTop: '0.5px solid #E8E2DA', paddingTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Start date</label>
                <input style={inputStyle} type="date" value={policyForm.start_date} onChange={e => setPolicyForm(p => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Renewal date</label>
                <input style={inputStyle} type="date" value={policyForm.renewal_date} onChange={e => setPolicyForm(p => ({ ...p, renewal_date: e.target.value }))} />
              </div>
            </div>

            {/* Group 4: Metadata */}
            <div style={{ borderTop: '0.5px solid #E8E2DA', paddingTop: 14 }}>
              <label style={labelStyle}>Status</label>
              <select style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties} value={policyForm.status} onChange={e => setPolicyForm(p => ({ ...p, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="lapsed">Lapsed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Notes</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 } as React.CSSProperties} rows={2} placeholder="e.g. Single mother, 2 young kids" value={policyForm.notes} onChange={e => setPolicyForm(p => ({ ...p, notes: e.target.value }))} />
            </div>

            {/* Document handling: Edit mode uses live DocList (add/delete
                fire immediately). Add mode queues files, uploaded after the
                policy row is created. */}
            {editingPolicyId ? (
              <DocList
                parentId={editingPolicyId}
                apiEndpoint="/api/policy-doc"
                parentParam="policyId"
                label="Documents"
                editable
              />
            ) : (
              <DocUploadField
                multi
                label="Documents"
                files={policyFiles}
                onFilesChange={setPolicyFiles}
                onError={msg => setPolicyError(msg)}
              />
            )}

            {policyError && <p style={{ fontSize: 12, color: '#A32D2D', margin: 0 }}>{policyError}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={savePolicy} disabled={policySaving} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', opacity: policySaving ? 0.7 : 1 }}>
                {editingPolicyId ? <Save size={14} /> : <Plus size={14} />}
                {policySaving ? 'Saving…' : (editingPolicyId ? 'Save changes' : 'Add policy')}
              </button>
              <button onClick={() => { setShowAddPolicy(false); setEditingPolicyId(null); setPolicyFiles([]) }} style={btnOutline}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* == ADD CLAIM MODAL (new) == */}
      {showAddClaim && (
        <Modal title="New claim" onClose={() => { setShowAddClaim(false); setClaimError(''); setClaimFiles([]) }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Claim title *</label>
              <input style={inputStyle} value={claimForm.title} onChange={e => setClaimForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Health claim — clinic visit" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Claim type</label>
                <select style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties} value={claimForm.type} onChange={e => setClaimForm(p => ({ ...p, type: e.target.value }))}>
                  {CLAIM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Priority</label>
                <select style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties} value={claimForm.priority} onChange={e => setClaimForm(p => ({ ...p, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 } as React.CSSProperties} rows={4} value={claimForm.body} onChange={e => setClaimForm(p => ({ ...p, body: e.target.value }))} placeholder="What happened? Any context that will help track this claim." />
            </div>

            <DocUploadField
              multi
              label="Documents"
              files={claimFiles}
              onFilesChange={setClaimFiles}
              onError={msg => setClaimError(msg)}
            />

            {claimError && <p style={{ fontSize: 12, color: '#A32D2D', margin: 0 }}>{claimError}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveClaim} disabled={claimSaving} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', opacity: claimSaving ? 0.7 : 1 }}>
                <Plus size={14} />{claimSaving ? 'Creating…' : 'Create claim'}
              </button>
              <button onClick={() => { setShowAddClaim(false); setClaimFiles([]) }} style={btnOutline}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* == EDIT CLAIM MODAL == */}
      {editingClaim && (
        <Modal title="Edit claim" onClose={closeEditClaim}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Claim title *</label>
              <input
                style={inputStyle}
                value={editClaimForm.title}
                onChange={e => setEditClaimForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Health claim — clinic visit"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Claim type</label>
                <select
                  style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
                  value={editClaimForm.type}
                  onChange={e => setEditClaimForm(p => ({ ...p, type: e.target.value }))}
                >
                  {CLAIM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Priority</label>
                <select
                  style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
                  value={editClaimForm.priority}
                  onChange={e => setEditClaimForm(p => ({ ...p, priority: e.target.value }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 } as React.CSSProperties}
                rows={4}
                value={editClaimForm.body}
                onChange={e => setEditClaimForm(p => ({ ...p, body: e.target.value }))}
                placeholder="What happened? Any context that will help track this claim."
              />
            </div>

            {/* Documents — managed inline. Add/delete fire immediately
                against the server; there's no "save" gesture for docs. */}
            <div>
              <label style={labelStyle}>Documents</label>
              <DocList
                parentId={editingClaim.id}
                apiEndpoint="/api/claim-doc"
                parentParam="claimId"
                label="Documents"
                editable
              />
            </div>

            {editClaimError && <p style={{ fontSize: 12, color: '#A32D2D', margin: 0 }}>{editClaimError}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={saveEditedClaim}
                disabled={editClaimSaving}
                style={{ ...btnPrimary, flex: 1, justifyContent: 'center', opacity: editClaimSaving ? 0.7 : 1 }}
              >
                <Save size={14} />{editClaimSaving ? 'Saving…' : 'Save changes'}
              </button>
              <button onClick={closeEditClaim} style={btnOutline}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* == POLICY DELETE CONFIRM MODAL == */}
      {confirmDeleteId && (
        <Modal title="Delete policy?" onClose={() => setConfirmDeleteId(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1A1410', margin: 0, lineHeight: 1.5 }}>
              This will permanently remove this policy and its uploaded document. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => deletePolicy(confirmDeleteId)} disabled={deleting}
                style={{ flex: 1, background: '#A32D2D', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', opacity: deleting ? 0.7 : 1 }}>
                <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Delete policy'}
              </button>
              <button onClick={() => setConfirmDeleteId(null)} style={btnOutline}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* == CLAIM DELETE CONFIRM MODAL == */}
      {confirmDeleteClaimId && (
        <Modal title="Delete claim?" onClose={() => setConfirmDeleteClaimId(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1A1410', margin: 0, lineHeight: 1.5 }}>
              This will permanently remove this claim from the client's record. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => deleteClaim(confirmDeleteClaimId)} disabled={claimDeleting}
                style={{ flex: 1, background: '#A32D2D', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', opacity: claimDeleting ? 0.7 : 1 }}>
                <Trash2 size={14} /> {claimDeleting ? 'Deleting…' : 'Delete claim'}
              </button>
              <button onClick={() => setConfirmDeleteClaimId(null)} style={btnOutline}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* == MAYA STUB PREVIEW MODAL == */}
      {mayaStub && (
        <Modal title={mayaStub.title} onClose={() => setMayaStub(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: 8, padding: '12px 14px' }}>
              <Bot size={18} color="#BA7517" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#854F0B', marginBottom: 4 }}>Coming soon</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460', lineHeight: 1.5 }}>
                  Maya will draft this for you in the next update. Here's the prompt we're preparing to send:
                </div>
              </div>
            </div>
            <div style={{ background: '#FBFAF7', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Prompt preview</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#1A1410', lineHeight: 1.6, fontStyle: 'italic' }}>"{mayaStub.context}"</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setMayaStub(null)} style={btnOutline}>Close</button>
            </div>
          </div>
        </Modal>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
