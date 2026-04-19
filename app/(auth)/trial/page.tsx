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
    width: '100%', height: 48, padding: '0 16px',
    border: '0.5px solid #E8E2DA', borderRadius: 8,
    fontFamily: 'DM Sans, sans-serif', fontSize: 14,
    color: '#1A1410', background: '#FFFFFF', outline: 'none',
    transition: 'border-color 0.15s',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 500,
    color: '#1A1410', textTransform: 'uppercase', letterSpacing: '0.06em',
    display: 'block', marginBottom: 8,
  }

  if (submitted) return (
    <>
      <style>{`html,body,#__next{background:#F7F4F0!important;margin:0;padding:0;}`}</style>
      <div style={{ minHeight: '100vh', background: '#F7F4F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ textAlign: 'center', maxWidth: 460 }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, color: '#1A1410', marginBottom: 8 }}>
            espresso<span style={{ color: '#BA7517' }}>.</span>
          </div>
          <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 14, padding: '48px 40px', marginTop: 32 }}>
            <div style={{ width: 56, height: 56, background: '#FEF3E2', border: '0.5px solid #FAC775', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 26 }}>☕</div>
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 22, fontWeight: 500, color: '#1A1410', margin: '0 0 10px' }}>You're on the list</h2>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#5F5A57', margin: '0 0 28px', lineHeight: 1.7 }}>
              We'll be in touch within 1 business day to set up your account. Questions? Email us at{' '}
              <a href="mailto:hello@espresso.insure" style={{ color: '#BA7517' }}>hello@espresso.insure</a>
            </p>
            <Link href="/login" style={{ display: 'inline-block', background: '#BA7517', color: '#FFFFFF', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, padding: '12px 28px', borderRadius: 8, textDecoration: 'none' }}>
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </>
  )

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
              Start free.<br />
              <em style={{ color: '#BA7517' }}>See results tonight.</em>
            </div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#9B9088', lineHeight: 1.7, maxWidth: 360 }}>
              14-day free trial. No credit card. Set up in 30 minutes — Maya starts working in your first client group tonight.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { title: '24/7 client intake', body: 'Every enquiry handled while you sleep. Client brief on your dashboard by morning.' },
              { title: 'Renewal management', body: 'Every policy tracked. Automated follow-ups at 90, 60, 30, 14, and 7 days.' },
              { title: 'Claims + documents', body: 'Maya guides clients through claims in real time and collects all documents automatically.' },
            ].map(f => (
              <div key={f.title} style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#BA7517', flexShrink: 0, marginTop: 6 }} />
                <div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#F7F4F0', marginBottom: 2 }}>{f.title}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#9B9088', lineHeight: 1.6 }}>{f.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', background: '#F7F4F0' }}>
          <div style={{ width: '100%', maxWidth: 440 }}>
            <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 28, fontWeight: 500, color: '#1A1410', margin: '0 0 6px' }}>Start your free trial</h1>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#5F5A57', margin: '0 0 36px' }}>14 days free · No credit card required · Full access</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Full name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Lim Wai Mun" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Work email *</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@company.com" required style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Company / Agency</label>
                  <input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Wayne & Co" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Mobile (WhatsApp)</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+65 8XXX XXXX" style={inputStyle} />
                </div>
              </div>

              {error && (
                <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: 8, padding: '12px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#A32D2D' }}>{error}</div>
              )}

              <button type="submit" disabled={loading} style={{ width: '100%', height: 50, background: loading ? '#D3D1C7' : '#BA7517', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF', marginTop: 4 }}>
                {loading ? 'Submitting…' : 'Start free trial →'}
              </button>
            </form>

            <div style={{ borderTop: '0.5px solid #E8E2DA', marginTop: 28, paddingTop: 22, textAlign: 'center' }}>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#5F5A57' }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: '#BA7517', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
              </span>
            </div>

            <p style={{ textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#B4B2A9', marginTop: 20 }}>
              © 2026 Espresso · <a href="https://espresso.insure" style={{ color: '#B4B2A9' }}>espresso.insure</a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
