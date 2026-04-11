'use client';

import React from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';

export default function DashboardHome() {
  const isMobile = useIsMobile();
  
  // Recent conversations
  const conversations = [
    { id: 1, client: 'Maria Santos', time: '2 min ago', message: 'Looking for health insurance for family', status: 'active' },
    { id: 2, client: 'Robert Chen', time: '15 min ago', message: 'Asked about car insurance renewal', status: 'completed' },
    { id: 3, client: 'Sarah Lim', time: '1 hour ago', message: 'Inquired about travel insurance', status: 'active' },
  ];

  // Alerts
  const alerts = [
    { id: 1, type: 'renewal', title: 'Renewal due tomorrow', client: 'James Wong', policy: 'Life Insurance', priority: 'high' },
    { id: 2, type: 'document', title: 'Document missing', client: 'Lisa Tan', policy: 'Health Insurance', priority: 'medium' },
    { id: 3, type: 'payment', title: 'Payment overdue', client: 'Michael Lee', policy: 'Car Insurance', priority: 'high' },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
    }}>
      {/* Two Panels Side by Side */}
      <div style={{
        display: 'flex',
        gap: '24px',
        width: '100%',
        marginTop: '24px',
      }}>
        {/* Left Panel - Recent Conversations */}
        <div style={{ flex: '0 0 60%' }}>
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Recent conversations</h2>
              <span style={{
                fontSize: '12px',
                color: '#C8813A',
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}>
                View all →
              </span>
            </div>
            <div className="panel-body">
              {conversations.map((conv) => (
                <div key={conv.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid #2E1A0E',
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: conv.status === 'active' ? '#C8813A' : '#2E1A0E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: conv.status === 'active' ? '#120A06' : '#C9B99A',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}>
                    {conv.client.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px',
                    }}>
                      <div style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#F5ECD7',
                      }}>
                        {conv.client}
                      </div>
                      <div style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '11px',
                        color: '#C9B99A',
                      }}>
                        {conv.time}
                      </div>
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '12px',
                      color: '#C9B99A',
                    }}>
                      {conv.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Alerts */}
        <div style={{ flex: 1 }}>
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Alerts</h2>
              <span style={{
                fontSize: '12px',
                color: '#C8813A',
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}>
                View all →
              </span>
            </div>
            <div className="panel-body">
              {alerts.map((alert) => (
                <div key={alert.id} style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #2E1A0E',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: alert.priority === 'high' ? '#E53E3E' : '#C8813A',
                    }} />
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#F5ECD7',
                    }}>
                      {alert.title}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '12px',
                    color: '#C9B99A',
                    marginBottom: '4px',
                  }}>
                    {alert.client} • {alert.policy}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span className={`pill ${alert.priority === 'high' ? 'pill-danger' : 'pill-amber'}`}>
                      {alert.priority} priority
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: '#C8813A',
                      cursor: 'pointer',
                      fontFamily: 'DM Sans, sans-serif',
                    }}>
                      Resolve →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}