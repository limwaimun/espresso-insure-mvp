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

  return (
    <>
      <style>{`
        html, body, #__next { background: #F7F4F0 !important; margin: 0; padding: 0; height: 100%; }
        * { box-sizing: border-box; }
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=DM+Sans:wght@300;400;500&display=swap');
        input:focus { outline: none; border-color: #BA7517 !important; box-shadow: 0 0 0 3px rgba(186,117,23,0.1); }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F4F0', display: 'flex' }}>

        {/* Left panel — branding */}
        <div style={{ width: '42%', background: '#1A1410', padding: '48px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 400, color: '#F7F4F0', marginBottom: 64 }}>
              espresso<span style={{ color: '#BA7517' }}>.</span>
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 44, fontWeight: 400, color: '#F7F4F0', lineHeight: 1.15, marginBottom: 20 }}>
              Your AI back-office.<br />
              <em style={{ color: '#BA7517' }}>Inside WhatsApp.</em>
            </div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#9B9088', lineHeight: 1.7, maxWidth: 360 }}>
              Maya handles intake, renewals, and claims — 24/7, so you can focus on building your book.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['24/7 client intake and renewal management', 'Claims support and form pre-filling', 'Full dashboard — always up to date'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#9B9088' }}>
                <span style={{ color: '#BA7517', flexShrink: 0 }}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', background: '#F7F4F0' }}>
          <div style={{ width: '100%', maxWidth: 420 }}>
            <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 28, fontWeight: 500, color: '#1A1410', margin: '0 0 6px' }}>Welcome back</h1>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#5F5A57', margin: '0 0 36px' }}>Sign in to your Espresso account</p>

            <form action={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 500, color: '#1A1410', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Email</label>
                <input name="email" type="email" placeholder="your@email.com" required style={{ width: '100%', height: 48, padding: '0 16px', border: '0.5px solid #E8E2DA', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1A1410', background: '#FFFFFF', transition: 'border-color 0.15s' }} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 500, color: '#1A1410', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
                  <Link href="/forgot-password" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#BA7517', textDecoration: 'none' }}>Forgot password?</Link>
                </div>
                <input name="password" type="password" placeholder="••••••••" required style={{ width: '100%', height: 48, padding: '0 16px', border: '0.5px solid #E8E2DA', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1A1410', background: '#FFFFFF', transition: 'border-color 0.15s' }} />
              </div>

              {error && (
                <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: 8, padding: '12px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#A32D2D' }}>{error}</div>
              )}

              <button type="submit" disabled={loading} style={{ width: '100%', height: 50, background: loading ? '#D3D1C7' : '#BA7517', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF', marginTop: 4, transition: 'opacity 0.15s' }}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div style={{ borderTop: '0.5px solid #E8E2DA', marginTop: 32, paddingTop: 24, textAlign: 'center' }}>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#5F5A57' }}>
                No account yet?{' '}
                <Link href="/trial" style={{ color: '#BA7517', textDecoration: 'none', fontWeight: 500 }}>Start free trial</Link>
              </span>
            </div>

            <p style={{ textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#B4B2A9', marginTop: 28 }}>
              © 2026 Espresso · <a href="https://espresso.insure" style={{ color: '#B4B2A9' }}>espresso.insure</a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
