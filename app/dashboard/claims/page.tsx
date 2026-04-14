'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type FilterType = 'all' | 'open' | 'resolved' | 'high';

interface Claim {
  id: string;
  title: string;
  body: string;
  resolved: boolean;
  priority: 'high' | 'medium' | 'info';
  created_at: string;
  client_id: string;
  clients: {
    name: string;
    company: string | null;
  }[] | null;
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  
  // Calculate summary metrics
  const totalClaims = claims.length;
  const openClaims = claims.filter(c => !c.resolved).length;
  const resolvedClaims = claims.filter(c => c.resolved).length;
  const highPriorityClaims = claims.filter(c => c.priority === 'high').length;

  useEffect(() => {
    async function fetchClaims() {
      try {
        setLoading(true);
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('claims')
          .select(`
            id,
            title,
            body,
            resolved,
            priority,
            created_at,
            client_id,
            clients!inner (
              name,
              company
            )
          `)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error fetching claims:", error);
          throw error;
        }
        
        console.log(`Fetched ${data?.length || 0} claims`);
        setClaims(data || []);
      } catch (err: any) {
        console.error("Error in fetchClaims:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchClaims();
  }, []);

  // Filter claims based on selected filter
  const filteredClaims = claims.filter(claim => {
    if (filter === 'all') return true;
    if (filter === 'open') return !claim.resolved;
    if (filter === 'resolved') return claim.resolved;
    if (filter === 'high') return claim.priority === 'high';
    return true;
  });

  // Helper function to format relative time
  function formatRelativeTime(dateString: string): string {
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

  const filterTabs = [
    { id: 'all' as FilterType, label: 'All', count: totalClaims },
    { id: 'open' as FilterType, label: 'Open', count: openClaims },
    { id: 'resolved' as FilterType, label: 'Resolved', count: resolvedClaims },
    { id: 'high' as FilterType, label: 'High Priority', count: highPriorityClaims },
  ];

  if (loading) {
    return (
      <div style={{ width: '100%', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '16px', color: '#C9B99A' }}>
          Loading claims...
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
          }}>
            Claims
          </h1>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/dashboard/claims/new" style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{
                fontSize: '13px',
                padding: '8px 16px',
              }}>
                + New claim
              </button>
            </Link>
          </div>
        </div>

        {/* 4 Summary Cards - Match All Clients style */}
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
              Total Claims
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#F5ECD7',
            }}>
              {totalClaims}
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
              Open
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#F5ECD7',
            }}>
              {openClaims}
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
              Resolved
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#F5ECD7',
            }}>
              {resolvedClaims}
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
              High Priority
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#F5ECD7',
            }}>
              {highPriorityClaims}
            </div>
          </div>
        </div>

        {/* Filter Tabs - Match tier pill style */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #2E1A0E',
        }}>
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                fontWeight: 500,
                padding: '6px 12px',
                borderRadius: '100px',
                background: filter === tab.id ? '#C8813A' : 'transparent',
                color: filter === tab.id ? '#120A06' : '#C9B99A',
                border: filter === tab.id ? 'none' : '1px solid #2E1A0E',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Claims Table - Match All Clients table styling */}
        {filteredClaims.length > 0 ? (
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
                  <col style={{ width: '250px' }} />
                  <col style={{ width: '100px' }} />
                  <col style={{ width: '100px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '150px' }} />
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
                      Description
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
                    }}>
                      Priority
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
                      Created
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClaims.map((claim) => {
                    const clientName = claim.clients && claim.clients.length > 0 ? claim.clients[0].name : 'Unknown';
                    const company = claim.clients && claim.clients.length > 0 ? claim.clients[0].company : null;
                    const description = claim.title || 'No title';
                    const bodyPreview = claim.body ? 
                      (claim.body.length > 100 ? claim.body.substring(0, 100) + '...' : claim.body) : 
                      null;
                    
                    const statusText = claim.resolved ? 'Resolved' : 'Open';
                    const statusClass = claim.resolved ? 'pill-success' : 'pill-amber';
                    
                    const priorityClass = claim.priority === 'high' ? 'pill-danger' : 
                                         claim.priority === 'medium' ? 'pill-amber' : 'pill-info';
                    
                    return (
                      <tr key={claim.id} style={{
                        borderBottom: '1px solid #2E1A0E',
                      }}>
                        <td style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#C9B99A',
                          padding: '12px 16px',
                          verticalAlign: 'top',
                          borderBottom: '1px solid #2E1A0E',
                        }}>
                          <Link 
                            href={`/dashboard/clients/${claim.client_id}`}
                            style={{
                              color: '#F5ECD7',
                              textDecoration: 'none',
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                          >
                            {clientName}
                          </Link>
                          {company && (
                            <div style={{
                              fontFamily: 'DM Sans, sans-serif',
                              fontSize: '11px',
                              color: '#C9B99A',
                              marginTop: '2px',
                            }}>
                              {company}
                            </div>
                          )}
                        </td>
                        <td style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#C9B99A',
                          padding: '12px 16px',
                          verticalAlign: 'top',
                          borderBottom: '1px solid #2E1A0E',
                        }}>
                          <div style={{
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '13px',
                            color: '#F5ECD7',
                            fontWeight: 500,
                            marginBottom: '4px',
                          }}>
                            {description}
                          </div>
                          {bodyPreview && (
                            <div style={{
                              fontFamily: 'DM Sans, sans-serif',
                              fontSize: '11px',
                              color: '#C9B99A',
                              lineHeight: 1.4,
                            }}>
                              {bodyPreview}
                            </div>
                          )}
                        </td>
                        <td style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#C9B99A',
                          padding: '12px 16px',
                          verticalAlign: 'top',
                          borderBottom: '1px solid #2E1A0E',
                        }}>
                          <span className={`pill ${statusClass}`}>{statusText}</span>
                        </td>
                        <td style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#C9B99A',
                          padding: '12px 16px',
                          verticalAlign: 'top',
                          borderBottom: '1px solid #2E1A0E',
                        }}>
                          <span className={`pill ${priorityClass}`}>
                            {claim.priority === 'high' ? 'High' : claim.priority === 'medium' ? 'Medium' : 'Info'}
                          </span>
                        </td>
                        <td style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#C9B99A',
                          padding: '12px 16px',
                          verticalAlign: 'top',
                          borderBottom: '1px solid #2E1A0E',
                        }}>
                          {formatRelativeTime(claim.created_at)}
                        </td>
                        <td style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#C9B99A',
                          padding: '12px 16px',
                          verticalAlign: 'top',
                          borderBottom: '1px solid #2E1A0E',
                        }}>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                          }}>
                            <Link 
                              href={`/dashboard/clients/${claim.client_id}`}
                              style={{
                                fontFamily: 'DM Sans, sans-serif',
                                fontSize: '12px',
                                color: '#C8813A',
                                textDecoration: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              View client →
                            </Link>
                            <span 
                              style={{
                                fontFamily: 'DM Sans, sans-serif',
                                fontSize: '12px',
                                color: '#C9B99A',
                                cursor: 'not-allowed',
                                fontStyle: 'italic',
                              }}
                            >
                              Mark as resolved
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
              {filter === 'all' ? 'No claims recorded yet' : 'No claims match this filter'}
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: '#C9B99A',
              lineHeight: 1.6,
              maxWidth: '400px',
              margin: '0 auto',
            }}>
              {filter === 'all' 
                ? 'Claims will appear here when clients submit them via WhatsApp.'
                : `Try selecting a different filter or check back later.`
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}