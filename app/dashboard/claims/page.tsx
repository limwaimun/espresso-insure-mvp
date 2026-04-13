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
  } | null;
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  
  // Calculate summary metrics
  const totalClaims = claims.length;
  const openClaims = claims.filter(c => !c.resolved).length;
  const resolvedClaims = claims.filter(c => c.resolved).length;
  const highPriorityClaims = claims.filter(c => c.priority === 'high' && !c.resolved).length;
  
  // Filter claims based on selected filter
  const filteredClaims = claims.filter(claim => {
    if (filter === 'all') return true;
    if (filter === 'open') return !claim.resolved;
    if (filter === 'resolved') return claim.resolved;
    if (filter === 'high') return claim.priority === 'high' && !claim.resolved;
    return true;
  }).sort((a, b) => {
    // Sort: unresolved first, then by creation date (newest first)
    if (a.resolved !== b.resolved) {
      return a.resolved ? 1 : -1;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  
  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Fetch claims on component mount
  useEffect(() => {
    async function fetchClaims() {
      setLoading(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('alerts')
        .select('*, clients(name, company)')
        .eq('type', 'claim')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching claims:', error);
      } else {
        setClaims(data || []);
      }
      
      setLoading(false);
    }
    
    fetchClaims();
  }, []);
  
  // Summary cards data
  const summaryCards = [
    { 
      id: 1, 
      title: 'TOTAL CLAIMS', 
      value: totalClaims.toString(), 
      color: 'info' 
    },
    { 
      id: 2, 
      title: 'OPEN', 
      value: openClaims.toString(), 
      color: openClaims > 0 ? 'danger' : 'ok' 
    },
    { 
      id: 3, 
      title: 'RESOLVED', 
      value: resolvedClaims.toString(), 
      color: 'ok' 
    },
    { 
      id: 4, 
      title: 'HIGH PRIORITY', 
      value: highPriorityClaims.toString(), 
      color: highPriorityClaims > 0 ? 'danger' : 'ok' 
    },
  ];
  
  // Filter tabs
  const filterTabs = [
    { id: 'all', label: 'All', count: totalClaims },
    { id: 'open', label: 'Open', count: openClaims },
    { id: 'resolved', label: 'Resolved', count: resolvedClaims },
    { id: 'high', label: 'High Priority', count: highPriorityClaims },
  ];

  return (
    <div style={{ width: '100%' }}>
      <h1 style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '28px',
        fontWeight: 400,
        color: '#F5ECD7',
        margin: '0 0 20px 0',
      }}>
        Claims
      </h1>
      
      {/* Summary Cards */}
      <div className="metric-grid" style={{ marginBottom: '24px' }}>
        {summaryCards.map((card) => (
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
          </div>
        ))}
      </div>
      
      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as FilterType)}
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              fontWeight: filter === tab.id ? 500 : 400,
              color: filter === tab.id ? '#F5ECD7' : '#C9B99A',
              background: filter === tab.id ? '#C8813A' : 'transparent',
              border: filter === tab.id ? 'none' : '1px solid #2E1A0E',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
            <span style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              color: filter === tab.id ? '#120A06' : '#C9B99A',
              background: filter === tab.id ? 'rgba(18, 10, 6, 0.2)' : 'rgba(201, 185, 154, 0.1)',
              borderRadius: '10px',
              padding: '2px 6px',
              minWidth: '20px',
              textAlign: 'center',
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>
      
      {loading ? (
        <div style={{
          background: '#120A06',
          border: '1px solid #2E1A0E',
          borderRadius: '8px',
          padding: '60px 40px',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#C9B99A',
          }}>
            Loading claims...
          </div>
        </div>
      ) : filteredClaims.length > 0 ? (
        <div style={{
          background: '#120A06',
          border: '1px solid #2E1A0E',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          <div style={{
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 380px)',
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}>
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
                    color: '#C8813A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '10px 12px',
                    textAlign: 'left',
                    borderBottom: '1px solid #2E1A0E',
                    whiteSpace: 'nowrap',
                  }}>
                    Client
                  </th>
                  <th style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#C8813A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '10px 12px',
                    textAlign: 'left',
                    borderBottom: '1px solid #2E1A0E',
                    whiteSpace: 'nowrap',
                  }}>
                    Description
                  </th>
                  <th style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#C8813A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '10px 12px',
                    textAlign: 'left',
                    borderBottom: '1px solid #2E1A0E',
                    whiteSpace: 'nowrap',
                  }}>
                    Status
                  </th>
                  <th style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#C8813A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '10px 12px',
                    textAlign: 'left',
                    borderBottom: '1px solid #2E1A0E',
                    whiteSpace: 'nowrap',
                  }}>
                    Priority
                  </th>
                  <th style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#C8813A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '10px 12px',
                    textAlign: 'left',
                    borderBottom: '1px solid #2E1A0E',
                    whiteSpace: 'nowrap',
                  }}>
                    Filed
                  </th>
                  <th style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#C8813A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '10px 12px',
                    textAlign: 'left',
                    borderBottom: '1px solid #2E1A0E',
                    whiteSpace: 'nowrap',
                  }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim) => {
                  const clientName = claim.clients?.name || 'Client';
                  const company = claim.clients?.company;
                  const description = claim.title || 'Claim';
                  const bodyPreview = claim.body ? 
                    claim.body.slice(0, 80) + (claim.body.length > 80 ? '...' : '') : 
                    null;
                  
                  // Determine status
                  let statusText = 'Resolved';
                  let statusClass = 'pill-ok';
                  
                  if (!claim.resolved) {
                    if (claim.priority === 'high') {
                      statusText = 'Urgent';
                      statusClass = 'pill-danger';
                    } else {
                      statusText = 'Open';
                      statusClass = claim.priority === 'medium' ? 'pill-amber' : 'pill-info';
                    }
                  }
                  
                  // Priority pill
                  let priorityClass = 'pill-info';
                  if (claim.priority === 'high') priorityClass = 'pill-danger';
                  if (claim.priority === 'medium') priorityClass = 'pill-amber';
                  
                  return (
                    <tr key={claim.id}>
                      <td style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#F5ECD7',
                        fontWeight: 500,
                        padding: '10px 12px',
                        verticalAlign: 'top',
                        borderBottom: '1px solid #2E1A0E',
                      }}>
                        <Link 
                          href={`/dashboard/clients/${claim.client_id}`}
                          style={{
                            color: '#F5ECD7',
                            textDecoration: 'none',
                            cursor: 'pointer',
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
                        padding: '10px 12px',
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
                        padding: '10px 12px',
                        verticalAlign: 'top',
                        borderBottom: '1px solid #2E1A0E',
                      }}>
                        <span className={`pill ${statusClass}`}>{statusText}</span>
                      </td>
                      <td style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#C9B99A',
                        padding: '10px 12px',
                        verticalAlign: 'top',
                        borderBottom: '1px solid #2E1A0E',
                      }}>
                        <span className={`pill ${priorityClass}`}>
                          {claim.priority === 'high' ? 'High' : 
                           claim.priority === 'medium' ? 'Medium' : 'Info'}
                        </span>
                      </td>
                      <td style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#C9B99A',
                        padding: '10px 12px',
                        verticalAlign: 'top',
                        borderBottom: '1px solid #2E1A0E',
                      }}>
                        {formatRelativeTime(claim.created_at)}
                      </td>
                      <td style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#C9B99A',
                        padding: '10px 12px',
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
                            title="Coming soon"
                          >
                            Ask Maya to follow up
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
  );
}