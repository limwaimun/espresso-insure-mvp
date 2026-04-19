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
      setError(e?.message || 'Incorrect email or password.')
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        html, body, #__next { background: #F7F4F0 !important; margin: 0; padding: 0; min-height: 100%; }
        * { box-sizing: border-box; }
        input:focus { outline: none; border-color: #BA7517 !important; }
        @media (max-width: 480px) {
          .login-card { padding: 28px 22px !important; border-radius: 12px !important; }
          .login-logo { font-size: 26px !important; margin-bottom: 32px !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F4F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>

        {/* Logo */}
        <a href="/" className="login-logo" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 400, color: '#1A1410', textDecoration: 'none', marginBottom: 48, display: 'block', textAlign: 'center' }}>
          espresso<span style={{ color: '#BA7517' }}>.</span>
        </a>

        {/* Form card */}
        <div className="login-card" style={{ width: '100%', maxWidth: 400, background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 16, padding: '40px 36px' }}>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 22, fontWeight: 500, color: '#1A1410', margin: '0 0 4px' }}>Sign in</h1>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#9B9088', margin: '0 0 32px' }}>Enter your email and password to continue</p>

          <form action={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 500, color: '#3D3532', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 7 }}>Email</label>
              <input name="email" type="email" placeholder="you@email.com" required style={{ width: '100%', height: 46, padding: '0 14px', border: '0.5px solid #E8E2DA', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1A1410', background: '#FFFFFF', transition: 'border-color 0.15s' }} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 500, color: '#3D3532', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Password</label>
                <Link href="/forgot-password" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#BA7517', textDecoration: 'none' }}>Forgot?</Link>
              </div>
              <input name="password" type="password" placeholder="••••••••" required style={{ width: '100%', height: 46, padding: '0 14px', border: '0.5px solid #E8E2DA', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1A1410', background: '#FFFFFF', transition: 'border-color 0.15s' }} />
            </div>

            {error && (
              <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: 7, padding: '10px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#A32D2D' }}>{error}</div>
            )}

            <button type="submit" disabled={loading} style={{ width: '100%', height: 48, background: loading ? '#D3D1C7' : '#BA7517', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#FFFFFF', marginTop: 4 }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#9B9088', marginTop: 24 }}>
          No account?{' '}
          <Link href="/trial" style={{ color: '#BA7517', textDecoration: 'none', fontWeight: 500 }}>Start free trial</Link>
        </p>
      </div>
    </>
  )
}
