import { createClient } from '@/lib/supabase/server';

export default async function AlertsPage() {
  const supabase = await createClient();
  
  // Fetch real alerts with client names
  const { data: alerts } = await supabase
    .from('alerts')
    .select('*, clients(name)')
    .order('created_at', { ascending: false });

  const filters = ['all', 'unresolved', 'high', 'medium', 'low'];

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '32px',
          fontWeight: 400,
          color: '#F5ECD7',
          margin: 0,
        }}>
          Alerts
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
            Mark all as read
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
            {alerts?.length || 0}
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
            Unresolved
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            color: '#F5ECD7',
          }}>
            {alerts?.filter(a => !a.resolved).length || 0}
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
            High priority
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            color: '#F5ECD7',
          }}>
            {alerts?.filter(a => a.priority === 'high').length || 0}
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
            This week
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            color: '#F5ECD7',
          }}>
            {alerts?.filter(a => {
              const alertDate = new Date(a.created_at);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return alertDate >= weekAgo;
            }).length || 0}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #2E1A0E',
      }}>
        {filters.map((filter) => (
          <button
            key={filter}
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              fontWeight: 500,
              padding: '6px 12px',
              borderRadius: '100px',
              background: filter === 'all' ? '#C8813A' : 'transparent',
              color: filter === 'all' ? '#120A06' : '#C9B99A',
              border: filter === 'all' ? 'none' : '1px solid #2E1A0E',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {alerts && alerts.length > 0 ? (
        <div style={{
          background: '#120A06',
          border: '1px solid #2E1A0E',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          {alerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                padding: '20px',
                borderBottom: '1px solid #2E1A0E',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
              }}
            >
              {/* Priority Dot */}
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: alert.priority === 'high' ? '#E53E3E' : 
                           alert.priority === 'medium' ? '#C8813A' : '#38A169',
                flexShrink: 0,
                marginTop: '4px',
              }} />
              
              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px',
                }}>
                  <div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#F5ECD7',
                      marginBottom: '4px',
                    }}>
                      {alert.title}
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '12px',
                      color: '#C9B99A',
                    }}>
                      {alert.clients?.name || 'Client'} · {alert.type || 'Alert'}
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                    }}>
                      {formatTimeAgo(alert.created_at)}
                    </div>
                    
                    <span style={{
                      display: 'inline-block',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      fontWeight: 500,
                      padding: '4px 8px',
                      borderRadius: '100px',
                      background: alert.priority === 'high' ? 'rgba(229, 62, 62, 0.2)' : 
                                 alert.priority === 'medium' ? 'rgba(200, 129, 58, 0.2)' : 'rgba(56, 161, 105, 0.2)',
                      color: alert.priority === 'high' ? '#E53E3E' : 
                             alert.priority === 'medium' ? '#C8813A' : '#38A169',
                      border: `1px solid ${alert.priority === 'high' ? '#E53E3E' : 
                                            alert.priority === 'medium' ? '#C8813A' : '#38A169'}`,
                      textTransform: 'capitalize',
                    }}>
                      {alert.priority || 'low'}
                    </span>
                  </div>
                </div>
                
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#C9B99A',
                  lineHeight: 1.5,
                  marginBottom: '12px',
                }}>
                  {alert.body || 'No description available.'}
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '11px',
                    color: '#C8813A',
                    cursor: 'pointer',
                  }}>
                    {alert.resolved ? 'Resolved' : 'Mark as resolved →'}
                  </div>
                  
                  {alert.policy && (
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      background: 'rgba(201, 185, 154, 0.1)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }}>
                      {alert.policy}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          background: '#120A06',
          border: '1px solid #2E1A0E',
          borderRadius: '8px',
          padding: '60px 40px',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '24px',
            color: '#F5ECD7',
            marginBottom: '16px',
          }}>
            No alerts
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#C9B99A',
            lineHeight: 1.6,
            maxWidth: '400px',
            margin: '0 auto',
          }}>
            You're all caught up.
          </div>
        </div>
      )}
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