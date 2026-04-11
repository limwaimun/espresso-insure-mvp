'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navigation = () => {
  const pathname = usePathname();
  
  const authRoutes = ['/trial', '/login', '/confirmed', '/dashboard'];
  const isAuthRoute = authRoutes.some(route => 
    pathname?.startsWith(route)
  );
  
  if (isAuthRoute) return null;
  
  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      padding: '20px 48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'linear-gradient(to bottom, rgba(28,15,10,0.95), transparent)',
    }}>
      <Link href="/" style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '22px',
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: '#F5ECD7',
        textDecoration: 'none',
      }}>
        Espresso<span style={{ color: '#C8813A' }}>.</span>
      </Link>

      <ul style={{
        display: 'flex',
        alignItems: 'center',
        gap: '36px',
        listStyle: 'none',
        margin: 0,
        padding: 0,
      }}>
        {['Problem', 'How it works', 'Features', 'Pricing', 'Setup', 'FAQ'].map((item) => (
          <li key={item}>
            <Link
              href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              style={{
                color: '#C9B99A',
                fontSize: '14px',
                letterSpacing: '0.05em',
                textDecoration: 'none',
              }}
            >
              {item}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/dashboard"
        style={{
          background: '#C8813A',
          color: '#120A06',
          fontWeight: 500,
          fontSize: '14px',
          padding: '10px 24px',
          borderRadius: '100px',
          textDecoration: 'none',
        }}
      >
        Launch Dashboard
      </Link>
    </nav>
  );
};

export default Navigation;