'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/(auth)/login/actions';

interface DashboardSidebarProps {
  profile?: {
    name: string;
    plan: string;
  };
  counts?: {
    conversations: number;
    alerts: number;
    renewals: number;
    claims: number;
  };
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const DashboardSidebar = ({ profile, counts }: DashboardSidebarProps) => {
  const pathname = usePathname();
  
  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠', active: pathname === '/dashboard', badge: null },
    { id: 'conversations', label: 'Conversations', icon: '💬', active: pathname?.includes('conversations'), badge: counts?.conversations || 0 },
    { id: 'alerts', label: 'Alerts', icon: '🔔', active: pathname?.includes('alerts'), badge: counts?.alerts || 0, badgeUrgent: (counts?.alerts || 0) > 0 },
    { id: 'clients', label: 'Clients', icon: '👥', active: pathname?.includes('clients'), badge: null },
    { id: 'renewals', label: 'Renewals', icon: '📅', active: pathname?.includes('renewals'), badge: counts?.renewals || 0 },
    { id: 'claims', label: 'Claims', icon: '📄', active: pathname?.includes('claims'), badge: counts?.claims || 0, badgeUrgent: (counts?.claims || 0) > 0 },
    { id: 'analytics', label: 'Analytics', icon: '📊', active: pathname?.includes('analytics'), badge: null },
    { id: 'settings', label: 'Settings', icon: '⚙️', active: pathname?.includes('settings'), badge: null },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#120A06',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid #2E1A0E',
      }}>
        <Link href="/dashboard" style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '22px',
          fontWeight: 400,
          color: '#F5ECD7',
          letterSpacing: '0.02em',
          textDecoration: 'none',
        }}>
          espresso<span style={{ color: '#C8813A' }}>.</span>
        </Link>
      </div>

      {/* Navigation */}
      <div style={{
        flex: 1,
        padding: '16px 0',
        overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}>
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard${item.id === 'home' ? '' : `/${item.id}`}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 24px',
                textDecoration: 'none',
                borderLeft: item.active ? '2px solid #C8813A' : '2px solid transparent',
                background: item.active ? 'rgba(200, 129, 58, 0.1)' : 'transparent',
                color: item.active ? '#F5ECD7' : '#C9B99A',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                fontWeight: item.active ? 500 : 400,
                transition: 'all 0.2s',
              }}
            >
              <span style={{
                fontSize: '16px',
                opacity: 0.8,
                width: '20px',
                textAlign: 'center',
              }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>
                {item.label}
              </span>
              {item.badge && item.badge > 0 && (
                <span style={{
                  background: item.badgeUrgent ? '#E53E3E' : '#C8813A',
                  color: item.badgeUrgent ? '#FFFFFF' : '#120A06',
                  fontSize: '10px',
                  fontWeight: 500,
                  padding: '2px 6px',
                  borderRadius: '100px',
                  minWidth: '18px',
                  textAlign: 'center',
                }}>
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* FA Profile Card */}
      <div style={{
        padding: '20px 24px',
        borderTop: '1px solid #2E1A0E',
        background: 'rgba(28, 15, 10, 0.5)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px',
        }}>
          {/* Avatar */}
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#C8813A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#120A06',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '16px',
            fontWeight: 600,
          }}>
            {profile?.name ? getInitials(profile.name) : 'U'}
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              color: '#F5ECD7',
              marginBottom: '2px',
            }}>
              {profile?.name || 'User'}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{
                background: '#C8813A',
                color: '#120A06',
                fontSize: '10px',
                fontWeight: 500,
                padding: '2px 8px',
                borderRadius: '100px',
              }}>
                {profile?.plan === 'solo' ? 'Solo' : profile?.plan === 'pro' ? 'Pro' : profile?.plan === 'team' ? 'Team' : 'Trial'}
              </span>
              <span style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '11px',
                color: '#C9B99A',
              }}>
                FA
              </span>
            </div>
          </div>
        </div>
        
        {/* Logout Button */}
        <form action={logout}>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #2E1A0E',
              borderRadius: '6px',
              color: '#C9B99A',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>↩</span> Sign out
          </button>
        </form>
      </div>
    </div>
  );
};

export default DashboardSidebar;
