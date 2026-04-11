'use client';

import React, { useState } from 'react';

export default function MayaPage() {
  const [activeTab, setActiveTab] = useState('active');
  
  const conversations = [
    { id: 1, client: 'Maria Santos', time: '2 min ago', message: 'Looking for health insurance for family', status: 'active', unread: true },
    { id: 2, client: 'Robert Chen', time: '15 min ago', message: 'Asked about car insurance renewal', status: 'completed', unread: false },
    { id: 3, client: 'Sarah Lim', time: '1 hour ago', message: 'Inquired about travel insurance', status: 'active', unread: false },
    { id: 4, client: 'James Wong', time: '2 hours ago', message: 'Follow-up on life insurance quote', status: 'pending', unread: true },
    { id: 5, client: 'Lisa Tan', time: '1 day ago', message: 'Medical claim assistance needed', status: 'completed', unread: false },
    { id: 6, client: 'Michael Lee', time: '2 days ago', message: 'Investment plan consultation', status: 'active', unread: false },
  ];

  const filteredConversations = activeTab === 'all' 
    ? conversations 
    : conversations.filter(conv => conv.status === activeTab);

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
          Conversations
        </h1>
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          color: '#C9B99A',
        }}>
          Manage client conversations and follow-ups with Maya
        </p>
      </div>

      {/* Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
      }}>
        <div className="card">
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: '#C9B99A',
            marginBottom: '8px',
          }}>
            ACTIVE CONVERSATIONS
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            color: '#F5ECD7',
          }}>
            3
          </div>
        </div>
        
        <div className="card">
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: '#C9B99A',
            marginBottom: '8px',
          }}>
            COMPLETED TODAY
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            color: '#F5ECD7',
          }}>
            18
          </div>
        </div>
        
        <div className="card">
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: '#C9B99A',
            marginBottom: '8px',
          }}>
            AVG RESPONSE TIME
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            color: '#F5ECD7',
          }}>
            2.4m
          </div>
        </div>
        
        <div className="card">
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: '#C9B99A',
            marginBottom: '8px',
          }}>
            SATISFACTION RATE
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            color: '#F5ECD7',
          }}>
            98.2%
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid #2E1A0E',
        paddingBottom: '16px',
      }}>
        {['active', 'pending', 'completed', 'all'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? '#C8813A' : 'transparent',
              color: activeTab === tab ? '#120A06' : '#C9B99A',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              fontWeight: activeTab === tab ? 500 : 400,
              padding: '8px 16px',
              borderRadius: '100px',
              border: 'none',
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.2s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Conversations List */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Recent Conversations</h2>
          <button className="panel-action">Start new conversation</button>
        </div>
        <div className="panel-body">
          {filteredConversations.map((conv) => (
            <div key={conv.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px 0',
              borderBottom: '1px solid #2E1A0E',
              background: conv.unread ? 'rgba(200, 129, 58, 0.05)' : 'transparent',
            }}>
              <div style={{
                position: 'relative',
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: conv.status === 'active' ? '#C8813A' : 
                            conv.status === 'pending' ? '#4299E1' : '#2E1A0E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: conv.status === 'active' ? '#120A06' : '#C9B99A',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '18px',
                  fontWeight: 500,
                }}>
                  {conv.client.charAt(0)}
                </div>
                {conv.unread && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#C8813A',
                    border: '2px solid #120A06',
                  }} />
                )}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#F5ECD7',
                  }}>
                    {conv.client}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '12px',
                      color: '#C9B99A',
                    }}>
                      {conv.time}
                    </div>
                    <span className={`pill ${
                      conv.status === 'active' ? 'pill-ok' :
                      conv.status === 'pending' ? 'pill-info' : 'pill-amber'
                    }`}>
                      {conv.status}
                    </span>
                  </div>
                </div>
                
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  color: '#C9B99A',
                  marginBottom: '12px',
                }}>
                  {conv.message}
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '12px',
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
                    Reply
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
                    View details
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