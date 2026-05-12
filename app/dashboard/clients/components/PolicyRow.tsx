'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/dates'
import PortalMenu from '@/components/PortalMenu'
import DocList from '@/components/DocList'
import { KV } from '@/components/HoldingsDisplayPrimitives'
import { ChevronDown, ChevronRight, MoreVertical, Bot, Pencil, Trash2, User, Activity, ArrowUpRight, Save, FileText, Loader2, Circle, AlertCircle } from 'lucide-react'
import type { Policy } from '@/lib/types'
import { policyStatusPill, annualPremium, type ParseOverall } from '@/lib/policies'
import { phaseLabel, stateLabel, phaseColor, validTransitions, type LifecycleEvent } from '@/lib/policy-lifecycle'
import { formatRelativeTime } from '@/lib/dates'
import Modal from '@/components/Modal'
import BriefModal from '@/components/BriefModal'
import { inputStyle, labelStyle, btnPrimary, btnOutline } from '@/lib/styles'

export type { Policy }  // re-export: kept so ClientDetailPage's `import { Policy } from './PolicyRow'` keeps working during the unification transition.

// ── Helpers ────────────────────────────────────────────────────────────────
// Duplicated from ClientDetailPage for the same reason. TODO: consolidate.

// ── Component ──────────────────────────────────────────────────────────────

export default function PolicyRow({ policy, faId, onEdit, onAskMaya, confirmingDelete, setConfirming, cardRefreshKey, clientInfo, parseOverall }: {
  policy: Policy
  faId: string
  onEdit: (p: Policy) => void
  onAskMaya: (p: Policy, action: 'summarize' | 'renewal_reminder') => void
  confirmingDelete: boolean
  setConfirming: (id: string | null) => void
  cardRefreshKey: number
  /**
   * When provided, PolicyRow renders an additional Client column at the start
   * of the collapsed row and adds a "View client →" item to the kebab menu.
   * Used by the multi-client renewals page; omitted on the per-client detail
   * page (where the client context is already known). Mirrors ClaimCard B80b1.
   */
  clientInfo?: { name: string; company: string | null; id: string }
  /**
   * B-pe-18c.1: parse-pipeline indicator next to policy number.
   * Renders a small icon when value is 'pending' | 'running' | 'failed'.
   * No icon when 'done' or undefined. BriefModal handles the live progress
   * detail (this is just the at-a-glance row signal).
   */
  parseOverall?: ParseOverall
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLButtonElement>(null)

  // B82d: lifecycle UI state
  const [logActivityOpen, setLogActivityOpen] = useState(false)
  const [logActivityText, setLogActivityText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [logError, setLogError] = useState<string | null>(null)

  // Pull current phase/state from the policy row (cast since the Policy
  // type in lib/types may not yet declare these — they exist on the DB
  // post-B82a but the type was last updated pre-migration).
  const currentPhase = (policy as Policy & { current_phase?: string }).current_phase || 'ongoing'
  const currentState = (policy as Policy & { policy_state?: string }).policy_state || 'active'

  // Advance stage modal state
  const [advanceOpen, setAdvanceOpen] = useState(false)
  const [advanceText, setAdvanceText] = useState('')
  const [selectedTransition, setSelectedTransition] = useState<{ to_phase: string; to_state: string; label: string } | null>(null)
  const [advanceError, setAdvanceError] = useState<string | null>(null)

  // Brief modal state (B-pe-4)
  const [briefOpen, setBriefOpen] = useState(false)

  // Activity timeline state (lazy-loaded on first expand)
  const [events, setEvents] = useState<LifecycleEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventsLoaded, setEventsLoaded] = useState(false)

  // Lazy-load events on first expand
  useEffect(() => {
    if (!expanded || eventsLoaded) return
    setEventsLoading(true)
    fetch(`/api/policy-lifecycle/list?policyId=${policy.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.events) setEvents(data.events)
        setEventsLoaded(true)
      })
      .catch(err => console.error('[PolicyRow] failed to load events:', err))
      .finally(() => setEventsLoading(false))
  }, [expanded, eventsLoaded, policy.id])

  async function submitAdvanceStage() {
    if (!selectedTransition) return
    setSubmitting(true)
    setAdvanceError(null)
    try {
      const res = await fetch('/api/policy-lifecycle/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stage_transition',
          policyId: policy.id,
          to_phase: selectedTransition.to_phase,
          to_state: selectedTransition.to_state,
          text: advanceText.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAdvanceError(data.error || 'Failed to advance stage')
        setSubmitting(false)
        return
      }
      setAdvanceOpen(false)
      setAdvanceText('')
      setSelectedTransition(null)
      setEventsLoaded(false)  // force reload of events on next expand
      router.refresh()
    } catch (err) {
      setAdvanceError('Network error')
    }
    setSubmitting(false)
  }

  async function submitLogActivity() {
    if (!logActivityText.trim()) return
    setSubmitting(true)
    setLogError(null)
    try {
      const res = await fetch('/api/policy-lifecycle/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual_note',
          policyId: policy.id,
          text: logActivityText.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLogError(data.error || 'Failed to log activity')
        setSubmitting(false)
        return
      }
      setLogActivityOpen(false)
      setLogActivityText('')
      setEventsLoaded(false)  // force reload of events on next expand
      router.refresh()
    } catch (err) {
      setLogError('Network error')
    }
    setSubmitting(false)
  }

  const { cls, text } = policyStatusPill(policy)

  return (
    <>
      {/* Main row — 6 columns (or 7 with clientInfo): [Client], Product (+ policy#), Insurer (+ type), Premium (+ SA), Renewal, Status, ⋮ */}
      <tr onClick={() => setExpanded(e => !e)} style={{ cursor: 'pointer', borderBottom: expanded ? 'none' : '0.5px solid #F1EFE8' }}>
        {clientInfo && (
          <td style={{ padding: '12px 10px' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1410' }}>{clientInfo.name}</div>
            {clientInfo.company && (
              <div style={{ fontSize: 11, color: '#6B6460' }}>{clientInfo.company}</div>
            )}
          </td>
        )}
        <td style={{ padding: '12px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {expanded ? <ChevronDown size={12} color="#9B9088" /> : <ChevronRight size={12} color="#9B9088" />}
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1410' }}>{policy.product_name || policy.type || '—'}</div>
              {policy.policy_number && (
                <div style={{ fontSize: 10, color: '#9B9088', fontFamily: 'DM Mono, monospace', marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span>{policy.policy_number}</span>
                  <style>{`@keyframes policyrow-spin { to { transform: rotate(360deg) } } .policyrow-spin { animation: policyrow-spin 1s linear infinite; }`}</style>
                  {parseOverall === 'running' && (
                    <span
                      title="Analyzing policy document…"
                      style={{ display: 'inline-flex', alignItems: 'center', cursor: 'help' }}
                    >
                      <Loader2 size={11} className="policyrow-spin" color="#BA7517" aria-label="Analyzing policy document" />
                    </span>
                  )}
                  {parseOverall === 'pending' && (
                    <span
                      title="Policy analysis queued"
                      style={{ display: 'inline-flex', alignItems: 'center', cursor: 'help' }}
                    >
                      <Circle size={11} color="#9B9088" aria-label="Policy analysis queued" />
                    </span>
                  )}
                  {parseOverall === 'failed' && (
                    <span
                      title="Policy analysis failed — open Brief to see error"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        cursor: 'help',
                        color: '#C15050',
                      }}
                    >
                      <AlertCircle size={14} color="#C15050" aria-label="Policy analysis failed" />
                      <span style={{ fontSize: 10, fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>
                        Parse failed
                      </span>
                    </span>
                  )}
                </div>
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
              { icon: <Activity size={12} color="#6B6460" />, label: 'Log activity', onClick: () => setLogActivityOpen(true), dividerBefore: true },
              { icon: <ArrowUpRight size={12} color="#6B6460" />, label: 'Advance stage', onClick: () => setAdvanceOpen(true) },
              { icon: <FileText size={12} color="#6B6460" />, label: 'Brief', onClick: () => setBriefOpen(true), dividerBefore: true },
              ...(clientInfo ? [{
                icon: <User size={12} color="#6B6460" />,
                label: 'View client',
                onClick: () => router.push(`/dashboard/clients/${clientInfo.id}`),
                dividerBefore: true,
              }] : []),
              { icon: <Pencil size={12} color="#6B6460" />, label: 'Edit policy', onClick: () => onEdit(policy), dividerBefore: !clientInfo },
              { icon: <Trash2 size={12} />, label: 'Delete policy', onClick: () => setConfirming(policy.id), danger: true, dividerBefore: true },
            ]}
          />
        </td>
      </tr>

      {/* Expanded detail — three sections (Coverage / Money / Lifecycle) +
          Documents and Identifiers + optional Notes. Mirrors HoldingRow's
          B46 layout: 4-column grids, cream palette, section headers in
          muted grey uppercase. */}
      {expanded && (() => {
        // Derive money + lifecycle data
        const annualTotal = annualPremium(policy)

        const daysLeft = policy.renewal_date
          ? Math.ceil((new Date(policy.renewal_date).getTime() - Date.now()) / 86400000)
          : null
        const daysLeftDisplay = daysLeft == null
          ? '—'
          : daysLeft < 0
            ? `${Math.abs(daysLeft)} days overdue`
            : daysLeft === 0
              ? 'Today'
              : `${daysLeft} days`

        const sectionHeaderStyle: React.CSSProperties = {
          fontSize: 10,
          color: '#9B9088',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          fontWeight: 500,
          marginBottom: 12,
        }
        const gridStyle: React.CSSProperties = {
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px 24px',
        }

        const phaseColors = phaseColor(currentPhase)

        return (
          <tr style={{ borderBottom: '0.5px solid #F1EFE8', background: '#FBFAF7' }}>
            <td colSpan={clientInfo ? 7 : 6} style={{ padding: '20px 24px 22px 34px' }}>

              {/* STAGE INDICATOR — phase + state pill at top of expanded view (B82d) */}
              <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500 }}>
                  Stage
                </span>
                <span style={{
                  background: phaseColors.bg,
                  color: phaseColors.text,
                  fontSize: 11,
                  fontWeight: 500,
                  padding: '3px 10px',
                  borderRadius: 100,
                  whiteSpace: 'nowrap',
                }}>
                  {phaseLabel(currentPhase)} · {stateLabel(currentState)}
                </span>
              </div>

              {/* COVERAGE — what's being insured. Insurer omitted since
                  it's already prominent in the collapsed row. Policy #
                  moved here from a separate Identifiers section so the
                  4-column grid fills cleanly. */}
              <div style={{ marginBottom: 24 }}>
                <div style={sectionHeaderStyle}>Coverage</div>
                <div style={gridStyle}>
                  <KV label="Type" value={policy.type || '—'} />
                  <KV label="Sum assured" value={policy.sum_assured ? `SGD ${Number(policy.sum_assured).toLocaleString()}` : '—'} />
                  <KV label="Product name" value={policy.product_name || '—'} />
                  <KV label="Policy #" value={policy.policy_number || '—'} />
                </div>
              </div>

              {/* MONEY — what it costs. Strict 4-column grid; the empty
                  cell keeps column boundaries aligned with Coverage and
                  Lifecycle above/below. */}
              <div style={{ marginBottom: 24 }}>
                <div style={sectionHeaderStyle}>Money</div>
                <div style={gridStyle}>
                  <KV label="Premium" value={policy.premium != null ? `SGD ${Number(policy.premium).toLocaleString()}` : '—'} />
                  <KV label="Frequency" value={<span style={{ textTransform: 'capitalize' }}>{policy.premium_frequency || 'Annual'}</span>} />
                  <KV label="Annual total" value={annualTotal > 0 ? `SGD ${annualTotal.toLocaleString()}` : '—'} />
                  <div />
                </div>
              </div>

              {/* LIFECYCLE — is it active and current */}
              <div style={{ marginBottom: 24 }}>
                <div style={sectionHeaderStyle}>Lifecycle</div>
                <div style={gridStyle}>
                  <KV label="Status" value={<span style={{ textTransform: 'capitalize' }}>{policy.status || 'active'}</span>} />
                  <KV label="Start date" value={policy.start_date ? formatDate(policy.start_date) : '—'} />
                  <KV label="Renewal date" value={policy.renewal_date ? formatDate(policy.renewal_date) : '—'} />
                  <KV label="Days left" value={daysLeftDisplay} />
                </div>
              </div>

              {/* DOCUMENTS — full-width below the three semantic sections.
                  Identifiers section dropped; Policy # now sits in Coverage. */}
              <div style={{ marginBottom: policy.notes ? 20 : 0 }}>
                <div style={sectionHeaderStyle}>Documents</div>
                <DocList
                  key={`policy-doc-${policy.id}-${cardRefreshKey}`}
                  parentId={policy.id}
                  apiEndpoint="/api/policy-doc"
                  parentParam="policyId"
                  label=""
                />
              </div>

              {/* ACTIVITY TIMELINE — lifecycle events for this policy (B82d) */}
              <div style={{ marginTop: 24, paddingTop: 14, borderTop: '0.5px solid #F1EFE8', marginBottom: policy.notes ? 20 : 0 }}>
                <div style={sectionHeaderStyle}>Activity</div>
                {eventsLoading ? (
                  <div style={{ fontSize: 12, color: '#9B9088' }}>Loading...</div>
                ) : events.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#9B9088', fontStyle: 'italic' }}>
                    No activity yet. Use 'Log activity' or 'Advance stage' from the menu to record an entry.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {events.map(ev => (
                      <div key={ev.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ fontSize: 11, color: '#9B9088', fontFamily: 'DM Mono, monospace', minWidth: 90, paddingTop: 2 }}>
                          {formatRelativeTime(ev.created_at)}
                        </div>
                        <div style={{ flex: 1, fontSize: 13, color: '#1A1410', lineHeight: 1.5 }}>
                          {ev.event_type === 'stage_transition' && (
                            <div>
                              <span style={{ color: '#6B6460' }}>Moved from </span>
                              <span style={{ fontWeight: 500 }}>{phaseLabel(ev.from_phase || '')} / {stateLabel(ev.from_state || '')}</span>
                              <span style={{ color: '#6B6460' }}> to </span>
                              <span style={{ fontWeight: 500 }}>{phaseLabel(ev.to_phase || '')} / {stateLabel(ev.to_state || '')}</span>
                              {ev.text && <div style={{ color: '#6B6460', marginTop: 2, fontStyle: 'italic' }}>"{ev.text}"</div>}
                            </div>
                          )}
                          {ev.event_type === 'manual_note' && (
                            <div>{ev.text}</div>
                          )}
                          {ev.event_type === 'agent_nudge' && (
                            <div style={{ color: '#854F0B' }}>Agent nudge: {ev.text || '(no message)'}</div>
                          )}
                          {ev.event_type === 'maya_drafted' && (
                            <div style={{ color: '#185FA5' }}>Maya drafted a message: {ev.text || '(see metadata)'}</div>
                          )}
                          {ev.event_type === 'maya_sent' && (
                            <div style={{ color: '#0F6E56' }}>Maya sent: {ev.text || '(see metadata)'}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* NOTES — full-width if present */}
              {policy.notes && (
                <div style={{ paddingTop: 14, borderTop: '0.5px solid #F1EFE8' }}>
                  <div style={{ fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Notes</div>
                  <div style={{ fontSize: 13, color: '#6B6460', lineHeight: 1.6 }}>{policy.notes}</div>
                </div>
              )}
            </td>
          </tr>
        )
      })()}

      {/* B82d: Log activity modal */}
      {logActivityOpen && (
        <Modal title="Log activity" onClose={() => { setLogActivityOpen(false); setLogActivityText(''); setLogError(null) }}>
          <div style={{ padding: '24px 28px', minWidth: 480 }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460', margin: '0 0 16px', lineHeight: 1.5 }}>
              Record a note against this policy. Examples: "Called Cindy, said Friday is better", "Sent quote for renewal", "Client requested deductible options".
            </p>
            <label style={labelStyle}>Note</label>
            <textarea
              value={logActivityText}
              onChange={e => setLogActivityText(e.target.value)}
              placeholder="What happened?"
              rows={5}
              style={{ ...inputStyle, fontFamily: 'DM Sans, sans-serif', resize: 'vertical' }}
              autoFocus
            />
            {logError && (
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#A32D2D', marginTop: 8 }}>
                {logError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
              <button onClick={() => { setLogActivityOpen(false); setLogActivityText(''); setLogError(null) }} style={btnOutline}>
                Cancel
              </button>
              <button
                onClick={submitLogActivity}
                disabled={!logActivityText.trim() || submitting}
                style={{ ...btnPrimary, opacity: !logActivityText.trim() || submitting ? 0.5 : 1, cursor: !logActivityText.trim() || submitting ? 'not-allowed' : 'pointer' }}
              >
                <Save size={13} /> {submitting ? 'Saving...' : 'Save activity'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Brief modal (B-pe-4) */}
      {briefOpen && (
        <BriefModal
          onClose={() => setBriefOpen(false)}
          policyId={policy.id}
          policyLabel={`${policy.insurer || 'Policy'}${policy.policy_number ? ' — ' + policy.policy_number : ''}`}
        />
      )}

      {/* B82d: Advance stage modal */}
      {advanceOpen && (() => {
        const transitions = validTransitions(currentPhase, currentState)
        return (
          <Modal title="Advance stage" onClose={() => { setAdvanceOpen(false); setAdvanceText(''); setSelectedTransition(null); setAdvanceError(null) }}>
            <div style={{ padding: '24px 28px', minWidth: 480 }}>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460', margin: '0 0 8px', lineHeight: 1.5 }}>
                Current stage: <strong style={{ color: '#1A1410' }}>{phaseLabel(currentPhase)} · {stateLabel(currentState)}</strong>
              </p>
              {transitions.length === 0 ? (
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460', padding: '14px 0', fontStyle: 'italic' }}>
                  No transitions available from this stage.
                </div>
              ) : (
                <>
                  <label style={{ ...labelStyle, marginTop: 16 }}>Select next stage</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                    {transitions.map(t => {
                      const isSelected = selectedTransition?.to_phase === t.to_phase && selectedTransition?.to_state === t.to_state
                      return (
                        <button
                          key={`${t.to_phase}:${t.to_state}`}
                          onClick={() => setSelectedTransition(t)}
                          style={{
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: 13,
                            textAlign: 'left',
                            padding: '10px 14px',
                            border: isSelected ? '1px solid #BA7517' : '0.5px solid #E8E2DA',
                            background: isSelected ? '#FBF7EE' : '#FFFFFF',
                            color: '#1A1410',
                            borderRadius: 8,
                            cursor: 'pointer',
                          }}
                        >
                          {t.label} <span style={{ color: '#9B9088', fontSize: 11 }}>→ {phaseLabel(t.to_phase)} / {stateLabel(t.to_state)}</span>
                        </button>
                      )
                    })}
                  </div>
                  <label style={{ ...labelStyle, marginTop: 18 }}>Note (optional)</label>
                  <textarea
                    value={advanceText}
                    onChange={e => setAdvanceText(e.target.value)}
                    placeholder="Why this transition?"
                    rows={3}
                    style={{ ...inputStyle, fontFamily: 'DM Sans, sans-serif', resize: 'vertical' }}
                  />
                  {advanceError && (
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#A32D2D', marginTop: 8 }}>
                      {advanceError}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
                    <button onClick={() => { setAdvanceOpen(false); setAdvanceText(''); setSelectedTransition(null); setAdvanceError(null) }} style={btnOutline}>
                      Cancel
                    </button>
                    <button
                      onClick={submitAdvanceStage}
                      disabled={!selectedTransition || submitting}
                      style={{ ...btnPrimary, opacity: !selectedTransition || submitting ? 0.5 : 1, cursor: !selectedTransition || submitting ? 'not-allowed' : 'pointer' }}
                    >
                      <Save size={13} /> {submitting ? 'Saving...' : 'Advance stage'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </Modal>
        )
      })()}
    </>
  )
}
