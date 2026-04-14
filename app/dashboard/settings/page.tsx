'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [mayaSettings, setMayaSettings] = useState({
    autoReply: false,
    coverageGapDetection: false,
    renewalReminders: false,
    birthdayGreetings: false,
  });
  
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          name: profile.name,
          phone: profile.phone,
          company: profile.company 
        })
        .eq('id', profile.id);
      if (error) throw error;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleMayaToggle = (setting: string) => {
    setMayaSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#C9B99A' }}>
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      <div>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '28px',
          fontWeight: 400,
          color: '#F5ECD7',
          margin: '0 0 8px 0',
        }}>
          Settings
        </h1>
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          color: '#C9B99A',
        }}>
          Manage your profile, Maya preferences, and subscription
        </p>
      </div>

      {/* PROFILE */}
      <div style={{ background: '#3D2215', borderRadius: '8px', padding: '24px' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#F5ECD7', margin: '0 0 20px 0' }}>
          Profile
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 'bold', color: '#F5ECD7' }}>
              Name
            </label>
            <input type="text" value={profile?.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} style={{ background: '#2E1A0E', border: '1px solid #3D2215', borderRadius: '6px', padding: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#F5ECD7', outline: 'none', width: '100%' }} />
          </div>
          <div>
            <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 'bold', color: '#F5ECD7' }}>
              Email
            </label>
            <input type="email" value={profile?.email || ''} disabled style={{ background: '#2E1A0E', border: '1px solid #3D2215', borderRadius: '6px', padding: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#666666', outline: 'none', width: '100%', cursor: 'not-allowed' }} />
          </div>
          <div>
            <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 'bold', color: '#F5ECD7' }}>
              WhatsApp
            </label>
            <input type="text" value={profile?.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} style={{ background: '#2E1A0E', border: '1px solid #3D2215', borderRadius: '6px', padding: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#F5ECD7', outline: 'none', width: '100%' }} />
          </div>
          <div>
            <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 'bold', color: '#F5ECD7' }}>
              Company
            </label>
            <input type="text" value={profile?.company || ''} onChange={(e) => setProfile({ ...profile, company: e.target.value })} style={{ background: '#2E1A0E', border: '1px solid #3D2215', borderRadius: '6px', padding: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#F5ECD7', outline: 'none', width: '100%' }} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
          {saveSuccess && <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#5AB87A' }}>✓ Saved</span>}
          <button onClick={handleSaveProfile} disabled={saving} style={{ background: '#C8813A', color: '#120A06', border: 'none', borderRadius: '6px', padding: '10px 20px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </div>

      {/* MAYA */}
      <div style={{ background: '#3D2215', borderRadius: '8px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#F5ECD7', margin: 0 }}>
            Maya
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#D4A030' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D4A030' }} />
            Setting up
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[
            { key: 'autoReply', label: 'Auto-reply to new messages', desc: 'Maya will respond to client WhatsApp messages automatically' },
            { key: 'coverageGapDetection', label: 'Flag missing coverage', desc: 'Maya will identify and flag coverage gaps during conversations' },
            { key: 'renewalReminders', label: 'Send renewal reminders', desc: 'Maya will remind clients about upcoming renewals via WhatsApp' },
            { key: 'birthdayGreetings', label: 'Birthday messages', desc: 'Maya will send birthday greetings to clients automatically' }
          ].map((item) => (
            <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 'bold', color: '#F5ECD7' }}>
                    {item.label}
                  </span>
                  <span style={{ background: '#2E1A0E', color: '#C9B99A', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', fontFamily: 'DM Sans, sans-serif' }}>
                    Coming soon
                  </span>
                </div>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#C9B99A', margin: 0, lineHeight: 1.5 }}>
                  {item.desc}
                </p>
              </div>
              <div onClick={() => handleMayaToggle(item.key)} style={{ width: '44px', height: '24px', borderRadius: '12px', background: mayaSettings[item.key as keyof typeof mayaSettings] ? '#C8813A' : '#2E1A0E', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: '2px', left: mayaSettings[item.key as keyof typeof mayaSettings] ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#F5ECD7', transition: 'all 0.2s' }} />
              </div>
            </div>
          ))}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 'bold', color: '#F5ECD7' }}>
                Active hours
              </span>
              <span style={{ background: '#2E1A0E', color: '#C9B99A', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', fontFamily: 'DM Sans, sans-serif' }}>
                Coming soon
              </span>
            </div>
            <div style={{ background: '#2E1A0E', border: '1px solid #3D2215', borderRadius: '6px', padding: '10px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#666666', cursor: 'not-allowed' }}>
              9:00 AM — 6:00 PM
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 'bold', color: '#F5ECD7' }}>
                Welcome message
              </span>
              <span style={{ background: '#2E1A0E', color: '#C9B99A', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', fontFamily: 'DM Sans, sans-serif' }}>
                Coming soon
              </span>
            </div>
            <textarea rows={3} value="Hi! I'm Maya, your insurance advisor's assistant. How can I help you today?" style={{ background: '#2E1A0E', border: '1px solid #3D2215', borderRadius: '6px', padding: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#F5ECD7', outline: 'none', width: '100%', resize: 'vertical' }} />
          </div>
        </div>
      </div>

      {/* PLAN & BILLING */}
      <div style={{ background: '#3D2215', borderRadius: '8px', padding: '24px' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#F5ECD7', margin: '0 0 20px 0' }}>
          Plan & billing
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '100px', background: 'rgba(200, 129, 58, 0.2)', color: '#C8813A', border: '1px solid #C8813A' }}>
            Solo
          </span>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '24px', fontWeight: 'bold', color: '#F5ECD7' }}>
            $29/month
          </span>
        </div>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#D4A030', marginBottom: '16px' }}>
          Trial · 14 days remaining
        </div>
        <button style={{ background: 'transparent', color: '#C8813A', border: '1px solid #C8813A', borderRadius: '6px', padding: '10px 20px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>
          Upgrade plan
        </button>
      </div>

      {/* YOUR DATA */}
      <div style={{ background: '#3D2215', borderRadius: '8px', padding: '24px' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#F5ECD7', margin: '0 0 20px 0' }}>
          Your data
        </h2>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', padding: '6px 12px', borderRadius: '100px', background: 'rgba(201, 185, 154, 0.1)', color: '#C9B99A', border: '1px solid #C9B99A' }}>
            13 clients
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', padding: '6px 12px', borderRadius: '100px', background: 'rgba(201, 185, 154, 0.1)', color: '#C9B99A', border: '1px solid #C9B99A' }}>
            30 policies
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', padding: '6px 12px', borderRadius: '100px', background: 'rgba(201, 185, 154, 0.1)', color: '#C9B99A', border: '1px solid #C9B99A' }}>
            3 conversations
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/dashboard/import" style={{ background: '#C8813A', color: '#120A06', border: 'none', borderRadius: '6px', padding: '10px 20px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>
            Import clients
          </Link>
          <button disabled style={{ background: 'transparent', color: '#666666', border: '1px solid #666666', borderRadius: '6px', padding: '10px 20px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 'bold', cursor: 'not-allowed' }}>
            Export data
          </button>
        </div>
      </div>
    </div>
  );
}