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
        
        {isMobile ? (
          <div style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '18px',
            fontWeight: 400,
            color: '#F5ECD7',
          }}>
            espresso<span style={{ color: '#C8813A' }}>.</span>
          </div>
        ) : (
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '20px',
            fontWeight: 400,
            color: '#F5ECD7',
            margin: 0,
          }}>
            Good morning, David
          </h1>
        )}
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
              background: '#38A169',
              animation: 'pulse 2s infinite',
            }} />
            <span>Maya active</span>
          </div>
        )}

        {/* Secondary button - hidden on mobile */}
        {!isMobile && (
          <button style={{
            background: 'transparent',
            border: '1px solid #2E1A0E',
            color: '#C9B99A',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            fontWeight: 400,
            padding: '8px 16px',
            borderRadius: '100px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            + Client
          </button>
        )}

        {/* Primary button - smaller on mobile */}
        <button style={{
          background: '#C8813A',
          color: '#120A06',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: isMobile ? '12px' : '13px',
          fontWeight: 500,
          padding: isMobile ? '6px 12px' : '8px 20px',
          borderRadius: '100px',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
        }}>
          {isMobile ? 'Chat' : 'View conversations'}
        </button>
        
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