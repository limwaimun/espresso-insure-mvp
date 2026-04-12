import { createClient } from '@/lib/supabase/server';

export default async function RenewalsPage() {
  const supabase = await createClient();
  
  // Fetch policies with upcoming renewal dates and client names
  const { data: renewals } = await supabase
    .from('policies')
    .select('*, clients(name)')
    .order('renewal_date', { ascending: true });

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
        <button className="btn-secondary" style={{
          fontSize: '13px',
          padding: '8px 16px',
        }}>
          View calendar
        </button>
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
            {renewals.length} renewal{renewals.length !== 1 ? 's' : ''} tracked · {
              renewals.filter(r => {
                const renewalDate = new Date(r.renewal_date);
                const today = new Date();
                const thirtyDaysFromNow = new Date();
                thirtyDaysFromNow.setDate(today.getDate() + 30);
                return renewalDate <= thirtyDaysFromNow;
              }).length
            } due within 30 days
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
                      Due
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
                    
                    let status = 'upcoming';
                    let statusClass = 'pill-ok';
                    let statusColor = '#C9B99A';
                    
                    if (daysUntilRenewal <= 7) {
                      status = 'urgent';
                      statusClass = 'pill-danger';
                      statusColor = '#D06060';
                    } else if (daysUntilRenewal <= 30) {
                      status = 'due';
                      statusClass = 'pill-amber';
                      statusColor = '#D4A030';
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
                          {renewal.clients?.name || 'Client'}
                        </td>
                        <td style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#C9B99A',
                          padding: '10px 12px',
                          verticalAlign: 'middle',
                          borderBottom: '1px solid #2E1A0E',
                        }}>
                          {renewal.name || 'Policy'}
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
                          color: statusColor,
                          padding: '10px 12px',
                          verticalAlign: 'middle',
                          borderBottom: '1px solid #2E1A0E',
                        }}>
                          {renewalDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
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
                          <span className={`pill ${statusClass}`}>{status}</span>
                        </td>
                        <td style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#C9B99A',
                          padding: '10px 12px',
                          verticalAlign: 'middle',
                          borderBottom: '1px solid #2E1A0E',
                        }}>
                          <span style={{
                            color: '#C8813A',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}>
                            Send reminder →
                          </span>
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