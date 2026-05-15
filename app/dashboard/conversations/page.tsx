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
      padding: '24px 28px',
      background: '#F7F4F0',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <h1 style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 22,
          fontWeight: 500,
          color: '#1A1410',
          margin: 0,
        }}>
          Conversations
        </h1>
      </div>

      {/* Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
        marginBottom: 20,
      }}>
        {[
          { label: 'Total', value: conversations?.length || 0 },
          { label: 'Active', value: conversations?.filter(c => c.status === 'active').length || 0 },
          { label: 'Completed', value: conversations?.filter(c => c.status === 'completed').length || 0 },
          { label: 'Gaps identified', value: conversations?.reduce((sum, conv) => sum + (conv.gaps_identified || 0), 0) || 0 },
        ].map(k => (
          <div key={k.label} style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#1A1410', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 500, color: '#1A1410', lineHeight: 1 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Conversations List */}
      <div style={{
        background: '#FFFFFF',
        border: '0.5px solid #E8E2DA',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 16px',
          borderBottom: '0.5px solid #E8E2DA',
          background: '#FAFAF8',
        }}>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            fontWeight: 500,
            color: '#1A1410',
          }}>
            All conversations
          </div>
        </div>
        
        <div>
          {conversations && conversations.length > 0 ? (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                style={{
                  padding: '14px 16px',
                  borderBottom: '0.5px solid #E8E2DA',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#FEF3E2',
                  border: '1px solid #FAC775',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#854F0B',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 14,
                  fontWeight: 500,
                  flexShrink: 0,
                }}>
                  {conversation.clients?.name?.charAt(0) || 'C'}
                </div>
                
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 3,
                  }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#1A1410',
                    }}>
                      {conversation.clients?.name || 'Client'}
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 11,
                      color: '#5F5A57',
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
                      fontSize: 12,
                      color: '#5F5A57',
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
                      gap: 6,
                    }}>
                      {conversation.gaps_identified && conversation.gaps_identified > 0 && (
                        <span style={{
                          background: '#FCEBEB',
                          color: '#A32D2D',
                          border: '0.5px solid #F7C1C1',
                          fontSize: 10,
                          fontWeight: 500,
                          padding: '2px 7px',
                          borderRadius: 100,
                        }}>
                          {conversation.gaps_identified} gap{conversation.gaps_identified > 1 ? 's' : ''}
                        </span>
                      )}
                      
                      <span style={{
                        background: conversation.status === 'active' ? '#E1F5EE' : '#F3F2F0',
                        color: conversation.status === 'active' ? '#0F6E56' : '#5F5A57',
                        border: `0.5px solid ${conversation.status === 'active' ? '#9FE1CB' : '#D8D4CE'}`,
                        fontSize: 10,
                        fontWeight: 500,
                        padding: '2px 8px',
                        borderRadius: 100,
                      }}>
                        {conversation.status || 'unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              padding: '48px 20px',
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 16,
                fontWeight: 500,
                color: '#1A1410',
                marginBottom: 8,
              }}>
                No conversations yet
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                color: '#5F5A57',
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
