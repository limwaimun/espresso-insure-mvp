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
      else throw new Error()
    } catch {
      setError('Something went wrong. Email us at hello@espresso.insure')
    }
    setLoading(false)
  }

  const input: React.CSSProperties = { width: '100%', height: 46, padding: '0 14px', border: '0.5px solid #E8E2DA', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1A1410', background: '#FFFFFF', outline: 'none', transition: 'border-color 0.15s' }
  const label: React.CSSProperties = { fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 500, color: '#3D3532', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 7 }

  if (submitted) return (
    <>
      <style>{`html,body,#__next{background:#F7F4F0!important;margin:0;padding:0;}`}</style>
      <div style={{ minHeight: '100vh', background: '#F7F4F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <a href="/" className="trial-logo" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 400, color: '#1A1410', textDecoration: 'none', marginBottom: 48, display: 'block', textAlign: 'center' }}>espresso<span style={{ color: '#BA7517' }}>.</span></a>
        <div style={{ width: '100%', maxWidth: 400, background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 16, padding: '40px 36px', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, background: '#FEF3E2', border: '0.5px solid #FAC775', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 22 }}>☕</div>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 500, color: '#1A1410', margin: '0 0 8px' }}>You're on the list</h2>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#9B9088', margin: '0 0 28px', lineHeight: 1.7 }}>We'll be in touch within 1 business day to set up your account.</p>
          <Link href="/login" style={{ display: 'inline-block', background: '#BA7517', color: '#FFFFFF', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, padding: '11px 28px', borderRadius: 8, textDecoration: 'none' }}>Back to login</Link>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{`
        html, body, #__next { background: #F7F4F0 !important; margin: 0; padding: 0; min-height: 100%; }
        * { box-sizing: border-box; }
        input:focus { outline: none; border-color: #BA7517 !important; }
        .trial-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 480px) {
          .trial-card { padding: 28px 22px !important; border-radius: 12px !important; }
          .trial-logo { font-size: 26px !important; margin-bottom: 32px !important; }
          .trial-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F4F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>

        {/* Logo */}
        <a href="/" className="trial-logo" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 400, color: '#1A1410', textDecoration: 'none', marginBottom: 48, display: 'block', textAlign: 'center' }}>
          espresso<span style={{ color: '#BA7517' }}>.</span>
        </a>

        {/* Form card */}
        <div className="trial-card" style={{ width: '100%', maxWidth: 420, background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 16, padding: '40px 36px' }}>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 22, fontWeight: 500, color: '#1A1410', margin: '0 0 4px' }}>Start your free trial</h1>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#9B9088', margin: '0 0 32px' }}>14 days free · No credit card · Full access</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={label}>Full name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Lim Wai Mun" required style={input} />
            </div>
            <div>
              <label style={label}>Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@email.com" required style={input} />
            </div>
            <div>
              <label style={label}>Company / Agency</label>
              <input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Wayne & Co" style={input} />
            </div>
            <div>
              <label style={label}>Mobile (WhatsApp)</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+65 8XXX XXXX" style={input} />
            </div>

            {error && (
              <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: 7, padding: '10px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#A32D2D' }}>{error}</div>
            )}

            <button type="submit" disabled={loading} style={{ width: '100%', height: 48, background: loading ? '#D3D1C7' : '#BA7517', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#FFFFFF', marginTop: 4 }}>
              {loading ? 'Submitting…' : 'Start free trial →'}
            </button>
          </form>
        </div>

        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#9B9088', marginTop: 24 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#BA7517', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </>
  )
}
