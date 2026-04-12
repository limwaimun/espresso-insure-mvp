import { createClient } from '@/lib/supabase/server';

export default async function ClaimsPage() {
  const supabase = await createClient();
  
  // Fetch claim alerts (alerts with type = 'claim')
  const { data: claims } = await supabase
    .from('alerts')
    .select('*, clients(name)')
    .eq('type', 'claim')
    .order('created_at', { ascending: false });

  return (
    <div style={{ width: '100%' }}>
      <h1 style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '28px',
        fontWeight: 400,
        color: '#F5ECD7',
        margin: '0 0 20px 0',
      }}>
        Claims
      </h1>

      {claims && claims.length > 0 ? (
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
                    Opened
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
                {claims.map((claim) => {
                  // Determine status from alert properties
                  let status = 'Claim open';
                  let statusClass = 'pill-danger';
                  
                  if (claim.resolved) {
                    status = 'Resolved';
                    statusClass = 'pill-ok';
                  } else if (claim.priority === 'medium') {
                    status = 'Pending insurer';
                    statusClass = 'pill-amber';
                  }
                  
                  return (
                    <tr key={claim.id}>
                      <td style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#F5ECD7',
                        fontWeight: 500,
                        padding: '10px 12px',
                        verticalAlign: 'middle',
                        borderBottom: '1px solid #2E1A0E',
                      }}>
                        {claim.clients?.name || 'Client'}
                      </td>
                      <td style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#C9B99A',
                        padding: '10px 12px',
                        verticalAlign: 'middle',
                        borderBottom: '1px solid #2E1A0E',
                      }}>
                        {claim.policy || '—'}
                      </td>
                      <td style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#C9B99A',
                        padding: '10px 12px',
                        verticalAlign: 'middle',
                        borderBottom: '1px solid #2E1A0E',
                      }}>
                        {claim.insurer || '—'}
                      </td>
                      <td style={{
                        fontFamily: 'DM Mono, monospace',
                        fontSize: '12px',
                        color: '#C9B99A',
                        padding: '10px 12px',
                        verticalAlign: 'middle',
                        borderBottom: '1px solid #2E1A0E',
                      }}>
                        {new Date(claim.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
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
                          View claim →
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
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
            No claims recorded yet
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#C9B99A',
            lineHeight: 1.6,
            maxWidth: '400px',
            margin: '0 auto',
          }}>
            Claims will appear here when clients submit them via WhatsApp.
          </div>
        </div>
      )}
    </div>
  );
}