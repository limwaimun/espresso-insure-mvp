import { createClient } from '@/lib/supabase/server';

export default async function DashboardHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch user profile for greeting
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user?.id)
    .single();
  
  // Calculate date 30 days from now for renewals
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  // Real queries
  const { count: clientCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true });
  
  const { count: policyCount } = await supabase
    .from('policies')
    .select('*', { count: 'exact', head: true });
  
  const { count: conversationCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  
  const { count: renewalCount } = await supabase
    .from('policies')
    .select('*', { count: 'exact', head: true })
    .lte('renewal_date', thirtyDaysFromNow.toISOString());
  
  const { data: totalPremiumData } = await supabase
    .from('policies')
    .select('premium')
    .eq('status', 'active');
  
  // Calculate total premium
  const totalPremium = totalPremiumData?.reduce((sum, p) => sum + (p.premium || 0), 0) || 0;
  
  // Format premium as currency
  const formattedPremium = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(totalPremium);
  
  // Recent conversations
  const { data: recentConversations } = await supabase
    .from('conversations')
    .select('*, clients(name)')
    .order('last_message_at', { ascending: false })
    .limit(3);
  
  // Alerts
  const { data: alerts } = await supabase
    .from('alerts')
    .select('*')
    .eq('resolved', false)
    .order('created_at', { ascending: false })
    .limit(3);
  
  // Metric cards data
  const metricCards = [
    { id: 1, title: 'CLIENTS', value: clientCount?.toString() || '0', change: 'No data yet', color: 'amber' },
    { id: 2, title: 'RENEWALS', value: renewalCount?.toString() || '0', change: 'No data yet', color: 'danger' },
    { id: 3, title: 'CHATS', value: conversationCount?.toString() || '0', change: 'No data yet', color: 'ok' },
    { id: 4, title: 'POLICIES', value: policyCount?.toString() || '0', change: 'No data yet', color: 'info' },
    { id: 5, title: 'PREMIUM', value: formattedPremium, change: 'No data yet', color: 'amber' },
    { id: 6, title: 'RATE', value: '0%', change: 'No data yet', color: 'ok' },
  ];
  
  // Format recent conversations for display
  const formattedConversations = recentConversations?.map((conv: any) => ({
    id: conv.id,
    client: conv.clients?.name || 'Client',
    time: conv.last_message_at ? formatTimeAgo(conv.last_message_at) : 'No messages',
    message: conv.last_message || 'No message',
    status: conv.status,
  })) || [];
  
  // Format alerts for display
  const formattedAlerts = alerts?.map((alert: any) => ({
    id: alert.id,
    type: alert.type,
    title: alert.title,
    client: alert.client_name || 'Client',
    policy: alert.policy_name || 'Policy',
    priority: alert.priority,
  })) || [];

  return (
    <>
      {/* SECTION 1: Welcome & Date */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '32px',
            fontWeight: 400,
            color: '#F5ECD7',
            margin: '0 0 8px 0',
          }}>
            Good morning, {profile?.name || 'User'}
          </h1>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            color: '#C9B99A',
            margin: 0,
          }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* SECTION 2: Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {metricCards.map((card) => (
          <div key={card.id} style={{
            background: '#120A06',
            border: '1px solid #2E1A0E',
            borderRadius: '8px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#C8813A',
              marginBottom: '8px',
            }}>
              {card.title}
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '28px',
              fontWeight: 600,
              color: '#F5ECD7',
              marginBottom: '8px',
            }}>
              {card.value}
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#C9B99A',
            }}>
              {card.change}
            </div>
          </div>
        ))}
      </div>

      {/* SECTION 3: Conversations & Alerts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
      }}>
        {/* Left Panel: Recent Conversations */}
        <div style={{
          background: '#120A06',
          border: '1px solid #2E1A0E',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}>
            <h2 style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              color: '#F5ECD7',
              margin: 0,
            }}>
              Recent conversations
            </h2>
            <a href="/dashboard/conversations" style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#C8813A',
              textDecoration: 'none',
            }}>
              View all →
            </a>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {formattedConversations.length > 0 ? (
              formattedConversations.map((conv) => (
                <div key={conv.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: 'rgba(28, 15, 10, 0.5)',
                  borderRadius: '6px',
                  border: '1px solid #2E1A0E',
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#C8813A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#120A06',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    fontWeight: 600,
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
                        fontSize: '13px',
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
                      lineHeight: 1.4,
                    }}>
                      {conv.message}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#C9B99A',
              }}>
                No conversations yet
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Alerts */}
        <div style={{
          background: '#120A06',
          border: '1px solid #2E1A0E',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}>
            <h2 style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              color: '#F5ECD7',
              margin: 0,
            }}>
              Alerts
            </h2>
            <a href="/dashboard/alerts" style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#C8813A',
              textDecoration: 'none',
            }}>
              View all →
            </a>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {formattedAlerts.length > 0 ? (
              formattedAlerts.map((alert) => (
                <div key={alert.id} style={{
                  padding: '12px',
                  background: 'rgba(28, 15, 10, 0.5)',
                  borderRadius: '6px',
                  border: '1px solid #2E1A0E',
                  borderLeft: `3px solid ${alert.priority === 'high' ? '#E53E3E' : alert.priority === 'medium' ? '#C8813A' : '#38A169'}`,
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px',
                  }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#F5ECD7',
                    }}>
                      {alert.title}
                    </div>
                    <span style={{
                      background: alert.priority === 'high' ? '#E53E3E' : alert.priority === 'medium' ? '#C8813A' : '#38A169',
                      color: alert.priority === 'high' ? '#FFFFFF' : '#120A06',
                      fontSize: '10px',
                      fontWeight: 500,
                      padding: '2px 8px',
                      borderRadius: '100px',
                    }}>
                      {alert.priority}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '12px',
                    color: '#C9B99A',
                    lineHeight: 1.4,
                  }}>
                    {alert.client} • {alert.policy}
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#C9B99A',
              }}>
                No alerts
              </div>
            )}
          </div>
        </div>
      </div>
    </>
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
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}