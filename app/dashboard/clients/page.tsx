'use client';

import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type TierType = 'all' | 'platinum' | 'gold' | 'silver' | 'bronze';
type ClientType = 'all' | 'individual' | 'sme' | 'corporate';
type ConnectionFilter = 'all' | 'connected' | 'not-connected';

interface Client {
  id: string;
  name: string;
  company: string | null;
  type: string | null;
  tier: string | null;
  email: string | null;
  whatsapp: string | null;
  created_at: string;
  conversations?: {
    id: string;
    status: string;
    last_message: string | null;
    last_message_at: string | null;
  }[];
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<TierType>('all');
  const [selectedType, setSelectedType] = useState<ClientType>('all');
  const [selectedConnection, setSelectedConnection] = useState<ConnectionFilter>('all');
  


  useEffect(() => {
    async function fetchClients() {
      try {
        setLoading(true);
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, company, type, tier, email, whatsapp, created_at, conversations(id, status, last_message, last_message_at)')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error fetching clients:", error);
          throw error;
        }
        
        console.log(`Fetched ${data?.length || 0} clients`);
        setClients(data || []);
        setFilteredClients(data || []);
      } catch (err: any) {
        console.error("Error in fetchClients:", err);
        setError(err.message || 'Failed to load clients');
      } finally {
        setLoading(false);
      }
    }
    
    fetchClients();
  }, []);

  // Apply filters whenever searchQuery, selectedTier, selectedType, or selectedConnection changes
  useEffect(() => {
    let result = clients;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(client => 
        client.name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.company?.toLowerCase().includes(query) ||
        client.whatsapp?.toLowerCase().includes(query)
      );
    }
    
    // Apply tier filter
    if (selectedTier !== 'all') {
      result = result.filter(client => client.tier === selectedTier);
    }
    
    // Apply type filter
    if (selectedType !== 'all') {
      result = result.filter(client => client.type === selectedType);
    }
    
    // Apply connection filter
    if (selectedConnection !== 'all') {
      result = result.filter(client => {
        const hasActiveConversation = client.conversations?.some(conv => conv.status === 'active');
        if (selectedConnection === 'connected') {
          return hasActiveConversation;
        } else { // 'not-connected'
          return !hasActiveConversation;
        }
      });
    }
    
    setFilteredClients(result);
  }, [clients, searchQuery, selectedTier, selectedType, selectedConnection]);



  const handleWhatsAppClick = (whatsappNumber: string | null) => {
    if (whatsappNumber) {
      window.open(`https://wa.me/${whatsappNumber}`, '_blank');
    }
  };

  // Helper function to get WhatsApp connection status
  const getWhatsAppStatus = (client: Client) => {
    if (!client.conversations || client.conversations.length === 0) {
      return { status: 'not-connected', label: 'Not connected', color: '#C9B99A', dotColor: '#C9B99A' };
    }
    
    const activeConversation = client.conversations.find(conv => conv.status === 'active');
    if (activeConversation) {
      return { status: 'connected', label: 'Connected', color: '#5AB87A', dotColor: '#5AB87A' };
    }
    
    const waitingConversation = client.conversations.find(conv => conv.status === 'waiting');
    if (waitingConversation) {
      return { status: 'pending', label: 'Pending', color: '#F6AD55', dotColor: '#F6AD55' };
    }
    
    return { status: 'not-connected', label: 'Not connected', color: '#C9B99A', dotColor: '#C9B99A' };
  };

  const tabs: TierType[] = ['all', 'platinum', 'gold', 'silver', 'bronze'];
  const tabLabels = {
    all: 'All',
    platinum: 'Platinum',
    gold: 'Gold',
    silver: 'Silver',
    bronze: 'Bronze'
  };

  if (loading) {
    return (
      <div style={{ width: '100%', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '16px', color: '#C9B99A' }}>
          Loading clients...
        </div>
      </div>
    );
  }

  if (error) {
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
            {error || 'Please try again later.'}
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
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '28px',
              fontWeight: 400,
              color: '#F5ECD7',
              margin: 0,
            }}>Clients</h1>
            
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
                {clients.length || 0}
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
                {clients.filter(c => c.type === 'individual').length || 0}
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
                {clients.filter(c => c.type === 'sme').length || 0}
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
                {clients.filter(c => c.type === 'corporate').length || 0}
              </div>
            </div>
          </div>

          {/* Tier Filter Pills */}
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
                onClick={() => setSelectedTier(tab)}
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '12px',
                  fontWeight: 500,
                  padding: '6px 12px',
                  borderRadius: '100px',
                  background: selectedTier === tab ? '#C8813A' : 'transparent',
                  color: selectedTier === tab ? '#120A06' : '#C9B99A',
                  border: selectedTier === tab ? 'none' : '1px solid #2E1A0E',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {tabLabels[tab]}
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
              {/* Search Bar */}
              <div style={{
                position: 'relative',
              }}>
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
              
              {/* Type Dropdown */}
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as ClientType)}
                style={{
                  background: '#120A06',
                  border: '1px solid #2E1A0E',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#F5ECD7',
                  minWidth: '120px',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All types</option>
                <option value="individual">Individual</option>
                <option value="sme">SME</option>
                <option value="corporate">Corporate</option>
              </select>
              
              {/* Tier Dropdown (syncs with pills) */}
              <select 
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value as TierType)}
                style={{
                  background: '#120A06',
                  border: '1px solid #2E1A0E',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#F5ECD7',
                  minWidth: '120px',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All tiers</option>
                <option value="platinum">Platinum</option>
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="bronze">Bronze</option>
              </select>
              
              {/* Connection Status Dropdown */}
              <select 
                value={selectedConnection}
                onChange={(e) => setSelectedConnection(e.target.value as ConnectionFilter)}
                style={{
                  background: '#120A06',
                  border: '1px solid #2E1A0E',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#F5ECD7',
                  minWidth: '140px',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All connections</option>
                <option value="connected">Connected</option>
                <option value="not-connected">Not connected</option>
              </select>
            </div>
            
            {/* REMOVED: Filter and Clear buttons */}
          </div>

          {/* Clients Table */}
          {filteredClients.length > 0 ? (
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
                      }}>
                        MAYA STATUS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => (
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
                              fontSize: '13px',
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
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#C9B99A',
                          padding: '12px 16px',
                        }}>
                          {(() => {
                            const status = getWhatsAppStatus(client);
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  backgroundColor: status.dotColor,
                                }} />
                                <span style={{ color: status.color }}>{status.label}</span>
                              </div>
                            );
                          })()}
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
                {searchQuery || selectedTier !== 'all' || selectedType !== 'all' 
                  ? 'No clients match your filters' 
                  : 'No clients yet'}
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#C9B99A',
                lineHeight: 1.6,
                maxWidth: '400px',
                margin: '0 auto 24px auto',
              }}>
                {searchQuery || selectedTier !== 'all' || selectedType !== 'all' 
                  ? 'Try adjusting your search or filters.'
                  : 'Import your client list to get started.'}
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
  }