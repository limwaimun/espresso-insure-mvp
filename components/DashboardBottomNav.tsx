'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';

const DashboardBottomNav = () => {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  
  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠', href: '/dashboard' },
    { id: 'conversations', label: 'Chat', icon: '💬', href: '/dashboard/conversations', badge: '3' },
    { id: 'alerts', label: 'Alerts', icon: '🔔', href: '/dashboard/alerts', badge: '2' },
    { id: 'clients', label: 'Clients', icon: '👥', href: '/dashboard/clients' },
    { id: 'more', label: 'More', icon: '⋯', href: '/dashboard/settings' },
  ];

  if (!isMobile) return null;

  return (
    <div className="bottom-nav">
      {navItems.map((item) => {
        const isActive = pathname === item.href || 
          (item.id === 'home' && pathname === '/dashboard') ||
          (item.id !== 'home' && pathname?.startsWith(item.href));
        
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="bottom-nav-icon">
              {item.icon}
            </span>
            <span className="bottom-nav-label">
              {item.label}
            </span>
            {item.badge && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '8px',
                background: '#E53E3E',
                color: 'white',
                fontSize: '9px',
                fontWeight: 500,
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default DashboardBottomNav;