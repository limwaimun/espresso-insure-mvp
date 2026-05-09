'use client'

// Claims-list page (B80b2): rebuilt to use ClaimCard with clientInfo prop.
//
// Replaces the previous CSS-grid row layout + custom action column +
// "Ask Maya to follow up" generic modal with the same row pattern used
// on the client detail page. Expand-to-details, kebab menu with three
// specific Maya actions + Edit + Delete + View client.
//
// Desktop-table-only for now. Mobile responsive deferred to B80c.

import React, { useState, useEffect } from 'react'
import NewClaimModal from './components/NewClaimModal'
import ClaimCard from '../clients/components/ClaimCard'
import EditClaimModal from '../clients/components/EditClaimModal'
import ConfirmDeleteModal from '../clients/components/ConfirmDeleteModal'
import MayaStubModal from '../clients/components/MayaStubModal'
import { createClient } from '@/lib/supabase/client'
import { btnPrimary } from '@/lib/styles'
import { isOpen, isResolved, type Claim } from '@/lib/claims'
import type { Alert } from '@/lib/types'

type FilterType = 'all' | 'open' | 'resolved' | 'high'

// Local type: Claim from lib/claims + the joined clients relation that
// the claims-list query brings in (multi-client context).
type ClaimWithClient = Claim & {
  clients: { name: string; company: string | null; whatsapp: string | null } | null
}

export default function ClaimsPage() {
  const supabase = createClient()

  const [claims, setClaims] = useState<ClaimWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [ifaId, setIfaId] = useState<string>('')

  const [showNew, setShowNew] = useState(false)
  const [editingClaim, setEditingClaim] = useState<Alert | null>(null)
  const [confirmDeleteClaimId, setConfirmDeleteClaimId] = useState<string | null>(null)
  const [claimDeleting, setClaimDeleting] = useState(false)
  const [mayaStub, setMayaStub] = useState<{ title: string; context: string } | null>(null)
  const [cardRefreshKey, setCardRefreshKey] = useState(0)

  const bumpCardRefresh = () => setCardRefreshKey(k => k + 1)

  useEffect(() => {
    load()
    supabase.auth.getUser().then(({ data }) => { if (data.user) setIfaId(data.user.id) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    // Select * so ClaimCard's expanded view has all schema fields
    // (filed_date, incident_date, approved_at, denied_at, paid_at,
    // closed_at, denial_reason, *_amount, insurer_*).
    const { data } = await supabase
      .from('claims')
      .select('*, clients(name, company, whatsapp)')
      .order('created_at', { ascending: false })
    setClaims((data || []) as ClaimWithClient[])
    setLoading(false)
  }

  async function deleteClaim(claimId: string) {
    setClaimDeleting(true)
    try {
      await fetch('/api/claim-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, ifaId }),
      })
      setConfirmDeleteClaimId(null)
      await load()
    } catch (err) {
      console.error('Delete claim failed', err)
    }
    setClaimDeleting(false)
  }

  // Mirror of ClientDetailPage.handleClaimAskMaya — but reads client name
  // from the joined clients relation since claims-list spans many clients.
  function handleClaimAskMaya(claim: Alert, action: 'status_update' | 'message_insurer' | 'message_client') {
    const c = claim as ClaimWithClient
    const clientName = c.clients?.name || 'this client'
    const titles: Record<string, string> = {
      status_update: 'Draft status update for FA notes',
      message_insurer: 'Draft message to insurer',
      message_client: 'Draft message to client',
    }
    const contexts: Record<string, string> = {
      status_update: `Summarize the current status of the "${claim.title}" claim for ${clientName} as a short internal note. Current status: ${claim.status || 'open'}, priority: ${claim.priority || 'medium'}.`,
      message_insurer: `Draft a professional email to the insurer chasing an update on ${clientName}'s claim: "${claim.title}".`,
      message_client: `Draft a warm WhatsApp message to ${clientName} updating them on their claim: "${claim.title}". Current status: ${claim.status || 'open'}.`,
    }
    setMayaStub({ title: titles[action], context: contexts[action] })
  }

  // KPIs
  const totalClaims = claims.length
  const openClaims = claims.filter(isOpen).length
  const resolvedClaims = claims.filter(isResolved).length
  const highPriority = claims.filter(c => c.priority === 'high' && isOpen(c)).length

  const filtered = claims.filter(c => {
    const q = search.toLowerCase()
    if (q && !c.title?.toLowerCase().includes(q) && !c.clients?.name?.toLowerCase().includes(q)) return false
    if (filter === 'open') return isOpen(c)
    if (filter === 'resolved') return isResolved(c)
    if (filter === 'high') return c.priority === 'high' && isOpen(c)
    return true
  })

  return (
    <div style={{ padding: '24px 28px', background: '#F7F4F0', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 22, fontWeight: 500, color: '#1A1410', margin: 0 }}>Claims</h1>
        <button onClick={() => setShowNew(true)} style={btnPrimary}>
          + New claim
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total claims', value: totalClaims },
          { label: 'Open', value: openClaims, warn: openClaims > 0 },
          { label: 'Resolved', value: resolvedClaims, green: true },
          { label: 'High priority', value: highPriority, danger: highPriority > 0 },
        ].map(k => (
          <div key={k.label} style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#1A1410', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 500, color: k.danger ? '#A32D2D' : k.green ? '#0F6E56' : k.warn ? '#854F0B' : '#1A1410', lineHeight: 1 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#B4B2A9', fontSize: 13, pointerEvents: 'none' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by client or description…" style={{ width: '100%', height: 40, padding: '0 12px 0 34px', border: '0.5px solid #E8E2DA', borderRadius: 7, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' as const }} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value as FilterType)} style={{ height: 40, padding: '0 10px', border: '0.5px solid #E8E2DA', borderRadius: 7, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', background: '#FFFFFF', cursor: 'pointer', outline: 'none' }}>
          <option value="all">All status ({totalClaims})</option>
          <option value="open">Open ({openClaims})</option>
          <option value="resolved">Resolved ({resolvedClaims})</option>
          <option value="high">High priority ({highPriority})</option>
        </select>
      </div>

      {/* Claims table */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57' }}>No claims found</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAF8', borderBottom: '0.5px solid #E8E2DA' }}>
                {['Client', 'Title', 'Type', 'Status', 'Priority', 'Filed', ''].map((h, i) => (
                  <th key={i} style={{ padding: '10px', textAlign: 'left', fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#1A1410', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(claim => {
                // Defensive: skip orphan rows with no client_id. Shouldn't exist
                // (claims FK to clients in schema) but type system is null-aware.
                if (!claim.client_id) return null
                return (
                  <ClaimCard
                    key={claim.id}
                    claim={claim as Alert}
                    ifaId={ifaId}
                    onEdit={(c) => setEditingClaim(c)}
                    onAskMaya={handleClaimAskMaya}
                    onDelete={(id) => setConfirmDeleteClaimId(id)}
                    cardRefreshKey={cardRefreshKey}
                    clientInfo={{
                      name: claim.clients?.name || '—',
                      company: claim.clients?.company || null,
                      id: claim.client_id,
                    }}
                  />
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showNew && ifaId && (
        <NewClaimModal
          ifaId={ifaId}
          onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); load() }}
        />
      )}

      {editingClaim && (
        <EditClaimModal
          claim={editingClaim}
          ifaId={ifaId}
          cardRefreshKey={cardRefreshKey}
          onClose={() => { setEditingClaim(null); bumpCardRefresh() }}
          onSaved={() => { setEditingClaim(null); bumpCardRefresh(); load() }}
        />
      )}

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

      {mayaStub && (
        <MayaStubModal
          stub={mayaStub}
          onClose={() => setMayaStub(null)}
        />
      )}
    </div>
  )
}
