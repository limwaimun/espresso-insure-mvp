'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type AlertType = 'all' | 'renewal' | 'claim' | 'payment' | 'birthday' | 'resolved';

interface Alert {
  id: string;
  title: string;
  body: string;
  type: string;
  priority: 'high' | 'medium' | 'info';
  resolved: boolean;
  created_at: string;
  clients: {
    id: string;
    name: string;
    company: string;
    whatsapp: string;
  } | null;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AlertType>('all');
  const [resolvingAlerts, setResolvingAlerts] = useState<Set<string>>(new Set());
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('alerts')
      .select('*, clients(id, name, company, whatsapp)')
      .order('created_at', { ascending: false });
    
    setAlerts(data || []);
    setLoading(false);
  };

  const totalUnresolved = alerts.filter(a => !a.resolved).length;
  const renewalCount = alerts.filter(a => a.type === 'renewal' && !a.resolved).length;
  const claimCount = alerts.filter(a => a.type === 'claim' && !a.resolved).length;
  const otherCount = alerts.filter(a => !a.resolved && a.type !== 'renewal' && a.type !== 'claim').length;

  const filteredAlerts = alerts.filter(alert => {
    if (activeTab === 'all') return !alert.resolved;
    if (activeTab === 'renewal') return alert.type === 'renewal' && !alert.resolved;
    if (activeTab === 'claim') return alert.type === 'claim' && !alert.resolved;
    if (activeTab === 'payment') return alert.type === 'payment' && !alert.resolved;
    if (activeTab === 'birthday') return alert.type === 'document' && !alert.resolved;
    if (activeTab === 'resolved') return alert.resolved;
    return true;
  });

  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
    const priorityOrder = { high: 0, medium: 1, info: 2 };
    if (a.priority !== b.priority) return priorityOrder[a.priority] - priorityOrder[b.priority];
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const tabs = [
    { id: 'all' as AlertType, label: 'All', count: alerts.filter(a => !a.resolved).length },
    { id: 'renewal' as AlertType, label: 'Renewals', count: renewalCount },
    { id: 'claim' as AlertType, label: 'Claims', count: claimCount },
    { id: 'payment' as AlertType, label: 'Lapsed', count: alerts.filter(a => a.type === 'payment' && !a.resolved).length },
    { id: 'birthday' as AlertType, label: 'Birthdays', count: alerts.filter(a => a.type === 'document' && !a.resolved).length },
    { id: 'resolved' as AlertType, label: 'Resolved', count: alerts.filter(a => a.resolved).length },
  ];

  const markResolved = async (alertId: string) => {
    // Add to resolving set to show visual feedback
    setResolvingAlerts(prev => new Set(prev).add(alertId));
    
    // Update in Supabase
    await supabase.from('alerts').update({ resolved: true }).eq('id', alertId);
    
    // Update local state - this will trigger automatic recalculation of all derived values
    setAlerts(prev => prev.map(alert => alert.id === alertId ? { ...alert, resolved: true } : alert));
    
    // Refresh server components (sidebar counts)
    router.refresh();
    
    // Remove from resolving set after a delay to show the resolved state
    setTimeout(() => {
      setResolvingAlerts(prev => {
        const next = new Set(prev);
        next.delete(alertId);
        return next;
      });
    }, 1000);
  };

  const formatTimeAgo = (dateString: string): string => {
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
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return { bg: 'rgba(208, 96, 96, 0.2)', text: '#D06060', border: '#D06060' };
      case 'medium': return { bg: 'rgba(212, 160, 48, 0.2)', text: '#D4A030', border: '#D4A030' };
      default: return { bg: 'rgba(201, 185, 154, 0.2)', text: '#C9B99A', border: '#C9B99A' };
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'renewal': return { bg: 'rgba(212, 160, 48, 0.2)', text: '#D4A030', border: '#D4A030' };
      case 'claim': return { bg: 'rgba(208, 96, 96, 0.2)', text: '#D06060', border: '#D06060' };
      case 'payment': return { bg: 'rgba(139, 101, 51, 0.2)', text: '#8B6533', border: '#8B6533' };
      case 'document': return { bg: 'rgba(90, 184, 122, 0.2)', text: '#5AB87A', border: '#5AB87A' };
      default: return { bg: 'rgba(32, 160, 160, 0.2)', text: '#20A0A0', border: '#20A0A0' };
    }
  };

  const getBorderColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#D06060';
      case 'medium': return '#D4A030';
      default: return '#C9B99A';
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 400, color: '#F5ECD7', margin: 0 }}>
          Alerts
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: totalUnresolved > 0 ? '#D06060' : '#C8813A', marginBottom: '4px' }}>
            Total Unresolved
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '24px', fontWeight: 600, color: '#F5ECD7' }}>
            {totalUnresolved}
          </div>
        </div>

        <div style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C8813A', marginBottom: '4px' }}>
            Renewals
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '24px', fontWeight: 600, color: '#F5ECD7' }}>
            {renewalCount}
          </div>
        </div>

        <div style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C8813A', marginBottom: '4px' }}>
            Claims
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '24px', fontWeight: 600, color: '#F5ECD7' }}>
            {claimCount}
          </div>
        </div>

        <div style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C8813A', marginBottom: '4px' }}>
            Other
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '24px', fontWeight: 600, color: '#F5ECD7' }}>
            {otherCount}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #2E1A0E', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              fontWeight: 500,
              padding: '6px 12px',
              borderRadius: '100px',
              background: activeTab === tab.id ? '#C8813A' : 'transparent',
              color: activeTab === tab.id ? '#120A06' : '#C9B99A',
              border: activeTab === tab.id ? 'none' : '1px solid #2E1A0E',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                background: activeTab === tab.id ? '#120A06' : '#2E1A0E',
                color: activeTab === tab.id ? '#C8813A' : '#C9B99A',
                fontSize: '10px',
                fontWeight: 500,
                padding: '1px 6px',
                borderRadius: '100px',
                minWidth: '18px',
                textAlign: 'center',
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: '8px', padding: '60px 40px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#C9B99A' }}>
            Loading alerts...
          </div>
        </div>
      ) : sortedAlerts.length === 0 ? (
        <div style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: '8px', padding: '60px 40px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', color: '#F5ECD7', marginBottom: '16px' }}>
            No alerts
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#C9B99A', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto' }}>
            {activeTab === 'resolved' ? 'No resolved alerts yet.' : 'You\'re all caught up.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sortedAlerts.map((alert) => {
            const priorityColor = getPriorityColor(alert.priority);
            const typeColor = getTypeColor(alert.type);
            const borderColor = getBorderColor(alert.priority);
            const isResolved = alert.resolved;
            
            return (
              <div
                key={alert.id}
                style={{
                  background: '#120A06',
                  borderLeft: `4px solid ${borderColor}`,
                  borderRight: '1px solid #2E1A0E',
                  borderTop: '1px solid #2E1A0E',
                  borderBottom: '1px solid #2E1A0E',
                  borderRadius: '8px',
                  padding: '16px',
                  opacity: isResolved || resolvingAlerts.has(alert.id) ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      fontWeight: 500,
                      padding: '4px 8px',
                      borderRadius: '100px',
                      background: priorityColor.bg,
                      color: priorityColor.text,
                      border: `1px solid ${priorityColor.border}`,
                      textTransform: 'capitalize',
                    }}>
                      {alert.priority}
                    </span>
                    
                    <span style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      fontWeight: 500,
                      padding: '4px 8px',
                      borderRadius: '100px',
                      background: typeColor.bg,
                      color: typeColor.text,
                      border: `1px solid ${typeColor.border}`,
                      textTransform: 'capitalize',
                    }}>
                      {alert.type === 'document' ? 'Birthday' : alert.type}
                    </span>
                  </div>
                  
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#C9B99A' }}>
                    {formatTimeAgo(alert.created_at)}
                  </div>
                </div>
                
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 600, color: '#F5ECD7', marginBottom: '8px' }}>
                  {alert.title}
                </div>
                
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#C9B99A', lineHeight: 1.5, marginBottom: '16px', maxWidth: '800px' }}>
                  {alert.body.length > 120 ? `${alert.body.substring(0, 120)}...` : alert.body}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {alert.clients && (
                      <Link 
                        href={`/dashboard/clients/${alert.clients.id}`}
                        style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '12px',
                          color: '#C8813A',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        View {alert.clients.name} →
                      </Link>
                    )}
                    
                    {alert.clients?.whatsapp && !isResolved && (
                      <a
                        href={`https://wa.me/${alert.clients.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '12px',
                          color: '#20A0A0',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Message →
                      </a>
                    )}
                  </div>
                  
                  {!isResolved && (
                    <button
                      onClick={() => markResolved(alert.id)}
                      disabled={resolvingAlerts.has(alert.id)}
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '12px',
                        fontWeight: 500,
                        padding: '6px 12px',
                        borderRadius: '4px',
                        background: resolvingAlerts.has(alert.id) ? '#4CAF50' : '#5AB87A',
                        color: '#120A06',
                        border: 'none',
                        cursor: resolvingAlerts.has(alert.id) ? 'default' : 'pointer',
                        opacity: resolvingAlerts.has(alert.id) ? 0.8 : 1,
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      onMouseEnter={(e) => {
                        if (!resolvingAlerts.has(alert.id)) {
                          e.currentTarget.style.background = '#4CAF50';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!resolvingAlerts.has(alert.id)) {
                          e.currentTarget.style.background = '#5AB87A';
                        }
                      }}
                    >
                      {resolvingAlerts.has(alert.id) ? (
                        <>
                          <span style={{ fontSize: '14px' }}>✓</span>
                          Resolved
                        </>
                      ) : (
                        'Mark resolved'
                      )}
                    </button>
                  )}
                  
                  {isResolved && !resolvingAlerts.has(alert.id) && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '12px',
                      color: '#5AB87A',
                    }}>
                      <span style={{ fontSize: '14px' }}>✓</span>
                      Resolved
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
