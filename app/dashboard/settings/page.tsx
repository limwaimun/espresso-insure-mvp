'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
}

interface MayaSettings {
  autoReply: boolean;
  workingHours: string;
  greetingMessage: string;
  coverageGapDetection: boolean;
  renewalReminders: boolean;
  birthdayGreetings: boolean;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Maya settings state
  const [mayaSettings, setMayaSettings] = useState<MayaSettings>({
    autoReply: false,
    workingHours: '9:00 AM — 6:00 PM',
    greetingMessage: 'Hi! I\'m Maya, your insurance advisor\'s assistant. How can I help you today?',
    coverageGapDetection: false,
    renewalReminders: false,
    birthdayGreetings: false,
  });
  
  // Trial state
  const [trialStatus, setTrialStatus] = useState<{
    active: boolean;
    daysRemaining: number;
    expired: boolean;
  }>({
    active: true,
    daysRemaining: 14,
    expired: false,
  });
  
  // Data metrics
  const [metrics, setMetrics] = useState({
    clients: 13,
    policies: 30,
    conversations: 3,
  });
  
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    try {
      // Fetch user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
        }
      }
      
      // In a real app, we would fetch Maya settings, trial status, and metrics from API
      // For now, we use the default/placeholder values
      
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

  const handleMayaToggle = (setting: keyof MayaSettings) => {
    if (typeof mayaSettings[setting] === 'boolean') {
      setMayaSettings(prev => ({
        ...prev,
        [setting]: !prev[setting]
      }));
    }
  };

  const handleGreetingMessageChange = (value: string) => {
    setMayaSettings(prev => ({
      ...prev,
      greetingMessage: value
    }));
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
      
      {/* Page Header */}
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

      {/* ========== SECTION 1: PROFILE ========== */}
      <div style={{
        background: '#3D2215',
        borderRadius: '8px',
        padding: '24px',
      }}>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '20px',
          color: '#F5ECD7',
          margin: '0 0 20px 0',
        }}>
          Profile
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '20px',
        }}>
          {/* Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#F5ECD7',
            }}>
              Name
            </label>
            <input
              type="text"
              value={profile?.name || ''}
              onChange={(e) => setProfile(prev => prev ? { ...prev, name: e.target.value } : null)}
              style={{
                background: '#2E1A0E',
                border: '1px solid #3D2215',
                borderRadius: '6px',
                padding: '12px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#F5ECD7',
                outline: 'none',
              }}
            />
          </div>
          
          {/* Email (disabled) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#F5ECD7',
            }}>
              Email
            </label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              style={{
                background: '#2E1A0E',
                border: '1px solid #3D2215',
                borderRadius: '6px',
                padding: '12px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#666666',
                outline: 'none',
                cursor: 'not-allowed',
              }}
            />
          </div>
          
          {/* WhatsApp */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#F5ECD7',
            }}>
              WhatsApp
            </label>
            <input
              type="text"
              value={profile?.phone || ''}
              onChange={(e) => setProfile(prev => prev ? { ...prev, phone: e.target.value } : null)}
              style={{
                background: '#2E1A0E',
                border: '1px solid #3D2215',
                borderRadius: '6px',
                padding: '12px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#F5ECD7',
                outline: 'none',
              }}
            />
          </div>
          
          {/* Company */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#F5ECD7',
            }}>
              Company
            </label>
            <input
              type="text"
              value={profile?.company || ''}
              onChange={(e) => setProfile(prev => prev ? { ...prev, company: e.target.value } : null)}
              style={{
                background: '#2E1A0E',
                border: '1px solid #3D2215',
                borderRadius: '6px',
                padding: '12px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#F5ECD7',
                outline: 'none',
              }}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
          {saveSuccess && (
            <span style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#5AB87A',
            }}>
              ✓ Saved
            </span>
          )}
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            style={{
              background: '#C8813A',
              color: '#120A06',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
              opacity: saving ? 0.7 : 1,
            }}
            onMouseEnter={(e) => !saving && (e.currentTarget.style.background = '#D4A030')}
            onMouseLeave={(e) => !saving && (e.currentTarget.style.background = '#C8813A')}
          >
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </div>

      {/* ========== SECTION 2: MAYA ========== */}
      <div style={{
        background: '#3D2215',
        borderRadius: '8px',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '20px',
            color: '#F5ECD7',
            margin: 0,
          }}>
            Maya
          </h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            color: '#D4A030',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#D4A030',
            }} />
            Setting up
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Auto-reply toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#F5ECD7',
                }}>
                  Auto-reply to new messages
                </span>
                <span style={{
                  background: '#2E1A0E',
                  color: '#C9B99A',
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  Coming soon
                </span>
              </div>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#C9B99A',
                margin: 0,
                lineHeight: 1.5,
              }}>
                Maya will respond to client WhatsApp messages automatically
              </p>
            </div>
            <div
              onClick={() => handleMayaToggle('autoReply')}
              style={{
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                background: mayaSettings.autoReply ? '#C8813A' : '#2E1A0E',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute',
                top: '2px',
                left: mayaSettings.autoReply ? '22px' : '2px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#F5ECD7',
                transition: 'all 0.2s',
              }} />
            </div>
          </div>
          
          {/* Working hours */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#F5ECD7',
                }}>
                  Active hours
                </span>
                <span style={{
                  background: '#2E1A0E',
                  color: '#C9B99A',
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  Coming soon
                </span>
              </div>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#C9B99A',
                margin: 0,
                lineHeight: 1.5,
              }}>
                Maya only replies during these hours
              </p>
            </div>
            <div style={{
              background: '#2E1A0E',
              border: '1px solid #3D2215',
              borderRadius: '6px',
              padding: '10px 12px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#666666',
              cursor: 'not-allowed',
              flexShrink: 0,
            }}>
              {mayaSettings.workingHours}
            </div>
          </div>
          
          {/* Greeting message */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#F5ECD7',
              }}>
                Welcome message
              </span>
              <span style={{
                background: '#2E1A0E',
                color: '#C9B99A',
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '4px',
                fontFamily: 'DM Sans, sans-serif',
              }}>
                Coming soon
              </span>
            </div>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
              margin: '0 0 8px 0',
              lineHeight: 1.5,
            }}>
              Maya sends this when a new client messages for the first time
            </p>
            <textarea
              value={mayaSettings.greetingMessage}
              onChange={(e) => handleGreetingMessageChange(e.target.value)}
              rows={3}
              style={{
                background: '#2E1A0E',
                border: '1px solid #3D2215',
                borderRadius: '6px',
                padding: '12px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#F5ECD7',
                outline: 'none',
                resize: 'vertical',
                minHeight: '80px',
              }}
            />
          </div>
          
          {/* Coverage gap detection toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#F5ECD7',
                }}>
                  Flag missing coverage
                </span>
                <span style={{
                  background: '#2E1A0E',
                  color: '#C9B99A',
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  Coming soon
                </span>
              </div>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#C9B99A',
                margin: 0,
                lineHeight: 1.5,
              }}>
                Maya will identify and flag coverage gaps during conversations
              </p>
            </div>
            <div
              onClick={() => handleMayaToggle('coverageGapDetection')}
              style={{
                width