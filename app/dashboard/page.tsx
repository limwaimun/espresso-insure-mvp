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
  if ((clientCount ?? 0) === 0) {
    return (
      <div style={{ width: '100%' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '32px',
            fontWeight: 400,
            color: '#F5ECD7',
            margin: '0 0 8px 0',
          }}>
            Welcome to Espresso!
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
  // Fetch policy metrics for current user
  const { count: policyCount } = await supabase.from('policies').select('*', { count: 'exact', head: true }).eq('ifa_id', user.id);
  
  const { data: allPolicies } = await supabase.from('policies').select('premium, renewal_date, status').eq('ifa_id', user.id);
  
  // Calculate total premium
  const totalPremium = (allPolicies || []).reduce((sum: number, p: any) => sum + (Number(p.premium) || 0), 0);
  const formattedPremium = totalPremium > 0 ? `$${totalPremium.toLocaleString()}` : '$0';
  
  // Calculate renewals due in next 90 days (3 months for IFA planning)
  const currentTime = new Date();
  const ninetyDays = new Date();
  ninetyDays.setDate(ninetyDays.getDate() + 90);
  const renewalCount = (allPolicies || []).filter((p: any) => {
    if (!p.renewal_date) return false;
    const d = new Date(p.renewal_date);
    return d >= currentTime && d <= ninetyDays;
  }).length;
  
  // Fetch conversation count
  const { count: conversationCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true });
  
  // Fetch clients for birthday calculation
  const { data: allClients } = await supabase.from('clients').select('birthday').eq('ifa_id', user.id);
  
  // Calculate upcoming birthdays (next 30 days, compare month/day only)
  const today = new Date();
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  let birthdayCount = 0;
  if (allClients) {
    birthdayCount = allClients.filter((client: any) => {
      if (!client.birthday) return false;
      
      try {
        const birthday = new Date(client.birthday);
        const birthdayThisYear = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        
        // If birthday has already passed this year, check next year
        if (birthdayThisYear < today) {
          birthdayThisYear.setFullYear(today.getFullYear() + 1);
        }
        
        return birthdayThisYear >= today && birthdayThisYear <= thirtyDaysFromNow;
      } catch {
        return false;
      }
    }).length;
  }
  
  // Create null-safe versions
  const safeClientCount = clientCount ?? 0;
  const safePolicyCount = policyCount ?? 0;
  const safeConversationCount = conversationCount ?? 0;
  const safeBirthdayCount = birthdayCount ?? 0;
  
  // Format conversation change text
  const conversationChangeText = safeConversationCount > 0 
    ? `${safeConversationCount} total` 
    : 'No data yet';
  
  // Fetch recent conversations with client info
  const { data: recentConversations } = await supabase
    .from('conversations')
    .select('*, clients(name, company)')
    .order('last_message_at', { ascending: false })
    .limit(5);
  
  // Fetch recent unresolved alerts with client info
  const { data: alerts } = await supabase
    .from('alerts')
    .select('*, clients(name)')
    .eq('resolved', false)
    .order('created_at', { ascending: false })
    .limit(5);
  
  // Metric cards data (6 cards with BIRTHDAYS)
  const metricCards = [
    { 
      id: 1, 
      title: 'CLIENTS', 
      value: safeClientCount.toString(), 
      change: safeClientCount > 0 ? `${safeClientCount} total` : 'No data yet', 
      color: 'amber' 
    },
    { 
      id: 2, 
      title: 'RENEWALS', 
      value: renewalCount.toString(), 
      change: renewalCount > 0 ? `${renewalCount} due in 90 days` : 'No renewals due', 
      color: renewalCount > 0 ? 'danger' : 'ok' 
    },
    { 
      id: 3, 
      title: 'CHATS', 
      value: safeConversationCount.toString(), 
      change: conversationChangeText, 
      color: 'ok' 
    },
    { 
      id: 4, 
      title: 'POLICIES', 
      value: safePolicyCount.toString(), 
      change: safePolicyCount > 0 ? `${safePolicyCount} total` : 'No data yet', 
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
      title: 'BIRTHDAYS', 
      value: safeBirthdayCount.toString(), 
      change: safeBirthdayCount > 0 ? `${safeBirthdayCount} this month` : 'None upcoming', 
      color: 'ok' 
    },
  ];
  
  // Format recent conversations for display
  const formattedConversations = recentConversations?.map((conv: any) => {
    const clientName = conv.clients?.name || 'Client';
    const company = conv.clients?.company ? ` · ${conv.clients.company}` : '';
    const lastMessage = conv.last_message ? 
      conv.last_message.slice(0, 60) + (conv.last_message.length > 60 ? '...' : '') : 
      'No message';
    
    return {
      id: conv.id,
      client: clientName,
      company: company,
      message: lastMessage,
      time: conv.last_message_at ? formatTimeAgo(conv.last_message_at) : 'No time',
      status: conv.status || 'active',
    };
  }) || [];
  
  // Format alerts for display
  const formattedAlerts = alerts?.map((alert: any) => ({
    id: alert.id,
    title: alert.title || 'Alert',
    client: alert.clients?.name || 'Client',
    time: alert.created_at ? formatTimeAgo(alert.created_at) : 'No time',
    priority: alert.priority || 'info',
  })) || [];

  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      padding: '0',
      minHeight: '100vh',
    }}>
      <div className="px-8 py-6">
        {/* Title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}>
          <h1 style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '28px',
            fontWeight: 400,
            color: '#F5ECD7',
            margin: 0,
          }}>Dashboard</h1>
        </div>

        {/* Greeting */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '16px',
            color: '#C9B99A',
            lineHeight: 1.5,
          }}>
            Here's what's happening with your clients today.
          </p>
        </div>

        {/* Metric Grid - Match All Clients style */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
        }}>
          {metricCards.map((card) => (
            <div key={card.id} style={{
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
                {card.title}
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '24px',
                fontWeight: 600,
                color: '#F5ECD7',
              }}>
                {card.value}
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: card.color === 'danger' ? '#E53E3E' : '#5AB87A',
                marginTop: '4px',
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
        <div style={{
          background: '#120A06',
          border: '1px solid #2E1A0E',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #2E1A0E',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              color: '#F5ECD7',
            }}>Recent conversations</span>
            <Link href="/dashboard/conversations" style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#C8813A',
              textDecoration: 'none',
            }}>
              View all →
            </Link>
          </div>
          <div style={{ padding: '16px 20px' }}>
            {formattedConversations.length > 0 ? (
              formattedConversations.map((conv) => (
                <Link 
                  key={conv.id} 
                  href="/dashboard/conversations"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 0',
                    borderBottom: '1px solid #2E1A0E',
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                >
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexWrap: 'wrap',
                    }}>
                      <span>{conv.client}</span>
                      <span style={{ color: '#C9B99A', fontWeight: 400 }}>{conv.company}</span>
                      <span className={`pill ${conv.status === 'active' ? 'pill-ok' : 'pill-amber'}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {conv.status === 'active' ? 'Active' : 'Waiting'}
                      </span>
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
                </Link>
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
        <div style={{
          background: '#120A06',
          border: '1px solid #2E1A0E',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #2E1A0E',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              color: '#F5ECD7',
            }}>Recent alerts</span>
            <Link href="/dashboard/alerts" style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#C8813A',
              textDecoration: 'none',
            }}>
              View all →
            </Link>
          </div>
          <div style={{ padding: '16px 20px' }}>
            {formattedAlerts.length > 0 ? (
              formattedAlerts.map((alert) => (
                <Link 
                  key={alert.id} 
                  href="/dashboard/alerts"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 0',
                    borderBottom: '1px solid #2E1A0E',
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                >
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexWrap: 'wrap',
                    }}>
                      <span>{alert.title}</span>
                      <span className={`pill ${alert.priority === 'high' ? 'pill-danger' : alert.priority === 'medium' ? 'pill-amber' : 'pill-info'}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {alert.priority === 'high' ? 'High' : alert.priority === 'medium' ? 'Medium' : 'Info'}
                      </span>
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
                </Link>
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