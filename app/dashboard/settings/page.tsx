'use client';

import React from 'react';
<div style={{
      maxWidth: '640px',
    }}>

export default function SettingsPage() {
  return (
    <div style={{
      maxWidth: '640px',
    }}>
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
              defaultValue="Tan Ah Kow"
              style={{ maxWidth: '300px' }}
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
              defaultValue="ahkow@taktech.com"
              style={{ maxWidth: '300px' }}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
              fontWeight: 500,
            }}>
              Phone
            </label>
            <input
              type="tel"
              className="input"
              defaultValue="+65 9123 4567"
              style={{ maxWidth: '300px' }}
            />
          </div>
          
          <button className="btn-secondary" style={{ alignSelf: 'flex-start' }}>
            Save changes
          </button>
        </div>
      </div>

      {/* MAYA SETTINGS SECTION */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Maya settings</h2>
        </div>
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#F5ECD7',
                fontWeight: 500,
              }}>
                Response style
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#C9B99A',
              }}>
                Professional
              </div>
            </div>
            <select className="input" style={{ width: '150px' }}>
              <option>Professional</option>
              <option>Friendly</option>
              <option>Concise</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#F5ECD7',
                fontWeight: 500,
              }}>
                Auto-brief
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#C9B99A',
              }}>
                On
              </div>
            </div>
            <div style={{
              width: '40px',
              height: '20px',
              background: '#C8813A',
              borderRadius: '10px',
              position: 'relative',
              cursor: 'pointer',
            }}>
              <div style={{
                position: 'absolute',
                right: '2px',
                top: '2px',
                width: '16px',
                height: '16px',
                background: '#120A06',
                borderRadius: '50%',
              }} />
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#F5ECD7',
                fontWeight: 500,
              }}>
                Pause hours
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#C9B99A',
              }}>
                10pm-8am
              </div>
            </div>
            <input
              type="text"
              className="input"
              defaultValue="10pm-8am"
              style={{ width: '150px' }}
            />
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS SECTION */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Notifications</h2>
        </div>
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { label: 'Renewal alerts', description: 'On', enabled: true },
            { label: 'Claim updates', description: 'On', enabled: true },
            { label: 'Coverage gaps', description: 'On', enabled: true },
          ].map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  color: '#F5ECD7',
                  fontWeight: 500,
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '12px',
                  color: '#C9B99A',
                }}>
                  {item.description}
                </div>
              </div>
              <div style={{
                width: '40px',
                height: '20px',
                background: item.enabled ? '#C8813A' : '#2E1A0E',
                borderRadius: '10px',
                position: 'relative',
                cursor: 'pointer',
              }}>
                <div style={{
                  position: 'absolute',
                  right: item.enabled ? '2px' : '22px',
                  top: '2px',
                  width: '16px',
                  height: '16px',
                  background: '#120A06',
                  borderRadius: '50%',
                  transition: 'right 0.2s',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PLAN & BILLING SECTION */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Plan & billing</h2>
        </div>
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#F5ECD7',
                fontWeight: 500,
              }}>
                Current plan
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#C9B99A',
              }}>
                Pro
              </div>
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: '#F5ECD7',
              fontWeight: 500,
            }}>
              SGD $79/month
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#F5ECD7',
                fontWeight: 500,
              }}>
                Next billing
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#C9B99A',
              }}>
                1 May 2026
              </div>
            </div>
            <button className="btn-secondary">
              Update payment
            </button>
          </div>
        </div>
      </div>

      {/* DANGER ZONE SECTION */}
      <div className="panel" style={{ borderColor: '#E53E3E' }}>
        <div className="panel-header">
          <h2 className="panel-title" style={{ color: '#E53E3E' }}>Danger zone</h2>
        </div>
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button className="btn-secondary">
            Export data
          </button>
          <button style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            color: '#E53E3E',
            background: 'transparent',
            border: 'none',
            padding: '8px 0',
            cursor: 'pointer',
            textAlign: 'left' as const,
          }}>
            Cancel subscription
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
    </div>
