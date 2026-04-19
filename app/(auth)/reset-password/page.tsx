'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [validSession, setValidSession] = useState(false)

  useEffect(() => {
    // Supabase puts the token in the URL hash — check for valid session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setValidSession(true)
    })
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 46, padding: '0 14px',
    border: '0.5px solid #E8E2DA', borderRadius: 8,
    fontFamily: 'DM Sans, sans-serif', fontSize: 14,
    color: '#1A1410', background: '#FFFFFF', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 400 }}>
      <a href="/" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 400, color: '#1A1410', textDecoration: 'none', marginBottom: 48, display: 'block', textAlign: 'center' }}>
        espresso<span style={{ color: '#BA7517' }}>.</span>
      </a>

      <div style={{ width: '100%', background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 16, padding: '40px 36px' }}>
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, background: '#E1F5EE', border: '0.5px solid #9FE1CB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 22 }}>✓</div>
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 500, color: '#1A1410', margin: '0 0 8px' }}>Password updated</h2>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#9B9088' }}>Redirecting you to your dashboard…</p>
          </div>
        ) : !validSession ? (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 500, color: '#1A1410', margin: '0 0 8px' }}>Invalid or expired link</h2>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#9B9088', margin: '0 0 24px' }}>This reset link has expired. Please request a new one.</p>
            <a href="/forgot-password" style={{ background: '#BA7517', color: '#FFFFFF', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, padding: '11px 24px', borderRadius: 8, textDecoration: 'none', display: 'inline-block' }}>
              Request new link
            </a>
          </div>
        ) : (
          <>
            <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 22, fontWeight: 500, color: '#1A1410', margin: '0 0 4px' }}>Set new password</h1>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#9B9088', margin: '0 0 32px' }}>Choose a strong password for your account</p>

            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 500, color: '#3D3532', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 7 }}>New password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 characters" required minLength={8} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#BA7517'}
                  onBlur={e => e.target.style.borderColor = '#E8E2DA'} />
              </div>
              <div>
                <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 500, color: '#3D3532', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 7 }}>Confirm password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat new password" required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#BA7517'}
                  onBlur={e => e.target.style.borderColor = '#E8E2DA'} />
              </div>

              {error && (
                <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: 7, padding: '10px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#A32D2D' }}>{error}</div>
              )}

              <button type="submit" disabled={loading} style={{ width: '100%', height: 48, background: loading ? '#D3D1C7' : '#BA7517', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#FFFFFF', marginTop: 4 }}>
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
