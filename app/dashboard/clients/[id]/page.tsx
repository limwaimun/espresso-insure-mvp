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
  
  // Fetch their policies, ordered by renewal date
  const { data: policies } = await supabase
    .from('policies')
    .select('*')
    .eq('client_id', id)
    .order('renewal_date', { ascending: true });
  
  // Fetch their conversations
  const { data: conversations } = await supabase
    .from('conversations')
    .select('*')
    .eq('client_id', id)
    .order('last_message_at', { ascending: false })
    .limit(5);
  
  // Fetch claims for this client
  const { data: claims } = await supabase
    .from('alerts')
    .select('*')
    .eq('client_id', id)
    .eq('type', 'claim')
    .order('created_at', { ascending: false });
  
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
          <Link href={`/dashboard/clients/${id}/edit`} style={{
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
          }}>
            <span>✏️</span> Edit
          </Link>
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
      
      {/* == SECTION 3: POLICIES TABLE == */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="panel-title">Policies</span>
          <Link href="#" style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px',
            color: '#C8813A',
            textDecoration: 'none',
          }}>
            + Add policy
          </Link>
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
      
      {/* == SECTION 4: COVERAGE ANALYSIS == */}
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
      
      {/* == SECTION 5: CLAIMS == */}
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
                  {claims.map((claim: any) => (
                    <tr key={claim.id}>
                      <td>
                        {claim.created_at ? new Date(claim.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td>{claim.description || 'No description'}</td>
                      <td>
                        <span className={`pill ${claim.status === 'resolved' ? 'pill-ok' : 'pill-amber'}`}>
                          {claim.status === 'resolved' ? 'Resolved' : 'Open'}
                        </span>
                      </td>
                      <td>
                        <span className={`pill ${claim.priority === 'high' ? 'pill-danger' : claim.priority === 'medium' ? 'pill-amber' : 'pill-ok'}`}>
                          {claim.priority === 'high' ? 'High' : claim.priority === 'medium' ? 'Medium' : 'Low'}
                        </span>
                      </td>
                    </tr>
                  ))}
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
      
      {/* == SECTION 7: RECENT ACTIVITY == */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Activity</span>
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