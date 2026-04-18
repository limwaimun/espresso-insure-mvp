'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/(auth)/login/actions'

interface DashboardSidebarProps {
  profile?: { name: string; plan: string }
  counts?: { conversations: number; alerts: number; renewals: number; claims: number }
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const DashboardSidebar = ({ profile, counts }: DashboardSidebarProps) => {
  const pathname = usePathname()

  const navItems = [
    { id: 'home',      label: 'Home',      href: '/dashboard',           active: pathname === '/dashboard' },
    { id: 'clients',   label: 'Clients',   href: '/dashboard/clients',   active: !!pathname?.includes('clients') },
    { id: 'renewals',  label: 'Renewals',  href: '/dashboard/renewals',  active: !!pathname?.includes('renewals'),  badge: counts?.renewals || 0 },
    { id: 'claims',    label: 'Claims',    href: '/dashboard/claims',    active: !!pathname?.includes('claims'),    badge: counts?.claims || 0,   urgent: (counts?.claims || 0) > 0 },
    { id: 'analytics', label: 'Analytics', href: '/dashboard/analytics', active: !!pathname?.includes('analytics') },
    { id: 'settings',  label: 'Settings',  href: '/dashboard/settings',  active: !!pathname?.includes('settings') },
  ]

  const planLabel = profile?.plan === 'solo' ? 'Solo' : profile?.plan === 'pro' ? 'Pro' : profile?.plan === 'team' ? 'Team' : 'Trial'

  const icons: Record<string, React.ReactNode> = {
    home:      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 1.5L14 6.5V14a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 15V9h4v6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
    clients:   <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M2 14c0-2.761 2.686-5 6-5s6 2.239 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    renewals:  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 1v2M11 1v2M2 6h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    claims:    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="3" y="1" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6 5h4M6 8h4M6 11h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    analytics: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 12L5.5 7.5 8.5 10 11 7l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    settings:  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <style>{`
        .sb-nav::-webkit-scrollbar { display: none; }
        .sb-nav { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>

      {/* Logo */}
      <div style={{ padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', borderBottom: '0.5px solid #E8E2DA', flexShrink: 0 }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 400, color: '#1A1410' }}>
            espresso<span style={{ color: '#BA7517' }}>.</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="sb-nav" style={{ flex: 1, padding: '10px 8px', overflow: 'hidden' }}>
        {navItems.map(item => (
          <Link key={item.id} href={item.href} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, marginBottom: 2,
              background: item.active ? '#FEF3E2' : 'transparent',
              color: item.active ? '#854F0B' : '#3D3532',
              fontFamily: 'DM Sans, sans-serif', fontSize: 13,
              fontWeight: item.active ? 500 : 400,
            }}>
              <span style={{ flexShrink: 0, width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icons[item.id]}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span style={{ background: (item as any).urgent ? '#E24B4A' : '#BA7517', color: '#FFFFFF', fontSize: 10, fontWeight: 500, padding: '1px 6px', borderRadius: 100 }}>
                  {item.badge}
                </span>
              ) : null}
            </div>
          </Link>
        ))}
      </nav>

      {/* Profile */}
      <div style={{ padding: '14px 16px', borderTop: '0.5px solid #E8E2DA', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FEF3E2', border: '1px solid #FAC775', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: '#854F0B', flexShrink: 0 }}>
            {profile?.name ? getInitials(profile.name) : 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#1A1410', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.name || 'User'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
              <span style={{ background: '#FEF3E2', color: '#854F0B', fontSize: 10, fontWeight: 500, padding: '1px 7px', borderRadius: 100, border: '0.5px solid #FAC775' }}>{planLabel}</span>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#5F5A57' }}>FA</span>
            </div>
          </div>
        </div>
        <form action={logout}>
          <button type="submit" style={{ width: '100%', padding: '7px 0', background: 'transparent', border: '0.5px solid #E8E2DA', borderRadius: 7, color: '#5F5A57', fontFamily: 'DM Sans, sans-serif', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span>↩</span> Sign out
          </button>
        </form>
      </div>
    </div>
  )
}

export default DashboardSidebar
