'use client'

import type { Holding } from '@/lib/types'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/Modal'
import HoldingRow from '@/components/HoldingRow'
import HoldingForm from '@/components/HoldingForm'
import { Plus, Bot, Trash2, Check, Copy, Compass } from 'lucide-react'
import { btnAddSection, btnPrimary, btnOutline } from '@/lib/styles'
import { buildHoldingReviewPrompt, buildHoldingUpdatePrompt } from '@/lib/maya-prompts'

// ── Types ──────────────────────────────────────────────────────────────────

// Holding now imported from lib/types (canonical DB row shape)

// ── Batch 8: P&L + yield calculation helpers ───────────────────────────────

// ── Styles — matched 1:1 to ClientDetailPage so Holdings looks native to the card ──

// Column header cell — exact match to Policies table <th> styling
const thBase: React.CSSProperties = {
  textAlign: 'left', padding: '10px', fontSize: 10, color: '#9B9088',
  textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500,
  borderBottom: '0.5px solid #E8E2DA',
}
const thCell = (widthPct: number, rightAlign = false): React.CSSProperties => ({
  ...thBase, width: `${widthPct}%`, textAlign: rightAlign ? 'right' : 'left',
})

// Outlined amber "+ Add X" button — exact match to ClientDetailPage's btnAddSection
// Shared styles imported from @/lib/styles (see imports below)

// ── Helpers ────────────────────────────────────────────────────────────────

// Returns a pill class name matching the global pill-* CSS classes Policies uses.
// ── HoldingRow ─────────────────────────────────────────────────────────────

// ── Main section ───────────────────────────────────────────────────────────

export default function HoldingsSection({ clientId, ifaId }: { clientId: string; ifaId: string }) {
  const supabase = createClient()
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)

  // Form modal state. HoldingForm owns its own form values + saving state;
  // we just track which mode is open and which holding (if any) we're editing.
  const [formMode, setFormMode] = useState<'add' | 'edit' | null>(null)
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null)

  // Harbour review script
  const [harbourScript, setHarbourScript] = useState<string | null>(null)
  const [loadingHarbour, setLoadingHarbour] = useState(false)
  const [copiedHarbour, setCopiedHarbour] = useState(false)

  // Maya action stub — preview of the prompt that will be sent
  const [mayaStub, setMayaStub] = useState<{ title: string; prompt: string } | null>(null)

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadHoldings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  async function loadHoldings() {
    const { data } = await supabase
      .from('holdings')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    setHoldings(data || [])
    setLoading(false)
  }

  function openAdd() {
    setEditingHolding(null)
    setFormMode('add')
  }

  function openEdit(h: Holding) {
    setEditingHolding(h)
    setFormMode('edit')
  }

  function closeForm() {
    setFormMode(null)
    setEditingHolding(null)
  }

  // Called by HoldingForm after a successful save. Closes the modal and
  // refetches holdings so the table reflects the new/updated row.
  function onFormSaved() {
    closeForm()
    loadHoldings()
  }

  async function markReviewed(holdingId: string) {
    await supabase.from('holdings').update({ last_reviewed_at: new Date().toISOString() }).eq('id', holdingId)
    loadHoldings()
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return
    setDeleting(true)
    await supabase.from('holdings').delete().eq('id', confirmDeleteId)
    setConfirmDeleteId(null)
    setDeleting(false)
    loadHoldings()
  }

  // Maya stubs — preview of the prompt that will be sent once agent wiring is done (Batch 3)
  function askMayaStub(h: Holding, action: 'review' | 'client_update') {
    setMayaStub(action === 'review'
      ? buildHoldingReviewPrompt(h)
      : buildHoldingUpdatePrompt(h))
  }

  async function getHarbourScript() {
    setLoadingHarbour(true)
    try {
      const res = await fetch('/api/harbour', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ifaId, clientId, mode: 'client_review' }),
      })
      const data = await res.json()
      setHarbourScript(data.review?.mayaScript || null)
    } catch { /* silent */ }
    setLoadingHarbour(false)
  }

  async function copyHarbour() {
    if (!harbourScript) return
    await navigator.clipboard.writeText(harbourScript)
    setCopiedHarbour(true)
    setTimeout(() => setCopiedHarbour(false), 1800)
  }

  const totalValue = holdings.reduce((s, h) => s + (Number(h.current_value) || 0), 0)
  const headerCurrency = holdings[0]?.currency || 'SGD'

  if (loading) return null

  const hasRows = holdings.length > 0

  return (
    <div className="panel" style={{ marginBottom: 24 }}>
      {/* Header — matches Policies panel-header structure */}
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span className="panel-title">Investments &amp; holdings</span>
          {hasRows && (
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460' }}>
              {headerCurrency} {totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {hasRows && (
            <button
              onClick={getHarbourScript}
              disabled={loadingHarbour}
              style={{ ...btnAddSection, opacity: loadingHarbour ? 0.6 : 1 }}
            >
              <Compass size={12} />
              {loadingHarbour ? 'Loading…' : 'Review script'}
            </button>
          )}
          <button onClick={openAdd} style={btnAddSection}>
            <Plus size={12} />
            Add holding
          </button>
        </div>
      </div>

      <div className="panel-body">
        {/* Harbour review script card — cream palette matching Coverage analysis */}
        {harbourScript && (
          <div style={{ padding: '14px 16px', background: '#FAEEDA', borderRadius: 8, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Bot size={12} color="#BA7517" />
              <span style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#854F0B',
                fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>
                Harbour · review script for Maya
              </span>
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410',
              lineHeight: 1.6, fontStyle: 'italic', marginBottom: 10,
            }}>
              &ldquo;{harbourScript}&rdquo;
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={copyHarbour} style={{ ...btnAddSection, padding: '5px 12px', fontSize: 11 }}>
                {copiedHarbour ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
              </button>
              <button
                onClick={() => setHarbourScript(null)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088',
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Holdings table — exact parity with Policies table structure */}
        {hasRows ? (
          <div className="table">
            <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thCell(44)}>Product</th>
                  <th style={thCell(14, true)}>Value</th>
                  <th style={thCell(18, true)}>P&amp;L</th>
                  <th style={thCell(18, true)}>Yield</th>
                  <th style={{ ...thBase, width: '6%' }}></th>
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => (
                  <HoldingRow
                    key={h.id}
                    holding={h}
                    onEdit={openEdit}
                    onAskMaya={askMayaStub}
                    onMarkReviewed={markReviewed}
                    onDelete={(id) => setConfirmDeleteId(id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            padding: 20, textAlign: 'center',
            fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460',
          }}>
            No investment holdings recorded yet
          </div>
        )}
      </div>

      {/* == ADD / EDIT HOLDING MODAL == */}
      {formMode && (
        <HoldingForm
          mode={formMode}
          initialHolding={editingHolding ?? undefined}
          clientId={clientId}
          ifaId={ifaId}
          onClose={closeForm}
          onSaved={onFormSaved}
        />
      )}

      {/* == MAYA STUB MODAL == */}
      {mayaStub && (
        <Modal title={mayaStub.title} onClose={() => setMayaStub(null)}>
          <div style={{ background: '#FAEEDA', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <Bot size={14} color="#BA7517" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12, color: '#854F0B', lineHeight: 1.5 }}>
              Coming soon — Maya agent integration in progress. Preview of the prompt that will be sent:
            </span>
          </div>
          <pre style={{
            background: '#FBFAF7', border: '0.5px solid #F1EFE8', borderRadius: 8,
            padding: '12px 14px', fontSize: 12, color: '#1A1410', lineHeight: 1.6,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            {mayaStub.prompt}
          </pre>
        </Modal>
      )}

      {/* == DELETE CONFIRM MODAL == */}
      {confirmDeleteId && (
        <Modal title="Delete this holding?" onClose={() => { if (!deleting) setConfirmDeleteId(null) }}>
          <div style={{ fontSize: 13, color: '#6B6460', marginBottom: 20, lineHeight: 1.6 }}>
            This will permanently remove the holding from the client record. You can&apos;t undo this.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setConfirmDeleteId(null)}
              disabled={deleting}
              style={{ ...btnOutline, opacity: deleting ? 0.6 : 1 }}
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              style={{ ...btnPrimary, background: '#A32D2D', opacity: deleting ? 0.6 : 1 }}
            >
              <Trash2 size={13} />
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
