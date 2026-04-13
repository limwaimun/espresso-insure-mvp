import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function DashboardHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // This shouldn't happen because layout redirects, but handle it
    return <div>Please log in</div>;
  }
  
  // Fetch user profile for greeting
  let profile: { name: string } | null = null;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();
    profile = data;
  } catch (error) {
    // Profile might not exist yet
    console.error('Profile fetch error:', error);
  }
  
  // Check if user has any clients
  const { count: clientCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true });
  
  // If no clients, show onboarding screen
  if (clientCount === 0) {
    return (
      <div style={{ width: '100%' }}>
        {/* Greeting */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '32px',
            fontWeight: 400,
            color: '#F5ECD7',
            margin: '0 0 8px 0',
          }}>
            Welcome to Espresso, {profile?.name || 'User'}!
          </h1>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '16px',
            color: '#C9B99A',
            lineHeight: 1.5,
          }}>
            Import your client list so Maya can start helping you manage renewals, conversations, and alerts.
          </p>
        </div>
        
        {/* Onboarding Card */}
        <div className="panel" style={{
          maxWidth: '640px',
          margin: '0 auto',
          textAlign: 'center',
        }}>
          <div className="panel-body" style={{ padding: '40px' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
            }}>
              {/* Primary button */}
              <Link href="/dashboard/import" style={{ textDecoration: 'none', width: '100%' }}>
                <button className="btn-primary" style={{
                  fontSize: '16px',
                  padding: '16px 32px',
                  width: '100%',
                  maxWidth: '400px',
                }}>
                  Import clients from Excel / CSV
                </button>
              </Link>
              
              {/* Secondary link */}
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#C9B99A',
              }}>
                or{' '}
                <Link href="/dashboard/clients/new" style={{
                  color: '#C8813A',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}>
                  Add a client manually
                </Link>
              </div>
              
              {/* Divider */}
              <div style={{
                width: '100%',
                height: '1px',
                background: '#2E1A0E',
                margin: '24px 0',
              }} />
              
              {/* Bullet points */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                textAlign: 'left',
                width: '100%',
                maxWidth: '400px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}>
                  <div style={{
                    color: '#38A169',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}>
                    ✓
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    color: '#C9B99A',
                    lineHeight: 1.5,
                  }}>
                    Your dashboard populates with real data
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}>
                  <div style={{
                    color: '#38A169',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}>
                    ✓
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    color: '#C9B99A',
                    lineHeight: 1.5,
                  }}>
                    Maya tracks renewals and sends you alerts
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}>
                  <div style={{
                    color: '#38A169',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}>
                    ✓
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    color: '#C9B99A',
                    lineHeight: 1.5,
                  }}>
                    Clients can reach you via WhatsApp through Maya
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // If user has clients, show normal dashboard
  // Fetch policy metrics
  const { count: policyCount } = await supabase.from('policies').select('*', { count: 'exact', head: true });
  
  const { data: allPolicies } = await supabase.from('policies').select('premium, renewal_date, status');
  
  const totalPremium = allPolicies?.reduce((sum, p) => sum + (p.premium || 0), 0) || 0;
  const formattedPremium = totalPremium > 0 ? `$${totalPremium.toLocaleString()}` : '$0';
  
  const renewalCount = allPolicies?.filter(p => {
    if (!p.renewal_date) return false;
    const renewalDate = new Date(p.renewal_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return renewalDate <= thirtyDaysFromNow && renewalDate >= new Date();
  }).length || 0;
  
  // For now, hardcode conversation count until conversations table exists
  const conversationCount = 0;
  
  // Empty arrays for now
  const recentConversations: any[] = [];
  const alerts: any[] = [];
  
  // Metric cards data
  const metricCards = [
    { 
      id: 1, 
      title: 'CLIENTS', 
      value: clientCount?.toString() || '0', 
      change: clientCount > 0 ? `${clientCount} total` : 'No data yet', 
      color: 'amber' 
    },
    { 
      id: 2, 
      title: 'RENEWALS', 
      value: renewalCount?.toString() || '0', 
      change: renewalCount > 0 ? `${renewalCount} due in 30 days` : 'No renewals due', 
      color: renewalCount > 0 ? 'danger' : 'ok' 
    },
    { 
      id: 3, 
      title: 'CHATS', 
      value: conversationCount?.toString() || '0', 
      change: 'No data yet', 
      color: 'ok' 
    },
    { 
      id: 4, 
      title: 'POLICIES', 
      value: policyCount?.toString() || '0', 
      change: policyCount > 0 ? `${policyCount} total` : 'No data yet', 
      color: 'info' 
    },
    { 
      id: 5, 
      title: 'PREMIUM', 
      value: formattedPremium, 
      change: totalPremium > 0 ? 'Annual premium' : 'No data yet', 
      color: 'amber' 
    },
    { 
      id: 6, 
      title: 'RATE', 
      value: '0%', 
      change: 'No data yet', 
      color: 'ok' 
    },
  ];
  
  // Format recent conversations for display
  const formattedConversations = recentConversations?.map((conv: any) => ({
    id: conv.id,
    client: conv.clients?.name || 'Client',
    message: conv.last_message || 'No message',
    time: conv.last_message_at ? formatTimeAgo(conv.last_message_at) : 'No time',
    status: conv.status || 'unknown',
  })) || [];
  
  // Format alerts for display
  const formattedAlerts = alerts?.map((alert: any) => ({
    id: alert.id,
    title: alert.title || 'Alert',
    client: alert.clients?.name || 'Client',
    time: alert.created_at ? formatTimeAgo(alert.created_at) : 'No time',
    priority: alert.priority || 'low',
  })) || [];

  return (
    <div style={{ width: '100%' }}>
      {/* Greeting */}
      <div style={{ marginBottom: '32px' }}>
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
          fontSize: '16px',
          color: '#C9B99A',
          lineHeight: 1.5,
        }}>
          Here's what's happening with your clients today.
        </p>
      </div>

      {/* Metric Grid */}
      <div className="metric-grid" style={{ marginBottom: '32px' }}>
        {metricCards.map((card) => (
          <div key={card.id} className={`card card-${card.color}`}>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              color: '#C9B99A',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
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
              marginBottom: '6px',
            }}>
              {card.value}
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: card.color === 'danger' ? '#E53E3E' : '#5AB87A',
            }}>
              {card.change}
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
      }}>
        {/* Recent Conversations */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Recent conversations</span>
            <Link href="/dashboard/conversations" style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#C8813A',
              textDecoration: 'none',
            }}>
              View all →
            </Link>
          </div>
          <div className="panel-body">
            {formattedConversations.length > 0 ? (
              formattedConversations.map((conv) => (
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
                    background: '#C8813A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#120A06',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    {conv.client.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#F5ECD7',
                      marginBottom: '2px',
                    }}>
                      {conv.client}
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '12px',
                      color: '#C9B99A',
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {conv.message}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '11px',
                    color: '#C9B99A',
                    whiteSpace: 'nowrap',
                  }}>
                    {conv.time}
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

        {/* Recent Alerts */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Recent alerts</span>
            <Link href="/dashboard/alerts" style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#C8813A',
              textDecoration: 'none',
            }}>
              View all →
            </Link>
          </div>
          <div className="panel-body">
            {formattedAlerts.length > 0 ? (
              formattedAlerts.map((alert) => (
                <div key={alert.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid #2E1A0E',
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: alert.priority === 'high' ? '#E53E3E' : 
                               alert.priority === 'medium' ? '#C8813A' : '#38A169',
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#F5ECD7',
                      marginBottom: '2px',
                    }}>
                      {alert.title}
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '12px',
                      color: '#C9B99A',
                    }}>
                      {alert.client}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '11px',
                    color: '#C9B99A',
                    whiteSpace: 'nowrap',
                  }}>
                    {alert.time}
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
                No alerts yet
              </div>
            )}
          </div>
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
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}