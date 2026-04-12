'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, just redirect to dashboard
    window.location.href = '/dashboard';
  };

  return (
    <>
      {/* Amber radial glow */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(200,129,58,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      
      {/* Main Content Container */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '400px',
        padding: '0 16px',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '32px',
        }}>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '32px',
            fontWeight: 400,
            color: '#F5ECD7',
          }}>
            espresso.
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px',
            color: '#C9B99A',
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
          }}>
            AI-Powered Insurance Platform
          </div>
        </div>

        {/* Login Form */}
        <div className="panel" style={{ padding: '32px' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}>
            <div>
              <h1 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '24px',
                fontWeight: 400,
                color: '#F5ECD7',
                margin: '0 0 8px 0',
              }}>
                Welcome back
              </h1>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#C9B99A',
              }}>
                Sign in to your Espresso account
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#C9B99A',
                  fontWeight: 500,
                }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  className="input"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#C9B99A',
                  fontWeight: 500,
                }}>
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  className="input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                Sign in
              </button>

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '8px',
              }}>
                <button type="button" style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#C8813A',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                }}>
                  Forgot password?
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sign up link */}
        <div style={{
          textAlign: 'center' as const,
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          color: '#C9B99A',
          marginTop: '24px',
        }}>
          Don't have an account?{' '}
          <Link href="/trial" style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#C8813A',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 500,
            padding: '0',
            textDecoration: 'none',
          }}>
            Start free trial
          </Link>
        </div>
      </div>
    </>
  );
}