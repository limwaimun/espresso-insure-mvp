import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // Fetch all data
  const { data: allPolicies } = await supabase.from('policies').select('*, clients(id, name, company, type, tier)');
  const { data: allClients } = await supabase.from('clients').select('*');

  const policies = allPolicies || [];
  const clients = allClients || [];
  const activePolicies = policies.filter(p => p.status === 'active');
  const clientCount = clients.length;

  // === CALCULATIONS ===

  // Revenue
  const totalPremium = activePolicies.reduce((sum, p) => sum + (Number(p.premium) || 0), 0);
  const avgPerClient = clientCount > 0 ? Math.round(totalPremium / clientCount) : 0;
  const lapsedPolicies = policies.filter(p => p.status === 'lapsed');
  const lapsedAmount = lapsedPolicies.reduce((sum, p) => sum + (Number(p.premium) || 0), 0);

  // Renewal pipeline
  const now = new Date();
  const renewalBuckets = [
    { label: 'Next 30 days', min: 0, max: 30, color: '#D06060' },
    { label: '31\u201360 days', min: 31, max: 60, color: '#D4A030' },
    { label: '61\u201390 days', min: 61, max: 90, color: '#20A0A0' },
    { label: '90+ days', min: 91, max: 9999, color: '#5AB87A' },
  ];

  const renewalData = renewalBuckets.map(bucket => {
    const matching = activePolicies.filter(p => {
      if (!p.renewal_date) return false;
      const days = Math.ceil((new Date(p.renewal_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return days >= bucket.min && days <= bucket.max;
    });
    const amount = matching.reduce((sum, p) => sum + (Number(p.premium) || 0), 0);
    return { ...bucket, count: matching.length, amount };
  });

  const totalRenewalPipeline = renewalData.reduce((sum, b) => sum + b.amount, 0);

  // Coverage gaps
  const standardTypes = ['Life', 'Health', 'Critical Illness', 'Disability', 'Motor', 'Travel', 'Property', 'Professional Indemnity'];

  const gapData = standardTypes.map(coverageType => {
    const clientsWithout = clients.filter(client => {
      const clientPols = policies.filter(p => p.client_id === client.id);
      const hasType = clientPols.some(p => {
        const pType = (p.type || '').toLowerCase();
        const cType = coverageType.toLowerCase();
        return pType.includes(cType) || cType.includes(pType);
      });
      return !hasType;
    });
    const pct = clientCount > 0 ? Math.round((clientsWithout.length / clientCount) * 100) : 0;
    return { type: coverageType, missing: clientsWithout.length, total: clientCount, pct };
  }).filter(g => g.pct > 50).sort((a, b) => b.pct - a.pct);

  const totalGaps = gapData.reduce((sum, g) => sum + g.missing, 0);

  // Urgent renewals (next 30 days)
  const urgentRenewals = renewalData[0];

  // Premium by insurer
  const insurerMap: Record<string, number> = {};
  activePolicies.forEach(p => {
    const insurer = p.insurer || 'Unknown';
    insurerMap[insurer] = (insurerMap[insurer] || 0) + (Number(p.premium) || 0);
  });
  const insurerData = Object.entries(insurerMap)
    .sort((a, b) => b[1] - a[1]);
  const maxInsurerAmount = Math.max(...insurerData.map(([, amt]) => amt), 1);
  const insurerColors = ['#C8813A', '#E8A55A', '#A0703A', '#D4A030', '#8B6533', '#6B4423', '#C8813A', '#E8A55A', '#A0703A', '#D4A030']; // Extended colors for more insurers

  // Top 5 clients by premium
  const clientPremiumMap: Record<string, { id: string; name: string; company: string; type: string; premium: number; policyCount: number }> = {};
  activePolicies.forEach(p => {
    const cid = p.client_id;
    const client = p.clients as any;
    if (!cid) return;
    if (!clientPremiumMap[cid]) {
      clientPremiumMap[cid] = {
        id: cid,
        name: client?.name || 'Unknown',
        company: client?.company || '',
        type: client?.type || 'individual',
        premium: 0,
        policyCount: 0,
      };
    }
    clientPremiumMap[cid].premium += (Number(p.premium) || 0);
    clientPremiumMap[cid].policyCount += 1;
  });
  const top5Clients = Object.values(clientPremiumMap).sort((a, b) => b.premium - a.premium).slice(0, 5);

  // Client by type
  const typeData = [
    { label: 'Individual', count: clients.filter(c => c.type === 'individual').length, color: '#C8813A' },
    { label: 'SME', count: clients.filter(c => c.type === 'sme').length, color: '#20A0A0' },
    { label: 'Corporate', count: clients.filter(c => c.type === 'corporate').length, color: '#5A8AD4' },
  ];
  const totalTypeCount = typeData.reduce((s, t) => s + t.count, 0) || 1;

  // Client by tier
  const tierConfigs = [
    { label: 'Platinum', key: 'platinum', color: '#20A0A0' },
    { label: 'Gold', key: 'gold', color: '#D4A030' },
    { label: 'Silver', key: 'silver', color: '#C9B99A' },
    { label: 'Bronze', key: 'bronze', color: '#D06060' },
  ];
  const tierData = tierConfigs.map(tc => {
    const tierClients = clients.filter(c => c.tier === tc.key);
    const tierPremium = tierClients.reduce((sum, c) => {
      const cp = activePolicies.filter(p => p.client_id === c.id);
      return sum + cp.reduce((s, p) => s + (Number(p.premium) || 0), 0);
    }, 0);
    return { ...tc, count: tierClients.length, premium: tierPremium };
  });

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
          }}>Analytics</h1>
        </div>

        {/* ========== SECTION A: ACTION REQUIRED ========== */}
        <h2 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '20px',
          fontWeight: 400,
          color: '#F5ECD7',
          marginBottom: '16px',
        }}>
          Action required
        </h2>

        {/* 3 Alert Cards - Match All Clients style */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
        }}>
          {/* Lapsed */}
          <Link href="/dashboard/renewals" style={{ textDecoration: 'none', cursor: 'pointer', flex: 1 }}>
            <div style={{
              background: '#120A06',
              border: '1px solid #2E1A0E',
              borderRadius: '8px',
              padding: '16px',
            }}>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#D06060',
                marginBottom: '4px',
              }}>Lapsed Policies</div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '24px',
                fontWeight: 600,
                color: '#F5ECD7',
              }}>{lapsedPolicies.length}</div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#D06060',
                marginTop: '4px',
              }}>${lapsedAmount.toLocaleString()} at risk</div>
            </div>
          </Link>
          {/* Urgent Renewals */}
          <Link href="/dashboard/renewals" style={{ textDecoration: 'none', cursor: 'pointer', flex: 1 }}>
            <div style={{
              background: '#120A06',
              border: '1px solid #2E1A0E',
              borderRadius: '8px',
              padding: '16px',
            }}>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#D4A030',
                marginBottom: '4px',
              }}>Urgent Renewals</div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '24px',
                fontWeight: 600,
                color: '#F5ECD7',
              }}>{urgentRenewals.count}</div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#D4A030',
                marginTop: '4px',
              }}>${urgentRenewals.amount.toLocaleString()} in next 30 days</div>
            </div>
          </Link>
          {/* Coverage Gaps */}
          <Link href="/dashboard/clients" style={{ textDecoration: 'none', cursor: 'pointer', flex: 1 }}>
            <div style={{
              background: '#120A06',
              border: '1px solid #2E1A0E',
              borderRadius: '8px',
              padding: '16px',
            }}>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#20A0A0',
                marginBottom: '4px',
              }}>Coverage Gaps</div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '24px',
                fontWeight: 600,
                color: '#F5ECD7',
              }}>{totalGaps}</div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#20A0A0',
                marginTop: '4px',
              }}>Upsell opportunities</div>
            </div>
          </Link>
        </div>

      {/* Renewal Pipeline - Stacked Bar */}
      <div style={{
        background: '#120A06',
        border: '1px solid #2E1A0E',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
      }}>
        <div style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          fontWeight: 500,
          color: '#F5ECD7',
          marginBottom: '12px',
        }}>Renewal pipeline</div>
        <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', height: '32px', marginBottom: '12px' }}>
          {renewalData.map((bucket, i) => {
            const pct = totalRenewalPipeline > 0 ? (bucket.amount / totalRenewalPipeline) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div key={i} style={{ width: `${pct}%`, background: bucket.color, minWidth: pct > 0 ? '2px' : '0' }} />
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {renewalData.map((bucket, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: bucket.color }} />
                <span style={{ fontSize: '11px', color: '#C9B99A' }}>{bucket.label}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#F5ECD7' }}>{bucket.count} policies</div>
              <div style={{ fontSize: '12px', color: bucket.color }}>${bucket.amount.toLocaleString()}</div>
            </div>
          ))}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#C9B99A', marginBottom: '4px' }}>Total</div>
            <div style={{ fontSize: '13px', color: '#F5ECD7', fontWeight: 'bold' }}>${totalRenewalPipeline.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Coverage Gaps Grid */}
      {gapData.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '14px', color: '#C9B99A', marginBottom: '12px' }}>Top coverage gaps ({'>'}50% uncovered)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {gapData.map((gap, i) => (
              <Link key={i} href="/dashboard/clients" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                <div style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#F5ECD7', fontSize: '14px' }}>{gap.type}</span>
                    <span style={{ color: '#D06060', fontSize: '12px' }}>{gap.missing} of {gap.total} not covered ({gap.pct}%)</span>
                  </div>
                  <div style={{ background: '#2E1A0E', borderRadius: '4px', height: '8px' }}>
                    <div style={{ width: `${gap.pct}%`, background: '#D06060', borderRadius: '4px', height: '8px', opacity: 0.8 }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ========== SECTION B: YOUR BOOK ========== */}
      <h2 style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '20px',
        fontWeight: 400,
        color: '#F5ECD7',
        marginBottom: '16px',
      }}>
        Your book
      </h2>

      {/* 4 Metric Cards - Match All Clients style */}
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
            color: '#5AB87A',
            marginBottom: '4px',
          }}>Total AUM</div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            color: '#F5ECD7',
          }}>${totalPremium.toLocaleString()}</div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px',
            color: '#5AB87A',
            marginTop: '4px',
          }}>Annual premium managed</div>
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
            color: '#C8813A',
            marginBottom: '4px',
          }}>Avg Per Client</div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            color: '#F5ECD7',
          }}>${avgPerClient.toLocaleString()}</div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px',
            color: '#C8813A',
            marginTop: '4px',
          }}>Average annual premium</div>
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
            color: '#C8813A',
            marginBottom: '4px',
          }}>Total Clients</div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            color: '#F5ECD7',
          }}>{clientCount}</div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px',
            color: '#C8813A',
            marginTop: '4px',
          }}>Active clients</div>
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
            color: '#C8813A',
            marginBottom: '4px',
          }}>Total Policies</div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            color: '#F5ECD7',
          }}>{policies.length}</div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px',
            color: '#C8813A',
            marginTop: '4px',
          }}>{activePolicies.length} active</div>
        </div>
      </div>

      {/* Two columns: Insurer + Top Clients */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '16px', marginBottom: '40px' }}>
        {/* Premium by Insurer */}
        <div style={{
          background: '#120A06',
          border: '1px solid #2E1A0E',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: '#F5ECD7',
            marginBottom: '16px',
          }}>Premium by insurer</div>
          {insurerData.map(([insurer, amount], i) => {
            const pct = Math.round((amount / totalPremium) * 100);
            return (
              <Link key={i} href="/dashboard/clients" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', cursor: 'pointer' }}>
                <div style={{ width: '140px', fontSize: '13px', color: '#C9B99A', flexShrink: 0 }}>{insurer}</div>
                <div style={{ flex: 1, background: '#2E1A0E', borderRadius: '4px', height: '28px', position: 'relative' }}>
                  <div style={{ width: `${pct}%`, background: insurerColors[i % insurerColors.length] || '#C8813A', borderRadius: '4px', height: '28px', minWidth: '2px' }} />
                </div>
                <div style={{ width: '110px', textAlign: 'right', fontSize: '13px', color: '#F5ECD7', flexShrink: 0 }}>
                  ${amount.toLocaleString()} ({pct}%)
                </div>
              </Link>
            );
          })}
        </div>

        {/* Top 5 Clients */}
        <div style={{
          background: '#120A06',
          border: '1px solid #2E1A0E',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: '#F5ECD7',
            marginBottom: '16px',
          }}>Top clients</div>
          {top5Clients.map((client, i) => (
            <Link key={i} href={`/dashboard/clients/${client.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 8px', borderRadius: '6px', marginBottom: '4px', cursor: 'pointer' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#C8813A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#120A06', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>
                  {client.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#F5ECD7', fontSize: '14px' }}>{client.name}</div>
                  <div style={{ color: '#C9B99A', fontSize: '12px' }}>{client.company || client.type}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ color: '#F5ECD7', fontSize: '14px' }}>${client.premium.toLocaleString()}</div>
                  <div style={{ color: '#C9B99A', fontSize: '11px' }}>{client.policyCount} policies</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ========== SECTION C: CLIENT HEALTH ========== */}
      <h2 style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '20px',
        fontWeight: 400,
        color: '#F5ECD7',
        marginBottom: '16px',
      }}>
        Client health
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* By Type - Segmented Bar */}
        <div style={{
          background: '#120A06',
          border: '1px solid #2E1A0E',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: '#F5ECD7',
            marginBottom: '16px',
          }}>Clients by type</div>
          <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', height: '28px', marginBottom: '16px' }}>
            {typeData.map((t, i) => {
              const pct = (t.count / totalTypeCount) * 100;
              if (pct === 0) return null;
              return <div key={i} style={{ width: `${pct}%`, background: t.color, minWidth: '2px' }} />;
            })}
          </div>
          {typeData.map((t, i) => (
            <Link key={i} href="/dashboard/clients" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: t.color }} />
                  <span style={{ color: '#F5ECD7', fontSize: '14px' }}>{t.label}</span>
                </div>
                <span style={{ color: '#C9B99A', fontSize: '14px' }}>{t.count} ({Math.round((t.count / totalTypeCount) * 100)}%)</span>
              </div>
            </Link>
          ))}
        </div>

        {/* By Tier */}
        <div style={{
          background: '#120A06',
          border: '1px solid #2E1A0E',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: '#F5ECD7',
            marginBottom: '16px',
          }}>Clients by tier</div>
          {tierData.map((t, i) => (
            <Link key={i} href="/dashboard/clients" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ padding: '2px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', background: t.color + '25', color: t.color }}>{t.label}</span>
                  <span style={{ color: '#C9B99A', fontSize: '14px' }}>{t.count} {t.count === 1 ? 'client' : 'clients'}</span>
                </div>
                <span style={{ color: '#F5ECD7', fontSize: '14px', fontFamily: 'DM Mono, monospace' }}>${t.premium.toLocaleString()}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
