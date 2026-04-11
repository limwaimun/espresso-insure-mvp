'use client';

import React from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';

export default function DashboardHome() {
  const isMobile = useIsMobile();
  
  // Metric cards data - SECTION 2
  const metricCards = [
    { id: 1, title: 'CLIENTS', value: '247', change: '↑ 12 this month', color: 'amber' },
    { id: 2, title: 'RENEWALS', value: '8', change: '2 require attention', color: 'danger' },
    { id: 3, title: 'CHATS', value: '3', change: '↑ 18 completed today', color: 'ok' },
    { id: 4, title: 'POLICIES', value: '412', change: '↑ 6 this week', color: 'info' },
    { id: 5, title: 'PREMIUM', value: '$284,600', change: '↑ $18,400 this month', color: 'amber' },
    { id: 6, title: 'RATE', value: '94.2%', change: '↑ 4.2% vs last year', color: 'ok' },
  ];

  // Recent conversations - SECTION 3 (left panel)
  const conversations = [
    { id: 1, client: 'Maria Santos', time: '2 min ago', message: 'Looking for health insurance for family', status: 'active' },
    { id: 2, client: 'Robert Chen', time: '15 min ago', message: 'Asked about car insurance renewal', status: 'completed' },
    { id: 3, client: 'Sarah Lim', time: '1 hour ago', message: 'Inquired about travel insurance', status: 'active' },
  ];

  // Alerts - SECTION 3 (right panel)
  const alerts = [
    { id: 1, type: 'renewal', title: 'Renewal due tomorrow', client: 'James Wong', policy: 'Life Insurance', priority: 'high' },
    { id: 2, type: 'document', title: 'Document missing', client: 'Lisa Tan', policy: 'Health Insurance', priority: 'medium' },
    { id: 3, type: 'payment', title: 'Payment overdue', client: 'Michael Lee', policy: 'Car Insurance', priority: 'high' },
  ];

  // Renewals - SECTION 4
  const renewals = [
    { id: 1, client: 'Angela Koh', policy: 'Health Insurance', date: '12 Apr 2026', premium: '$1,200', status: 'urgent' },
    { id: 2, client: 'Thomas Ng', policy: 'Life Insurance', date: '15 Apr 2026', premium: '$2,500', status: 'due' },
    { id: 3, client: 'Jessica Lim', policy: 'Car Insurance', date: '18 Apr 2026', premium: '$800', status: 'upcoming' },
    { id: 4, client: 'David Tan', policy: 'Travel Insurance', date: '20 Apr 2026', premium: '$300', status: 'upcoming' },
  ];

  // Analytics preview - SECTION 5
  const analytics = [
    { id: 1, title: 'Renewal rate this month', value: '96.4%', change: '+2.1%', color: 'ok' },
    { id: 2, title: 'Coverage opportunities', value: '18', change: '↑ 5 detected', color: 'amber' },
    { id: 3, title: 'Time saved by Espresso', value: '42h', change: '↑ 8h this week', color: 'info' },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
    }}>
      {/* SECTION 2: Six Metric Cards */}
      <div className="metric-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        width: '100%',
      }}>
        {metricCards.map((card) => (
          <div key={card.id} className="card" style={{
            backgroundColor: '#1C0F0A',
            border: '1px solid #2E1A0E',
            borderRadius: '8px',
            padding: '16px',
            borderTop: `3px solid ${
              card.color === 'amber' ? '#C8813A' :
              card.color === 'danger' ? '#E53E3E' :
              card.color === 'ok' ? '#38A169' :
              '#4299E1'
            }`,
          }}>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#C9B99A',
              marginBottom: '8px',
            }}>
              {card.title}
            </div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '34px',
              fontWeight: 300,
              color: '#F5ECD7',
              lineHeight: 1.1,
              margin: '8px 0 4px 0',
            }}>
              {card.value}
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: card.change.includes('↑') ? '#38A169' : 
                     card.change.includes('require') ? '#E53E3E' : '#C9B99A',
              marginTop: '6px',
            }}>
              {card.change}
            </div>
          </div>
        ))}
      </div>

      {/* SECTION 3: Two Panels Side by Side */}
      <div style={{
        display: 'flex',
        gap: '24px',
        width: '100%',
      }}>
        {/* Left Panel - Recent Conversations (60%) */}
        <div style={{ flex: '0 0 60%' }}>
          <div className="panel" style={{
            backgroundColor: '#1C0F0A',
            border: '1px solid #2E1A0E',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <div className="panel-header" style={{
              padding: '16px 20px',
              borderBottom: '1px solid #2E1A0E',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 className="panel-title" style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '18px',
                fontWeight: 400,
                color: '#F5ECD7',
                margin: 0,
              }}>
                Recent conversations
              </h2>
              <span style={{
                fontSize: '12px',
                color: '#C8813A',
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}>
                View all →
              </span>
            </div>
            <div className="panel-body" style={{ padding: '0 20px' }}>
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

        {/* Right Panel - Alerts (40%) */}
        <div style={{ flex: 1 }}>
          <div className="panel" style={{
            backgroundColor: '#1C0F0A',
            border: '1px solid #2E1A0E',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <div className="panel-header" style={{
              padding: '16px 20px',
              borderBottom: '1px solid #2E1A0E',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 className="panel-title" style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '18px',
                fontWeight: 400,
                color: '#F5ECD7',
                margin: 0,
              }}>
                Alerts
              </h2>
              <span style={{
                fontSize: '12px',
                color: '#C8813A',
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}>
                View all →
              </span>
            </div>
            <div className="panel-body" style={{ padding: '0 20px' }}>
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
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontWeight: 500,
                      backgroundColor: alert.priority === 'high' ? '#E53E3E20' : '#C8813A20',
                      color: alert.priority === 'high' ? '#E53E3E' : '#C8813A',
                    }}>
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

      {/* SECTION 4: Upcoming Renewals Table */}
      <div className="panel" style={{
        backgroundColor: '#1C0F0A',
        border: '1px solid #2E1A0E',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <div className="panel-header" style={{
          padding: '16px 20px',
          borderBottom: '1px solid #2E1A0E',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 className="panel-title" style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '18px',
            fontWeight: 400,
            color: '#F5ECD7',
            margin: 0,
          }}>
            Upcoming renewals
          </h2>
          <span style={{
            fontSize: '12px',
            color: '#C8813A',
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            View calendar →
          </span>
        </div>
        <div className="panel-body" style={{ padding: '0 20px' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}>
            <thead>
              <tr>
                <th style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#C8813A',
                  padding: '12px 16px',
                  borderBottom: '1px solid #2E1A0E',
                  textAlign: 'left',
                  fontWeight: 500,
                }}>Client</th>
                <th style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#C8813A',
                  padding: '12px 16px',
                  borderBottom: '1px solid #2E1A0E',
                  textAlign: 'left',
                  fontWeight: 500,
                }}>Policy</th>
                <th style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#C8813A',
                  padding: '12px 16px',
                  borderBottom: '1px solid #2E1A0E',
                  textAlign: 'left',
                  fontWeight: 500,
                }}>Date</th>
                <th style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#C8813A',
                  padding: '12px 16px',
                  borderBottom: '1px solid #2E1A0E',
                  textAlign: 'left',
                  fontWeight: 500,
                }}>Premium</th>
                <th style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#C8813A',
                  padding: '12px 16px',
                  borderBottom: '1px solid #2E1A0E',
                  textAlign: 'left',
                  fontWeight: 500,
                }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {renewals.map((renewal) => (
                <tr key={renewal.id}>
                  <td style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '13px',
                    color: '#F5ECD7',
                    padding: '12px 16px',
                    borderBottom: '1px solid #2E1A0E',
                  }}>{renewal.client}</td>
                  <td style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '12px',
                    color: '#C9B99A',
                    padding: '12px 16px',
                    borderBottom: '1px solid #2E1A0E',
                  }}>{renewal.policy}</td>
                  <td style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '12px',
                    color: '#C9B99A',
                    padding: '12px 16px',
                    borderBottom: '1px solid #2E1A0E',
                  }}>{renewal.date}</td>
                  <td style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '12px',
                    color: '#C9B99A',
                    padding: '12px 16px',
                    borderBottom: '1px solid #2E1A0E',
                  }}>{renewal.premium}</td>
                  <td style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '12px 16px',
                    borderBottom: '1px solid #2E1A0E',
                    color: renewal.status === 'urgent' ? '#E53E3E' : 
                           renewal.status === 'due' ? '#C8813A' : '#C9B99A',
                  }}>{renewal.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 5: Three Analytics Preview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
      }}>
        {analytics.map((item) => (
          <div key={item.id} style={{
            backgroundColor: '#1C0F0A',
            border: '1px solid #2E1A0E',
            borderRadius: '8px',
            padding: '16px',
          }}>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#C9B99A',
              marginBottom: '8px',
            }}>
              {item.title}
            </div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '34px',
              fontWeight: 300,
              color: '#F5ECD7',
              marginBottom: '4px',
            }}>
              {item.value}
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              color: item.change.includes('↑') || item.change.includes('+') ? '#38A169' : '#C9B99A',
            }}>
              {item.change}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
