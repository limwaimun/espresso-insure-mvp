'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ImportClientsModal from '@/components/ImportClientsModal'

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
  policies?: { premium: number | null; status: string }[]
}

const TIER_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  platinum: { bg: '#F1EFE8', color: '#444441', border: '#D3D1C7' },
  gold:     { bg: '#FAEEDA', color: '#854F0B', border: '#FAC775' },
  silver:   { bg: '#F1EFE8', color: '#5F5E5A', border: '#D3D1C7' },
  bronze:   { bg: '#FAECE7', color: '#712B13', border: '#F5C4B3' },
}

const CLIENT_LIMIT = 50

export default function ClientsPage() {
  const supabase = createClient()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [connectionFilter, setConnectionFilter] = useState('all')
  const [plan, setPlan] = useState('trial')
  const [ifaId, setIfaId] = useState('')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showImport, setShowImport] = useState(false)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setIfaId(user.id)
    const [{ data: clientData }, { data: profile }] = await Promise.all([
      supabase.from('clients').select('id, name, company, type, tier, email, whatsapp, created_at, conversations(id), policies(premium, status)').eq('ifa_id', user.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('plan').eq('id', user.id).single(),
    ])
    setClients((clientData || []) as any)
    setPlan(profile?.plan || 'trial')
    setLoading(false)
  }

  useEffect(() => { load() }, [])

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





  return (
    <div style={{ padding: '24px 28px', background: '#F7F4F0', minHeight: '100vh' }}>

      {/* Import modal */}
      {showImport && ifaId && (
        <ImportClientsModal
          ifaId={ifaId}
          plan={plan}
          currentCount={clients.length}
          clientLimit={CLIENT_LIMIT}
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); load() }}
        />
      )}

      {/* Upgrade modal */}
      {showUpgradeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 36, width: 440, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <div style={{ width: 48, height: 48, background: '#FEF3E2', border: '0.5px solid #FAC775', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: 22 }}>☕</div>
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 500, color: '#1A1410', margin: '0 0 8px' }}>Client limit reached</h2>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#5F5A57', margin: '0 0 24px', lineHeight: 1.7 }}>
              The Solo plan includes up to {CLIENT_LIMIT} clients. Upgrade to Pro for unlimited clients, claims support, coverage gap detection, and more.
            </p>
            <div style={{ background: '#F7F4F0', border: '0.5px solid #E8E2DA', borderRadius: 10, padding: '16px 18px', marginBottom: 24 }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, color: '#1A1410', marginBottom: 8 }}>Pro plan — SGD 149/month</div>
              {['Unlimited clients', 'Claims + FNOL support', 'Coverage gap detection', 'Document management', 'Priority support'].map(f => (
                <div key={f} style={{ fontSize: 13, color: '#3D3532', display: 'flex', gap: 8, marginBottom: 4 }}>
                  <span style={{ color: '#0F6E56' }}>✓</span>{f}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowUpgradeModal(false)} style={{ flex: 1, background: 'transparent', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '10px 0', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57' }}>
                Not now
              </button>
              <button onClick={() => { window.open('mailto:hello@espresso.insure?subject=Upgrade to Pro', '_blank'); setShowUpgradeModal(false) }} style={{ flex: 2, background: '#BA7517', border: 'none', borderRadius: 8, padding: '10px 0', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#FFFFFF' }}>
                Upgrade to Pro →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 500, color: '#1A1410', margin: 0 }}>Clients</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => (plan === 'solo' || plan === 'trial') && clients.length >= CLIENT_LIMIT ? setShowUpgradeModal(true) : setShowImport(true)}
            style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#3D3532' }}>
            + Import clients
          </button>
          <button style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#3D3532' }}>
            Export
          </button>
        </div>
      </div>

      {/* Soft wall banners */}
      {(plan === 'solo' || plan === 'trial') && clients.length >= CLIENT_LIMIT && (
        <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#A32D2D' }}>Client limit reached</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#A32D2D', marginTop: 2 }}>You have {clients.length} clients. Solo plan includes up to {CLIENT_LIMIT}. Upgrade to Pro for unlimited.</div>
          </div>
          <button onClick={() => setShowUpgradeModal(true)} style={{ background: '#A32D2D', border: 'none', borderRadius: 7, padding: '8px 16px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, color: '#FFFFFF', flexShrink: 0, marginLeft: 16 }}>
            Upgrade to Pro
          </button>
        </div>
      )}
      {(plan === 'solo' || plan === 'trial') && clients.length >= 45 && clients.length < CLIENT_LIMIT && (
        <div style={{ background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#854F0B' }}>Approaching client limit</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#854F0B', marginTop: 2 }}>You have {clients.length} of {CLIENT_LIMIT} clients on the Solo plan. Upgrade to Pro for unlimited.</div>
          </div>
          <button onClick={() => setShowUpgradeModal(true)} style={{ background: '#BA7517', border: 'none', borderRadius: 7, padding: '8px 16px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, color: '#FFFFFF', flexShrink: 0, marginLeft: 16 }}>
            Upgrade to Pro
          </button>
        </div>
      )}

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

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#B4B2A9', fontSize: 13, pointerEvents: 'none' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, company or email…" style={{ width: '100%', height: 36, padding: '0 12px 0 34px', border: '0.5px solid #E8E2DA', borderRadius: 7, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' as const }} />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ height: 36, padding: '0 10px', border: '0.5px solid #E8E2DA', borderRadius: 7, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', background: '#FFFFFF', cursor: 'pointer', outline: 'none' }}>
          <option value="all">All types</option>
          <option value="individual">Individual</option>
          <option value="sme">SME</option>
          <option value="corporate">Corporate</option>
        </select>
        <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} style={{ height: 36, padding: '0 10px', border: '0.5px solid #E8E2DA', borderRadius: 7, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', background: '#FFFFFF', cursor: 'pointer', outline: 'none' }}>
          <option value="all">All tiers</option>
          <option value="platinum">Platinum</option>
          <option value="gold">Gold</option>
          <option value="silver">Silver</option>
          <option value="bronze">Bronze</option>
        </select>
        <select value={connectionFilter} onChange={e => setConnectionFilter(e.target.value)} style={{ height: 36, padding: '0 10px', border: '0.5px solid #E8E2DA', borderRadius: 7, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', background: '#FFFFFF', cursor: 'pointer', outline: 'none' }}>
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
            // Compute tier live from policies (client.tier is stale snapshot)
            const totalPremium = (client.policies ?? [])
              .filter((p: any) => p.status === 'active')
              .reduce((s: number, p: any) => s + (Number(p.premium) || 0), 0)
            const tier = totalPremium >= 10000 ? 'platinum'
              : totalPremium >= 5000 ? 'gold'
              : totalPremium >= 1000 ? 'silver' : 'bronze'
            const ts = TIER_STYLES[tier] || TIER_STYLES.silver
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
                      {tier}
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
