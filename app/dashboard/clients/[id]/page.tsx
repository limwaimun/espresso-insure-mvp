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

  // Calculate age from birthday
  let birthdayDisplay = '—';
  let age = null;
  if (client.birthday) {
    try {
      const birthday = new Date(client.birthday);
      const today = new Date();
      age = today.getFullYear() - birthday.getFullYear();
      const monthDiff = today.getMonth() - birthday.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
        age--;
      }
      // Format as "Mar 15, 1978 (age 48)"
      birthdayDisplay = birthday.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      if (age > 0) {
        birthdayDisplay += ` (age ${age})`;
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
      
      {/* ROW 1 — HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        {/* Left: Avatar + Name + Company + Type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
              margin: '0 0 4px 0',
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
        </div>
        
        {/* Right: Tier badge + Edit button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="pill pill-amber">{client.tier || 'Standard'}</span>
          <Link href={`/dashboard/clients/${id}/edit`} style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px',
            color: '#C8813A',
            textDecoration: 'none',
            padding: '6px 12px',
            border: '1px solid #C8813A',
            borderRadius: '4px',
          }}>
            Edit
          </Link>
        </div>
      </div>
      
      {/* ROW 2 — CONTACT INFO (4 items in a row, each in a small card) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {/* WhatsApp */}
        <div className="card" style={{ padding: '12px' }}>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            color: '#C9B99A',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            📱 Phone
          </div>
          {client.whatsapp ? (
            <a href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#F5ECD7',
              textDecoration: 'none',
            }}>
              {client.whatsapp}
            </a>
          ) : (
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
              fontStyle: 'italic',
            }}>
              —
            </div>
          )}
        </div>
        
        {/* Email */}
        <div className="card" style={{ padding: '12px' }}>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            color: '#C9B99A',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            ✉️ Email
          </div>
          {client.email ? (
            <a href={`mailto:${client.email}`} style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#F5ECD7',
              textDecoration: 'none',
            }}>
              {client.email}
            </a>
          ) : (
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
              fontStyle: 'italic',
            }}>
              —
            </div>
          )}
        </div>
        
        {/* Birthday */}
        <div className="card" style={{ padding: '12px' }}>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            color: '#C9B99A',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            🎂 Birthday
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            color: '#F5ECD7',
          }}>
            {client.birthday ? birthdayDisplay : '—'}
          </div>
        </div>
        
        {/* Address */}
        <div className="card" style={{ padding: '12px' }}>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            color: '#C9B99A',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            📍 Address
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            color: '#F5ECD7',
          }}>
            {client.address || '—'}
          </div>
        </div>
      </div>
      
      {/* ROW 3 — METRIC CARDS (keep as is) */}
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
      
      {/* ROW 4 — TWO COLUMNS: 70% Policies Table, 30% Key Dates */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '70% 30%',
        gap: '24px',
        marginBottom: '24px',
      }}>
        {/* Left column (70% width): POLICIES TABLE */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Policies</span>
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
        
        {/* Right column (30% width): KEY DATES */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Key Dates</span>
          </div>
          <div className="panel-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Birthday */}
              <div>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '11px',
                  color: '#C9B99A',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '4px',
                }}>
                  Birthday
                </div>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#F5ECD7',
                }}>
                  {client.birthday ? (
                    <>
                      {new Date(client.birthday).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
                      {age !== null && ` (age ${age})`}
                    </>
                  ) : '—'}
                </div>
              </div>
              
              {/* Next Renewal */}
              <div>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '11px',
                  color: '#C9B99A',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '4px',
                }}>
                  Next Renewal
                </div>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#F5ECD7',
                }}>
                  {nextRenewalDate ? (
                    <>
                      {nextRenewalDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {daysUntilRenewal !== null && (
                        <span className={`pill ${daysUntilRenewal <= 30 ? 'pill-danger' : daysUntilRenewal <= 90 ? 'pill-amber' : 'pill-ok'}`} style={{ marginLeft: '8px' }}>
                          {daysUntilRenewal} days
                        </span>
                      )}
                    </>
                  ) : '—'}
                </div>
              </div>
              
              {/* Client Since */}
              <div>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '11px',
                  color: '#C9B99A',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '4px',
                }}>
                  Client Since
                </div>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#F5ECD7',
                }}>
                  {client.created_at ? new Date(client.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ROW 5 — RECENT ACTIVITY (full width, below the two columns) */}
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