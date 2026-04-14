import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function RenewalsPage() {
  const supabase = await createClient();

  const { data: policies } = await supabase
    .from('policies')
    .select('*, clients(id, name, company, whatsapp)')
    .order('renewal_date', { ascending: true });

  const allPolicies = policies || [];
  const now = new Date();

  // Calculate days until renewal and assign status
  const enriched = allPolicies.map(p => {
    const days = p.renewal_date
      ? Math.ceil((new Date(p.renewal_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    let status = 'upcoming';
    let statusLabel = 'Upcoming';
    let statusColor = '#5AB87A';

    if (days === null) {
      status = 'unknown';
      statusLabel = 'No date';
      statusColor = '#C9B99A';
    } else if (days < 0) {
      status = 'lapsed';
      statusLabel = 'Lapsed';
      statusColor = '#8B3A3A';
    } else if (days <= 30) {
      status = 'urgent';
      statusLabel = 'Urgent';
      statusColor = '#D06060';
    } else if (days <= 60) {
      status = 'action';
      statusLabel = 'Action needed';
      statusColor = '#D4A030';
    } else if (days <= 90) {
      status = 'review';
      statusLabel = 'Review';
      statusColor = '#20A0A0';
    } else {
      status = 'upcoming';
      statusLabel = 'Upcoming';
      statusColor = '#5AB87A';
    }

    return { ...p, days, status, statusLabel, statusColor };
  });

  // Sort: lapsed first, then urgent, then by days ascending
  const sorted = enriched.sort((a, b) => {
    const order: Record<string, number> = { lapsed: 0, urgent: 1, action: 2, review: 3, upcoming: 4, unknown: 5 };
    const aOrder = order[a.status] ?? 5;
    const bOrder = order[b.status] ?? 5;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (a.days ?? 9999) - (b.days ?? 9999);
  });

  // Summary counts
  const lapsedCount = sorted.filter(p => p.status === 'lapsed').length;
  const urgentCount = sorted.filter(p => p.status === 'urgent').length;
  const actionCount = sorted.filter(p => p.status === 'action').length;
  const reviewCount = sorted.filter(p => p.status === 'review').length;

  const urgentPremium = sorted.filter(p => p.status === 'urgent').reduce((s, p) => s + (Number(p.premium) || 0), 0);
  const lapsedPremium = sorted.filter(p => p.status === 'lapsed').reduce((s, p) => s + (Number(p.premium) || 0), 0);

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
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '28px',
            fontWeight: 400,
            color: '#F5ECD7',
            margin: 0,
          }}>Renewals</h1>
        </div>

        {/* Summary Cards - Match All Clients style */}
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
              color: '#8B3A3A',
              marginBottom: '4px',
            }}>
              Lapsed
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#F5ECD7',
            }}>
              {lapsedCount}
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#8B3A3A',
              marginTop: '4px',
            }}>
              ${lapsedPremium.toLocaleString()} at risk
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
              color: '#D06060',
              marginBottom: '4px',
            }}>
              Urgent
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#F5ECD7',
            }}>
              {urgentCount}
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#D06060',
              marginTop: '4px',
            }}>
              ${urgentPremium.toLocaleString()} in next 30 days
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
              color: '#D4A030',
              marginBottom: '4px',
            }}>
              Action needed
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#F5ECD7',
            }}>
              {actionCount}
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#D4A030',
              marginTop: '4px',
            }}>
              31–60 days
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
              color: '#20A0A0',
              marginBottom: '4px',
            }}>
              Under review
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#F5ECD7',
            }}>
              {reviewCount}
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#20A0A0',
              marginTop: '4px',
            }}>
              61–90 days
            </div>
          </div>
        </div>

        {/* Summary text */}
        <div style={{
          background: '#120A06',
          border: '1px solid #2E1A0E',
          borderRadius: '8px',
          padding: '12px 20px',
          marginBottom: '24px',
          fontSize: '14px',
          color: '#C9B99A',
        }}>
          {sorted.length} policies tracked · {lapsedCount > 0 && <span style={{ color: '#8B3A3A' }}>{lapsedCount} lapsed · </span>}
          <span style={{ color: '#D06060' }}>{urgentCount} urgent</span> · <span style={{ color: '#D4A030' }}>{actionCount} action needed</span> · <span style={{ color: '#20A0A0' }}>{reviewCount} under review</span>
        </div>

        {/* Renewals Table - Match All Clients table styling */}
        <div style={{
          background: '#120A06',
          border: '1px solid #2E1A0E',
          borderRadius: '8px',
          overflow: 'hidden',
          width: '100%',
        }}>
          <div style={{
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 280px)',
          }}>
            <table style={{
              width: '100%',
              tableLayout: 'auto',
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
                    Policy Type
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
                    Insurer
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
                    Premium
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
                    Renewal
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
                    Days
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
                    Action
                  </th>
                </tr>
              </thead>
          <tbody>
            {sorted.map((p, i) => {
              const client = p.clients as any;
              const clientName = client?.name || 'Unknown';
              const clientId = client?.id || p.client_id;
              const whatsapp = client?.whatsapp?.replace(/[^0-9]/g, '') || '';
              const renewalDate = p.renewal_date
                ? new Date(p.renewal_date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })
                : '—';

              return (
                <tr key={p.id || i} style={{ borderBottom: '1px solid #2E1A0E' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <Link href={`/dashboard/clients/${clientId}`} style={{ color: '#F5ECD7', textDecoration: 'none', fontWeight: 'bold' }}>
                      {clientName}
                    </Link>
                    {client?.company && (
                      <div style={{ fontSize: '12px', color: '#C9B99A' }}>{client.company}</div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#F5ECD7', fontSize: '13px' }}>{p.type || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#C9B99A', fontSize: '13px' }}>{p.insurer || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#F5ECD7', fontSize: '13px', fontFamily: 'DM Mono, monospace' }}>
                    ${(Number(p.premium) || 0).toLocaleString()}/yr
                  </td>
                  <td style={{ padding: '12px 16px', color: p.days !== null && p.days <= 30 ? p.statusColor : '#C9B99A', fontSize: '13px' }}>
                    {renewalDate}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: p.statusColor, fontFamily: 'DM Mono, monospace' }}>
                    {p.days === null ? '—' : p.days < 0 ? 'Overdue' : `${p.days}d`}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: p.statusColor + '20',
                      color: p.statusColor,
                    }}>
                      {p.statusLabel}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <Link 
                        href={`/dashboard/clients/${p.client_id}`}
                        style={{
                          color: '#C8813A',
                          textDecoration: 'none',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        View client →
                      </Link>
                      

                      
                      <span 
                        style={{
                          color: '#C9B99A',
                          fontSize: '13px',
                          opacity: 0.5,
                          cursor: 'not-allowed',
                          fontStyle: 'italic',
                        }}
                        title="Coming soon"
                      >
                        Ask Maya →
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

        {sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#C9B99A' }}>
            No policies tracked yet. Import clients to see renewals.
          </div>
        )}
      </div>
    </div>
  );
}