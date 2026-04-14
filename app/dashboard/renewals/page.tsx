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

  const enriched = allPolicies.map(p => {
    const days = p.renewal_date
      ? Math.ceil((new Date(p.renewal_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    let statusLabel = 'Upcoming';
    let statusColor = '#5AB87A';
    let sortOrder = 4;

    if (days === null) {
      statusLabel = 'No date'; statusColor = '#C9B99A'; sortOrder = 5;
    } else if (days < 0) {
      statusLabel = 'Lapsed'; statusColor = '#8B3A3A'; sortOrder = 0;
    } else if (days <= 30) {
      statusLabel = 'Urgent'; statusColor = '#D06060'; sortOrder = 1;
    } else if (days <= 60) {
      statusLabel = 'Action needed'; statusColor = '#D4A030'; sortOrder = 2;
    } else if (days <= 90) {
      statusLabel = 'Review'; statusColor = '#20A0A0'; sortOrder = 3;
    }

    return { ...p, days, statusLabel, statusColor, sortOrder };
  });

  const sorted = enriched.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return (a.days ?? 9999) - (b.days ?? 9999);
  });

  const lapsedCount = sorted.filter(p => p.sortOrder === 0).length;
  const urgentCount = sorted.filter(p => p.sortOrder === 1).length;
  const actionCount = sorted.filter(p => p.sortOrder === 2).length;
  const reviewCount = sorted.filter(p => p.sortOrder === 3).length;
  const urgentPremium = sorted.filter(p => p.sortOrder === 1).reduce((s, p) => s + (Number(p.premium) || 0), 0);
  const lapsedPremium = sorted.filter(p => p.sortOrder === 0).reduce((s, p) => s + (Number(p.premium) || 0), 0);

  // Styles — IDENTICAL to Claims page
  const thStyle: React.CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#C8813A',
    padding: '12px 16px',
    textAlign: 'left',
    borderBottom: '1px solid #2E1A0E',
  };

  const tdStyle: React.CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '13px',
    color: '#C9B99A',
    padding: '12px 16px',
    verticalAlign: 'top',
    borderBottom: '1px solid #2E1A0E',
  };

  const monoStyle: React.CSSProperties = {
    ...tdStyle,
    fontFamily: 'DM Mono, monospace',
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 400, color: '#F5ECD7', marginBottom: '24px' }}>
        Renewals
      </h1>

      {/* Summary Cards — same style as All Clients / Claims */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8B3A3A', marginBottom: '8px' }}>LAPSED</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', color: '#F5ECD7' }}>{lapsedCount}</div>
          <div style={{ fontSize: '12px', color: '#8B3A3A', marginTop: '4px' }}>${lapsedPremium.toLocaleString()} at risk</div>
        </div>
        <div style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D06060', marginBottom: '8px' }}>URGENT</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', color: '#F5ECD7' }}>{urgentCount}</div>
          <div style={{ fontSize: '12px', color: '#D06060', marginTop: '4px' }}>${urgentPremium.toLocaleString()} in next 30 days</div>
        </div>
        <div style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D4A030', marginBottom: '8px' }}>ACTION NEEDED</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', color: '#F5ECD7' }}>{actionCount}</div>
          <div style={{ fontSize: '12px', color: '#D4A030', marginTop: '4px' }}>31–60 days</div>
        </div>
        <div style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#20A0A0', marginBottom: '8px' }}>UNDER REVIEW</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', color: '#F5ECD7' }}>{reviewCount}</div>
          <div style={{ fontSize: '12px', color: '#20A0A0', marginTop: '4px' }}>61–90 days</div>
        </div>
      </div>

      {/* Summary text */}
      <div style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: '8px', padding: '12px 20px', marginBottom: '24px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#C9B99A' }}>
        {sorted.length} policies tracked
        {lapsedCount > 0 && <> · <span style={{ color: '#8B3A3A' }}>{lapsedCount} lapsed</span></>}
        {' '} · <span style={{ color: '#D06060' }}>{urgentCount} urgent</span>
        {' '} · <span style={{ color: '#D4A030' }}>{actionCount} action needed</span>
        {' '} · <span style={{ color: '#20A0A0' }}>{reviewCount} under review</span>
      </div>

      {/* Table */}
      <div style={{
        background: '#120A06',
        border: '1px solid #2E1A0E',
        borderRadius: '8px',
        overflow: 'hidden',
        minHeight: 'calc(100vh - 380px)',
      }}>
        <div style={{
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 380px)',
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
                <th style={thStyle}>Client</th>
                <th style={thStyle}>Policy Type</th>
                <th style={thStyle}>Insurer</th>
                <th style={thStyle}>Premium</th>
                <th style={thStyle}>Renewal</th>
                <th style={thStyle}>Days</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
          <tbody>
            {sorted.map((p, i) => {
              const client = p.clients as any;
              const clientName = client?.name || 'Unknown';
              const clientId = client?.id || p.client_id;
              const renewalDate = p.renewal_date
                ? new Date(p.renewal_date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })
                : '—';

              return (
                <tr key={p.id || i}>
                  <td style={tdStyle}>
                    <Link href={`/dashboard/clients/${clientId}`} style={{ color: '#F5ECD7', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>
                      {clientName}
                    </Link>
                    {client?.company && (
                      <div style={{ fontSize: '11px', color: '#C9B99A', marginTop: '2px' }}>{client.company}</div>
                    )}
                  </td>
                  <td style={tdStyle}>{p.type || '—'}</td>
                  <td style={tdStyle}>{p.insurer || '—'}</td>
                  <td style={monoStyle}>${(Number(p.premium) || 0).toLocaleString()}/yr</td>
                  <td style={{ ...tdStyle, color: p.days !== null && p.days <= 30 ? p.statusColor : '#C9B99A' }}>{renewalDate}</td>
                  <td style={{ ...monoStyle, color: p.statusColor }}>
                    {p.days === null ? '—' : p.days < 0 ? 'Overdue' : `${p.days}d`}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      background: p.statusColor + '20',
                      color: p.statusColor,
                    }}>
                      {p.statusLabel}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <Link href={`/dashboard/clients/${clientId}`} style={{ color: '#C8813A', textDecoration: 'none', fontSize: '13px' }}>
                        View client →
                      </Link>
                      <span style={{ color: '#C9B99A', fontSize: '13px', opacity: 0.5, cursor: 'not-allowed' }}>
                        Ask Maya to follow up
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
  );
}