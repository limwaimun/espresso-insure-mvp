'use client';

import React, { useState } from 'react';

export default function AlertsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  
  const alerts = [
    { 
      id: 1, 
      title: 'Renewal due tomorrow', 
      client: 'James Wong', 
      policy: 'Life Insurance', 
      time: '2 hours ago', 
      priority: 'high', 
      color: 'red',
      action: 'Resolve →'
    },
    { 
      id: 2, 
      title: 'Document missing', 
      client: 'Lisa Tan', 
      policy: 'Health Insurance', 
      time: '3 hours ago', 
      priority: 'medium', 
      color: 'amber',
      action: 'Resolve →'
    },
    { 
      id: 3, 
      title: 'Payment overdue', 
      client: 'Michael Lee', 
      policy: 'Car Insurance', 
      time: '5 hours ago', 
      priority: 'high', 
      color: 'red',
      action: 'Resolve →'
    },
    { 
      id: 4, 
      title: 'Coverage gap detected', 
      client: 'Tan Ah Kow', 
      policy: 'Group Insurance', 
      time: '8 hours ago', 
      priority: 'medium', 
      color: 'amber',
      action: 'Resolve →'
    },
    { 
      id: 5, 
      title: 'Claim requires attention', 
      client: 'Angela Foo', 
      policy: 'Medical Insurance', 
      time: '12 hours ago', 
      priority: 'high', 
      color: 'red',
      action: 'Resolve →'
    },
    { 
      id: 6, 
      title: 'Renewal in 7 days', 
      client: 'Sarah Lim', 
      policy: 'Travel Insurance', 
      time: '1 day ago', 
      priority: 'medium', 
      color: 'amber',
      action: 'Resolve →'
    },
    { 
      id: 7, 
      title: 'Policy renewed successfully', 
      client: 'Robert Chen', 
      policy: 'Home Insurance', 
      time: '1 day ago', 
      priority: 'info', 
      color: 'green',
      action: 'View →'
    },
    { 
      id: 8, 
      title: 'Missing beneficiary details', 
      client: 'Priya Nair', 
      policy: 'Life Insurance', 
      time: '2 days ago', 
      priority: 'medium', 
      color: 'amber',
      action: 'Resolve →'
    },
  ];

  const filters = ['All', 'Renewals', 'Claims', 'Documents', 'Payments'];

  const getPriorityPillStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          background: '#E53E3E',
          color: '#120A06',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '11px',
          fontWeight: 500,
          padding: '4px 8px',
          borderRadius: '100px',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
        };
      case 'medium':
        return {
          background: '#C8813A',
          color: '#120A06',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '11px',
          fontWeight: 500,
          padding: '4px 8px',
          borderRadius: '100px',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
        };
      case 'info':
        return {
          background: '#38A169',
          color: '#120A06',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '11px',
          fontWeight: 500,
          padding: '4px 8px',
          borderRadius: '100px',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
        };
      default:
        return {
          background: '#2E1A0E',
          color: '#C9B99A',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '11px',
          fontWeight: 500,
          padding: '4px 8px',
          borderRadius: '100px',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
        };
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'high priority';
      case 'medium': return 'medium priority';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  const getDotColor = (color: string) => {
    switch (color) {
      case 'red': return '#E53E3E';
      case 'amber': return '#C8813A';
      case 'green': return '#38A169';
      default: return '#C9B99A';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    }}>
      {/* TITLE ROW */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '28px',
          fontWeight: 400,
          color: '#F5ECD7',
          margin: 0,
        }}>
          Alerts
        </h1>
        <button style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '13px',
          color: '#C8813A',
          background: 'transparent',
          border: '1px solid #2E1A0E',
          padding: '8px 16px',
          cursor: 'pointer',
          borderRadius: '100px',
        }}>
          Mark all read
        </button>
      </div>

      {/* FILTER TABS */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid #2E1A0E',
        paddingBottom: '16px',
      }}>
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter.toLowerCase())}
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              fontWeight: activeFilter === filter.toLowerCase() ? 500 : 400,
              color: activeFilter === filter.toLowerCase() ? '#C8813A' : '#C9B99A',
              background: 'transparent',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '100px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* ALERT LIST */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}>
        {alerts.map((alert) => (
          <div 
            key={alert.id}
            style={{
              padding: '16px',
              borderBottom: '1px solid #2E1A0E',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            {/* Colored Dot */}
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: getDotColor(alert.color),
              flexShrink: 0,
              marginTop: '2px',
            }} />

            {/* Content */}
            <div style={{ flex: 1 }}>
              {/* Top Row: Title + Time */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '4px',
              }}>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#F5ECD7',
                }}>
                  {alert.title}
                </div>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '11px',
                  color: '#C9B99A',
                  textAlign: 'right' as const,
                }}>
                  {alert.time}
                </div>
              </div>

              {/* Client Info */}
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#C9B99A',
                marginBottom: '8px',
              }}>
                {alert.client} · {alert.policy}
              </div>

              {/* Bottom Row: Priority Pill + Action */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={getPriorityPillStyle(alert.priority)}>
                  {getPriorityLabel(alert.priority)}
                </div>
                <button style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#C8813A',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 0',
                }}>
                  {alert.action}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}