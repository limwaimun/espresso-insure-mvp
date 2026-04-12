import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function ClientsPage() {
  const supabase = await createClient();
  
  // Fetch real clients
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  const tabs = ['All', 'Platinum', 'Gold', 'Silver', 'Bronze', 'At risk'];

  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      padding: '0',
      minHeight: '100vh',
    }}>
      <div className="px-8 py-6">
        {/* Title and Actions Row */}
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
          }}>All clients</h1>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-primary" style={{
              fontSize: '13px',
              padding: '8px 16px',
            }}>+ Add client</button>
            <button className="btn-secondary" style={{
              fontSize: '13px',
              padding: '8px 16px',
            }}>Export</button>
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
              Total clients
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#F5ECD7',
            }}>
              {clients?.length || 0}
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
              Active policies
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#F5ECD7',
            }}>
              {clients?.reduce((sum, client) => sum + (client.active_policies || 0), 0) || 0}
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
              Renewals due
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#F5ECD7',
            }}>
              {clients?.reduce((sum, client) => sum + (client.renewals_due || 0), 0) || 0}
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
              Annual premium
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#F5ECD7',
            }}>
              ${clients?.reduce((sum, client) => sum + (client.annual_premium || 0), 0)?.toLocaleString() || '0'}
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
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {}}
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                fontWeight: 500,
                padding: '6px 12px',
                borderRadius: '100px',
                background: 'All' === tab ? '#C8813A' : 'transparent',
                color: 'All' === tab ? '#120A06' : '#C9B99A',
                border: 'All' === tab ? 'none' : '1px solid #2E1A0E',
                cursor: 'pointer',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search and Filter Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              position: 'relative',
            }}>
              <input
                type="text"
                placeholder="Search clients..."
                style={{
                  background: '#120A06',
                  border: '1px solid #2E1A0E',
                  borderRadius: '6px',
                  padding: '8px 12px 8px 36px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#F5ECD7',
                  width: '280px',
                }}
              />
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#C9B99A',
                fontSize: '14px',
              }}>
                🔍
              </span>
            </div>
            
            <select style={{
              background: '#120A06',
              border: '1px solid #2E1A0E',
              borderRadius: '6px',
              padding: '8px 12px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#F5ECD7',
              minWidth: '120px',
            }}>
              <option value="">All types</option>
              <option value="individual">Individual</option>
              <option value="sme">SME</option>
              <option value="corporate">Corporate</option>
            </select>
            
            <select style={{
              background: '#120A06',
              border: '1px solid #2E1A0E',
              borderRadius: '6px',
              padding: '8px 12px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#F5ECD7',
              minWidth: '120px',
            }}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="at-risk">At risk</option>
            </select>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <button className="btn-secondary" style={{
              fontSize: '12px',
              padding: '6px 12px',
            }}>
              Filter
            </button>
            <button className="btn-secondary" style={{
              fontSize: '12px',
              padding: '6px 12px',
            }}>
              Clear
            </button>
          </div>
        </div>

        {/* Clients Table */}
        {clients && clients.length > 0 ? (
          <div style={{
            background: '#120A06',
            border: '1px solid #2E1A0E',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <div style={{
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 280px)',
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}>
                <colgroup>
                  <col style={{ width: '180px' }} />
                  <col style={{ width: '80px' }} />
                  <col style={{ width: '70px' }} />
                  <col style={{ width: '90px' }} />
                  <col style={{ width: '100px' }} />
                  <col style={{ width: '130px' }} />
                  <col style={{ width: '50px' }} />
                </colgroup>
                <thead style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  background: '#1C0F0A',
                }}>
                  <tr>
                    <th style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#C8813A',
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderBottom: '1px solid #2E1A0E',
                    }}>
                      Client
                    </th>
                    <th style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#C8813A',
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderBottom: '1px solid #2E1A0E',
                    }}>
                      Type
                    </th>
                    <th style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#C8813A',
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderBottom: '1px solid #2E1A0E',
                    }}>
                      Policies
                    </th>
                    <th style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#C8813A',
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderBottom: '1px solid #2E1A0E',
                    }}>
                      Renewal
                    </th>
                    <th style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#C8813A',
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderBottom: '1px solid #2E1A0E',
                    }}>
                      Premium
                    </th>
                    <th style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#C8813A',
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderBottom: '1px solid #2E1A0E',
                    }}>
                      Status
                    </th>
                    <th style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#C8813A',
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderBottom: '1px solid #2E1A0E',
                    }}></th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} style={{
                      borderBottom: '1px solid #2E1A0E',
                    }}>
                      <td style={{
                        padding: '12px 16px',
                      }}>
                        <Link href={`/dashboard/clients/${client.id}`} style={{
                          textDecoration: 'none',
                          color: 'inherit',
                        }}>
                          <div style={{
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '16px',
                            fontWeight: 500,
                            color: '#F5ECD7',
                            marginBottom: '4px',
                          }}>
                            {client.name}
                          </div>
                          <div style={{
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '11px',
                            color: '#C9B99A',
                          }}>
                            {client.company || 'Individual'}
                          </div>
                        </Link>
                      </td>
                      <td style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#C9B99A',
                        padding: '12px 16px',
                      }}>
                        {client.type || 'Individual'}
                      </td>
                      <td style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#C9B99A',
                        padding: '12px 16px',
                      }}>
                        {client.active_policies || 0}
                      </td>
                      <td style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#C9B99A',
                        padding: '12px 16px',
                      }}>
                        {client.next_renewal_date ? new Date(client.next_renewal_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '—'}
                      </td>
                      <td style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#C9B99A',
                        padding: '12px 16px',
                      }}>
                        {client.annual_premium ? `$${client.annual_premium.toLocaleString()}/yr` : '—'}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                      }}>
                        <span style={{
                          display: 'inline-block',
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '11px',
                          fontWeight: 500,
                          padding: '4px 8px',
                          borderRadius: '100px',
                          background: client.status === 'active' ? 'rgba(56, 161, 105, 0.2)' : 
                                     client.status === 'at-risk' ? 'rgba(229, 62, 62, 0.2)' :
                                     client.status === 'inactive' ? 'rgba(201, 185, 154, 0.2)' : 'rgba(200, 129, 58, 0.2)',
                          color: client.status === 'active' ? '#38A169' : 
                                 client.status === 'at-risk' ? '#E53E3E' :
                                 client.status === 'inactive' ? '#C9B99A' : '#C8813A',
                          border: `1px solid ${client.status === 'active' ? '#38A169' : 
                                            client.status === 'at-risk' ? '#E53E3E' :
                                            client.status === 'inactive' ? '#C9B99A' : '#C8813A'}`,
                        }}>
                          {client.status || 'New'}
                        </span>
                      </td>
                      <td style={{
                        padding: '12px 16px',
                      }}>
                        <button style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#C9B99A',
                          fontSize: '16px',
                          cursor: 'pointer',
                          padding: '4px',
                        }}>
                          ⋮
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              No clients yet
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: '#C9B99A',
              lineHeight: 1.6,
              maxWidth: '400px',
              margin: '0 auto 24px auto',
            }}>
              Maya will help you add clients as conversations come in.
            </div>
            <button className="btn-primary" style={{
              padding: '10px 20px',
            }}>
              + Add your first client
            </button>
          </div>
        )}
      </div>
    </div>
  );
}