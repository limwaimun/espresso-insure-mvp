import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientProfilePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Fetch client by ID
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();
  
  // Fetch their policies
  const { data: policies } = await supabase
    .from('policies')
    .select('*')
    .eq('client_id', id);
  
  // Fetch their conversations
  const { data: conversations } = await supabase
    .from('conversations')
    .select('*')
    .eq('client_id', id)
    .order('last_message_at', { ascending: false })
    .limit(5);
  
  // If client doesn't exist, show 404
  if (!client) {
    return (
      <div style={{ width: '100%', textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', color: '#F5ECD7', marginBottom: '16px' }}>
          Client not found
        </div>
        <Link href="/dashboard/clients" style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          color: '#C8813A',
          textDecoration: 'none',
        }}>
          ← Back to all clients
        </Link>
      </div>
    );
  }
  
  // Calculate metrics
  const activePolicies = policies?.filter(p => p.status === 'active').length || 0;
  const totalPremium = policies?.filter(p => p.status === 'active').reduce((sum, p) => sum + (p.premium || 0), 0) || 0;
  const openClaims = policies?.filter(p => p.claims_open && p.claims_open > 0).length || 0;
  
  // Get next renewal date
  const nextRenewal = policies?.filter(p => p.renewal_date)
    .map(p => new Date(p.renewal_date))
    .sort((a, b) => a.getTime() - b.getTime())[0];
  
  const metrics = [
    { label: 'Policies', value: activePolicies.toString() },
    { label: 'Annual premium', value: `$${totalPremium.toLocaleString()}` },
    { label: 'Next renewal', value: nextRenewal ? nextRenewal.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '—' },
    { label: 'Renewal rate', value: '100%' },
    { label: 'Open claims', value: openClaims.toString() },
    { label: 'Client since', value: client.created_at ? new Date(client.created_at).getFullYear().toString() : '—' },
  ];
  
  // Generate activity from conversations and policies
  const activity = [
    ...(conversations?.map(conv => ({
      id: conv.id,
      text: `Message: ${conv.last_message?.substring(0, 50)}${conv.last_message && conv.last_message.length > 50 ? '...' : ''}`,
      date: conv.last_message_at,
    })) || []),
    ...(policies?.filter(p => p.renewal_date && new Date(p.renewal_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).map(policy => ({
      id: policy.id,
      text: `Renewal due for ${policy.name || 'policy'}`,
      date: policy.renewal_date,
    })) || []),
    ...(policies?.filter(p => p.claims_open && p.claims_open > 0).map(policy => ({
      id: policy.id,
      text: `Claim open — ${policy.name || 'policy'}`,
      date: policy.updated_at,
    })) || []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

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
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
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
        }}>
          {client.name.charAt(0)}
        </div>
        <div>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '28px',
            fontWeight: 400,
            color: '#F5ECD7',
            margin: 0,
          }}>
            {client.name}
          </h1>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            color: '#C9B99A',
          }}>
            {client.company || 'Individual'} · {client.type || 'Individual'}
          </div>
        </div>
        <span className="pill pill-amber">{client.tier || 'Standard'}</span>
      </div>
      
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
          </div>
        ))}
      </div>
      
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Recent activity</span>
        </div>
        <div className="panel-body">
          {activity.length > 0 ? (
            activity.map((a, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: '12px',
                padding: '12px 0',
                borderBottom: '1px solid #2E1A0E',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#C9B99A',
                alignItems: 'center',
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#C8813A',
                  flexShrink: 0,
                }} />
                {a.text}
              </div>
            ))
          ) : (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
            }}>
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
}