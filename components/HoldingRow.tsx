// ── HoldingRow ──────────────────────────────────────────────────────────────
//
// Extracted from HoldingsSection in Batch 36e. Displays one holding as a row
// with an expandable detail panel showing P&L, yield, classification, and
// attached documents. Purely presentational — all mutations happen via the
// 5 callback props provided by the parent section.

'use client'

import { useState, useRef } from 'react'
import { Bot, Check, ChevronDown, ChevronRight, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import type { Holding } from '@/lib/types'
import { calcPnl, calcAnnualIncome, heldDuration, reviewPill } from '@/lib/holdings'
import { formatMoney, formatPct } from '@/lib/money'
import { formatDate } from '@/lib/dates'
import { PerfItem, KV } from '@/components/HoldingsDisplayPrimitives'
import PortalMenu from '@/components/PortalMenu'
import DocList from '@/components/DocList'

const RISK_LABELS: Record<string, string> = {
  conservative: 'Conservative',
  moderate: 'Moderate',
  aggressive: 'Aggressive',
}

function HoldingRow({ holding, onEdit, onAskMaya, onMarkReviewed, onDelete }: {
  holding: Holding
  onEdit: (h: Holding) => void
  onAskMaya: (h: Holding, action: 'review' | 'client_update') => void
  onMarkReviewed: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLButtonElement>(null)

  const pnl = calcPnl(holding)
  const income = calcAnnualIncome(holding)
  const yieldPct = holding.distribution_yield != null ? Number(holding.distribution_yield) : null

  // Classification tags under product subtitle. Resolve "Other" -> custom text.
  const assetLabel = holding.asset_class === 'Other' ? holding.asset_class_other : holding.asset_class
  const regionLabel = holding.geography === 'Other' ? holding.geography_other : holding.geography
  const sectorLabel = holding.sector === 'Other' ? holding.sector_other : holding.sector
  const tags = [assetLabel, regionLabel, sectorLabel].filter(Boolean) as string[]

  const tagStyle: React.CSSProperties = {
    fontSize: 10, background: '#F1EFE8', color: '#5F5E5A',
    padding: '2px 7px', borderRadius: 3, letterSpacing: '0.01em',
    display: 'inline-block',
  }

  // Subtitle line: provider · [platform] · [units @ NAV currency]
  const subParts: string[] = []
  if (holding.provider) subParts.push(holding.provider)
  if (holding.platform) subParts.push(holding.platform)
  if (holding.units_held != null && holding.last_nav != null) {
    subParts.push(
      `${Number(holding.units_held).toLocaleString(undefined, { maximumFractionDigits: 3 })} @ ${Number(holding.last_nav).toFixed(4)} ${holding.currency}`
    )
  }
  const subtitle = subParts.join(' · ')

  return (
    <>
      {/* Main row — 5 columns: Product, Value, P&L, Yield, ⋮ */}
      <tr
        onClick={() => setExpanded(v => !v)}
        style={{ cursor: 'pointer', borderBottom: expanded ? 'none' : '0.5px solid #F1EFE8' }}
      >
        {/* Product (chevron + name + subtitle + classification tags) */}
        <td style={{ padding: '13px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <div style={{ paddingTop: 3 }}>
              {expanded
                ? <ChevronDown size={12} color="#9B9088" />
                : <ChevronRight size={12} color="#9B9088" />}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 13, fontWeight: 500, color: '#1A1410',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                marginBottom: 3,
              }}>
                {holding.product_name}
              </div>
              {subtitle && (
                <div style={{ fontSize: 11, color: '#6B6460', marginBottom: tags.length ? 6 : 0 }}>
                  {subtitle}
                </div>
              )}
              {tags.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {tags.map((t, i) => <span key={i} style={tagStyle}>{t}</span>)}
                </div>
              )}
            </div>
          </div>
        </td>

        {/* Value */}
        <td style={{ padding: '13px 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          <div style={{ fontSize: 13, color: '#1A1410' }}>
            {holding.current_value != null
              ? Number(holding.current_value).toLocaleString(undefined, { maximumFractionDigits: 0 })
              : '—'}
          </div>
        </td>

        {/* P&L */}
        <td style={{ padding: '13px 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          {pnl ? (
            <>
              <div style={{
                fontSize: 13, fontWeight: 500,
                color: pnl.absolute >= 0 ? '#0F6E56' : '#A32D2D',
              }}>
                {pnl.absolute >= 0 ? '+' : '−'}{Math.abs(Math.round(pnl.absolute)).toLocaleString()}
              </div>
              <div style={{
                fontSize: 10, marginTop: 2,
                color: pnl.absolute >= 0 ? '#0F6E56' : '#A32D2D',
              }}>
                {formatPct(pnl.percent)}{pnl.annualized != null ? ` · ${formatPct(pnl.annualized)} p.a.` : ''}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, color: '#BFB9B1' }}>—</div>
              {holding.current_value != null && (
                <div style={{ fontSize: 10, color: '#BFB9B1', marginTop: 2 }}>
                  Cost not entered
                </div>
              )}
            </>
          )}
        </td>

        {/* Yield */}
        <td style={{ padding: '13px 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          {yieldPct != null ? (
            <>
              <div style={{ fontSize: 13, color: '#1A1410' }}>
                {yieldPct.toFixed(1)}%
              </div>
              {income != null && (
                <div style={{ fontSize: 10, color: '#6B6460', marginTop: 2 }}>
                  {holding.currency} {Math.round(income).toLocaleString()}/yr
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 13, color: '#BFB9B1' }}>—</div>
          )}
        </td>

        {/* ⋮ menu */}
        <td style={{ padding: '13px 10px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
          <button
            ref={menuRef}
            onClick={() => setMenuOpen(o => !o)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: 4, opacity: 0.5, display: 'flex', alignItems: 'center',
              marginLeft: 'auto',
            }}
            title="Actions"
          >
            <MoreVertical size={14} color="#6B6460" />
          </button>
          <PortalMenu
            anchorRef={menuRef as React.RefObject<HTMLElement>}
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            items={[
              { icon: <Bot size={12} color="#BA7517" />, label: 'Review with Maya',       onClick: () => onAskMaya(holding, 'review'),        accent: true },
              { icon: <Bot size={12} color="#BA7517" />, label: 'Draft client update',    onClick: () => onAskMaya(holding, 'client_update'), accent: true },
              { icon: <Check size={12} color="#0F6E56" />,  label: 'Mark reviewed',       onClick: () => onMarkReviewed(holding.id),          dividerBefore: true },
              { icon: <Pencil size={12} color="#6B6460" />, label: 'Edit holding',        onClick: () => onEdit(holding) },
              { icon: <Trash2 size={12} />,                 label: 'Delete holding',      onClick: () => onDelete(holding.id),                danger: true, dividerBefore: true },
            ]}
          />
        </td>
      </tr>

      {/* Expanded detail — performance block on top, then the existing KV grid + docs + notes */}
      {expanded && (
        <tr style={{ borderBottom: '0.5px solid #F1EFE8', background: '#FBFAF7' }}>
          <td colSpan={5} style={{ padding: '18px 24px 22px 34px' }}>

            {/* Section styles — identical 4-col grid across all three for vertical alignment */}

            {/* PERFORMANCE — hidden if no perf signal */}
            {(pnl || yieldPct != null) && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500, marginBottom: 12 }}>Performance</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 24px' }}>
                  {pnl && (
                    <>
                      <PerfItem label="Unrealized gain" value={
                        <span style={{ color: pnl.absolute >= 0 ? '#0F6E56' : '#A32D2D', fontWeight: 500 }}>
                          {pnl.absolute >= 0 ? '+' : '−'}{holding.currency} {Math.abs(Math.round(pnl.absolute)).toLocaleString()}
                        </span>
                      } />
                      <PerfItem label="Return" value={
                        <span style={{ color: pnl.absolute >= 0 ? '#0F6E56' : '#A32D2D', fontWeight: 500 }}>
                          {formatPct(pnl.percent)}
                        </span>
                      } />
                      {pnl.annualized != null && (
                        <PerfItem label="Annualized" value={
                          <span style={{ color: pnl.annualized >= 0 ? '#0F6E56' : '#A32D2D', fontWeight: 500 }}>
                            {formatPct(pnl.annualized)} p.a.
                          </span>
                        } />
                      )}
                    </>
                  )}
                  {yieldPct != null && (
                    <PerfItem label="Distribution yield" value={<span style={{ fontWeight: 500 }}>{`${yieldPct.toFixed(2)}%`}</span>} />
                  )}
                  {income != null && (
                    <PerfItem label="Annual income" value={<span style={{ fontWeight: 500 }}>{`${holding.currency} ${Math.round(income).toLocaleString()}`}</span>} />
                  )}
                  {holding.inception_date && (
                    <PerfItem label="Held" value={<span style={{ fontWeight: 500 }}>{heldDuration(holding.inception_date)}</span>} />
                  )}
                </div>
              </div>
            )}

            {/* POSITION — always shown */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500, marginBottom: 12 }}>Position</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 24px' }}>
                <KV label="Units held" value={holding.units_held != null ? Number(holding.units_held).toLocaleString() : '—'} />
                <KV label="Avg. cost price" value={holding.avg_cost_price != null ? Number(holding.avg_cost_price).toFixed(4) : '—'} />
                <KV label="Last NAV" value={holding.last_nav != null ? Number(holding.last_nav).toFixed(4) : '—'} />
                <KV label="Last NAV date" value={formatDate(holding.last_nav_date)} />
                <KV label="Total invested" value={
                  holding.avg_cost_price != null && holding.units_held != null
                  ? `${holding.currency} ${(Number(holding.avg_cost_price) * Number(holding.units_held)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                  : '—'
                } />
                <KV label="Currency" value={holding.currency} />
                <KV label="Platform" value={holding.platform || '—'} />
              </div>
            </div>

            {/* REVIEW — always shown */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500, marginBottom: 12 }}>Review</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 24px' }}>
                <KV label="Risk rating" value={holding.risk_rating ? (RISK_LABELS[holding.risk_rating] || holding.risk_rating) : '—'} />
                <KV label="Inception" value={formatDate(holding.inception_date)} />
                <KV label="Last reviewed" value={formatDate(holding.last_reviewed_at)} />
              </div>
            </div>

            <DocList
              parentId={holding.id}
              apiEndpoint="/api/holding-doc"
              parentParam="holdingId"
              label="Documents"
            />

            {holding.notes && (
              <div style={{ paddingTop: 14, borderTop: '0.5px solid #F1EFE8', marginTop: 14 }}>
                <div style={{ fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Notes</div>
                <div style={{ fontSize: 13, color: '#6B6460', lineHeight: 1.6 }}>{holding.notes}</div>
              </div>
            )}

          </td>
        </tr>
      )}
    </>
  )
}

export default HoldingRow
