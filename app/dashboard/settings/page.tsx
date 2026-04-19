'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const supabase = createClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [userId, setUserId] = useState('')
  const [plan, setPlan] = useState('trial')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      setEmail(user.email || '')
      const { data } = await supabase.from('profiles').select('name, phone, company, plan').eq('id', user.id).single()
      if (data) { setName(data.name || ''); setPhone(data.phone || ''); setCompany(data.company || ''); setPlan(data.plan || 'trial') }
    }
    load()
  }, [])

  async function saveProfile() {
    setSaving(true); setProfileMsg('')
    await supabase.from('profiles').update({ name, phone, company }).eq('id', userId)
    setProfileMsg('Profile saved ✓')
    setSaving(false)
    setTimeout(() => setProfileMsg(''), 3000)
  }

  async function updatePassword() {
    if (newPassword !== confirmPassword) { setPwMsg('Passwords do not match'); return }
    if (newPassword.length < 8) { setPwMsg('Minimum 8 characters'); return }
    setSavingPw(true); setPwMsg('')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwMsg(error ? error.message : 'Password updated ✓')
    setSavingPw(false)
    if (!error) { setNewPassword(''); setConfirmPassword(''); setTimeout(() => setPwMsg(''), 3000) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    border: '0.5px solid #E8E2DA', borderRadius: 7,
    fontFamily: 'DM Sans, sans-serif', fontSize: 13,
    color: '#1A1410', background: '#FFFFFF', outline: 'none',
    boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontFamily: 'DM Sans, sans-serif', fontSize: 11,
    color: '#5F5A57', textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: 6, display: 'block',
  }
  const card: React.CSSProperties = {
    background: '#FFFFFF', border: '0.5px solid #E8E2DA',
    borderRadius: 12, padding: 24, marginBottom: 16,
  }

  return (
    <div style={{ padding: '24px 40px', background: '#F7F4F0', minHeight: '100vh' }}>
      <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 500, color: '#1A1410', margin: '0 0 4px' }}>Settings</h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57', margin: '0 0 24px' }}>Manage your account and Maya preferences</p>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* Profile */}
      <div style={card}>
        <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 500, color: '#1A1410', margin: '0 0 20px' }}>Profile</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="Your full name" />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input value={email} disabled style={{ ...inputStyle, background: '#F7F4F0', color: '#5F5A57' }} />
          </div>
          <div>
            <label style={labelStyle}>WhatsApp number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} placeholder="+65 9123 4567" />
          </div>
          <div>
            <label style={labelStyle}>Company</label>
            <input value={company} onChange={e => setCompany(e.target.value)} style={inputStyle} placeholder="Your company name" />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={saveProfile} disabled={saving} style={{ background: '#BA7517', border: 'none', borderRadius: 7, padding: '8px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#FFFFFF', fontWeight: 500, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
          {profileMsg && <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#0F6E56' }}>{profileMsg}</span>}
        </div>
      </div>

      {/* Security */}
      <div style={card}>
        <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 500, color: '#1A1410', margin: '0 0 4px' }}>Security</h2>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57', margin: '0 0 20px' }}>Update your password</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>New password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} placeholder="Minimum 8 characters" />
          </div>
          <div>
            <label style={labelStyle}>Confirm new password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} placeholder="Repeat new password" />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={updatePassword} disabled={savingPw} style={{ background: '#BA7517', border: 'none', borderRadius: 7, padding: '8px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#FFFFFF', fontWeight: 500, opacity: savingPw ? 0.7 : 1 }}>
            {savingPw ? 'Updating…' : 'Update password'}
          </button>
          {pwMsg && <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: pwMsg.includes('✓') ? '#0F6E56' : '#A32D2D' }}>{pwMsg}</span>}
        </div>
      </div>

      {/* Preferred insurers */}
      <div style={card}>
        <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 500, color: '#1A1410', margin: '0 0 4px' }}>Maya preferences</h2>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57', margin: '0 0 12px' }}>Maya and Compass will prioritise these insurers in recommendations</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['AIA', 'Great Eastern', 'Prudential', 'NTUC Income', 'Manulife', 'Singlife', 'FWD', 'Tokio Marine', 'HSBC Life', 'AXA'].map(ins => (
            <span key={ins} style={{ background: '#F7F4F0', border: '0.5px solid #E8E2DA', borderRadius: 100, padding: '5px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#3D3532', cursor: 'pointer' }}>
              {ins}
            </span>
          ))}
        </div>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088', marginTop: 12 }}>Tap to set preferred insurers — coming in next update</p>
      </div>

      {/* Plan & upgrade */}
      <div style={card}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 500, color: '#1A1410', margin: '0 0 4px' }}>Your plan</h2>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57', margin: 0 }}>
            Currently on <strong style={{ color: '#BA7517' }}>{plan === 'solo' ? 'Solo' : plan === 'pro' ? 'Pro' : plan === 'team' ? 'Team' : 'Trial'}</strong>
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { id: 'solo', name: 'Solo', price: 'SGD 79', features: ['1 FA', '50 clients', 'Maya AI assistant', 'All agents + tools', 'Claims form library'] },
            { id: 'pro', name: 'Pro', price: 'SGD 149', highlight: true, features: ['1 FA', 'Unlimited clients', 'Priority Maya responses', 'WhatsApp integration', 'Full analytics dashboard'] },
            { id: 'team', name: 'Team', price: 'SGD 349', comingSoon: true, features: ['Up to 5 FAs', 'Shared client pool', 'Agency analytics', 'Admin dashboard', 'Dedicated support'] },
          ].map(p => {
            const isCurrent = plan === p.id || (plan === 'trial' && p.id === 'solo')
            return (
              <div key={p.id} style={{ background: p.highlight ? '#FEF3E2' : '#FAFAF8', border: `0.5px solid ${p.highlight ? '#FAC775' : '#E8E2DA'}`, borderRadius: 10, padding: '16px 18px', position: 'relative', opacity: (p as any).comingSoon ? 0.7 : 1 }}>
                {p.highlight && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#BA7517', color: '#FFFFFF', fontSize: 10, fontWeight: 500, padding: '2px 10px', borderRadius: 100, whiteSpace: 'nowrap' }}>Most popular</div>}
                {(p as any).comingSoon && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#5F5A57', color: '#FFFFFF', fontSize: 10, fontWeight: 500, padding: '2px 10px', borderRadius: 100, whiteSpace: 'nowrap' }}>Coming soon</div>}
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, color: '#1A1410', marginBottom: 2 }}>{p.name}</div>
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 22, fontWeight: 500, color: '#1A1410' }}>{p.price}</span>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#5F5A57' }}>/month</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#3D3532' }}>
                      <span style={{ color: '#0F6E56' }}>✓</span> {f}
                    </div>
                  ))}
                </div>
                {(p as any).comingSoon ? (
                  <button onClick={() => window.open('mailto:hello@espresso.insure?subject=Team plan waitlist', '_blank')} style={{ width: '100%', background: 'transparent', border: '0.5px solid #E8E2DA', borderRadius: 7, padding: '7px 0', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#5F5A57' }}>
                    Join waitlist
                  </button>
                ) : isCurrent ? (
                  <div style={{ background: '#E8E2DA', borderRadius: 7, padding: '7px 0', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#5F5A57' }}>Current plan</div>
                ) : (
                  <button onClick={() => window.open(`mailto:hello@espresso.insure?subject=Upgrade to ${p.name}`, '_blank')} style={{ width: '100%', background: p.highlight ? '#BA7517' : 'transparent', border: `0.5px solid ${p.highlight ? '#BA7517' : '#E8E2DA'}`, borderRadius: 7, padding: '7px 0', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: p.highlight ? '#FFFFFF' : '#3D3532', fontWeight: p.highlight ? 500 : 400 }}>
                    Upgrade to {p.name}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#9B9088', marginTop: 14, textAlign: 'center' }}>
        All plans include a 14-day free trial · Cancel anytime · hello@espresso.insure
      </p>
    </div>
  </div>
  )
}
