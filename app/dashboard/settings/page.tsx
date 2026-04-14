'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

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
        setCompany('');
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
    await supabase.from('profiles').update({ name, phone }).eq('id', profile.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const trialDays = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const hasSubscription = !!profile?.stripe_subscription_id;
  const trialActive = trialDays > 0 && !hasSubscription;
  const trialExpired = trialDays <= 0 && !hasSubscription;

  if (loading) {
    return <div style={{ color: '#C9B99A', padding: '40px' }}>Loading settings...</div>;
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#2E1A0E',
    border: '1px solid #3D2215',
    padding: '12px',
    borderRadius: '6px',
    color: '#F5ECD7',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '14px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    color: '#C9B99A',
    marginBottom: '6px',
    display: 'block',
  };

  const sectionStyle: React.CSSProperties = {
    background: '#3D2215',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  };

  const headingStyle: React.CSSProperties = {
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: '20px',
    color: '#F5ECD7',
    marginBottom: '20px',
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', color: '#F5ECD7', marginBottom: '8px' }}>Settings</h1>
      <p style={{ color: '#C9B99A', fontSize: '14px', marginBottom: '32px' }}>Manage your account, Maya preferences, and billing</p>

      {/* PROFILE */}
      <div style={sectionStyle}>
        <h2 style={headingStyle}>Profile</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} value={profile?.email || ''} disabled />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>WhatsApp number</label>
            <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Company</label>
            <input style={inputStyle} value={company} onChange={e => setCompany(e.target.value)} placeholder="Your agency or company" />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
          {saved && <span style={{ color: '#5AB87A', fontSize: '14px' }}>✓ Saved</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: '#C8813A',
              color: '#120A06',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </div>

      {/* MAYA */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ ...headingStyle, marginBottom: 0 }}>Maya</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D4A030' }} />
            <span style={{ fontSize: '13px', color: '#D4A030' }}>Setting up</span>
          </div>
        </div>

        {[
          { key: 'autoReply', label: 'Auto-reply to new messages', desc: 'Maya will respond to client WhatsApp messages automatically' },
          { key: 'coverageGaps', label: 'Flag missing coverage', desc: 'Maya will identify and flag coverage gaps during conversations' },
          { key: 'renewalReminders', label: 'Send renewal reminders', desc: 'Maya will remind clients about upcoming renewals via WhatsApp' },
          { key: 'birthdayGreetings', label: 'Birthday messages', desc: 'Maya will send birthday greetings to clients automatically' },
        ].map(item => (
          <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #2E1A0E' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#F5ECD7', fontSize: '14px', fontWeight: 'bold' }}>{item.label}</span>
                <span style={{ background: '#2E1A0E', color: '#C9B99A', fontSize: '10px', padding: '2px 8px', borderRadius: '4px' }}>Coming soon</span>
              </div>
              <div style={{ color: '#C9B99A', fontSize: '13px', marginTop: '4px' }}>{item.desc}</div>
            </div>
            <div
              onClick={() => setMaya(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
              style={{
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                background: maya[item.key as keyof typeof maya] ? '#C8813A' : '#2E1A0E',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
                marginLeft: '16px',
              }}
            >
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#F5ECD7',
                position: 'absolute',
                top: '3px',
                left: maya[item.key as keyof typeof maya] ? '23px' : '3px',
                transition: 'left 0.2s',
              }} />
            </div>
          </div>
        ))}

        <div style={{ marginTop: '20px', padding: '14px 0', borderBottom: '1px solid #2E1A0E' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ color: '#F5ECD7', fontSize: '14px', fontWeight: 'bold' }}>Active hours</span>
            <span style={{ background: '#2E1A0E', color: '#C9B99A', fontSize: '10px', padding: '2px 8px', borderRadius: '4px' }}>Coming soon</span>
          </div>
          <div style={{ color: '#C9B99A', fontSize: '13px', marginBottom: '8px' }}>Maya only replies during these hours</div>
          <div style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed', display: 'inline-block', width: 'auto' }}>9:00 AM — 6:00 PM</div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ color: '#F5ECD7', fontSize: '14px', fontWeight: 'bold' }}>Welcome message</span>
            <span style={{ background: '#2E1A0E', color: '#C9B99A', fontSize: '10px', padding: '2px 8px', borderRadius: '4px' }}>Coming soon</span>
          </div>
          <div style={{ color: '#C9B99A', fontSize: '13px', marginBottom: '8px' }}>Maya sends this when a new client messages for the first time</div>
          <textarea
            style={{ ...inputStyle, height: '80px', resize: 'vertical', opacity: 0.6 }}
            defaultValue="Hi! I'm Maya, your insurance advisor's assistant. How can I help you today?"
            disabled
          />
        </div>
      </div>

      {/* PLAN & BILLING */}
      <div style={sectionStyle}>
        <h2 style={headingStyle}>Plan & billing</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <span style={{ background: '#C8813A', color: '#120A06', padding: '4px 16px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>
            {(profile?.plan || 'solo').charAt(0).toUpperCase() + (profile?.plan || 'solo').slice(1)}
          </span>
          <span style={{ color: '#F5ECD7', fontSize: '16px', fontFamily: 'DM Mono, monospace' }}>$29/month</span>
        </div>
        <div style={{ marginBottom: '16px' }}>
          {trialActive && (
            <span style={{ color: '#D4A030', fontSize: '14px' }}>Trial · {trialDays} days remaining</span>
          )}
          {hasSubscription && (
            <span style={{ color: '#5AB87A', fontSize: '14px' }}>Active subscription</span>
          )}
          {trialExpired && (
            <span style={{ color: '#D06060', fontSize: '14px' }}>Trial expired — upgrade to continue</span>
          )}
        </div>
        <button
          style={{
            background: 'transparent',
            color: '#C8813A',
            border: '1px solid #C8813A',
            padding: '10px 24px',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Upgrade plan
        </button>
      </div>

      {/* YOUR DATA */}
      <div style={sectionStyle}>
        <h2 style={headingStyle}>Your data</h2>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <span style={{ background: '#2E1A0E', padding: '6px 14px', borderRadius: '6px', color: '#F5ECD7', fontSize: '14px' }}>
            {counts.clients} clients
          </span>
          <span style={{ background: '#2E1A0E', padding: '6px 14px', borderRadius: '6px', color: '#F5ECD7', fontSize: '14px' }}>
            {counts.policies} policies
          </span>
          <span style={{ background: '#2E1A0E', padding: '6px 14px', borderRadius: '6px', color: '#F5ECD7', fontSize: '14px' }}>
            {counts.conversations} conversations
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/dashboard/import">
            <button style={{
              background: '#C8813A',
              color: '#120A06',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
            }}>
              Import clients
            </button>
          </Link>
          <button
            disabled
            style={{
              background: 'transparent',
              color: '#C9B99A',
              border: '1px solid #3D2215',
              padding: '10px 24px',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'not-allowed',
              opacity: 0.5,
            }}
          >
            Export data · Coming soon
          </button>
        </div>
      </div>
    </div>
  );
}