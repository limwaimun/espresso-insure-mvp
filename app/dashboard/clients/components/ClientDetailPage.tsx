'use client'

import { useState, useRef, useEffect } from 'react'
import { computeParseOverall } from '@/lib/policies'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import HoldingsSection from '@/components/HoldingsSection'
import PortalMenu from '@/components/PortalMenu'
import Modal from '@/components/Modal'
import DocList from '@/components/DocList'
import PolicyRow, { Policy } from './PolicyRow'
import ClaimCard, { Alert } from './ClaimCard'
import MayaStubModal from './MayaStubModal'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import EditClientModal from './EditClientModal'
import AddClaimModal from './AddClaimModal'
import EditClaimModal from './EditClaimModal'
import PolicyForm from './PolicyForm'
import type { Holding, Message, Conversation, CoverageItem, TimelineItem, Metric, ClientData, Props } from '@/lib/types'
import { formatDate, formatRelativeTime } from '@/lib/dates'
import { inputStyle, labelStyle, btnPrimary, btnOutline, btnAddSection } from '@/lib/styles'
import {
  X, Plus, Save, Upload, Download, Check, MessageCircle, Copy,
  Pencil, Bot, Phone, Mail, Cake, MapPin, ChevronDown, ChevronRight, MoreVertical,
} from 'lucide-react'
import { createClient } from '../../../../lib/supabase/client'

// Types imported from @/lib/types (see imports above)

// ── Constants ──────────────────────────────────────────────────────────────

const INSURERS = ['AIA', 'Great Eastern', 'Prudential', 'NTUC Income', 'Manulife', 'AXA', 'Aviva', 'Tokio Marine', 'Singlife', 'FWD', 'Etiqa', 'Other']
const POLICY_TYPES = ['Life', 'Health', 'Critical Illness', 'Disability', 'Motor', 'Travel', 'Property', 'Professional Indemnity', 'Group Health', 'Group Life', 'Fire', 'Business Interruption', 'Keyman', 'D&O', 'Cyber', 'Workers Compensation', 'Public Liability', 'Marine']
const CLAIM_TYPES = ['Health', 'Life', 'Critical Illness', 'Disability', 'Motor', 'Travel', 'Property', 'Other']

// ── Helpers ────────────────────────────────────────────────────────────────

// Styles imported from @/lib/styles (see imports above)

// ── Modal is now imported from @/components/Modal (shared with HoldingsSection)

// ── PortalMenu is now imported from @/components/PortalMenu (shared with HoldingsSection)

// ── Main Component ─────────────────────────────────────────────────────────

export default function ClientDetailPage({
  client, policies, conversations, claims, metrics, birthdayDisplay,
  coverageAnalysis, timeline, connectionStatus, calculatedTier, faId, faName, holdings,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [resolvedFaId, setResolvedFaId] = useState(faId)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) setResolvedFaId(data.user.id)
    })
  }, [])

  const [showEdit, setShowEdit] = useState(false)
  const [showAddPolicy, setShowAddPolicy] = useState(false)
  const [showAddClaim, setShowAddClaim] = useState(false)
  const [showWAInstructions, setShowWAInstructions] = useState(false)
  const [copied, setCopied] = useState(false)

  // Edit-client form state now lives inside the extracted modal component
  // Policy form state likewise lives inside PolicyForm; parent only
  // tracks which policy (if any) is being edited.
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Claim modal state
  // Add-claim form state lives inside the extracted AddClaimModal

  // Edit Claim modal — form state lives inside the extracted EditClaimModal
  const [editingClaim, setEditingClaim] = useState<Alert | null>(null)
  const [confirmDeleteClaimId, setConfirmDeleteClaimId] = useState<string | null>(null)
  const [claimDeleting, setClaimDeleting] = useState(false)

  // Forces card-level DocList to re-fetch after the edit modal closes.
  // Both PolicyRow and ClaimCard render their own DocList; bumping this
  // counter via a prop triggers a key change, which remounts DocList and
  // re-runs its internal fetch — picking up any adds/deletes from the modal.
  const [cardRefreshKey, setCardRefreshKey] = useState(0)
  const bumpCardRefresh = () => setCardRefreshKey(k => k + 1)

  // Maya action stub modal — fires when user clicks any "Draft X with Maya" menu item
  const [mayaStub, setMayaStub] = useState<{ title: string; context: string } | null>(null)

  const [localActivity, setLocalActivity] = useState<{ date: string; text: string; type: string }[]>([])

  // Compass state
  const [compassGap, setCompassGap] = useState<{ key: string; label: string } | null>(null)
  const [compassResult, setCompassResult] = useState<any>(null)
  const [compassLoading, setCompassLoading] = useState(false)

  useEffect(() => {
    if (!compassGap || !resolvedFaId) return
    setCompassResult(null)
    setCompassLoading(true)
    fetch('/api/compass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        faId: resolvedFaId,
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

  async function deletePolicy(policyId: string) {
    setDeleting(true)
    try {
      await fetch('/api/policy-delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyId, faId: resolvedFaId }),
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
        body: JSON.stringify({ claimId, faId: resolvedFaId }),
      })
      setConfirmDeleteClaimId(null); router.refresh()
    } catch { console.error('Delete claim failed') }
    setClaimDeleting(false)
  }

  // ── Edit Claim modal handlers ──────────────────────────────────────────
  // Docs in the edit modal are managed inline via <DocList editable />
  // — add/delete happen immediately against the server. This Save button
  // only persists text-field changes (title, type, priority, body).
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

      {/* Next of kin + notes row */}
      {(client.nok_name || client.notes) && (
        <div style={{ display: 'flex', gap: 24, marginBottom: 20, padding: '12px 16px', background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 10, flexWrap: 'wrap' }}>
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
        const nextRenewal = policies
          .filter((p): p is typeof p & { renewal_date: string } => !!p.renewal_date && new Date(p.renewal_date) >= new Date())
          .sort((a, b) => new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime())[0]
        const daysToRenewal = nextRenewal ? Math.ceil((new Date(nextRenewal.renewal_date).getTime() - Date.now()) / 86400000) : null
        const openClaimsCount = claims.filter(c => !c.resolved).length

        // Batch 8: aggregate P&L + income across holdings with the needed fields.
        // Only count holdings where cost basis is entered — avoids false zeros.
        let totalInvested = 0
        let totalCurrent = 0
        let holdingsWithCost = 0
        for (const h of holdings) {
          const units = Number(h.units_held) || 0
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
          <button onClick={() => { setEditingPolicy(null); setShowAddPolicy(true) }} style={btnAddSection}>
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
                <tbody>{policies.map(policy => (
                    <PolicyRow
                      key={policy.id}
                      policy={policy}
                      faId={resolvedFaId}
                      onEdit={(p) => { setEditingPolicy(p); setShowAddPolicy(true) }}
                      onAskMaya={handlePolicyAskMaya}
                      confirmingDelete={confirmDeleteId === policy.id}
                      setConfirming={setConfirmDeleteId}
                      cardRefreshKey={cardRefreshKey}
                      parseOverall={computeParseOverall(policy as unknown as Record<string, unknown>)}
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
          <button onClick={() => setShowAddClaim(true)} style={btnAddSection}>
            <Plus size={12} /> New claim
          </button>
        </div>
        <div className="panel-body">
          {claims.length > 0 ? (
            <div className="table">
              <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid #E8E2DA' }}>
                    <th style={{ width: '36%', textAlign: 'left', padding: '10px', fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Title</th>
                    <th style={{ width: '14%', textAlign: 'left', padding: '10px', fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Type</th>
                    <th style={{ width: '14%', textAlign: 'left', padding: '10px', fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Status</th>
                    <th style={{ width: '14%', textAlign: 'left', padding: '10px', fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Priority</th>
                    <th style={{ width: '16%', textAlign: 'left', padding: '10px', fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Filed</th>
                    <th style={{ width: '6%' }}></th>
                  </tr>
                </thead>
                <tbody>{claims.map(claim => (
                  <ClaimCard
                    key={claim.id}
                    claim={claim}
                    faId={resolvedFaId}
                    onEdit={(c) => setEditingClaim(c)}
                    onAskMaya={handleClaimAskMaya}
                    onDelete={(id) => setConfirmDeleteClaimId(id)}
                    cardRefreshKey={cardRefreshKey}
                  />
                ))}</tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460' }}>No claims history.</div>
          )}
        </div>
      </div>

      {/* == SECTION 7: HOLDINGS (now below Claims — distinct product line) == */}
      <HoldingsSection clientId={client.id} faId={resolvedFaId} />

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
        <EditClientModal
          client={client}
          faId={resolvedFaId}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); router.refresh() }}
        />
      )}

      {/* == ADD / EDIT POLICY MODAL == */}
      {showAddPolicy && (
        <PolicyForm
          mode={editingPolicy ? 'edit' : 'add'}
          initialPolicy={editingPolicy ?? undefined}
          clientId={client.id}
          faId={resolvedFaId}
          onClose={() => { setShowAddPolicy(false); setEditingPolicy(null); bumpCardRefresh() }}
          onSaved={(activityText) => {
            setShowAddPolicy(false)
            setEditingPolicy(null)
            bumpCardRefresh()
            if (activityText) {
              setLocalActivity(prev => [{
                date: new Date().toISOString(),
                text: activityText,
                type: 'policy',
              }, ...prev])
            }
            router.refresh()
          }}
        />
      )}

      {/* == ADD CLAIM MODAL == */}
      {showAddClaim && (
        <AddClaimModal
          clientId={client.id}
          faId={resolvedFaId}
          policies={policies}
          onClose={() => setShowAddClaim(false)}
          onCreated={(activityText) => {
            setShowAddClaim(false)
            setLocalActivity(prev => [{
              date: new Date().toISOString(),
              text: activityText,
              type: 'claim',
            }, ...prev])
            router.refresh()
          }}
        />
      )}

      {/* == EDIT CLAIM MODAL == */}
      {editingClaim && (
        <EditClaimModal
          claim={editingClaim}
          faId={resolvedFaId}
          cardRefreshKey={cardRefreshKey}
          onClose={() => { setEditingClaim(null); bumpCardRefresh() }}
          onSaved={() => { setEditingClaim(null); bumpCardRefresh(); router.refresh() }}
        />
      )}

      {/* == POLICY DELETE CONFIRM MODAL == */}
      {confirmDeleteId && (
        <ConfirmDeleteModal
          title="Delete policy?"
          body="This will permanently remove this policy and its uploaded document. This action cannot be undone."
          confirmLabel="Delete policy"
          busy={deleting}
          onConfirm={() => deletePolicy(confirmDeleteId)}
          onClose={() => setConfirmDeleteId(null)}
        />
      )}

      {/* == CLAIM DELETE CONFIRM MODAL == */}
      {confirmDeleteClaimId && (
        <ConfirmDeleteModal
          title="Delete claim?"
          body="This will permanently remove this claim from the client's record. This action cannot be undone."
          confirmLabel="Delete claim"
          busy={claimDeleting}
          onConfirm={() => deleteClaim(confirmDeleteClaimId)}
          onClose={() => setConfirmDeleteClaimId(null)}
        />
      )}

      {/* == MAYA STUB PREVIEW MODAL == */}
      {mayaStub && (
        <MayaStubModal
          stub={mayaStub}
          onClose={() => setMayaStub(null)}
        />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
