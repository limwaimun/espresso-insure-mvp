'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Client {
  id: string
  name: string
  company: string | null
  type: 'individual' | 'sme' | 'corporate'
  tier: 'platinum' | 'gold' | 'silver' | 'bronze'
  email: string | null
  whatsapp: string | null
  created_at: string
  conversations?: { id: string }[]
}

const TIER_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  platinum: { bg: '#F1EFE8', color: '#444441', border: '#D3D1C7' },
  gold:     { bg: '#FAEEDA', color: '#854F0B', border: '#FAC775' },
  silver:   { bg: '#F1EFE8', color: '#5F5E5A', border: '#D3D1C7' },
  bronze:   { bg: '#FAECE7', color: '#712B13', border: '#F5C4B3' },
}

export default function ClientsPage() {
  const supabase = createClient()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [connectionFilter, setConnectionFilter] = useState('all')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('clients')
        .select('id, name, company, type, tier, email, whatsapp, created_at, conversations(id)')
        .order('created_at', { ascending: false })
      setClients((data || []) as any)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    if (q && !c.name.toLowerCase().includes(q) && !c.company?.toLowerCase().includes(q) && !c.email?.toLowerCase().includes(q)) return false
    if (tierFilter !== 'all' && c.tier !== tierFilter) return false
    if (typeFilter !== 'all' && c.type !== typeFilter) return false
    if (connectionFilter === 'connected' && !c.whatsapp) return false
    if (connectionFilter === 'not_connected' && c.whatsapp) return false
    return true
  })

  const counts = {
    total: clients.length,
    individual: clients.filter(c => c.type === 'individual').length,
    sme: clients.filter(c => c.type === 'sme').length,
    corporate: clients.filter(c => c.type === 'corporate').length,
  }

  const tierBtn = (label: string, value: string) => (
    <button key={value} onClick={() => setTierFilter(value)} style={{
      background: tierFilter === value ? '#1A1410' : '#FFFFFF',
      color: tierFilter === value ? '#FFFFFF' : '#6B6460',
      border: `0.5px solid ${tierFilter === value ? '#1A1410' : '#E8E2DA'}`,
      borderRadius: 100, padding: '5px 14px', cursor: 'pointer',
      fontFamily: 'DM Sans, sans-serif', fontSize: 13,
    }}>
      {label}
    </button>
  )

  const selectStyle: React.CSSProperties = {
    background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 7,
    padding: '7px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: 13,
    color: '#6B6460', cursor: 'pointer', outline: 'none',
  }

  return (
    <div style={{ padding: '24px 28px', background: '#F7F4F0', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 500, color: '#1A1410', margin: 0 }}>Clients</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#3D3532' }}>
            + Import clients
          </button>
          <button style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#3D3532' }}>
            Export
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total clients', value: counts.total },
          { label: 'Individual', value: counts.individual },
          { label: 'SME', value: counts.sme },
          { label: 'Corporate', value: counts.corporate },
        ].map(k => (
          <div key={k.label} style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#1A1410', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 28, fontWeight: 500, color: '#1A1410', lineHeight: 1 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tier filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {tierBtn('All', 'all')}
        {tierBtn('Platinum', 'platinum')}
        {tierBtn('Gold', 'gold')}
        {tierBtn('Silver', 'silver')}
        {tierBtn('Bronze', 'bronze')}
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#B4B2A9', fontSize: 14 }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search clients…"
            style={{ width: '100%', padding: '8px 12px 8px 36px', border: '0.5px solid #E8E2DA', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={selectStyle}>
          <option value="all">All types</option>
          <option value="individual">Individual</option>
          <option value="sme">SME</option>
          <option value="corporate">Corporate</option>
        </select>
        <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} style={selectStyle}>
          <option value="all">All tiers</option>
          <option value="platinum">Platinum</option>
          <option value="gold">Gold</option>
          <option value="silver">Silver</option>
          <option value="bronze">Bronze</option>
        </select>
        <select value={connectionFilter} onChange={e => setConnectionFilter(e.target.value)} style={selectStyle}>
          <option value="all">All connections</option>
          <option value="connected">Maya connected</option>
          <option value="not_connected">Not connected</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '200px 100px 90px 180px 200px 130px 120px', padding: '10px 20px', borderBottom: '0.5px solid #E8E2DA', background: '#FAFAF8' }}>
          {['Client', 'Type', 'Tier', 'Company', 'Email', 'WhatsApp', 'Maya status'].map(h => (
            <div key={h} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#1A1410', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57' }}>No clients found</div>
        ) : (
          filtered.map((client, i) => {
            const ts = TIER_STYLES[client.tier] || TIER_STYLES.silver
            const isConnected = !!client.whatsapp
            const convs = (client.conversations as any) || []
            const hasConversation = convs.length > 0

            return (
              <Link key={client.id} href={`/dashboard/clients/${client.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 100px 90px 180px 200px 130px 120px', padding: '13px 20px', borderBottom: i < filtered.length - 1 ? '0.5px solid #F1EFE8' : 'none', alignItems: 'center', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF8')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#1A1410' }}>{client.name}</div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#5F5A57', marginTop: 1 }}>
                      Added {new Date(client.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460', textTransform: 'capitalize' }}>{client.type}</div>
                  <div>
                    <span style={{ background: ts.bg, color: ts.color, border: `0.5px solid ${ts.border}`, fontSize: 11, fontWeight: 500, padding: '2px 9px', borderRadius: 100, textTransform: 'capitalize' }}>
                      {client.tier}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.company || '—'}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.email || '—'}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#3D3532' }}>{client.whatsapp || '—'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: hasConversation ? '#1D9E75' : isConnected ? '#BA7517' : '#D3D1C7', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: hasConversation ? '#0F6E56' : isConnected ? '#854F0B' : '#9B9088' }}>
                      {hasConversation ? 'Connected' : isConnected ? 'Pending' : 'Not connected'}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
