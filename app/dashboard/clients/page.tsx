import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function ClientsPage() {
  try {
    const supabase = await createClient();
    
    // Fetch real clients - only fields that exist in the database
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, name, company, type, tier, email, whatsapp, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching clients:", error);
      throw error;
    }
    
    console.log(`Fetched ${clients?.length || 0} clients`);

    const tabs = ['All', 'Platinum', 'Gold', 'Silver', 'Bronze'];

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
              <Link href="/dashboard/import" style={{ textDecoration: 'none' }}>
                <button className="btn-primary" style={{
                  fontSize: '13px',
                  padding: '8px 16px',
                }}>
                  + Import clients
                </button>
              </Link>
              <button className="btn-secondary" style={{
                fontSize: '13px',
                padding: '8px 16px',
              }}>
                Export
              </button>
            </div>
          </div>

          {/* Stats Bar - Simplified */}
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
                Individual
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '24px',
                fontWeight: 600,
                color: '#F5ECD7',
              }}>
                {clients?.filter(c => c.type === 'individual').length || 0}
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
                {clients?.filter(c => c.type === 'sme').length || 0}
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
                {clients?.filter(c => c.type === 'corporate').length || 0}
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
                <option value="">All tiers</option>
                <option value="platinum">Platinum</option>
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="bronze">Bronze</option>
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
                    <col style={{ width: '120px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '200px' }} />
                    <col style={{ width: '120px' }} />
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
                        Tier
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
                        Company
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
                        Email
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
                        WhatsApp
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
                              Added {new Date(client.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
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
                          <span style={{
                            display: 'inline-block',
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '11px',
                            fontWeight: 500,
                            padding: '4px 8px',
                            borderRadius: '100px',
                            background: client.tier === 'platinum' ? 'rgba(200, 129, 58, 0.2)' : 
                                       client.tier === 'gold' ? 'rgba(255, 215, 0, 0.2)' :
                                       client.tier === 'silver' ? 'rgba(192, 192, 192, 0.2)' : 'rgba(205, 127, 50, 0.2)',
                            color: client.tier === 'platinum' ? '#C8813A' : 
                                   client.tier === 'gold' ? '#FFD700' :
                                   client.tier === 'silver' ? '#C0C0C0' : '#CD7F32',
                            border: `1px solid ${client.tier === 'platinum' ? '#C8813A' : 
                                                  client.tier === 'gold' ? '#FFD700' :
                                                  client.tier === 'silver' ? '#C0C0C0' : '#CD7F32'}`,
                          }}>
                            {client.tier || 'Bronze'}
                          </span>
                        </td>
                        <td style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#C9B99A',
                          padding: '12px 16px',
                        }}>
                          {client.company || '—'}
                        </td>
                        <td style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#C9B99A',
                          padding: '12px 16px',
                        }}>
                          {client.email || '—'}
                        </td>
                        <td style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#C9B99A',
                          padding: '12px 16px',
                        }}>
                          {client.whatsapp || '—'}
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
                Import your client list to get started.
              </div>
              <Link href="/dashboard/import" style={{ textDecoration: 'none' }}>
                <button className="btn-primary" style={{
                  padding: '10px 20px',
                }}>
                  Import clients
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error: any) {
    console.error("Error in ClientsPage:", error);
    return (
      <div style={{ width: '100%', padding: '40px' }}>
        <div style={{
          background: 'rgba(229, 62, 62, 0.1)',
          border: '1px solid #E53E3E',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '16px',
            fontWeight: 500,
            color: '#F5ECD7',
            marginBottom: '8px',
          }}>
            Error loading clients
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#C9B99A',
            marginBottom: '16px',
          }}>
            {error.message || 'Please try again later.'}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
            style={{ padding: '8px 16px' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
}