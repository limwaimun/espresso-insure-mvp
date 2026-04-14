import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function DashboardHome() {
  const supabase = await createClient();

  // ALL queries in parallel — this is the key to fast loading
  const [
    clientResult,
    policyResult,
    conversationResult,
    unresolvedAlertResult,
    allPoliciesResult,
    birthdayResult,
    recentConvosResult,
    recentAlertsResult,
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('policies').select('*', { count: 'exact', head: true }),
    supabase.from('conversations').select('*', { count: 'exact', head: true }),
    supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('resolved', false),
    supabase.from('policies').select('premium, renewal_date, status'),
    supabase.from('clients').select('birthday'),
    supabase.from('conversations').select('*, clients(name, company)').order('last_message_at', { ascending: false }).limit(10),
    supabase.from('alerts').select('*, clients(name)').eq('resolved', false).order('created_at', { ascending: false }).limit(10),
  ]);

  const clientCount = clientResult.count ?? 0;
  const policyCount = policyResult.count ?? 0;
  const conversationCount = conversationResult.count ?? 0;
  const allPolicies = allPoliciesResult.data || [];
  const clients = birthdayResult.data || [];
  const recentConversations = recentConvosResult.data || [];
  const recentAlerts = recentAlertsResult.data || [];

  // Premium
  const totalPremium = allPolicies.reduce((sum, p) => sum + (Number(p.premium) || 0), 0);

  // Renewals in 90 days
  const now = new Date();
  const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const renewalCount = allPolicies.filter(p => {
    if (!p.renewal_date) return false;
    const d = new Date(p.renewal_date);
    return d >= now && d <= ninetyDays;
  }).length;

  // Birthdays in next 30 days
  const birthdayCount = clients.filter(c => {
    if (!c.birthday) return false;
    const bday = new Date(c.birthday);
    const thisYear = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
    const diffDays = Math.ceil((thisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }).length;

  // Relative time helper
  function timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' });
  }

  const metrics = [
    { label: 'CLIENTS', value: clientCount, subtitle: `${clientCount} total`, color: '#5AB87A' },
    { label: 'RENEWALS', value: renewalCount, subtitle: `${renewalCount} due in 90 days`, color: '#D06060' },
    { label: 'CHATS', value: conversationCount, subtitle: conversationCount > 0 ? `${conversationCount} active` : 'No data yet', color: '#5AB87A' },
    { label: 'POLICIES', value: policyCount, subtitle: `${policyCount} total`, color: '#20A0A0' },
    { label: 'PREMIUM', value: `$${totalPremium.toLocaleString()}`, subtitle: 'Annual premium', color: '#5AB87A' },
    { label: 'BIRTHDAYS', value: birthdayCount, subtitle: birthdayCount > 0 ? `${birthdayCount} this month` : 'None upcoming', color: '#D4A030' },
  ];

  return (
    <div>
      <p style={{ color: '#C9B99A', fontSize: '14px', marginBottom: '24px' }}>
        {"Here's what's happening with your clients today."}
      </p>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: m.color, marginBottom: '8px' }}>{m.label}</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', color: '#F5ECD7' }}>{m.value}</div>
            <div style={{ fontSize: '12px', color: m.color, marginTop: '4px' }}>{m.subtitle}</div>
          </div>
        ))}
      </div>

      {/* Two Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'stretch' }}>

        {/* Recent Conversations */}
        <div style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column' as const, minHeight: 'calc(100vh - 420px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#F5ECD7', margin: 0 }}>Recent conversations</h3>
            <Link href="/dashboard/conversations" style={{ color: '#C8813A', textDecoration: 'none', fontSize: '13px' }}>View all →</Link>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' as const }}>
            {recentConversations.length === 0 ? (
              <p style={{ color: '#C9B99A', fontSize: '14px' }}>No conversations yet</p>
            ) : (
              recentConversations.map((conv: any, i: number) => (
                <Link key={i} href="/dashboard/conversations" style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '12px 0', borderBottom: '1px solid #2E1A0E' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div>
                        <span style={{ color: '#F5ECD7', fontSize: '14px', fontWeight: 'bold' }}>{conv.clients?.name || 'Unknown'}</span>
                        {conv.clients?.company && <span style={{ color: '#C9B99A', fontSize: '13px' }}> · {conv.clients.company}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          background: conv.status === 'active' ? '#5AB87A25' : '#D4A03025',
                          color: conv.status === 'active' ? '#5AB87A' : '#D4A030',
                        }}>{conv.status === 'active' ? 'Active' : 'Waiting'}</span>
                        <span style={{ color: '#C9B99A', fontSize: '12px' }}>{timeAgo(conv.last_message_at)}</span>
                      </div>
                    </div>
                    <div style={{ color: '#C9B99A', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      {(conv.last_message || '').slice(0, 80)}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Alerts */}
        <div style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column' as const, minHeight: 'calc(100vh - 420px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#F5ECD7', margin: 0 }}>Recent alerts</h3>
            <Link href="/dashboard/alerts" style={{ color: '#C8813A', textDecoration: 'none', fontSize: '13px' }}>View all →</Link>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' as const }}>
            {recentAlerts.length === 0 ? (
              <p style={{ color: '#C9B99A', fontSize: '14px' }}>No alerts yet</p>
            ) : (
              recentAlerts.map((alert: any, i: number) => {
                const priorityColor = alert.priority === 'high' ? '#D06060' : alert.priority === 'medium' ? '#D4A030' : '#C9B99A';
                return (
                  <Link key={i} href="/dashboard/alerts" style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '12px 0', borderBottom: '1px solid #2E1A0E' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#F5ECD7', fontSize: '14px', fontWeight: 'bold' }}>{alert.title || 'Alert'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            background: priorityColor + '25',
                            color: priorityColor,
                          }}>{alert.priority === 'high' ? 'High' : alert.priority === 'medium' ? 'Medium' : 'Info'}</span>
                          <span style={{ color: '#C9B99A', fontSize: '12px' }}>{timeAgo(alert.created_at)}</span>
                        </div>
                      </div>
                      <div style={{ color: '#C9B99A', fontSize: '13px' }}>{alert.clients?.name || ''}</div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}