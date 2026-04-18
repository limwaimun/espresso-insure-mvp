'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function TrialPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '' })
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email) { setError('Name and email are required'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) setSubmitted(true)
      else throw new Error('Signup failed')
    } catch {
      setError('Something went wrong. Please email us at hello@espresso.insure')
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 42, padding: '0 14px',
    border: '0.5px solid #E8E2DA', borderRadius: 8,
    fontFamily: 'DM Sans, sans-serif', fontSize: 14,
    color: '#1A1410', background: '#FFFFFF', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 500,
    color: '#1A1410', textTransform: 'uppercase', letterSpacing: '0.06em',
    display: 'block', marginBottom: 6,
  }

  if (submitted) return (
    <div style={{ minHeight: '100vh', background: '#F7F4F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 400, color: '#1A1410', marginBottom: 28 }}>
          espresso<span style={{ color: '#BA7517' }}>.</span>
        </div>
        <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 14, padding: '36px 28px' }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>☕</div>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 500, color: '#1A1410', margin: '0 0 10px' }}>You're on the list</h2>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#5F5A57', margin: '0 0 20px', lineHeight: 1.6 }}>
            We'll be in touch within 1 business day to set up your account. In the meantime, feel free to reach out at <a href="mailto:hello@espresso.insure" style={{ color: '#BA7517' }}>hello@espresso.insure</a>.
          </p>
          <Link href="/login" style={{ display: 'inline-block', background: '#BA7517', color: '#FFFFFF', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, padding: '10px 24px', borderRadius: 8, textDecoration: 'none' }}>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F7F4F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
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
            Start your free trial
          </h1>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57', margin: '0 0 24px' }}>
            14 days free · No credit card required · Full access
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Full name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Lim Wai Mun" required style={inputStyle} onFocus={e => e.target.style.borderColor = '#BA7517'} onBlur={e => e.target.style.borderColor = '#E8E2DA'} />
            </div>
            <div>
              <label style={labelStyle}>Work email *</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@company.com" required style={inputStyle} onFocus={e => e.target.style.borderColor = '#BA7517'} onBlur={e => e.target.style.borderColor = '#E8E2DA'} />
            </div>
            <div>
              <label style={labelStyle}>Company / Agency</label>
              <input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Wayne & Co" style={inputStyle} onFocus={e => e.target.style.borderColor = '#BA7517'} onBlur={e => e.target.style.borderColor = '#E8E2DA'} />
            </div>
            <div>
              <label style={labelStyle}>Mobile (WhatsApp)</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+65 8XXX XXXX" style={inputStyle} onFocus={e => e.target.style.borderColor = '#BA7517'} onBlur={e => e.target.style.borderColor = '#E8E2DA'} />
            </div>

            {error && (
              <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: 7, padding: '10px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#A32D2D' }}>{error}</div>
            )}

            <button type="submit" disabled={loading} style={{ width: '100%', height: 42, background: loading ? '#D3D1C7' : '#BA7517', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#FFFFFF', marginTop: 4 }}>
              {loading ? 'Submitting…' : 'Start free trial →'}
            </button>
          </form>

          {/* Social proof */}
          <div style={{ borderTop: '0.5px solid #E8E2DA', marginTop: 24, paddingTop: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Maya handles your client follow-ups 24/7', 'Auto-fill claim forms in seconds', 'Renewal pipeline always up to date'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#3D3532' }}>
                  <span style={{ color: '#0F6E56', fontSize: 14 }}>✓</span> {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#BA7517', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
          </span>
        </div>

        <p style={{ textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#9B9088', marginTop: 16 }}>
          © 2025 Espresso · <a href="https://espresso.insure" style={{ color: '#9B9088' }}>espresso.insure</a>
        </p>
      </div>
    </div>
  )
}
