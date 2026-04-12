import { createClient } from '@/lib/supabase/server';

export default async function SettingsPage() {
  const supabase = await createClient();
  
  // Fetch user profile
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
    }}>
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
          Manage your account, Maya preferences, and notifications
        </p>
      </div>

      {/* PROFILE SECTION */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Profile</h2>
        </div>
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
              fontWeight: 500,
            }}>
              Name
            </label>
            <input
              type="text"
              className="input"
              defaultValue={profile?.name || ''}
              readOnly
              style={{ background: '#1C0F0A', color: '#C9B99A' }}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
              fontWeight: 500,
            }}>
              Email
            </label>
            <input
              type="email"
              className="input"
              defaultValue={user?.email || ''}
              readOnly
              style={{ background: '#1C0F0A', color: '#C9B99A' }}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
              fontWeight: 500,
            }}>
              WhatsApp number
            </label>
            <input
              type="tel"
              className="input"
              defaultValue={profile?.phone || ''}
              readOnly
              style={{ background: '#1C0F0A', color: '#C9B99A' }}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
              fontWeight: 500,
            }}>
              Plan
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#F5ECD7',
                background: 'rgba(200, 129, 58, 0.2)',
                border: '1px solid #C8813A',
                padding: '6px 12px',
                borderRadius: '6px',
              }}>
                {profile?.plan === 'solo' ? 'Solo' : 
                 profile?.plan === 'pro' ? 'Pro' : 
                 profile?.plan === 'team' ? 'Team' : 'Trial'}
              </span>
              <button className="btn-secondary" style={{
                fontSize: '12px',
                padding: '6px 12px',
              }}>
                Upgrade
              </button>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '8px',
          }}>
            <button className="btn-primary" style={{
              fontSize: '13px',
              padding: '8px 16px',
            }}>
              Save changes
            </button>
          </div>
        </div>
      </div>

      {/* MAYA SETTINGS SECTION */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Maya settings</h2>
        </div>
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#F5ECD7',
                fontWeight: 500,
                marginBottom: '4px',
              }}>
                Auto-reply to new WhatsApp messages
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#C9B99A',
              }}>
                Maya will greet new clients automatically
              </div>
            </div>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#F5ECD7',
                fontWeight: 500,
                marginBottom: '4px',
              }}>
                Coverage gap detection
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#C9B99A',
              }}>
                Maya will flag missing coverage during conversations
              </div>
            </div>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#F5ECD7',
                fontWeight: 500,
                marginBottom: '4px',
              }}>
                Renewal reminders
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#C9B99A',
              }}>
                Maya will send reminders 30 days before renewal
              </div>
            </div>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS SECTION */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Notifications</h2>
        </div>
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#F5ECD7',
                fontWeight: 500,
                marginBottom: '4px',
              }}>
                Email notifications
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#C9B99A',
              }}>
                Receive alerts and summaries via email
              </div>
            </div>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#F5ECD7',
                fontWeight: 500,
                marginBottom: '4px',
              }}>
                WhatsApp notifications
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#C9B99A',
              }}>
                Get urgent alerts on WhatsApp
              </div>
            </div>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#F5ECD7',
                fontWeight: 500,
                marginBottom: '4px',
              }}>
                Daily summary
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#C9B99A',
              }}>
                Receive a daily recap at 9 AM
              </div>
            </div>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* PLAN & BILLING SECTION */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Plan & billing</h2>
        </div>
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: '#F5ECD7',
              fontWeight: 500,
              marginBottom: '8px',
            }}>
              Current plan
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '16px',
                color: '#F5ECD7',
                background: 'rgba(200, 129, 58, 0.2)',
                border: '1px solid #C8813A',
                padding: '8px 16px',
                borderRadius: '8px',
              }}>
                {profile?.plan === 'solo' ? 'Solo · $49/month' : 
                 profile?.plan === 'pro' ? 'Pro · $99/month' : 
                 profile?.plan === 'team' ? 'Team · $199/month' : 'Trial · Free for 14 days'}
              </div>
              <button className="btn-secondary" style={{
                fontSize: '13px',
                padding: '8px 16px',
              }}>
                Change plan
              </button>
            </div>
          </div>
          
          <div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: '#F5ECD7',
              fontWeight: 500,
              marginBottom: '8px',
            }}>
              Billing information
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
              background: '#1C0F0A',
              border: '1px solid #2E1A0E',
              padding: '12px',
              borderRadius: '6px',
            }}>
              {profile?.plan === 'solo' || profile?.plan === 'pro' || profile?.plan === 'team' 
                ? 'Billing managed via Stripe. Visit stripe.com to update payment method.'
                : 'No billing information required during trial period.'}
            </div>
          </div>
        </div>
      </div>

      {/* DANGER ZONE SECTION */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title" style={{ color: '#E53E3E' }}>Danger zone</h2>
        </div>
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: '#F5ECD7',
              fontWeight: 500,
              marginBottom: '8px',
            }}>
              Delete account
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
              marginBottom: '12px',
            }}>
              Permanently delete your account and all data. This action cannot be undone.
            </div>
            <button className="btn-danger" style={{
              fontSize: '13px',
              padding: '8px 16px',
            }}>
              Delete account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}