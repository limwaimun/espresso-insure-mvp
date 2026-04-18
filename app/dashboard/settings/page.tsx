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

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      setEmail(user.email || '')
      const { data } = await supabase.from('profiles').select('name, phone, company').eq('id', user.id).single()
      if (data) { setName(data.name || ''); setPhone(data.phone || ''); setCompany(data.company || '') }
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
    color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: 6, display: 'block',
  }
  const card: React.CSSProperties = {
    background: '#FFFFFF', border: '0.5px solid #E8E2DA',
    borderRadius: 12, padding: 24, marginBottom: 16,
  }

  return (
    <div style={{ padding: '24px 28px', background: '#F7F4F0', minHeight: '100vh', maxWidth: 720 }}>
      <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 500, color: '#1A1410', margin: '0 0 4px' }}>Settings</h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#9B9088', margin: '0 0 24px' }}>Manage your account and Maya preferences</p>

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
            <input value={email} disabled style={{ ...inputStyle, background: '#F7F4F0', color: '#9B9088' }} />
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
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#9B9088', margin: '0 0 20px' }}>Update your password</p>
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
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#9B9088', margin: '0 0 12px' }}>Maya and Compass will prioritise these insurers in recommendations</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['AIA', 'Great Eastern', 'Prudential', 'NTUC Income', 'Manulife', 'Singlife', 'FWD', 'Tokio Marine', 'HSBC Life', 'AXA'].map(ins => (
            <span key={ins} style={{ background: '#F7F4F0', border: '0.5px solid #E8E2DA', borderRadius: 100, padding: '5px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6B6460', cursor: 'pointer' }}>
              {ins}
            </span>
          ))}
        </div>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#B4B2A9', marginTop: 12 }}>Insurer preferences coming in next update</p>
      </div>
    </div>
  )
}
