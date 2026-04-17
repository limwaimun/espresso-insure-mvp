'use client';

import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import PolicyDocCell from '../components/PolicyDocCell';
import AddPolicyModal from '../components/AddPolicyModal';
import EditClientModal from '../components/EditClientModal';
import WhatsAppSetupButton from '../components/WhatsAppSetupButton';

interface PageProps {
  params: { id: string };
}

export default function ClientProfilePage({ params }: PageProps) {
  const { id } = params;
  const [client, setClient] = useState<any>(null);
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [ifaId, setIfaId] = useState<string>('');
  const [conversations, setConversations] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [allAlerts, setAllAlerts] = useState<any[]>([]);
  const [clientMessages, setClientMessages] = useState<any[]>([]);
  const supabase = createClient();
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setIfaId(user.id);
      
      // Fetch client by ID
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();
      
      // Fetch their policies, ordered by renewal date
      const { data: policiesData } = await supabase
        .from('policies')
        .select('*')
        .eq('client_id', id)
        .order('renewal_date', { ascending: true });
      
      // Fetch alerts for this client
      const { data: alertsData } = await supabase
        .from('alerts')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      // Fetch conversations for this client
      const { data: clientConvos } = await supabase
        .from('conversations')
        .select('id')
        .eq('client_id', id);
      
      // Fetch messages for these conversations
      let fetchedClientMessages: any[] = [];
      if (clientConvos && clientConvos.length > 0) {
        const convoIds = clientConvos.map((c: any) => c.id);
        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .in('conversation_id', convoIds)
          .order('created_at', { ascending: false })
          .limit(10);
        fetchedClientMessages = msgs || [];
      }
      
      // Determine conversation status
      let conversations = null;
      if (clientConvos && clientConvos.length > 0) {
        conversations = {
          id: clientConvos[0].id,
          status: fetchedClientMessages.length > 0 ? 'active' : 'waiting',
          messages: fetchedClientMessages,
        };
      }
      
      setClientMessages(fetchedClientMessages);
      
      setClient(clientData);
      setPolicies(policiesData || []);
      setLoading(false);
    }
    
    fetchData();
  }, [id]);
  
  // Fetch additional data in a separate effect
  useEffect(() => {
    async function fetchAdditionalData() {
      if (!client) return;
      
      // Fetch conversations with messages for WhatsApp section
      const { data: conversationsData } = await supabase
        .from('conversations')
        .select('*, messages(id, role, content, created_at)')
        .eq('client_id', id)
        .order('last_message_at', { ascending: false })
        .limit(1);
      
      const convos = conversationsData && conversationsData.length > 0 ? conversationsData[0] : null;
      
      // Fetch claims for this client
      const { data: claimsData } = await supabase
        .from('alerts')
        .select('*')
        .eq('client_id', id)
        .eq('type', 'claim')
        .order('created_at', { ascending: false });
      
      // Fetch all alerts for this client (for timeline)
      const { data: alertsData } = await supabase
        .from('alerts')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      setConversations(convos);
      setClaims(claimsData || []);
      setAllAlerts(alertsData || []);
    }
    
    fetchAdditionalData();
  }, [client, id]);
  
  // Calculate metrics
  const activePolicies = policies?.filter(p => p.status === 'active').length || 0;
  const totalPremium = policies?.filter(p => p.status === 'active').reduce((sum, p) => sum + (Number(p.premium) || 0), 0) || 0;
  
  // Calculate tier based on total premium
  let calculatedTier = 'bronze';
  if (totalPremium >= 10000) calculatedTier = 'platinum';
  else if (totalPremium >= 5000) calculatedTier = 'gold';
  else if (totalPremium >= 1000) calculatedTier = 'silver';
  
  // Use calculated tier (override stored tier)
  const displayTier = calculatedTier;
  
  // Get next renewal date and days until
  let nextRenewalDate = null;
  let daysUntilRenewal = null;
  if (policies && policies.length > 0) {
    const renewalDates = policies
      .filter(p => p.renewal_date)
      .map(p => new Date(p.renewal_date))
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (renewalDates.length > 0) {
      nextRenewalDate = renewalDates[0];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const renewalDate = new Date(nextRenewalDate);
      renewalDate.setHours(0, 0, 0, 0);
      daysUntilRenewal = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }
  }
  
  const metrics = [
    { label: 'Policies', value: activePolicies.toString() },
    { label: 'Annual premium', value: `$${totalPremium.toLocaleString()}` },
    { 
      label: 'Next renewal', 
      value: nextRenewalDate ? nextRenewalDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '—',
      subtitle: daysUntilRenewal !== null ? `${daysUntilRenewal} days` : ''
    },
    { 
      label: 'Client since', 
      value: client.created_at ? new Date(client.created_at).getFullYear().toString() : '—',
      subtitle: client.created_at ? new Date(client.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : ''
    },
  ];
  


  // Calculate age from birthday (only for individuals)
  let birthdayDisplay = '—';
  let age = null;
  if (client.type === 'individual' && client.birthday) {
    try {
      const birthday = new Date(client.birthday);
      const today = new Date();
      age = today.getFullYear() - birthday.getFullYear();
      const monthDiff = today.getMonth() - birthday.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
        age--;
      }
      // Format as "Mar 15, 1978 (48)"
      birthdayDisplay = birthday.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      if (age > 0) {
        birthdayDisplay += ` (${age})`;
      }
    } catch (e) {
      birthdayDisplay = 'Invalid date';
    }
  }
  
  // Format date function for policies table
  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '—';
    }
  };
  
  // Format relative time for timeline
  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const now = new Date();
      const date = new Date(dateStr);
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '—';
    }
  };
  
  // Build timeline from messages, alerts, and policies
  const timeline = [
    ...clientMessages.map((m: any) => ({
      date: m.created_at,
      icon: m.role === 'client' ? '💬' : '🤖',
      text: m.role === 'client' ? `Client: "${m.content?.slice(0, 80) || 'No content'}${m.content && m.content.length > 80 ? '...' : ''}"` : `Maya: "${m.content?.slice(0, 80) || 'No content'}${m.content && m.content.length > 80 ? '...' : ''}"`,
      type: 'message'
    })),
    ...(allAlerts || []).map((a: any) => ({
      date: a.created_at,
      icon: a.type === 'claim' ? '📋' : a.type === 'renewal' ? '⚠️' : '🔔',
      text: a.title || 'Alert',
      type: 'alert'
    })),
    ...(policies || []).map((p: any) => ({
      date: p.created_at,
      icon: '📄',
      text: `${p.insurer || 'Unknown'} ${p.type || 'policy'} added ($${(Number(p.premium) || 0).toLocaleString()}/yr)`,
      type: 'policy'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15);
  
  // Insurance types for coverage analysis based on client type
  let coverageTypes = [];
  
  if (client.type === 'individual') {
    coverageTypes = [
      { key: 'life', label: 'Life' },
      { key: 'health', label: 'Health' },
      { key: 'critical illness', label: 'Critical Illness' },
      { key: 'disability', label: 'Disability' },
      { key: 'motor', label: 'Motor' },
      { key: 'travel', label: 'Travel' },
      { key: 'property', label: 'Property' },
      { key: 'professional indemnity', label: 'Professional Indemnity' },
    ];
  } else if (client.type === 'sme') {
    coverageTypes = [
      { key: 'group health', label: 'Group Health' },
      { key: 'group life', label: 'Group Life' },
      { key: 'fire', label: 'Fire Insurance' },
      { key: 'professional indemnity', label: 'Professional Indemnity' },
      { key: 'business interruption', label: 'Business Interruption' },
      { key: 'keyman', label: 'Keyman Insurance' },
      { key: 'directors & officers', label: 'Directors & Officers (D&O)' },
      { key: 'cyber', label: 'Cyber Insurance' },
    ];
  } else if (client.type === 'corporate') {
    coverageTypes = [
      { key: 'group health', label: 'Group Health' },
      { key: 'group life', label: 'Group Life' },
      { key: 'fire', label: 'Fire Insurance' },
      { key: 'professional indemnity', label: 'Professional Indemnity' },
      { key: 'business interruption', label: 'Business Interruption' },
      { key: 'keyman', label: 'Keyman Insurance' },
      { key: 'directors & officers', label: 'Directors & Officers (D&O)' },
      { key: 'cyber', label: 'Cyber Insurance' },
      { key: 'workers compensation', label: 'Workers Compensation' },
      { key: 'public liability', label: 'Public Liability' },
      { key: 'marine', label: 'Marine Insurance' },
    ];
  } else {
    // Default to individual types
    coverageTypes = [
      { key: 'life', label: 'Life' },
      { key: 'health', label: 'Health' },
      { key: 'critical illness', label: 'Critical Illness' },
      { key: 'disability', label: 'Disability' },
      { key: 'motor', label: 'Motor' },
      { key: 'travel', label: 'Travel' },
      { key: 'property', label: 'Property' },
      { key: 'professional indemnity', label: 'Professional Indemnity' },
    ];
  }
  
  // Check coverage for each type based on client type
  const coverageAnalysis = coverageTypes.map(type => {
    const matchingPolicy = policies?.find(p => 
      p.type && p.type.toLowerCase().includes(type.key.toLowerCase())
    );
    
    return {
      ...type,
      hasCoverage: !!matchingPolicy,
      insurer: matchingPolicy?.insurer || null,
    };
  });
  
  if (loading) {
    return (
      <div style={{ width: '100%', textAlign: 'center', padding: '40px', color: '#C9B99A' }}>
        Loading client details...
      </div>
    );
  }

  if (!client) {
    return (
      <div style={{ width: '100%', textAlign: 'center', padding: '40px', color: '#C9B99A' }}>
        Client not found
      </div>
    );
  }
  
  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '16px' }}>
        <Link href="/dashboard/clients" style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '13px',
          color: '#C8813A',
          textDecoration: 'none',
          cursor: 'pointer',
        }}>
          ← All clients
        </Link>
      </div>
      
      {/* == SECTION 1: CLIENT HEADER == */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        justifyContent: 'space-between', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        {/* Left: Avatar + Name + Company + Tier badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#C8813A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '24px',
            color: '#120A06',
            flexShrink: 0,
          }}>
            {client.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <h1 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '28px',
                fontWeight: 400,
                color: '#F5ECD7',
                margin: 0,
              }}>
                {client.type === 'individual' ? client.name : client.company}
              </h1>
              <span className={`pill pill-${displayTier === 'platinum' ? 'teal' : displayTier === 'gold' ? 'amber' : displayTier === 'silver' ? 'ok' : 'danger'}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                {displayTier.charAt(0).toUpperCase() + displayTier.slice(1)}
              </span>
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
              marginBottom: '8px',
            }}>
              {client.type === 'individual' 
                ? (client.company || 'Individual')
                : `Contact: ${client.name}`
              }
            </div>
            
            {/* Contact info inline (not cards) */}
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
            }}>
              {client.whatsapp && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  📱 {client.whatsapp}
                </span>
              )}
              {client.email && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ✉️ {client.email}
                </span>
              )}
              {client.type === 'individual' && client.birthday && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  🎂 {birthdayDisplay}
                </span>
              )}
              {client.address && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  📍 {client.address}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Right: WhatsApp + Edit buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {client.whatsapp ? (
            <a 
              href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#120A06',
                textDecoration: 'none',
                padding: '8px 16px',
                background: '#C8813A',
                borderRadius: '4px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>📱</span> WhatsApp
            </a>
          ) : (
            <button
              disabled
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#C9B99A',
                padding: '8px 16px',
                background: 'rgba(200,129,58,0.2)',
                borderRadius: '4px',
                border: 'none',
                cursor: 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>📱</span> No WhatsApp
            </button>
          )}
          <button 
            onClick={() => setShowEditClient(true)}
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C8813A',
              textDecoration: 'none',
              padding: '8px 16px',
              border: '1px solid #C8813A',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              cursor: 'pointer',
            }}
          >
            <span>✏️</span> Edit
          </button>
        </div>
      </div>
      
      {/* == SECTION 2: METRIC CARDS (one row, 4 cards) == */}
      <div className="metric-grid" style={{ marginBottom: '24px' }}>
        {metrics.map((m, i) => (
          <div key={i} className="card">
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              color: '#C9B99A',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
              marginBottom: '6px',
            }}>
              {m.label}
            </div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '28px',
              fontWeight: 300,
              color: '#F5ECD7',
            }}>
              {m.value}
            </div>
            {m.subtitle && (
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '11px',
                color: '#C9B99A',
                marginTop: '2px',
              }}>
                {m.subtitle}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* == SECTION 3: WHATSAPP CONNECTION == */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="panel-title">WhatsApp</span>
            {(() => {
              if (conversations?.status === 'active') {
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#5AB87A',
                    }} />
                    <span style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '12px',
                      color: '#5AB87A',
                      fontWeight: 500,
                    }}>Connected</span>
                  </div>
                );
              } else if (conversations?.status === 'waiting') {
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#F6AD55',
                    }} />
                    <span style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '12px',
                      color: '#F6AD55',
                      fontWeight: 500,
                    }}>Pending</span>
                  </div>
                );
              } else {
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#C9B99A',
                    }} />
                    <span style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '12px',
                      color: '#C9B99A',
                      fontWeight: 500,
                    }}>Not connected</span>
                  </div>
                );
              }
            })()}
          </div>
          {conversations && (
            <Link href={`/dashboard/conversations/${conversations.id}`} style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#C8813A',
              textDecoration: 'none',
            }}>
              View full conversation →
            </Link>
          )}
        </div>
        <div className="panel-body">
          {conversations ? (
            <div>
              {conversations.messages && conversations.messages.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {conversations.messages
                    .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .slice(-3) // Last 3 messages
                    .map((message: any, index: number) => (
                      <div 
                        key={message.id} 
                        style={{
                          display: 'flex',
                          justifyContent: message.role === 'client' ? 'flex-start' : 'flex-end',
                          marginBottom: '8px',
                        }}
                      >
                        <div style={{
                          maxWidth: '70%',
                          padding: '8px 12px',
                          borderRadius: '12px',
                          background: message.role === 'client' ? '#2E1A0E' : '#C8813A',
                          color: message.role === 'client' ? '#F5ECD7' : '#120A06',
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          lineHeight: 1.4,
                        }}>
                          <div style={{ marginBottom: '2px' }}>{message.content}</div>
                          <div style={{
                            fontSize: '10px',
                            color: message.role === 'client' ? '#C9B99A' : 'rgba(18, 10, 6, 0.7)',
                            textAlign: 'right',
                          }}>
                            {new Date(message.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#C9B99A',
                }}>
                  No messages yet in this conversation.
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <Link href={`/dashboard/conversations/${conversations.id}`} style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#C8813A',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  border: '1px solid #C8813A',
                  borderRadius: '4px',
                  display: 'inline-block',
                }}>
                  View full conversation →
                </Link>
                {client.whatsapp && (
                  <a 
                    href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '13px',
                      color: '#120A06',
                      textDecoration: 'none',
                      padding: '8px 16px',
                      background: '#C8813A',
                      borderRadius: '4px',
                      display: 'inline-block',
                      fontWeight: 500,
                    }}
                  >
                    Open in WhatsApp →
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#C9B99A',
                marginBottom: '16px',
              }}>
                This client is not yet connected to Maya on WhatsApp.
              </div>
              <WhatsAppSetupButton 
                clientName={client.name}
                clientWhatsApp={client.whatsapp}
                ifaName={ifaId}
                connectionStatus={conversations?.status || 'not_connected'}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* == SECTION 4: POLICIES TABLE == */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="panel-title">Policies</span>
          <button 
            onClick={() => setShowAddPolicy(true)}
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#C8813A',
              textDecoration: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            + Add policy
          </button>
        </div>
        <div className="panel-body">
          {policies && policies.length > 0 ? (
            <div className="table">
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Insurer</th>
                    <th>Type</th>
                    <th>Premium</th>
                    <th>Renewal Date</th>
                    <th>Status</th>
                    <th>POLICY DOC</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((policy: any) => {
                    // Calculate days until renewal
                    let daysUntilRenewal = null;
                    let pillClass = 'pill-ok';
                    let statusText = 'Active';
                    
                    if (policy.renewal_date) {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const renewalDate = new Date(policy.renewal_date);
                      renewalDate.setHours(0, 0, 0, 0);
                      daysUntilRenewal = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      
                      if (daysUntilRenewal <= 30) {
                        pillClass = 'pill-danger';
                        statusText = `Due in ${daysUntilRenewal} days`;
                      } else if (daysUntilRenewal <= 90) {
                        pillClass = 'pill-amber';
                        statusText = `Renews in ${daysUntilRenewal} days`;
                      }
                    }
                    
                    return (
                      <tr key={policy.id}>
                        <td>{policy.insurer || '—'}</td>
                        <td>{policy.type || '—'}</td>
                        <td>${(Number(policy.premium) || 0).toLocaleString()}</td>
                        <td>{formatDate(policy.renewal_date)}</td>
                        <td><span className={`pill ${pillClass}`}>{statusText}</span></td>
                        <td>
                          <PolicyDocCell 
                            policyId={policy.id}
                            ifaId={ifaId}
                            existingFileName={policy.document_name}
                            existingFileUrl={policy.document_url}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
            }}>
              No policies tracked yet.
            </div>
          )}
        </div>
      </div>
      
      {/* == SECTION 5: COVERAGE ANALYSIS == */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header">
          <span className="panel-title">Coverage analysis</span>
        </div>
        <div className="panel-body">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
          }}>
            {coverageAnalysis.map((coverage) => (
              <div key={coverage.key} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px',
                borderRadius: '4px',
                background: coverage.hasCoverage ? 'rgba(90,184,122,0.1)' : 'rgba(200,129,58,0.1)',
              }}>
                <div style={{
                  fontSize: '16px',
                  color: coverage.hasCoverage ? '#5AB87A' : '#C9B99A',
                }}>
                  {coverage.hasCoverage ? '✓' : '—'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '13px',
                    color: '#F5ECD7',
                    fontWeight: 500,
                  }}>
                    {coverage.label}
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '11px',
                    color: coverage.hasCoverage ? '#5AB87A' : '#C8813A',
                  }}>
                    {coverage.hasCoverage ? (coverage.insurer || 'Covered') : 'Not covered'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* == SECTION 6: CLAIMS == */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header">
          <span className="panel-title">Claims</span>
        </div>
        <div className="panel-body">
          {claims && claims.length > 0 ? (
            <div className="table">
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim: any) => {
                    const claimDate = claim.created_at ? new Date(claim.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                    const claimDescription = claim.title || (claim.body ? claim.body.slice(0, 60) + (claim.body.length > 60 ? '...' : '') : 'No description');
                    const claimBody = claim.body ? claim.body.slice(0, 100) + (claim.body.length > 100 ? '...' : '') : null;
                    
                    return (
                      <tr key={claim.id}>
                        <td style={{ verticalAlign: 'top' }}>
                          {claimDate}
                        </td>
                        <td style={{ verticalAlign: 'top' }}>
                          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#F5ECD7', fontWeight: 500, marginBottom: '4px' }}>
                            {claimDescription}
                          </div>
                          {claimBody && (
                            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#C9B99A', lineHeight: 1.4 }}>
                              {claimBody}
                            </div>
                          )}
                        </td>
                        <td style={{ verticalAlign: 'top' }}>
                          <span className={`pill ${claim.resolved === true ? 'pill-ok' : 'pill-amber'}`}>
                            {claim.resolved === true ? 'Resolved' : 'Open'}
                          </span>
                        </td>
                        <td style={{ verticalAlign: 'top' }}>
                          <span className={`pill ${claim.priority === 'high' ? 'pill-danger' : claim.priority === 'medium' ? 'pill-amber' : 'pill-info'}`}>
                            {claim.priority === 'high' ? 'High' : claim.priority === 'medium' ? 'Medium' : 'Info'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
            }}>
              No claims history.
            </div>
          )}
        </div>
      </div>
      
      {/* == SECTION 8: ACTIVITY TIMELINE == */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Activity</span>
        </div>
        <div className="panel-body">
          {timeline.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {timeline.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontFamily: 'DM Sans, sans-serif', 
                      fontSize: '13px', 
                      color: '#F5ECD7',
                      lineHeight: 1.4,
                      marginBottom: '2px'
                    }}>
                      {item.text}
                    </div>
                    <div style={{ 
                      fontFamily: 'DM Sans, sans-serif', 
                      fontSize: '11px', 
                      color: '#C9B99A',
                    }}>
                      {formatRelativeTime(item.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
            }}>
              No activity yet.
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddPolicy && (
        <AddPolicyModal
          clientId={id}
          ifaId={ifaId}
          onClose={() => setShowAddPolicy(false)}
          onAdded={() => {
            // Refresh policies
            supabase
              .from('policies')
              .select('*')
              .eq('client_id', id)
              .order('renewal_date', { ascending: true })
              .then(({ data }) => setPolicies(data || []));
            setShowAddPolicy(false);
          }}
        />
      )}

      {showEditClient && client && (
        <EditClientModal
          client={client}
          onClose={() => setShowEditClient(false)}
          onSaved={() => {
            // Refresh client data
            supabase
              .from('clients')
              .select('*')
              .eq('id', id)
              .single()
              .then(({ data }) => setClient(data));
            setShowEditClient(false);
          }}
        />
      )}
    </div>
  );
}