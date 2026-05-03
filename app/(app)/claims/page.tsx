'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import CreateClaimButton from '@/components/claims/CreateClaimButton'

interface ClientInfo {
  name: string
  company: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
}

interface Claim {
  id: string
  client_id: string
  policy_id: string | null
  title: string
  claim_type: string
  priority: string
  status: string
  body: string | null
  incident_date: string | null
  filed_date: string | null
  estimated_amount: number | null
  approved_amount: number | null
  insurer_claim_ref: string | null
  created_at: string
  updated_at: string
  clients: ClientInfo
}

type FilterStatus = 'all' | 'open' | 'in_progress' | 'approved' | 'denied' | 'paid'

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  approved: 'Approved',
  denied: 'Denied',
  paid: 'Paid',
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  open:         { bg: '#3D2215', color: '#F5ECD7' },
  in_progress:  { bg: '#2E1A0E', color: '#E8A55A' },
  approved:     { bg: '#1A3D2A', color: '#5AB87A' },
  denied:       { bg: '#3D1A1A', color: '#D06060' },
  paid:         { bg: '#1A2E3D', color: '#5A8AD4' },
}

const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
  high:   { bg: '#3D1A1A', color: '#D06060' },
  medium: { bg: '#3D2E15', color: '#D4A030' },
  low:    { bg: '#1A2E3D', color: '#5A8AD4' },
}

function statusPill(status: string) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.open
  const label = STATUS_LABELS[status] || status
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      fontSize: 11,
      fontWeight: 500,
      padding: '3px 10px',
      borderRadius: 100,
      whiteSpace: 'nowrap',
      border: '1px solid transparent',
    }}>
      {label}
    </span>
  )
}

function priorityPill(priority: string) {
  const s = PRIORITY_COLORS[priority] || PRIORITY_COLORS.low
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      fontSize: 11,
      fontWeight: 500,
      padding: '3px 10px',
      borderRadius: 100,
      whiteSpace: 'nowrap',
    }}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  )
}

function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return '1d ago'
  return `${days}d ago`
}

function formatCurrency(n: number | null): string {
  if (n == null) return '—'
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function ClaimsPage() {
  const supabase = createClient()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [search, setSearch] = useState('')

  const loadClaims = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    let query = supabase
      .from('claims')
      .select(`
        id, client_id, policy_id, title, claim_type, priority, status,
        body, incident_date, filed_date, estimated_amount, approved_amount,
        insurer_claim_ref, created_at, updated_at,
        clients!inner(name, company, email, phone, whatsapp)
      `)
      .eq('ifa_id', user.id)
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query

    if (!error && data) {
      setClaims(data as unknown as Claim[])
    } else if (error) {
      console.error('[claims] load error:', error.message)
    }
    setLoading(false)
  }, [supabase, filter])

  useEffect(() => {
    loadClaims()
  }, [loadClaims])

  const filtered = claims.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.title.toLowerCase().includes(q) ||
      c.clients?.name?.toLowerCase().includes(q) ||
      c.insurer_claim_ref?.toLowerCase().includes(q)
    )
  })

  const kpis = [
    { label: 'Total', value: claims.length, color: '#F5ECD7' },
    { label: 'Open', value: claims.filter(c => c.status === 'open').length, color: '#C9B99A' },
    { label: 'In Progress', value: claims.filter(c => c.status === 'in_progress').length, color: '#E8A55A' },
    { label: 'Approved', value: claims.filter(c => c.status === 'approved').length, color: '#5AB87A' },
    { label: 'Denied', value: claims.filter(c => c.status === 'denied').length, color: '#D06060' },
    { label: 'Paid', value: claims.filter(c => c.status === 'paid').length, color: '#5A8AD4' },
  ]

  return (
    <div style={{ padding: '24px 28px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '2.25rem',
            fontWeight: 500,
            color: '#F5ECD7',
            margin: 0,
          }}>
            Claims
          </h1>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.875rem',
            color: '#C9B99A',
            margin: '4px 0 0',
          }}>
            Track and manage insurance claims for your clients
          </p>
        </div>
        <CreateClaimButton />
      </div>

      {/* KPI cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 12,
        marginBottom: 24,
      }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background: '#3D2215',
            borderRadius: 16,
            padding: '16px 18px',
          }}>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.75rem',
              color: '#C9B99A',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 8,
            }}>
              {k.label}
            </div>
            <div style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '1.5rem',
              fontWeight: 500,
              color: k.color,
              lineHeight: 1,
            }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 16,
        alignItems: 'center',
      }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search claims..."
            style={{
              width: '100%',
              height: 38,
              padding: '0 12px 0 36px',
              background: '#120A06',
              border: '1px solid #2E1A0E',
              borderRadius: 8,
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              color: '#F5ECD7',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <span style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#C9B99A',
            fontSize: 13,
            pointerEvents: 'none',
          }}>
            🔍
          </span>
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as FilterStatus)}
          style={{
            height: 38,
            padding: '0 12px',
            background: '#120A06',
            border: '1px solid #2E1A0E',
            borderRadius: 8,
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            color: '#F5ECD7',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="all">All ({claims.length})</option>
          <option value="open">Open ({claims.filter(c => c.status === 'open').length})</option>
          <option value="in_progress">In Progress ({claims.filter(c => c.status === 'in_progress').length})</option>
          <option value="approved">Approved ({claims.filter(c => c.status === 'approved').length})</option>
          <option value="denied">Denied ({claims.filter(c => c.status === 'denied').length})</option>
          <option value="paid">Paid ({claims.filter(c => c.status === 'paid').length})</option>
        </select>
      </div>

      {/* Claims list */}
      <div style={{
        background: '#120A06',
        border: '1px solid #2E1A0E',
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '160px 1fr 110px 90px 80px 90px 100px',
          padding: '12px 20px',
          borderBottom: '1px solid #2E1A0E',
          background: '#1C0F0A',
        }}>
          {['Client', 'Description', 'Status', 'Priority', 'Amount', 'Filed', ''].map(h => (
            <div key={h} style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.7rem',
              fontWeight: 500,
              color: '#C9B99A',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
            }}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{
            padding: '32px 20px',
            textAlign: 'center',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            color: '#C9B99A',
          }}>
            Loading claims...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            padding: '48px 20px',
            textAlign: 'center',
          }}>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 14,
              color: '#C9B99A',
              margin: '0 0 16px',
            }}>
              {search ? 'No claims match your search.' : 'No claims yet.'}
            </p>
            {!search && <CreateClaimButton />}
          </div>
        ) : (
          filtered.map((claim, i) => {
            const clientName = claim.clients?.name || '—'
            const isLast = i === filtered.length - 1
            return (
              <div
                key={claim.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr 110px 90px 80px 90px 100px',
                  padding: '14px 20px',
                  borderBottom: isLast ? 'none' : '1px solid #2E1A0E',
                  alignItems: 'start',
                  transition: 'background 150ms ease-in-out',
                }}
                onMouseEnter={e => {
                  if (!isLast) e.currentTarget.style.background = '#3D2215'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#F5ECD7',
                  }}>
                    {clientName}
                  </div>
                  {claim.clients?.company && (
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 11,
                      color: '#C9B99A',
                      marginTop: 2,
                    }}>
                      {claim.clients.company}
                    </div>
                  )}
                </div>
                <div style={{ paddingRight: 12 }}>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 13,
                    color: '#F5ECD7',
                    marginBottom: 2,
                  }}>
                    {claim.title}
                  </div>
                  {claim.insurer_claim_ref && (
                    <div style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: 11,
                      color: '#C9B99A',
                    }}>
                      Ref: {claim.insurer_claim_ref}
                    </div>
                  )}
                </div>
                <div>{statusPill(claim.status)}</div>
                <div>{priorityPill(claim.priority)}</div>
                <div style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: 12,
                  color: '#F5ECD7',
                }}>
                  {formatCurrency(claim.estimated_amount)}
                </div>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 12,
                  color: '#C9B99A',
                }}>
                  {timeAgo(claim.created_at)}
                </div>
                <div>
                  <Link
                    href={`/dashboard/clients/${claim.client_id}`}
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 12,
                      color: '#C8813A',
                      textDecoration: 'none',
                      transition: 'color 150ms',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#E8A55A' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#C8813A' }}
                  >
                    View →
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Mobile hint */}
      <div style={{
        marginTop: 16,
        textAlign: 'center',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: 11,
        color: '#3D2215',
      }}>
        Espresso Claims — {new Date().toLocaleDateString('en-SG', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  )
}
