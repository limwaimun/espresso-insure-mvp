'use client';

import React from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';

const DashboardTopbar = () => {
  const isMobile = useIsMobile();
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    }}>
      {/* Left side - Hamburger menu on mobile, greeting on desktop */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '12px' : '0',
      }}>
        {isMobile && (
          <button style={{
            background: 'transparent',
            border: 'none',
            color: '#F5ECD7',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px',
          }}>
            ☰
          </button>
        )}
        
        {/* Left side empty - logo is in sidebar */}
      </div>

      {/* Right side - Actions and status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '8px' : '16px',
      }}>
        {/* Maya status - hidden on mobile */}
        {!isMobile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            color: '#C9B99A',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#C8813A',
              animation: 'pulse 2s infinite',
            }} />
            <span>Maya setting up</span>
          </div>
        )}
        
        {/* Notification bell on mobile */}
        {isMobile && (
          <button style={{
            background: 'transparent',
            border: 'none',
            color: '#F5ECD7',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px',
            position: 'relative',
          }}>
            🔔
            <span style={{
              position: 'absolute',
              top: '0',
              right: '0',
              background: '#E53E3E',
              color: 'white',
              fontSize: '9px',
              fontWeight: 500,
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              2
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default DashboardTopbar;