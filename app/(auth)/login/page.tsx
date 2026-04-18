'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from './actions'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(formData: FormData) {
    setLoading(true)
    setError('')
    try {
      await login(formData)
    } catch (e: any) {
      setError(e?.message || 'Login failed. Please check your credentials.')
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 42, padding: '0 14px',
    border: '0.5px solid #E8E2DA', borderRadius: 8,
    fontFamily: 'DM Sans, sans-serif', fontSize: 14,
    color: '#1A1410', background: '#FFFFFF', outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F4F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 400, color: '#1A1410', marginBottom: 8 }}>
            espresso<span style={{ color: '#BA7517' }}>.</span>
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#5F5A57' }}>
            Your AI-powered insurance back office
          </div>
        </div>

        {/* Card */}
        <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 14, padding: '32px 28px' }}>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 500, color: '#1A1410', margin: '0 0 6px' }}>
            Welcome back
          </h1>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57', margin: '0 0 28px' }}>
            Sign in to your Espresso account
          </p>

          <form action={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 500, color: '#1A1410', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                Email
              </label>
              <input
                name="email"
                type="email"
                placeholder="your@email.com"
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#BA7517'}
                onBlur={e => e.target.style.borderColor = '#E8E2DA'}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 500, color: '#1A1410', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Password
                </label>
                <Link href="/forgot-password" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#BA7517', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#BA7517'}
                onBlur={e => e.target.style.borderColor = '#E8E2DA'}
              />
            </div>

            {error && (
              <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: 7, padding: '10px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#A32D2D' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', height: 42, background: loading ? '#D3D1C7' : '#BA7517', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#FFFFFF', marginTop: 4, transition: 'background 0.15s' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{ borderTop: '0.5px solid #E8E2DA', marginTop: 24, paddingTop: 20, textAlign: 'center' }}>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57' }}>
              No account yet?{' '}
              <Link href="/trial" style={{ color: '#BA7517', textDecoration: 'none', fontWeight: 500 }}>
                Start free trial
              </Link>
            </span>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#9B9088', marginTop: 24 }}>
          © 2025 Espresso · <a href="https://espresso.insure" style={{ color: '#9B9088' }}>espresso.insure</a>
        </p>
      </div>
    </div>
  )
}
