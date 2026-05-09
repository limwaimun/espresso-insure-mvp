'use client'

// Renewals page (B81b2): rebuilt to use PolicyRow with clientInfo prop.
//
// Replaces the previous CSS-grid row layout + custom action column +
// generic "Ask Maya to follow up" modal with the same row pattern used
// on the client detail page. Click-to-expand, kebab menu with two
// specific Maya actions (Summarize / Draft renewal reminder) + View
// client + Edit + Delete.
//
// Days column dropped — PolicyRow's status pill encodes urgency in its
// text ("Due in 6d", "Overdue renewal", "Renews in 88d", "Lapsed").
//
// Desktop-table-only for now. Mobile responsive deferred.

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PolicyRow from '../clients/components/PolicyRow'
import PolicyForm from '../clients/components/PolicyForm'
import ConfirmDeleteModal from '../clients/components/ConfirmDeleteModal'
import MayaStubModal from '../clients/components/MayaStubModal'
import {
  isLapsed,
  isUrgent,
  isActionNeeded,
  isUnderReview,
  renewalBucket,
  type Policy,
} from '@/lib/policies'
import { formatDate } from '@/lib/dates'

type FilterType = 'all' | 'lapsed' | 'urgent' | 'action_needed' | 'under_review'

// Local type: Policy + the joined clients relation that the renewals
// query brings in (multi-client context).
type PolicyWithClient = Policy & {
  clients: { id: string; name: string; company: string | null; whatsapp: string | null } | null
}

export default function RenewalsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [policies, setPolicies] = useState<PolicyWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterType>('all')
  const [ifaId, setIfaId] = useState<string>('')

  const [editingPolicy, setEditingPolicy] = useState<PolicyWithClient | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [mayaStub, setMayaStub] = useState<{ title: string; context: string } | null>(null)
  const [cardRefreshKey, setCardRefreshKey] = useState(0)

  const bumpCardRefresh = () => setCardRefreshKey(k => k + 1)

  useEffect(() => {
    load()
    supabase.auth.getUser().then(({ data }) => { if (data.user) setIfaId(data.user.id) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('policies')
      .select('*, clients(id, name, company, whatsapp)')
      .order('renewal_date', { ascending: true })
    setPolicies((data || []) as PolicyWithClient[])
    setLoading(false)
  }

  async function deletePolicy(policyId: string) {
    setDeleting(true)
    try {
      await fetch('/api/policy-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyId, ifaId }),
      })
      setConfirmDeleteId(null)
      await load()
    } catch (err) {
      console.error('Delete policy failed', err)
    }
    setDeleting(false)
  }

  // Mirror of ClientDetailPage.handlePolicyAskMaya — but reads client name
  // from the joined clients relation since renewals page spans many clients.
  function handlePolicyAskMaya(policy: Policy, action: 'summarize' | 'renewal_reminder') {
    const p = policy as PolicyWithClient
    const clientName = p.clients?.name || 'this client'
    const titles: Record<string, string> = {
      summarize: 'Summarize policy for FA',
      renewal_reminder: 'Draft renewal reminder',
    }
    const contexts: Record<string, string> = {
      summarize: `Summarize ${clientName}'s ${policy.insurer} ${policy.type} policy for FA notes. Premium $${Number(policy.premium).toLocaleString()}/yr, renewal ${policy.renewal_date ? formatDate(policy.renewal_date) : 'unknown'}.`,
      renewal_reminder: `Draft a warm WhatsApp renewal reminder for ${clientName} about their ${policy.insurer} ${policy.type} policy renewing on ${policy.renewal_date ? formatDate(policy.renewal_date) : 'an upcoming date'}. Premium is $${Number(policy.premium).toLocaleString()}/yr.`,
    }
    setMayaStub({ title: titles[action], context: contexts[action] })
  }

  // KPIs and bucket counts
  const lapsedCount       = policies.filter(isLapsed).length
  const urgentCount       = policies.filter(isUrgent).length
  const actionNeededCount = policies.filter(isActionNeeded).length
  const underReviewCount  = policies.filter(isUnderReview).length
  const lapsedPremium = policies.filter(isLapsed).reduce((s, p) => s + (Number(p.premium) || 0), 0)
  const urgentPremium = policies.filter(isUrgent).reduce((s, p) => s + (Number(p.premium) || 0), 0)

  const filtered = policies.filter(p => {
    if (search) {
      const q = search.toLowerCase()
      if (!p.clients?.name?.toLowerCase().includes(q)
          && !p.type?.toLowerCase().includes(q)
          && !p.insurer?.toLowerCase().includes(q)) return false
    }
    if (statusFilter !== 'all') {
      return renewalBucket(p) === statusFilter
    }
    return true
  })

  return (
    <div style={{ padding: '24px 28px', background: '#F7F4F0', minHeight: '100vh' }}>
      <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 500, color: '#1A1410', margin: '0 0 20px' }}>Renewals</h1>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Lapsed', value: lapsedCount, sub: lapsedPremium > 0 ? `$${lapsedPremium.toLocaleString()} at risk` : '', danger: true },
          { label: 'Urgent', value: urgentCount, sub: urgentPremium > 0 ? `$${urgentPremium.toLocaleString()} in next 30 days` : '', warn: true },
          { label: 'Action needed', value: actionNeededCount, sub: '31–60 days', info: true },
          { label: 'Under review', value: underReviewCount, sub: '61–90 days' },
        ].map(k => (
          <div key={k.label} style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#1A1410', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 28, fontWeight: 500, lineHeight: 1, marginBottom: 4, color: k.danger ? '#A32D2D' : k.warn ? '#854F0B' : k.info ? '#185FA5' : '#1A1410' }}>{k.value}</div>
            {k.sub && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#5F5A57' }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Summary bar */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 10, padding: '10px 18px', marginBottom: 12, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#3D3532' }}>
        {policies.length} policies tracked
        {lapsedCount > 0 && <> · <span style={{ color: '#A32D2D' }}>{lapsedCount} lapsed</span></>}
        {urgentCount > 0 && <> · <span style={{ color: '#854F0B' }}>{urgentCount} urgent</span></>}
        {actionNeededCount > 0 && <> · <span style={{ color: '#185FA5' }}>{actionNeededCount} action needed</span></>}
        {underReviewCount > 0 && <> · <span style={{ color: '#3D3532' }}>{underReviewCount} under review</span></>}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#B4B2A9', fontSize: 13, pointerEvents: 'none' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by client, policy or insurer…" style={{ width: '100%', height: 36, padding: '0 12px 0 34px', border: '0.5px solid #E8E2DA', borderRadius: 7, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' as const }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as FilterType)} style={{ height: 36, padding: '0 10px', border: '0.5px solid #E8E2DA', borderRadius: 7, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', background: '#FFFFFF', cursor: 'pointer', outline: 'none' }}>
          <option value="all">All status</option>
          <option value="lapsed">Lapsed ({lapsedCount})</option>
          <option value="urgent">Urgent ({urgentCount})</option>
          <option value="action_needed">Action needed ({actionNeededCount})</option>
          <option value="under_review">Under review ({underReviewCount})</option>
        </select>
      </div>

      {/* Table — uses PolicyRow with clientInfo for multi-client context */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57' }}>No policies match your filter.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAF8', borderBottom: '0.5px solid #E8E2DA' }}>
                {['Client', 'Product', 'Insurer', 'Premium', 'Renewal', 'Status', ''].map((h, i) => (
                  <th key={i} style={{ padding: '10px', textAlign: 'left', fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#1A1410', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(policy => {
                if (!policy.client_id || !policy.clients) return null
                return (
                  <PolicyRow
                    key={policy.id}
                    policy={policy}
                    ifaId={ifaId}
                    onEdit={(p) => setEditingPolicy(p as PolicyWithClient)}
                    onAskMaya={handlePolicyAskMaya}
                    confirmingDelete={confirmDeleteId === policy.id}
                    setConfirming={(id) => setConfirmDeleteId(id)}
                    cardRefreshKey={cardRefreshKey}
                    clientInfo={{
                      name: policy.clients.name,
                      company: policy.clients.company,
                      id: policy.client_id,
                    }}
                  />
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit policy modal — uses PolicyForm in edit mode */}
      {editingPolicy && (
        <PolicyForm
          mode="edit"
          initialPolicy={editingPolicy}
          clientId={editingPolicy.client_id || ''}
          ifaId={ifaId}
          onClose={() => { setEditingPolicy(null); bumpCardRefresh() }}
          onSaved={() => { setEditingPolicy(null); bumpCardRefresh(); load(); router.refresh() }}
        />
      )}

      {/* Confirm delete modal */}
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

      {/* Maya stub preview modal */}
      {mayaStub && (
        <MayaStubModal
          stub={mayaStub}
          onClose={() => setMayaStub(null)}
        />
      )}
    </div>
  )
}
