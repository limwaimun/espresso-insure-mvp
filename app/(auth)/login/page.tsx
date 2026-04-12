'use client';

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { login, loginWithMagicLink } from './actions';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formDataObj = new FormData();
    formDataObj.append('email', formData.email);
    formDataObj.append('password', formData.password);

    const result = await login(formDataObj);
    
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formDataObj = new FormData();
    formDataObj.append('email', formData.email);

    const result = await loginWithMagicLink(formDataObj);
    
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setMagicLinkSent(true);
      setIsLoading(false);
    }
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

            {magicLinkSent ? (
              <div style={{
                background: 'rgba(56, 161, 105, 0.1)',
                border: '1px solid #38A169',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center' as const,
              }}>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  color: '#38A169',
                  fontWeight: 500,
                  marginBottom: '8px',
                }}>
                  Check your email!
                </div>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#C9B99A',
                }}>
                  We've sent a magic link to {formData.email}. Click the link to sign in.
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <div style={{
                    background: 'rgba(229, 62, 62, 0.1)',
                    border: '1px solid #E53E3E',
                    borderRadius: '8px',
                    padding: '12px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '13px',
                    color: '#E53E3E',
                  }}>
                    {error}
                  </div>
                )}

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
                      disabled={isLoading}
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
                      disabled={isLoading}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ width: '100%' }}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </button>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '8px',
                  }}>
                    <button 
                      type="button" 
                      onClick={handleMagicLink}
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#C8813A',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        textDecoration: 'underline',
                      }}
                      disabled={isLoading}
                    >
                      Send magic link instead
                    </button>
                  </div>
                </form>
              </>
            )}
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