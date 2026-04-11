'use client';

import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';

export default function ConversationsPage() {
  const isMobile = useIsMobile();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(isMobile ? null : 1);
  
  // If on mobile and no conversation selected, show list only
  const showListOnly = isMobile && selectedConversationId === null;
  const showChatOnly = isMobile && selectedConversationId !== null;
  
  // Conversation items data
  const conversations = [
    { 
      id: 1, 
      client: 'Sarah Lim', 
      avatarColor: '#8A2BE2', // Purple
      avatarInitial: 'S',
      preview: 'Maya: How many employees do you have?',
      time: '2m',
      dotColor: '#38A169', // Green
      status: 'active',
      selected: true
    },
    { 
      id: 2, 
      client: 'Raymond Chew', 
      avatarColor: '#4299E1', // Blue
      avatarInitial: 'R',
      preview: 'I\'ll check with my wife and get back',
      time: '18m',
      dotColor: '#C8813A', // Orange/Amber
      status: 'active',
      selected: false
    },
    { 
      id: 3, 
      client: 'Priya Nair', 
      avatarColor: '#38A169', // Green
      avatarInitial: 'P',
      preview: 'Conversation completed · 3 gaps identified',
      time: '1h',
      dotColor: '#C9B99A', // Grey
      status: 'completed',
      selected: false
    },
    { 
      id: 4, 
      client: 'Marcus Wong', 
      avatarColor: '#E53E3E', // Red
      avatarInitial: 'M',
      preview: 'Renewal reminder sent for AIA policy',
      time: '2h',
      dotColor: '#C9B99A', // Grey
      status: 'completed',
      selected: false
    },
    { 
      id: 5, 
      client: 'Angela Foo', 
      avatarColor: '#C8813A', // Amber
      avatarInitial: 'A',
      preview: 'Thanks! I\'ll review the quote and revert',
      time: '3h',
      dotColor: '#C9B99A', // Grey
      status: 'completed',
      selected: false
    },
  ];

  // Mobile: show list only or chat only
  if (showListOnly) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
      }}>
        {/* Mobile header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #2E1A0E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '20px',
            fontWeight: 400,
            color: '#F5ECD7',
          }}>
            Conversations
          </div>
          <button style={{
            background: 'transparent',
            border: 'none',
            color: '#C9B99A',
            fontSize: '20px',
            cursor: 'pointer',
          }}>
            ✕
          </button>
        </div>

        {/* Search input */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #2E1A0E',
        }}>
          <input
            type="text"
            placeholder="Search conversations"
            className="input"
            style={{
              width: '100%',
            }}
          />
        </div>

        {/* Stats bar */}
        <div style={{
          padding: '8px 16px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '11px',
          color: '#C9B99A',
          borderBottom: '1px solid #2E1A0E',
        }}>
          3 active · 18 completed today
        </div>

        {/* Conversation list */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
        }}>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConversationId(conv.id)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #2E1A0E',
                background: conv.selected ? 'rgba(200, 129, 58, 0.08)' : 'transparent',
                borderLeft: conv.selected ? '2px solid #C8813A' : 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px',
              }}>
                {/* Avatar */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: conv.avatarColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#F5ECD7',
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '20px',
                  fontWeight: 500,
                }}>
                  {conv.avatarInitial}
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: conv.dotColor,
                      }} />
                      <div style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '11px',
                        color: '#C9B99A',
                      }}>
                        {conv.time}
                      </div>
                    </div>
                  </div>

                  {/* Preview text */}
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '12px',
                    color: '#C9B99A',
                    lineHeight: 1.4,
                  }}>
                    {conv.preview}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Desktop or mobile with chat selected
  return (
    <div style={{
      display: 'flex',
      height: isMobile ? '100vh' : 'calc(100vh - 48px)',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '0' : '0',
      margin: '-24px',
      overflow: 'hidden',
    }}>
      {/* LEFT PANEL - 280px on desktop, hidden on mobile when chat is open */}
      {!isMobile && (
        <div style={{
          width: '280px',
          flexShrink: 0,
          background: '#1C0F0A',
          borderRight: '1px solid #2E1A0E',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}>
        {/* Search input */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #2E1A0E',
        }}>
          <input
            type="text"
            placeholder="Search conversations"
            className="input"
            style={{
              width: '100%',
            }}
          />
        </div>

        {/* Stats bar */}
        <div style={{
          padding: '8px 16px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '11px',
          color: '#C9B99A',
          borderBottom: '1px solid #2E1A0E',
        }}>
          3 active · 18 completed today
        </div>

        {/* Conversation list */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
        }}>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => {
                if (isMobile) {
                  setSelectedConversationId(conv.id);
                } else {
                  // For desktop, we could update selected state
                  // Currently just log for demo
                  console.log('Selected conversation:', conv.id);
                }
              }}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #2E1A0E',
                background: conv.selected ? 'rgba(200, 129, 58, 0.08)' : 'transparent',
                borderLeft: conv.selected ? '2px solid #C8813A' : 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px',
              }}>
                {/* Avatar */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: conv.avatarColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#F5ECD7',
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '20px',
                  fontWeight: 500,
                }}>
                  {conv.avatarInitial}
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: conv.dotColor,
                      }} />
                      <div style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '11px',
                        color: '#C9B99A',
                      }}>
                        {conv.time}
                      </div>
                    </div>
                  </div>

                  {/* Preview text */}
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '12px',
                    color: '#C9B99A',
                    lineHeight: 1.4,
                  }}>
                    {conv.preview}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* CHAT WINDOW */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#111B21',
        height: isMobile ? '500px' : '100%',
        overflow: 'hidden',
      }}>
        {/* Chat header - 60px */}
        <div style={{
          padding: '0 24px',
          background: '#1F2C33',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            {isMobile && (
              <button 
                onClick={() => setSelectedConversationId(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#C9B99A',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '0',
                  marginRight: '8px',
                }}
              >
                ←
              </button>
            )}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#8A2BE2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F5ECD7',
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '18px',
              fontWeight: 500,
            }}>
              S
            </div>
            <div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: '#F5ECD7',
              }}>
                Sarah Lim · Café Latte Pte Ltd
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '2px',
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#38A169',
                }} />
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '12px',
                  color: '#C9B99A',
                }}>
                  Maya is handling · You are in the group
                </div>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <button className="btn-secondary" style={{
              fontSize: '12px',
              padding: '6px 16px',
            }}>
              Pause Maya
            </button>
            <button className="btn-secondary" style={{
              fontSize: '12px',
              padding: '6px 16px',
            }}>
              Brief me
            </button>
          </div>
        </div>

        {/* Chat messages */}
        <div style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          {/* Message 1 - Client */}
          <div style={{ alignSelf: 'flex-start', maxWidth: '70%' }}>
            <div style={{
              background: '#1F2C33',
              borderRadius: '0 12px 12px 12px',
              padding: '12px 16px',
              position: 'relative',
            }}>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#F5ECD7',
                lineHeight: 1.5,
                marginBottom: '4px',
              }}>
                Hi! I run a café and I think I need business insurance
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '10px',
                color: '#C9B99A',
                textAlign: 'right',
              }}>
                10:28 AM
              </div>
            </div>
          </div>

          {/* Message 2 - Maya */}
          <div style={{ alignSelf: 'flex-start', maxWidth: '70%' }}>
            <div style={{
              marginBottom: '4px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '8px',
              color: '#C8813A',
              fontWeight: 500,
              letterSpacing: '0.05em',
            }}>
              Maya
            </div>
            <div style={{
              background: 'rgba(0, 92, 75, 0.3)',
              borderRadius: '0 12px 12px 12px',
              padding: '12px 16px',
              position: 'relative',
            }}>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#F5ECD7',
                lineHeight: 1.5,
                marginBottom: '4px',
              }}>
                Hi Sarah! I'm Maya, David's assistant. Would you prefer to continue here or shall I message you privately?
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '10px',
                color: '#C9B99A',
                textAlign: 'right',
              }}>
                10:29 AM
              </div>
            </div>
          </div>

          {/* Message 3 - Client */}
          <div style={{ alignSelf: 'flex-start', maxWidth: '70%' }}>
            <div style={{
              background: '#1F2C33',
              borderRadius: '0 12px 12px 12px',
              padding: '12px 16px',
              position: 'relative',
            }}>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#F5ECD7',
                lineHeight: 1.5,
                marginBottom: '4px',
              }}>
                Here is fine!
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '10px',
                color: '#C9B99A',
                textAlign: 'right',
              }}>
                10:30 AM
              </div>
            </div>
          </div>

          {/* Message 4 - Maya */}
          <div style={{ alignSelf: 'flex-start', maxWidth: '70%' }}>
            <div style={{
              marginBottom: '4px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '8px',
              color: '#C8813A',
              fontWeight: 500,
              letterSpacing: '0.05em',
            }}>
              Maya
            </div>
            <div style={{
              background: 'rgba(0, 92, 75, 0.3)',
              borderRadius: '0 12px 12px 12px',
              padding: '12px 16px',
              position: 'relative',
            }}>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#F5ECD7',
                lineHeight: 1.5,
                marginBottom: '4px',
              }}>
                How many staff do you currently have?
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '10px',
                color: '#C9B99A',
                textAlign: 'right',
              }}>
                10:30 AM
              </div>
            </div>
          </div>

          {/* Message 5 - Client */}
          <div style={{ alignSelf: 'flex-start', maxWidth: '70%' }}>
            <div style={{
              background: '#1F2C33',
              borderRadius: '0 12px 12px 12px',
              padding: '12px 16px',
              position: 'relative',
            }}>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#F5ECD7',
                lineHeight: 1.5,
                marginBottom: '4px',
              }}>
                5 full-time, 3 part-time
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '10px',
                color: '#C9B99A',
                textAlign: 'right',
              }}>
                10:31 AM
              </div>
            </div>
          </div>

          {/* Message 6 - Maya */}
          <div style={{ alignSelf: 'flex-start', maxWidth: '70%' }}>
            <div style={{
              marginBottom: '4px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '8px',
              color: '#C8813A',
              fontWeight: 500,
              letterSpacing: '0.05em',
            }}>
              Maya
            </div>
            <div style={{
              background: 'rgba(0, 92, 75, 0.3)',
              borderRadius: '0 12px 12px 12px',
              padding: '12px 16px',
              position: 'relative',
            }}>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#F5ECD7',
                lineHeight: 1.5,
                marginBottom: '4px',
              }}>
                And do you own or rent your café premises?
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '10px',
                color: '#C9B99A',
                textAlign: 'right',
              }}>
                10:31 AM
              </div>
            </div>
          </div>

          {/* Typing indicator */}
          <div style={{ alignSelf: 'flex-start', maxWidth: '70%' }}>
            <div style={{
              marginBottom: '4px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '8px',
              color: '#C8813A',
              fontWeight: 500,
              letterSpacing: '0.05em',
            }}>
              Maya
            </div>
            <div style={{
              background: 'rgba(0, 92, 75, 0.3)',
              borderRadius: '0 12px 12px 12px',
              padding: '12px 16px',
              position: 'relative',
              minWidth: '80px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                justifyContent: 'center',
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#F5ECD7',
                  opacity: 0.6,
                  animation: 'pulse 1.5s infinite',
                }} />
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#F5ECD7',
                  opacity: 0.6,
                  animation: 'pulse 1.5s infinite',
                  animationDelay: '0.2s',
                }} />
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#F5ECD7',
                  opacity: 0.6,
                  animation: 'pulse 1.5s infinite',
                  animationDelay: '0.4s',
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Status bar above input */}
        <div style={{
          padding: '8px 16px',
          background: 'rgba(200, 129, 58, 0.06)',
          borderTop: '1px solid #2E1A0E',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '11px',
          color: '#C9B99A',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span>🕐</span>
          <span>Maya is handling · Client brief ready in ~2 min</span>
        </div>

        {/* Input area */}
        <div style={{
          padding: '16px 24px',
          background: '#1F2C33',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <input
            type="text"
            placeholder="Message Sarah Lim..."
            className="input"
            style={{
              flex: 1,
              background: '#2A3B44',
              border: '1px solid #3D4F58',
              color: '#F5ECD7',
            }}
          />
          <button style={{
            background: '#C8813A',
            color: '#120A06',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            padding: '10px 20px',
            borderRadius: '100px',
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}