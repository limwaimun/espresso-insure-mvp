import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function RenewalsPage() {
  const supabase = await createClient();
  
  // Fetch policies with upcoming renewal dates and client names + WhatsApp
  const { data: renewals } = await supabase
    .from('policies')
    .select('*, clients(name, whatsapp)')
    .order('renewal_date', { ascending: true });

  // Calculate status counts for summary bar
  let urgentCount = 0;
  let actionNeededCount = 0;
  let reviewCount = 0;
  let upcomingCount = 0;
  let lapsedCount = 0;

  if (renewals) {
    renewals.forEach(renewal => {
      const renewalDate = new Date(renewal.renewal_date);
      const today = new Date();
      const daysUntilRenewal = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilRenewal < 0) {
        lapsedCount++;
      } else if (daysUntilRenewal <= 30) {
        urgentCount++;
      } else if (daysUntilRenewal <= 60) {
        actionNeededCount++;
      } else if (daysUntilRenewal <= 90) {
        reviewCount++;
      } else {
        upcomingCount++;
      }
    });
  }

  return (
    <div style={{ width: '100%' }}>
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
        }}>
          Renewals
        </h1>
        {/* View calendar button removed as requested */}
      </div>

      {renewals && renewals.length > 0 ? (
        <>
          {/* Summary Bar */}
          <div style={{
            background: 'rgba(200,129,58,0.06)',
            borderRadius: '8px',
            padding: '8px 16px',
            marginBottom: '16px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            color: '#C9B99A',
          }}>
            {urgentCount > 0 && <span style={{ color: '#D06060', fontWeight: 500 }}>{urgentCount} urgent</span>}
            {urgentCount > 0 && actionNeededCount > 0 && ' · '}
            {actionNeededCount > 0 && <span style={{ color: '#D4A030', fontWeight: 500 }}>{actionNeededCount} action needed</span>}
            {(urgentCount > 0 || actionNeededCount > 0) && reviewCount > 0 && ' · '}
            {reviewCount > 0 && <span style={{ color: '#20A0A0', fontWeight: 500 }}>{reviewCount} under review</span>}
            {(urgentCount > 0 || actionNeededCount > 0 || reviewCount > 0) && upcomingCount > 0 && ' · '}
            {upcomingCount > 0 && <span style={{ color: '#5AB87A', fontWeight: 500 }}>{upcomingCount} upcoming</span>}
            {(urgentCount > 0 || actionNeededCount > 0 || reviewCount > 0 || upcomingCount > 0) && lapsedCount > 0 && ' · '}
            {lapsedCount > 0 && <span style={{ color: '#A04040', fontWeight: 500 }}>{lapsedCount} lapsed</span>}
          </div>

          {/* Renewals Table */}
          <div style={{
            background: '#120A06',
            border: '1px solid #2E1A0E',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <div style={{
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 280px)',
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
                      Policy
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
                      Insurer
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
                      Renewal Date
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
                      Days
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
                      Premium
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
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {renewals.map((renewal) => {
                    const renewalDate = new Date(renewal.renewal_date);
                    const today = new Date();
                    const daysUntilRenewal = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    // Determine status based on days until renewal
                    let statusText = 'Upcoming';
                    let pillClass = 'pill-ok';
                    
                    if (daysUntilRenewal < 0) {
                      statusText = 'Lapsed';
                      pillClass = 'pill-danger';
                    } else if (daysUntilRenewal <= 30) {
                      statusText = 'Urgent';
                      pillClass = 'pill-danger';
                    } else if (daysUntilRenewal <= 60) {
                      statusText = 'Action needed';
                      pillClass = 'pill-amber';
                    } else if (daysUntilRenewal <= 90) {
                      statusText = 'Review';
                      pillClass = 'pill-teal';
                    } else {
                      statusText = 'Upcoming';
                      pillClass = 'pill-ok';
                    }
                    
                    // Format days display
                    let daysDisplay = '';
                    if (daysUntilRenewal < 0) {
                      daysDisplay = 'Overdue';
                    } else if (daysUntilRenewal === 0) {
                      daysDisplay = 'Today';
                    } else if (daysUntilRenewal === 1) {
                      daysDisplay = '1 day';
                    } else {
                      daysDisplay = `${daysUntilRenewal} days`;
                    }
                    
                    return (
                      <tr key={renewal.id}>
                        <td style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#F5ECD7',
                          fontWeight: 500,
                          padding: '10px 12px',
                          verticalAlign: 'middle',
                          borderBottom: '1px solid #2E1A0E',
                        }}>
                          <Link href={`/dashboard/clients/${renewal.client_id}`} style={{
                            color: '#F5ECD7',
                            textDecoration: 'none',
                            cursor: 'pointer',
                          }}>
                            {renewal.clients?.name || 'Client'}
                          </Link>
                        </td>
                        <td style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#C9B99A',
                          padding: '10px 12px',
                          verticalAlign: 'middle',
                          borderBottom: '1px solid #2E1A0E',
                        }}>
                          {renewal.type || renewal.name || 'Policy'}
                        </td>
                        <td style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#C9B99A',
                          padding: '10px 12px',
                          verticalAlign: 'middle',
                          borderBottom: '1px solid #2E1A0E',
                        }}>
                          {renewal.insurer || '—'}
                        </td>
                        <td style={{
                          fontFamily: 'DM Mono, monospace',
                          fontSize: '12px',
                          color: '#C9B99A',
                          padding: '10px 12px',
                          verticalAlign: 'middle',
                          borderBottom: '1px solid #2E1A0E',
                        }}>
                          {renewalDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{
                          fontFamily: 'DM Mono, monospace',
                          fontSize: '12px',
                          color: daysUntilRenewal < 0 ? '#D06060' : 
                                 daysUntilRenewal <= 30 ? '#D06060' : 
                                 daysUntilRenewal <= 60 ? '#D4A030' : 
                                 daysUntilRenewal <= 90 ? '#20A0A0' : '#5AB87A',
                          padding: '10px 12px',
                          verticalAlign: 'middle',
                          borderBottom: '1px solid #2E1A0E',
                          fontWeight: 500,
                        }}>
                          {daysDisplay}
                        </td>
                        <td style={{
                          fontFamily: 'DM Mono, monospace',
                          fontSize: '12px',
                          color: '#C9B99A',
                          padding: '10px 12px',
                          verticalAlign: 'middle',
                          borderBottom: '1px solid #2E1A0E',
                        }}>
                          ${renewal.premium?.toLocaleString() || '0'}/yr
                        </td>
                        <td style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#C9B99A',
                          padding: '10px 12px',
                          verticalAlign: 'middle',
                          borderBottom: '1px solid #2E1A0E',
                        }}>
                          <span className={`pill ${pillClass}`}>{statusText}</span>
                        </td>
                        <td style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#C9B99A',
                          padding: '10px 12px',
                          verticalAlign: 'middle',
                          borderBottom: '1px solid #2E1A0E',
                        }}>
                          {renewal.clients?.whatsapp ? (
                            <a 
                              href={`https://wa.me/${renewal.clients.whatsapp.replace(/[^0-9]/g, '')}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{
                                color: '#C8813A',
                                fontSize: '12px',
                                textDecoration: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <span>📱</span> Message →
                            </a>
                          ) : (
                            <span style={{
                              color: '#C9B99A',
                              fontSize: '12px',
                              fontStyle: 'italic',
                            }}>
                              No WhatsApp
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
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
            No policies tracked yet
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#C9B99A',
            lineHeight: 1.6,
            maxWidth: '400px',
            margin: '0 auto',
          }}>
            Add policies to track renewals and get automated reminders.
          </div>
        </div>
      )}
    </div>
  );
}