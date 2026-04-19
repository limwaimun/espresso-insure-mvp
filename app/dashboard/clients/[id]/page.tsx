import { createClient } from '@/lib/supabase/server';
import ClientDetailPage from '../components/ClientDetailPage';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientProfilePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Run all independent queries in parallel — much faster than sequential awaits
  const [
    { data: client },
    { data: policies },
    { data: conversationsData },
    { data: claims },
    { data: allAlerts },
    { data: clientConvos },
    { data: { user } },
    { data: holdings },
  ] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase.from('policies').select('*').eq('client_id', id).order('renewal_date', { ascending: true }),
    supabase.from('conversations').select('*, messages(id, role, content, created_at)').eq('client_id', id).order('last_message_at', { ascending: false }).limit(1),
    supabase.from('alerts').select('*').eq('client_id', id).eq('type', 'claim').order('created_at', { ascending: false }),
    supabase.from('alerts').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(10),
    supabase.from('conversations').select('id').eq('client_id', id),
    supabase.auth.getUser(),
    supabase.from('holdings').select('*').eq('client_id', id).order('current_value', { ascending: false }),
  ])

  const conversations = conversationsData?.[0] ?? null

  // Second round — depends on first round results, but run in parallel with each other
  const [clientMessages, profileResult] = await Promise.all([
    clientConvos && clientConvos.length > 0
      ? supabase.from('messages').select('*').in('conversation_id', clientConvos.map((c: any) => c.id)).order('created_at', { ascending: false }).limit(10).then(r => r.data || [])
      : Promise.resolve([]),
    supabase.from('profiles').select('name').eq('id', user?.id ?? '').single(),
  ])

  const ifaName = profileResult.data?.name ?? 'Your Advisor'

  if (!client) {
    return (
      <div style={{ width: '100%', textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color: '#F5ECD7', marginBottom: 16 }}>Client not found</div>
        <a href="/dashboard/clients" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#C8813A', textDecoration: 'none' }}>← Back to all clients</a>
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
    const dates = policies.filter(p => p.renewal_date).map(p => new Date(p.renewal_date)).sort((a, b) => a.getTime() - b.getTime());
    if (dates.length > 0) {
      nextRenewalDate = dates[0];
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const rd = new Date(nextRenewalDate); rd.setHours(0, 0, 0, 0);
      daysUntilRenewal = Math.ceil((rd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  const metrics = [
    { label: 'Policies', value: activePolicies.toString() },
    { label: 'Annual premium', value: `$${totalPremium.toLocaleString()}` },
    {
      label: 'Next renewal',
      value: nextRenewalDate ? nextRenewalDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '—',
      subtitle: daysUntilRenewal !== null ? `${daysUntilRenewal}  days` : '',
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
    const match = policies?.find(p => p.type && p.type.toLowerCase().includes(ct.key.toLowerCase()));
    return { ...ct, hasCoverage: !!match, insurer: match?.insurer || null };
  });

  // ── Timeline ──────────────────────────────────────────────────────────────
  const timeline = [
    ...clientMessages.map((m: any) => ({
      date: m.created_at,
      text: m.role === 'client' ? `Client: "${m.content?.slice(0, 80) || ''}${m.content?.length > 80 ? '...' : ''}"` : `Maya: "${m.content?.slice(0, 80) || ''}${m.content?.length > 80 ? '...' : ''}"`,
      type: 'message',
    })),
    ...(allAlerts || []).map((a: any) => ({ date: a.created_at, text: a.title || 'Alert', type: 'alert' })),
    ...(policies || []).map((p: any) => ({
      date: p.created_at,
      text: `${p.insurer || 'Unknown'} ${p.type || 'policy'} added ($${(Number(p.premium) || 0).toLocaleString()}/yr)`,
      type: 'policy',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15);

  // ── Connection status ─────────────────────────────────────────────────────
  const connectionStatus = conversations?.status === 'active' ? 'connected'
    : conversations?.status === 'waiting' ? 'pending'
    : 'not_connected';

  return (
    <ClientDetailPage
      client={{
        id: client.id,
        name: client.name,
        company: client.company,
        type: client.type,
        tier: client.tier,
        whatsapp: client.whatsapp,
        email: client.email,
        birthday: client.birthday,
        address: client.address,
      }}
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
      conversations={conversations}
      claims={claims ?? []}
      metrics={metrics}
      birthdayDisplay={birthdayDisplay}
      coverageAnalysis={coverageAnalysis}
      timeline={timeline}
      connectionStatus={connectionStatus}
      calculatedTier={calculatedTier}
      ifaId={user?.id ?? ''}
      ifaName={ifaName}
      holdings={holdings ?? []}
    />
  );
}
