import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import ClientDetailInteractive from '../components/ClientDetailInteractive';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientProfilePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  const { data: policies } = await supabase
    .from('policies')
    .select('*')
    .eq('client_id', id)
    .order('renewal_date', { ascending: true });

  const { data: conversationsData } = await supabase
    .from('conversations')
    .select('*, messages(id, role, content, created_at)')
    .eq('client_id', id)
    .order('last_message_at', { ascending: false })
    .limit(1);

  const conversations = conversationsData && conversationsData.length > 0 ? conversationsData[0] : null;

  const { data: claims } = await supabase
    .from('alerts')
    .select('*')
    .eq('client_id', id)
    .eq('type', 'claim')
    .order('created_at', { ascending: false });

  const { data: allAlerts } = await supabase
    .from('alerts')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: clientConvos } = await supabase
    .from('conversations')
    .select('id')
    .eq('client_id', id);

  let clientMessages: any[] = [];
  if (clientConvos && clientConvos.length > 0) {
    const convoIds = clientConvos.map((c: any) => c.id);
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', convoIds)
      .order('created_at', { ascending: false })
      .limit(10);
    clientMessages = msgs || [];
  }

  // Fetch IFA profile for name
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user?.id ?? '')
    .single();

  const ifaName = profile?.name ?? 'Your Advisor';

  if (!client) {
    return (
      <div style={{ width: '100%', textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', color: '#F5ECD7', marginBottom: '16px' }}>
          Client not found
        </div>
        <Link href="/dashboard/clients" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#C8813A', textDecoration: 'none' }}>
          ← Back to all clients
        </Link>
      </div>
    );
  }

  // ── Metrics ───────────────────────────────────────────────────────────────
  const activePolicies = policies?.filter(p => p.status === 'active').length || 0;
  const totalPremium = policies?.filter(p => p.status === 'active').reduce((sum, p) => sum + (Number(p.premium) || 0), 0) || 0;

  let calculatedTier = 'bronze';
  if (totalPremium >= 10000) calculatedTier = 'platinum';
  else if (totalPremium >= 5000) calculatedTier = 'gold';
  else if (totalPremium >= 1000) calculatedTier = 'silver';

  let nextRenewalDate = null;
  let daysUntilRenewal = null;
  if (policies && policies.length > 0) {
    const renewalDates = policies.filter(p => p.renewal_date).map(p => new Date(p.renewal_date)).sort((a, b) => a.getTime() - b.getTime());
    if (renewalDates.length > 0) {
      nextRenewalDate = renewalDates[0];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const rd = new Date(nextRenewalDate);
      rd.setHours(0, 0, 0, 0);
      daysUntilRenewal = Math.ceil((rd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  const metrics = [
    { label: 'Policies', value: activePolicies.toString() },
    { label: 'Annual premium', value: `$${totalPremium.toLocaleString()}` },
    {
      label: 'Next renewal',
      value: nextRenewalDate ? nextRenewalDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '—',
      subtitle: daysUntilRenewal !== null ? `${daysUntilRenewal} days` : '',
    },
    {
      label: 'Client since',
      value: client.created_at ? new Date(client.created_at).getFullYear().toString() : '—',
      subtitle: client.created_at ? new Date(client.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '',
    },
  ];

  // ── Birthday ──────────────────────────────────────────────────────────────
  let birthdayDisplay = '—';
  if (client.type === 'individual' && client.birthday) {
    try {
      const birthday = new Date(client.birthday);
      const today = new Date();
      let age = today.getFullYear() - birthday.getFullYear();
      const m = today.getMonth() - birthday.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) age--;
      birthdayDisplay = birthday.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      if (age > 0) birthdayDisplay += ` (${age})`;
    } catch { birthdayDisplay = 'Invalid date'; }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    try { return new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
  };

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
    } catch { return '—'; }
  };

  // ── Timeline ──────────────────────────────────────────────────────────────
  const timeline = [
    ...clientMessages.map((m: any) => ({
      date: m.created_at,
      text: m.role === 'client' ? `Client: "${m.content?.slice(0, 80) || ''}${m.content?.length > 80 ? '...' : ''}"` : `Maya: "${m.content?.slice(0, 80) || ''}${m.content?.length > 80 ? '...' : ''}"`,
      type: 'message',
    })),
    ...(allAlerts || []).map((a: any) => ({
      date: a.created_at,
      text: a.title || 'Alert',
      type: 'alert',
    })),
    ...(policies || []).map((p: any) => ({
      date: p.created_at,
      text: `${p.insurer || 'Unknown'} ${p.type || 'policy'} added ($${(Number(p.premium) || 0).toLocaleString()}/yr)`,
      type: 'policy',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15);

  // ── Coverage analysis ─────────────────────────────────────────────────────
  let coverageTypes: { key: string; label: string }[] = [];
  if (client.type === 'individual') {
    coverageTypes = [
      { key: 'life', label: 'Life' }, { key: 'health', label: 'Health' },
      { key: 'critical illness', label: 'Critical Illness' }, { key: 'disability', label: 'Disability' },
      { key: 'motor', label: 'Motor' }, { key: 'travel', label: 'Travel' },
      { key: 'property', label: 'Property' }, { key: 'professional indemnity', label: 'Professional Indemnity' },
    ];
  } else if (client.type === 'sme') {
    coverageTypes = [
      { key: 'group health', label: 'Group Health' }, { key: 'group life', label: 'Group Life' },
      { key: 'fire', label: 'Fire Insurance' }, { key: 'professional indemnity', label: 'Professional Indemnity' },
      { key: 'business interruption', label: 'Business Interruption' }, { key: 'keyman', label: 'Keyman Insurance' },
      { key: 'directors & officers', label: 'Directors & Officers (D&O)' }, { key: 'cyber', label: 'Cyber Insurance' },
    ];
  } else {
    coverageTypes = [
      { key: 'group health', label: 'Group Health' }, { key: 'group life', label: 'Group Life' },
      { key: 'fire', label: 'Fire Insurance' }, { key: 'professional indemnity', label: 'Professional Indemnity' },
      { key: 'business interruption', label: 'Business Interruption' }, { key: 'keyman', label: 'Keyman Insurance' },
      { key: 'directors & officers', label: 'Directors & Officers (D&O)' }, { key: 'cyber', label: 'Cyber Insurance' },
      { key: 'workers compensation', label: 'Workers Compensation' }, { key: 'public liability', label: 'Public Liability' },
      { key: 'marine', label: 'Marine Insurance' },
    ];
  }

  const coverageAnalysis = coverageTypes.map(ct => {
    const matchingPolicy = policies?.find(p =>
      p.type && p.type.toLowerCase().includes(ct.key.toLowerCase())
    );
    return { ...ct, hasCoverage: !!matchingPolicy, insurer: matchingPolicy?.insurer || null };
  });

  // ── Connection status ─────────────────────────────────────────────────────
  const connectionStatus = conversations?.status === 'active' ? 'connected'
    : conversations?.status === 'waiting' ? 'pending'
    : 'not_connected';

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* == SECTION 1: CLIENT HEADER == */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: '#3D2215', border: '1px solid #C8813A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: '#C8813A', flexShrink: 0,
          }}>
            {client.name?.charAt(0) || '?'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', fontWeight: 400, color: '#F5ECD7', margin: 0 }}>
                {client.name}
              </h1>
              <span style={{
                fontFamily: 'DM Mono, monospace', fontSize: '10px',
                color: calculatedTier === 'platinum' ? '#E5E4E2' : calculatedTier === 'gold' ? '#C8813A' : calculatedTier === 'silver' ? '#C9B99A' : '#CD7F32',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                background: '#2E1A0E', padding: '2px 8px', borderRadius: '100px',
              }}>
                {calculatedTier}
              </span>
              <span style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#C9B99A',
                background: '#1C0F0A', border: '1px solid #2E1A0E',
                padding: '2px 8px', borderRadius: '100px', textTransform: 'capitalize',
              }}>
                {client.type}
              </span>
            </div>
            {client.company && (
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#C9B99A', marginBottom: '6px' }}>
                {client.company}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#C9B99A', alignItems: 'center' }}>
              {client.whatsapp && <span>📱 {client.whatsapp}</span>}
              {client.email && <span>✉️ {client.email}</span>}
              {client.type === 'individual' && client.birthday && <span>🎂 {birthdayDisplay}</span>}
              {client.address && <span>📍 {client.address}</span>}
            </div>
          </div>
        </div>

        {/* Interactive buttons + policies table + modals — all in client component */}
        <ClientDetailInteractive
          clientId={id}
          clientName={client.name}
          clientWhatsApp={client.whatsapp}
          clientEmail={client.email}
          clientBirthday={client.birthday}
          clientAddress={client.address}
          clientCompany={client.company}
          clientType={client.type}
          ifaId={user?.id ?? ''}
          ifaName={ifaName}
          connectionStatus={connectionStatus}
          policies={(policies ?? []).map(p => ({
            id: p.id,
            insurer: p.insurer,
            type: p.type,
            premium: p.premium,
            renewal_date: p.renewal_date,
            status: p.status,
            document_name: p.document_name ?? null,
            document_url: p.document_url ?? null,
          }))}
        />
      </div>

      {/* == SECTION 2: METRIC CARDS == */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: '8px', padding: '20px 24px' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#C9B99A', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '8px' }}>
              {m.label}
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 300, color: '#F5ECD7', lineHeight: 1 }}>
              {m.value}
            </div>
            {m.subtitle && <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: '#C9B99A', marginTop: '6px' }}>{m.subtitle}</div>}
          </div>
        ))}
      </div>

      {/* == SECTION 3: WHATSAPP == */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="panel-title">WhatsApp</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: connectionStatus === 'connected' ? '#5AB87A' : connectionStatus === 'pending' ? '#F6AD55' : '#C9B99A' }} />
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: connectionStatus === 'connected' ? '#5AB87A' : connectionStatus === 'pending' ? '#F6AD55' : '#C9B99A', fontWeight: 500 }}>
                {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'pending' ? 'Pending' : 'Not connected'}
              </span>
            </div>
          </div>
          {conversations && (
            <Link href={`/dashboard/conversations/${conversations.id}`} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#C8813A', textDecoration: 'none' }}>
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
                    .slice(-3)
                    .map((message: any) => (
                      <div key={message.id} style={{ display: 'flex', justifyContent: message.role === 'client' ? 'flex-start' : 'flex-end', marginBottom: '8px' }}>
                        <div style={{ maxWidth: '70%', padding: '8px 12px', borderRadius: '12px', background: message.role === 'client' ? '#2E1A0E' : '#C8813A', color: message.role === 'client' ? '#F5ECD7' : '#120A06', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', lineHeight: 1.4 }}>
                          <div style={{ marginBottom: '2px' }}>{message.content}</div>
                          <div style={{ fontSize: '10px', color: message.role === 'client' ? '#C9B99A' : 'rgba(18,10,6,0.7)', textAlign: 'right' }}>
                            {new Date(message.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#C9B99A' }}>
                  No messages yet in this conversation.
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <Link href={`/dashboard/conversations/${conversations.id}`} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#C8813A', textDecoration: 'none', padding: '8px 16px', border: '1px solid #C8813A', borderRadius: '4px', display: 'inline-block' }}>
                  View full conversation →
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#C9B99A', marginBottom: '16px' }}>
                This client is not yet connected to Maya on WhatsApp.
              </div>
              {/* WhatsApp setup button rendered by ClientDetailInteractive below */}
            </div>
          )}
        </div>
      </div>

      {/* == SECTION 5: COVERAGE ANALYSIS == */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header"><span className="panel-title">Coverage analysis</span></div>
        <div className="panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {coverageAnalysis.map((coverage) => (
              <div key={coverage.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '4px', background: coverage.hasCoverage ? 'rgba(90,184,122,0.1)' : 'rgba(200,129,58,0.1)' }}>
                <div style={{ fontSize: '16px', color: coverage.hasCoverage ? '#5AB87A' : '#C9B99A' }}>{coverage.hasCoverage ? '✓' : '—'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#F5ECD7', fontWeight: 500 }}>{coverage.label}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: coverage.hasCoverage ? '#5AB87A' : '#C8813A' }}>
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
        <div className="panel-header"><span className="panel-title">Claims</span></div>
        <div className="panel-body">
          {claims && claims.length > 0 ? (
            <div className="table">
              <table style={{ width: '100%' }}>
                <thead><tr><th>Date</th><th>Description</th><th>Status</th><th>Priority</th></tr></thead>
                <tbody>
                  {claims.map((claim: any) => {
                    const claimDate = claim.created_at ? new Date(claim.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                    const claimDescription = claim.title || (claim.body ? claim.body.slice(0, 60) + (claim.body.length > 60 ? '...' : '') : 'No description');
                    const claimBody = claim.body ? claim.body.slice(0, 100) + (claim.body.length > 100 ? '...' : '') : null;
                    return (
                      <tr key={claim.id}>
                        <td style={{ verticalAlign: 'top' }}>{claimDate}</td>
                        <td style={{ verticalAlign: 'top' }}>
                          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#F5ECD7', fontWeight: 500, marginBottom: '4px' }}>{claimDescription}</div>
                          {claimBody && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#C9B99A', lineHeight: 1.4 }}>{claimBody}</div>}
                        </td>
                        <td style={{ verticalAlign: 'top' }}>
                          <span className={`pill ${claim.resolved === true ? 'pill-ok' : 'pill-amber'}`}>{claim.resolved === true ? 'Resolved' : 'Open'}</span>
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
            <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#C9B99A' }}>No claims history.</div>
          )}
        </div>
      </div>

      {/* == SECTION 7: ACTIVITY TIMELINE == */}
      <div className="panel">
        <div className="panel-header"><span className="panel-title">Activity</span></div>
        <div className="panel-body">
          {timeline.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {timeline.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', marginTop: '5px', flexShrink: 0, background: item.type === 'message' ? '#C8813A' : item.type === 'alert' ? '#D06060' : '#5AB87A' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#F5ECD7' }}>{item.text}</div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: '#C9B99A', marginTop: '2px' }}>{formatRelativeTime(item.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#C9B99A' }}>No activity recorded yet.</div>
          )}
        </div>
      </div>

    </div>
  );
}
