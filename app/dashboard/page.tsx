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
            fontSize: '28px',
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
            margin: 0,
          }}>
            Get started by importing your first client.
          </p>
        </div>
        
        <div style={{
          background: '#120A06',
          border: '1px solid #2E1A0E',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '20px',
            fontWeight: 500,
            color: '#F5ECD7',
            marginBottom: '12px',
          }}>
            No clients yet
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#C9B99A',
            marginBottom: '24px',
            maxWidth: '400px',
            margin: '0 auto 24px',
          }}>
            Import your client list to start managing policies, renewals, and claims.
          </div>
          <Link href="/dashboard/import" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{
              fontSize: '14px',
              padding: '10px 20px',
            }}>
              + Import clients
            </button>
          </Link>
        </div>
      </div>
    );
  }
  
  // ========== FETCH DATA FOR DASHBOARD ==========
  
  // Run ALL queries in parallel for maximum performance
  const today = new Date();
  const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  
  const [
    clientResult,
    policyResult,
    conversationResult,
    alertResult,
    renewalResult,
    birthdayResult,
    recentConvos,
    recentAlerts
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('policies').select('*', { count: 'exact', head: true }),
    supabase.from('conversations').select('*', { count: 'exact', head: true }),
    supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('resolved', false),
    supabase.from('policies').select('premium, renewal_date').gte('renewal_date', today.toISOString()).lte('renewal_date', ninetyDaysFromNow.toISOString()),
    supabase.from('clients').select('birthday'),
    supabase.from('conversations').select('*, clients(name, company)').order('last_message_at', { ascending: false }).limit(5),
    supabase.from('alerts').select('*, clients(name)').eq('resolved', false).order('created_at', { ascending: false }).limit(5),
  ]);
  
  // Extract counts and data
  const totalClientCount = clientResult.count || 0;
  const policyCount = policyResult.count || 0;
  const conversationCount = conversationResult.count || 0;
  const alertCount = alertResult.count || 0;
  
  // Calculate urgent renewals from renewal result
  const urgentRenewals = renewalResult.data?.filter(p => {
    if (!p.renewal_date) return false;
    const renewalDate = new Date(p.renewal_date);
    const diffDays = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  }).length || 0;
  
  // Calculate total premium from renewal result (includes all policies in next 90 days)
  const totalPremium = renewalResult.data?.reduce((sum, p) => sum + (Number(p.premium) || 0), 0) || 0;
  
  // For now, we need to fetch active policies separately for accurate count
  const { data: activePolicies } = await supabase
    .from('policies')
    .select('premium')
    .eq('status', 'active');
  
  const activePolicyCount = activePolicies?.length || 0;
  
  // Fetch open claims count
  const { count: openClaims } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'claim')
    .eq('resolved', false);
  
  // Fetch clients by type for breakdown
  const [
    { count: individualCount },
    { count: smeCount },
    { count: corporateCount }
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('type', 'individual'),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('type', 'sme'),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('type', 'corporate')
  ]);
  
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
  
  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      padding: '0',
      minHeight: '100vh',
    }}>
      <div className="px-8 py-6">
        {/* Title and Greeting */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}>
          <div>
            <h1 style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '28px',
              fontWeight: 400,
              color: '#F5ECD7',
              margin: 0,
            }}>
              Dashboard
            </h1>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: '#C9B99A',
              marginTop: '4px',
            }}>
              Welcome back, {profile?.name || 'Agent'}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/dashboard/import" style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{
                fontSize: '13px',
                padding: '8px 16px',
              }}>
                + Import clients
              </button>
            </Link>
          </div>
        </div>

        {/* 6 Metric Cards - Match All Clients style */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '32px',
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
              Total Clients
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#F5ECD7',
            }}>
              {totalClientCount || 0}
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
              Individual
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#F5ECD7',
            }}>
              {individualCount}
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
              SME
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#F5ECD7',
            }}>
              {smeCount}
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
              Corporate
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#F5ECD7',
            }}>
              {corporateCount}
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
              Total Premium
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#F5ECD7',
            }}>
              ${totalPremium.toLocaleString()}
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
              Active Policies
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#F5ECD7',
            }}>
              {activePolicyCount}
            </div>
          </div>
        </div>

        {/* Two-column layout: Recent Conversations + Recent Alerts */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
        }}>
          {/* Recent Conversations Panel */}
          <div style={{
            background: '#120A06',
            border: '1px solid #2E1A0E',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #2E1A0E',
            }}>
              <h2 style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '16px',
                fontWeight: 500,
                color: '#F5ECD7',
                margin: 0,
              }}>
                Recent conversations
              </h2>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {recentConversations && recentConversations.length > 0 ? (
                recentConversations.map((conv) => {
                  const client = conv.clients as any;
                  const clientName = client?.name || 'Unknown';
                  const clientId = client?.id;
                  const company = client?.company;
                  
                  return (
                    <Link 
                      key={conv.id}
                      href={clientId ? `/dashboard/clients/${clientId}` : '#'}
                      style={{ textDecoration: 'none' }}
                    >
                      <div style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #2E1A0E',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        background: 'transparent',
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '8px',
                        }}>
                          <div style={{
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#F5ECD7',
                          }}>
                            {clientName}
                          </div>
                          <div style={{
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '11px',
                            color: '#C9B99A',
                            whiteSpace: 'nowrap',
                          }}>
                            {conv.last_message_at ? formatTimeAgo(conv.last_message_at) : '—'}
                          </div>
                        </div>
                        
                        {company && (
                          <div style={{
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '12px',
                            color: '#C9B99A',
                            marginBottom: '8px',
                          }}>
                            {company}
                          </div>
                        )}
                        
                        <div style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: conv.status === 'active' ? '#5AB87A' : '#C9B99A',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: conv.status === 'active' ? '#5AB87A' : '#C9B99A',
                          }} />
                          {conv.status === 'active' ? 'Active' : 'Waiting'}
                        </div>
                        
                        {conv.last_message && (
                          <div style={{
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '13px',
                            color: '#C9B99A',
                            marginTop: '8px',
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}>
                            {conv.last_message}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#C9B99A',
                }}>
                  No recent conversations
                </div>
              )}
            </div>
          </div>

          {/* Recent Alerts Panel */}
          <div style={{
            background: '#120A06',
            border: '1px solid #2E1A0E',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #2E1A0E',
            }}>
              <h2 style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '16px',
                fontWeight: 500,
                color: '#F5ECD7',
                margin: 0,
              }}>
                Recent alerts
              </h2>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {recentAlerts && recentAlerts.length > 0 ? (
                recentAlerts.map((alert) => {
                  const client = alert.clients as any;
                  const clientName = client?.name || 'Unknown';
                  
                  return (
                    <Link 
                      key={alert.id}
                      href={`#`}
                      style={{ textDecoration: 'none' }}
                    >
                      <div style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #2E1A0E',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        background: 'transparent',
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '8px',
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
                            whiteSpace: 'nowrap',
                          }}>
                            {formatTimeAgo(alert.created_at)}
                          </div>
                        </div>
                        
                        <div style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '12px',
                          color: '#C9B99A',
                          marginBottom: '8px',
                        }}>
                          {clientName}
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                          <span style={{
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '11px',
                            fontWeight: 500,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: alert.priority === 'high' ? 'rgba(229, 62, 62, 0.2)' : 
                                       alert.priority === 'medium' ? 'rgba(246, 173, 85, 0.2)' : 
                                       'rgba(90, 184, 122, 0.2)',
                            color: alert.priority === 'high' ? '#E53E3E' : 
                                   alert.priority === 'medium' ? '#F6AD55' : 
                                   '#5AB87A',
                            border: `1px solid ${alert.priority === 'high' ? '#E53E3E' : 
                                              alert.priority === 'medium' ? '#F6AD55' : 
                                              '#5AB87A'}`,
                          }}>
                            {alert.priority === 'high' ? 'High' : alert.priority === 'medium' ? 'Medium' : 'Info'}
                          </span>
                        </div>
                        
                        {alert.body && (
                          <div style={{
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '13px',
                            color: '#C9B99A',
                            marginTop: '8px',
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}>
                            {alert.body}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div style={{
                  padding: '40px 20px',
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
    </div>
  );
}