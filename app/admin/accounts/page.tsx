'use client'

import { useState, useEffect } from 'react'

interface FAProfile {
  id: string
  name: string
  company: string | null
  phone: string | null
  plan: string | null
  created_at: string
  trial_ends_at: string | null
  preferred_insurers: string[] | null
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default function AdminAccountsPage() {
  const [fas, setFas] = useState<FAProfile[]>([])
  const [clientCounts, setClientCounts] = useState<Record<string, number>>({})
  const [lastLoginMap, setLastLoginMap] = useState<Record<string, string | null>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/accounts')
      .then(r => r.json())
      .then(data => {
        if (data.profiles) setFas(data.profiles)
        if (data.clientCounts) setClientCounts(data.clientCounts)
        if (data.lastLoginMap) setLastLoginMap(data.lastLoginMap)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ padding: 40, color: '#6B6460', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
      Loading accounts…
    </div>
  )

  const PLAN_COLORS: Record<string, string> = {
    platinum: '#6B6460', gold: '#BA7517', pro: '#4A9EBF',
    solo: '#BA7517', team: '#5AB87A', trial: '#9B9088',
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100 }}>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 400, color: '#1A1410', margin: '0 0 8px' }}>
        FA Accounts
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#6B6460', margin: '0 0 28px' }}>
        {fas.length} registered financial advisors
      </p>

      <div style={{ background: '#FFFFFF', border: '1px solid #E8E2DA', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FBFAF7' }}>
              {['Name', 'Company', 'Plan', 'Clients', 'WhatsApp', 'Trial ends', 'Joined', 'Last login'].map(h => (
                <th key={h} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #E8E2DA' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fas.map((fa, i) => {
              const trialDays = fa.trial_ends_at
                ? Math.max(0, Math.ceil((new Date(fa.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                : null
              return (
                <tr key={fa.id} style={{ borderBottom: i < fas.length - 1 ? '1px solid #F1EFE8' : 'none' }}>
                  <td style={{ padding: '14px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410', fontWeight: 500 }}>
                    {fa.name || '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460' }}>
                    {fa.company || '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontFamily: 'DM Sans, sans-serif', fontSize: 10, textTransform: 'capitalize',
                      padding: '2px 10px', borderRadius: 100,
                      background: 'rgba(186,117,23,0.08)', border: '1px solid #E8E2DA',
                      color: PLAN_COLORS[fa.plan || 'trial'] || '#9B9088',
                    }}>
                      {fa.plan || 'trial'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#1A1410', textAlign: 'center' }}>
                    {clientCounts[fa.id] ?? '…'}
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#6B6460' }}>
                    {fa.phone || '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: trialDays !== null && trialDays <= 3 ? '#D06060' : '#6B6460' }}>
                    {trialDays !== null ? `${trialDays}d left` : '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#9B9088' }}>
                    {new Date(fa.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#9B9088' }}>
                    {relativeTime(lastLoginMap[fa.id])}
                  </td>
                </tr>
              )
            })}
            {fas.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '40px 16px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6B6460' }}>
                  No accounts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
