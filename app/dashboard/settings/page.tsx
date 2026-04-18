'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import PreferredInsurersSection from './components/PreferredInsurersSection';

export default function SettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [counts, setCounts] = useState({ clients: 0, policies: 0, conversations: 0 });

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [maya, setMaya] = useState({
    autoReply: true,
    coverageGaps: true,
    renewalReminders: true,
    birthdayGreetings: true,
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (p) {
        setProfile(p);
        setName(p.name || '');
        setPhone(p.phone || '');
        setCompany(p.company || '');
      }

      const { count: cc } = await supabase.from('clients').select('*', { count: 'exact', head: true });
      const { count: pc } = await supabase.from('policies').select('*', { count: 'exact', head: true });
      const { count: vc } = await supabase.from('conversations').select('*', { count: 'exact', head: true });
      setCounts({ clients: cc || 0, policies: pc || 0, conversations: vc || 0 });

      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase.from('profiles').update({ name, phone, company }).eq('id', profile.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    if (!newPassword) { setPasswordError('Please enter a new password'); return; }
    if (newPassword.length < 8) { setPasswordError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmNewPassword) { setPasswordError('Passwords do not match'); return; }
    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPasswordError(error.message); setPasswordSaving(false); return; }
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordSaving(false);
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  const trialDays = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  if (loading) {
    return (
      <div style={{ padding: '40px', color: '#C9B99A', fontFamily: 'DM Sans, sans-serif' }}>
        Loading…
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: '#1C0F0A',
    border: '1px solid #2E1A0E',
    borderRadius: '8px',
    color: '#F5ECD7',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '11px',
    color: '#C9B99A',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '6px',
  };

  const sectionStyle: React.CSSProperties = {
    background: '#1C0F0A',
    border: '1px solid #2E1A0E',
    borderRadius: '12px',
    padding: '28px',
    marginBottom: '24px',
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', fontWeight: 400, color: '#F5ECD7', margin: '0 0 8px' }}>
        Settings
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#C9B99A', margin: '0 0 32px' }}>
        Manage your account, Maya preferences, and billing
      </p>

      {/* ── PROFILE ── */}
      <div style={sectionStyle}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 400, color: '#F5ECD7', margin: '0 0 24px' }}>
          Profile
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} value={profile?.email || ''} disabled />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={labelStyle}>WhatsApp Number</label>
            <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+65 9123 4567" />
          </div>
          <div>
            <label style={labelStyle}>Company</label>
            <input style={inputStyle} value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company" />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSave} disabled={saving} style={{
            background: saved ? '#5AB87A' : '#C8813A',
            color: '#120A06',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 24px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </div>

      {/* ── SECURITY / CHANGE PASSWORD ── */}
      <div style={sectionStyle}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 400, color: '#F5ECD7', margin: '0 0 6px' }}>
          Security
        </h2>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#C9B99A', margin: '0 0 24px' }}>
          Update your password
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              style={inputStyle}
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); setPasswordError(null); }}
              placeholder="Minimum 8 characters"
            />
          </div>
          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input
              type="password"
              style={inputStyle}
              value={confirmNewPassword}
              onChange={e => { setConfirmNewPassword(e.target.value); setPasswordError(null); }}
              placeholder="Repeat new password"
            />
          </div>
        </div>
        {passwordError && (
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#E53E3E', margin: '0 0 16px', padding: '8px 12px', background: 'rgba(229,62,62,0.1)', borderRadius: '6px', border: '1px solid rgba(229,62,62,0.2)' }}>
            {passwordError}
          </p>
        )}
        {passwordSaved && (
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#5AB87A', margin: '0 0 16px' }}>
            ✓ Password updated successfully
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleChangePassword} disabled={passwordSaving} style={{
            background: '#C8813A',
            color: '#120A06',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 24px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            cursor: passwordSaving ? 'not-allowed' : 'pointer',
            opacity: passwordSaving ? 0.7 : 1,
          }}>
            {passwordSaving ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </div>

      {/* ── MAYA PREFERENCES ── */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 400, color: '#F5ECD7', margin: '0 0 4px' }}>
              Maya
            </h2>
          </div>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#C9B99A', background: '#2E1A0E', padding: '4px 10px', borderRadius: '100px' }}>
            Coming soon
          </span>
        </div>
        {[
          { key: 'autoReply', label: 'Auto-reply to new messages', desc: 'Maya will respond to client WhatsApp messages automatically' },
          { key: 'coverageGaps', label: 'Flag missing coverage', desc: 'Maya will identify and flag coverage gaps during conversations' },
          { key: 'renewalReminders', label: 'Send renewal reminders', desc: 'Maya will remind clients about upcoming renewals via WhatsApp' },
          { key: 'birthdayGreetings', label: 'Birthday greetings', desc: 'Maya will send birthday messages to clients on their special day' },
        ].map(item => (
          <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #2E1A0E' }}>
            <div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#F5ECD7', fontWeight: 500, marginBottom: '2px' }}>{item.label}</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#C9B99A' }}>{item.desc}</div>
            </div>
            <div
              onClick={() => setMaya(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof maya] }))}
              style={{
                width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', flexShrink: 0,
                background: maya[item.key as keyof typeof maya] ? '#C8813A' : '#2E1A0E',
                position: 'relative', transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute', top: '2px', width: '20px', height: '20px', borderRadius: '50%',
                background: '#F5ECD7', transition: 'left 0.2s',
                left: maya[item.key as keyof typeof maya] ? '22px' : '2px',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── PREFERRED INSURERS ── */}
      <PreferredInsurersSection />

      {/* ── PLAN & BILLING ── */}
      <div style={sectionStyle}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 400, color: '#F5ECD7', margin: '0 0 16px' }}>
          Plan & billing
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#F5ECD7', fontWeight: 500, marginBottom: '4px', textTransform: 'capitalize' }}>
              {profile?.plan || 'Trial'} plan
            </div>
            {trialDays > 0 && (
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#C9B99A' }}>
                {trialDays} days remaining in trial
              </div>
            )}
          </div>
          <Link href="/pricing" style={{
            background: '#C8813A', color: '#120A06', textDecoration: 'none',
            padding: '8px 20px', borderRadius: '8px', fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px', fontWeight: 500,
          }}>
            Upgrade
          </Link>
        </div>
      </div>

      {/* ── YOUR DATA ── */}
      <div style={sectionStyle}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 400, color: '#F5ECD7', margin: '0 0 16px' }}>
          Your data
        </h2>
        <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
          {[
            { label: 'Clients', value: counts.clients },
            { label: 'Policies', value: counts.policies },
            { label: 'Conversations', value: counts.conversations },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 300, color: '#F5ECD7' }}>{stat.value}</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#C9B99A' }}>{stat.label}</div>
            </div>
          ))}
        </div>
        <Link href="/dashboard/import" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#C8813A', textDecoration: 'none' }}>
          Import data →
        </Link>
      </div>
    </div>
  );
}
