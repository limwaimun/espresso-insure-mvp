'use client';

import React from 'react';
import Link from 'next/link';

export default function ConfirmedPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#1C0F0A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
        textAlign: 'center' as const,
      }}>
        {/* Green Checkmark */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: '#38A169',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
          color: '#120A06',
          fontWeight: 'bold',
        }}>
          ✓
        </div>

        {/* Heading */}
        <div>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '36px',
            fontWeight: 400,
            color: '#F5ECD7',
            margin: '0 0 16px 0',
          }}>
            You're all set!
          </h1>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#C9B99A',
            lineHeight: 1.6,
            maxWidth: '320px',
          }}>
            Maya will message you on WhatsApp within 5 minutes
          </p>
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          maxWidth: '300px',
        }}>
          <button className="btn-primary" style={{ width: '100%' }}>
            Open WhatsApp
          </button>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary" style={{ width: '100%' }}>
              Go to dashboard
            </button>
          </Link>
        </div>

        {/* Footer Note */}
        <div style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '12px',
          color: '#C9B99A',
          marginTop: '24px',
        }}>
          Questions? Contact support@espresso.insure
        </div>
      </div>
    </div>
  );
}
