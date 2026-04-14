import { createClient } from '@/lib/supabase/server';

export default async function ConversationsPage() {
  const supabase = await createClient();
  
  // Fetch real conversations with client names
  const { data: conversations } = await supabase
    .from('conversations')
    .select('*, clients(name)')
    .order('last_message_at', { ascending: false });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 120px)',
      background: '#1C0F0A',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '28px',
          fontWeight: 400,
          color: '#F5ECD7',
          margin: 0,
        }}>
          Conversations
        </h1>
        
        <div style={{
          display: 'flex',
          gap: '8px',
        }}>
          <button className="btn-secondary" style={{
            fontSize: '13px',
            padding: '8px 16px',
          }}>
            Filter
          </button>
          <button className="btn-primary" style={{
            fontSize: '13px',
            padding: '8px 16px',
          }}>
            New conversation
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: '#120A06',
          border: '1px solid #2E1A0E',
          borderRadius: '8px',
          padding: '16px',
          flex: 1,
        }}>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#C8813A',
            marginBottom: '4px',
          }}>
            Total
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            color: '#F5ECD7',
          }}>
            {conversations?.length || 0}
          </div>
        </div>
        
        <div style={{
          background: '#120A06',
          border: '1px solid #2E1A0E',
          borderRadius: '8px',
          padding: '16px',
          flex: 1,
        }}>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#C8813A',
            marginBottom: '4px',
          }}>
            Active
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            color: '#F5ECD7',
          }}>
            {conversations?.filter(c => c.status === 'active').length || 0}
          </div>
        </div>
        
        <div style={{
          background: '#120A06',
          border: '1px solid #2E1A0E',
          borderRadius: '8px',
          padding: '16px',
          flex: 1,
        }}>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#C8813A',
            marginBottom: '4px',
          }}>
            Completed
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            color: '#F5ECD7',
          }}>
            {conversations?.filter(c => c.status === 'completed').length || 0}
          </div>
        </div>
        
        <div style={{
          background: '#120A06',
          border: '1px solid #2E1A0E',
          borderRadius: '8px',
          padding: '16px',
          flex: 1,
        }}>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#C8813A',
            marginBottom: '4px',
          }}>
            Gaps identified
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            color: '#F5ECD7',
          }}>
            {conversations?.reduce((sum, conv) => sum + (conv.gaps_identified || 0), 0) || 0}
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div style={{
        flex: 1,
        background: '#120A06',
        border: '1px solid #2E1A0E',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #2E1A0E',
        }}>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: '#F5ECD7',
            marginBottom: '16px',
          }}>
            All conversations
          </div>
          
          <div style={{
            display: 'flex',
            gap: '8px',
          }}>
            <button style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              fontWeight: 500,
              padding: '6px 12px',
              borderRadius: '100px',
              background: '#C8813A',
              color: '#120A06',
              border: 'none',
              cursor: 'pointer',
            }}>
              All
            </button>
            <button style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              fontWeight: 500,
              padding: '6px 12px',
              borderRadius: '100px',
              background: 'transparent',
              color: '#C9B99A',
              border: '1px solid #2E1A0E',
              cursor: 'pointer',
            }}>
              Active
            </button>
            <button style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              fontWeight: 500,
              padding: '6px 12px',
              borderRadius: '100px',
              background: 'transparent',
              color: '#C9B99A',
              border: '1px solid #2E1A0E',
              cursor: 'pointer',
            }}>
              Completed
            </button>
          </div>
        </div>
        
        <div style={{
          flex: 1,
          overflowY: 'auto',
        }}>
          {conversations && conversations.length > 0 ? (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #2E1A0E',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#C8813A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#120A06',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '16px',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    {conversation.clients?.name?.charAt(0) || 'C'}
                  </div>
                  
                  {/* Content */}
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
                        {conversation.clients?.name || 'Client'}
                      </div>
                      <div style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '11px',
                        color: '#C9B99A',
                      }}>
                        {conversation.last_message_at ? formatTimeAgo(conversation.last_message_at) : 'No messages'}
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '12px',
                        color: '#C9B99A',
                        lineHeight: 1.4,
                        maxWidth: '70%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {conversation.last_message || 'No message yet'}
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        {conversation.gaps_identified && conversation.gaps_identified > 0 && (
                          <span style={{
                            background: '#E53E3E',
                            color: '#FFFFFF',
                            fontSize: '10px',
                            fontWeight: 500,
                            padding: '2px 6px',
                            borderRadius: '100px',
                          }}>
                            {conversation.gaps_identified} gap{conversation.gaps_identified > 1 ? 's' : ''}
                          </span>
                        )}
                        
                        <span style={{
                          background: conversation.status === 'active' ? '#38A169' : '#C9B99A',
                          color: conversation.status === 'active' ? '#120A06' : '#1C0F0A',
                          fontSize: '10px',
                          fontWeight: 500,
                          padding: '2px 8px',
                          borderRadius: '100px',
                        }}>
                          {conversation.status || 'unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '24px',
                color: '#F5ECD7',
                marginBottom: '16px',
              }}>
                No conversations yet
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#C9B99A',
                lineHeight: 1.6,
                maxWidth: '400px',
                margin: '0 auto',
              }}>
                When clients message you on WhatsApp, conversations will appear here.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}