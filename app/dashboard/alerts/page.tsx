'use client';

import React, { useState } from 'react';

export default function AlertsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  
  const alerts = [
    { id: 1, type: 'renewal', title: 'Policy Renewal Due', client: 'Sarah Lim', policy: 'Life Insurance', date: '15 Apr 2026', priority: 'high', read: false },
    { id: 2, type: 'payment', title: 'Payment Missed', client: 'Raj Patel', policy: 'Investment Plan', date: '10 Apr 2026', priority: 'high', read: false },
    { id: 3, type: 'document', title: 'Document Expiring', client: 'Tan Ah Kow', policy: 'Health Insurance', date: '30 Apr 2026', priority: 'medium', read: true },
    { id: 4, type: 'compliance', title: 'Compliance Check', client: 'All Clients', policy: 'Annual Review', date: '30 Jun 2026', priority: 'medium', read: true },
    { id: 5, type: 'followup', title: 'Follow-up Required', client: 'Maria Santos', policy: 'Health Insurance', date: '12 Apr 2026', priority: 'low', read: true },
    { id: 6, type: 'market', title: 'Market Update', client: 'All Clients', policy: 'Investment Plans', date: 'Today', priority: 'low', read: true },
  ];

  const alertTypes = [
    { type: 'all', label: 'All Alerts', count: 6 },
    { type: 'unread', label: 'Unread', count: 2 },
    { type: 'renewal', label: 'Renewals', count: 1 },
    { type: 'payment', label: 'Payments', count: 1 },
    { type: 'compliance', label: 'Compliance', count: 1 },
  ];

  const filteredAlerts = activeFilter === 'all' 
    ? alerts 
    : activeFilter === 'unread'
    ? alerts.filter(alert => !alert.read)
    : alerts.filter(alert => alert.type === activeFilter);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#E53E3E';
      case 'medium': return '#C8813A';
      case 'low': return '#38A169';
      default: return '#C9B99A';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'renewal': return '📅';
      case 'payment': return '💰';
      case 'document': return '📄';
      case 'compliance': return '⚖️';
      case 'followup': return '💬';
      case 'market': return '📈';
      default: return '🔔';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
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
          Alert Center
        </h1>
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          color: '#C9B99A',
        }}>
          Manage and respond to client alerts and notifications
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid #2E1A0E',
        paddingBottom: '16px',
      }}>
        {alertTypes.map((filter) => (
          <button
            key={filter.type}
            onClick={() => setActiveFilter(filter.type)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: activeFilter === filter.type ? '#C8813A' : 'transparent',
              color: activeFilter === filter.type ? '#120A06' : '#C9B99A',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              fontWeight: activeFilter === filter.type ? 500 : 400,
              padding: '8px 16px',
              borderRadius: '100px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {filter.label}
            <span style={{
              background: activeFilter === filter.type ? '#120A06' : '#2E1A0E',
              color: activeFilter === filter.type ? '#C8813A' : '#C9B99A',
              fontSize: '11px',
              fontWeight: 500,
              padding: '2px 6px',
              borderRadius: '100px',
              minWidth: '20px',
              textAlign: 'center',
            }}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Recent Alerts</h2>
          <button className="panel-action">Mark all as read</button>
        </div>
        <div className="panel-body">
          {filteredAlerts.map((alert) => (
            <div key={alert.id} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              padding: '16px 0',
              borderBottom: '1px solid #2E1A0E',
              opacity: alert.read ? 0.7 : 1,
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: '#2E1A0E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0,
              }}>
                {getTypeIcon(alert.type)}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px',
                }}>
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: getPriorityColor(alert.priority),
                      }} />
                      <div style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#F5ECD7',
                      }}>
                        {alert.title}
                      </div>
                      {!alert.read && (
                        <span style={{
                          background: '#C8813A',
                          color: '#120A06',
                          fontSize: '10px',
                          fontWeight: 500,
                          padding: '2px 6px',
                          borderRadius: '100px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          New
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '12px',
                      color: '#C9B99A',
                    }}>
                      {alert.client} • {alert.policy}
                    </div>
                  </div>
                  
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '12px',
                    color: '#C9B99A',
                  }}>
                    {alert.date}
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '12px',
                }}>
                  <button style={{
                    background: '#C8813A',
                    color: '#120A06',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '12px',
                    fontWeight: 500,
                    padding: '6px 16px',
                    borderRadius: '100px',
                    border: 'none',
                    cursor: 'pointer',
                  }}>
                    Resolve
                  </button>
                  <button style={{
                    background: 'transparent',
                    border: '1px solid #2E1A0E',
                    color: '#C9B99A',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '12px',
                    padding: '6px 16px',
                    borderRadius: '100px',
                    cursor: 'pointer',
                  }}>
                    Snooze
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}