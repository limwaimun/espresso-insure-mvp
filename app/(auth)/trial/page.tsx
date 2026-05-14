'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// SEA country codes — Singapore first as default
const COUNTRY_CODES = [
  { code: '+65',  label: 'SG +65',  name: 'Singapore' },
  { code: '+60',  label: 'MY +60',  name: 'Malaysia' },
  { code: '+62',  label: 'ID +62',  name: 'Indonesia' },
  { code: '+66',  label: 'TH +66',  name: 'Thailand' },
  { code: '+84',  label: 'VN +84',  name: 'Vietnam' },
  { code: '+63',  label: 'PH +63',  name: 'Philippines' },
  { code: '+673', label: 'BN +673', name: 'Brunei' },
  { code: '+855', label: 'KH +855', name: 'Cambodia' },
  { code: '+856', label: 'LA +856', name: 'Laos' },
  { code: '+95',  label: 'MM +95',  name: 'Myanmar' },
] as const

// Password rules (kept in sync with server-side)
const PW_MIN_LEN = 8
const pwChecks = (pw: string) => ({
  length: pw.length >= PW_MIN_LEN,
  number: /\d/.test(pw),
  upper: /[A-Z]/.test(pw),
})
const pwValid = (pw: string) => {
  const c = pwChecks(pw)
  return c.length && c.number && c.upper
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://espresso.insure'),
  title: 'Start your free trial — Espresso',
  description: 'Try Espresso free for 14 days. Maya handles client intake, renewals, and claims for Singapore FAs — 24/7 inside WhatsApp. No credit card required.',
  openGraph: {
    type: 'website',
    url: 'https://espresso.insure/trial',
    siteName: 'Espresso',
    title: 'Start your free 14-day trial — Espresso',
    description: 'Try Espresso free for 14 days. No credit card required. Singapore FAs get their AI back-office inside WhatsApp in under 30 minutes.',
    locale: 'en_SG',
    images: [
      {
        url: 'https://espresso.insure/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Espresso — Start your free trial',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Start your free 14-day trial — Espresso',
    description: 'Try Espresso free for 14 days. No credit card required. Singapore FAs get their AI back-office inside WhatsApp in under 30 minutes.',
    images: ['https://espresso.insure/og-image.png'],
  },
};

export default function TrialPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', company: '',
    countryCode: '+65', phoneLocal: '',
    password: '', confirm: '',
  })
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required')
      return
    }

    const phoneDigits = form.phoneLocal.replace(/\D/g, '')
    if (!phoneDigits) {
      setError('Mobile number is required — Maya needs it to reach your clients on WhatsApp')
      return
    }
    if (phoneDigits.length < 7) {
      setError('Mobile number looks too short. Please check and try again.')
      return
    }

    if (!pwValid(form.password)) {
      setError('Password must be at least 8 characters, with a number and an uppercase letter')
      return
    }
    if (form.password !== form.confirm) {
      setError('Passwords don\'t match')
      return
    }

    const phone = `${form.countryCode}${phoneDigits}`

    setLoading(true)
    try {
      // 1. Create the account server-side
      const res = await fetch('/api/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          company: form.company.trim(),
          phone,
          password: form.password,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Something went wrong. Please email hello@espresso.insure')
        setLoading(false)
        return
      }

      // 2. Sign them in from the client so the session cookie is set in this browser
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })

      if (signInError) {
        // Account was created but auto-signin failed — fall back to the login page
        router.push('/login')
        return
      }

      // 3. Straight into the product
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Please email hello@espresso.insure and we\'ll get you set up.')
      setLoading(false)
    }
  }

  const input: React.CSSProperties = { width: '100%', height: 46, padding: '0 14px', border: '0.5px solid #E8E2DA', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1A1410', background: '#FFFFFF', outline: 'none', transition: 'border-color 0.15s' }
  const label: React.CSSProperties = { fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 500, color: '#3D3532', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 7 }

  const checks = pwChecks(form.password)

  const checklistItem = (ok: boolean, text: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: ok ? '#0F6E56' : '#9B9088' }}>
      <span style={{ width: 12, height: 12, borderRadius: '50%', background: ok ? '#0F6E56' : 'transparent', border: ok ? 'none' : '1px solid #C9C3BA', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#FFF', flexShrink: 0 }}>{ok ? '✓' : ''}</span>
      {text}
    </div>
  )

  return (
    <>
      <style>{`
        html, body, #__next { background: #F7F4F0 !important; margin: 0; padding: 0; min-height: 100%; }
        * { box-sizing: border-box; }
        input:focus, select:focus { outline: none; border-color: #BA7517 !important; }
        @media (max-width: 480px) {
          .trial-card { padding: 28px 22px !important; border-radius: 12px !important; }
          .trial-logo { font-size: 26px !important; margin-bottom: 32px !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F4F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>

        {/* Logo */}
        <a href="/" className="trial-logo" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 400, color: '#1A1410', textDecoration: 'none', marginBottom: 48, display: 'block', textAlign: 'center' }}>
          espresso<span style={{ color: '#BA7517' }}>.</span>
        </a>

        {/* Form card */}
        <div className="trial-card" style={{ width: '100%', maxWidth: 440, background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 16, padding: '40px 36px' }}>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 22, fontWeight: 500, color: '#1A1410', margin: '0 0 4px' }}>Start your free trial</h1>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#9B9088', margin: '0 0 32px' }}>14 days free · No credit card · Full access</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={label}>Full name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Sarah Tan" required style={input} />
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
              <label style={label}>Mobile (WhatsApp) *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={form.countryCode}
                  onChange={e => setForm(p => ({ ...p, countryCode: e.target.value }))}
                  style={{ ...input, width: 110, flexShrink: 0, padding: '0 10px', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\' viewBox=\'0 0 10 6\' fill=\'none\'><path d=\'M1 1L5 5L9 1\' stroke=\'%239B9088\' stroke-width=\'1.2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/></svg>")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 26 }}
                  aria-label="Country code"
                >
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.phoneLocal}
                  onChange={e => setForm(p => ({ ...p, phoneLocal: e.target.value }))}
                  placeholder="8123 4567"
                  required
                  style={{ ...input, flex: 1 }}
                />
              </div>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088', margin: '6px 0 0' }}>Maya needs this to reach your clients on WhatsApp.</p>
            </div>

            <div>
              <label style={label}>Password *</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                style={input}
              />
              {form.password.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 8 }}>
                  {checklistItem(checks.length, 'At least 8 characters')}
                  {checklistItem(checks.number, 'Contains a number')}
                  {checklistItem(checks.upper, 'Contains an uppercase letter')}
                </div>
              )}
            </div>

            <div>
              <label style={label}>Confirm password *</label>
              <input
                type="password"
                value={form.confirm}
                onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                style={{
                  ...input,
                  borderColor: form.confirm.length > 0 && form.confirm !== form.password ? '#F7C1C1' : '#E8E2DA',
                }}
              />
              {form.confirm.length > 0 && form.confirm !== form.password && (
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#A32D2D', margin: '6px 0 0' }}>Passwords don't match</p>
              )}
            </div>

            {error && (
              <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: 7, padding: '10px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#A32D2D' }}>{error}</div>
            )}

            <button type="submit" disabled={loading} style={{ width: '100%', height: 48, background: loading ? '#D3D1C7' : '#BA7517', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#FFFFFF', marginTop: 4 }}>
              {loading ? 'Creating your account…' : 'Start free trial →'}
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
