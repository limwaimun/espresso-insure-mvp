import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  
  // Fetch all data
  const { data: allPolicies } = await supabase
    .from('policies')
    .select('*, clients(name, company, type, tier)');
  
  const { data: allClients } = await supabase
    .from('clients')
    .select('*');
  
  // == SECTION 1: REVENUE OVERVIEW ==
  const activePolicies = allPolicies?.filter(p => p.status === 'active') || [];
  const totalPremium = activePolicies.reduce((sum, p) => sum + (Number(p.premium) || 0), 0);
  const clientCount = allClients?.length || 0;
  const avgPerClient = clientCount > 0 ? Math.round(totalPremium / clientCount) : 0;
  
  const lapsedPolicies = allPolicies?.filter(p => p.status === 'lapsed') || [];
  const lapsedPremium = lapsedPolicies.reduce((sum, p) => sum + (Number(p.premium) || 0), 0);
  
  // Calculate coverage gaps across all clients
  const standardTypes = ['life', 'health', 'critical illness', 'disability', 'motor', 'travel', 'property', 'professional indemnity'];
  let totalCoverageGaps = 0;
  
  if (allClients && allPolicies) {
    allClients.forEach(client => {
      const clientPolicies = allPolicies.filter(p => p.client_id === client.id);
      standardTypes.forEach(type => {
        const hasCoverage = clientPolicies.some(p => 
          p.type && p.type.toLowerCase().includes(type.toLowerCase())
        );
        if (!hasCoverage) totalCoverageGaps++;
      });
    });
  }
  
  const revenueCards = [
    { 
      id: 1, 
      title: 'TOTAL AUM', 
      value: `$${totalPremium.toLocaleString()}`, 
      subtitle: 'Annual premium managed',
      color: 'amber' 
    },
    { 
      id: 2, 
      title: 'AVG PER CLIENT', 
      value: `$${avgPerClient.toLocaleString()}`, 
      subtitle: 'Average annual premium',
      color: 'ok' 
    },
    { 
      id: 3, 
      title: 'LAPSED', 
      value: lapsedPolicies.length.toString(), 
      subtitle: `$${lapsedPremium.toLocaleString()} at risk`,
      color: lapsedPolicies.length > 0 ? 'danger' : 'ok' 
    },
    { 
      id: 4, 
      title: 'COVERAGE GAPS', 
      value: totalCoverageGaps.toString(), 
      subtitle: 'Upsell opportunities',
      color: totalCoverageGaps > 0 ? 'amber' : 'ok' 
    },
  ];
  
  // == SECTION 2: PREMIUM BY INSURER ==
  const insurerMap = new Map<string, number>();
  activePolicies.forEach(policy => {
    const insurer = policy.insurer || 'Unknown';
    const current = insurerMap.get(insurer) || 0;
    insurerMap.set(insurer, current + (Number(policy.premium) || 0));
  });
  
  const insurerData = Array.from(insurerMap.entries())
    .map(([insurer, amount]) => ({ insurer, amount }))
    .sort((a, b) => b.amount - a.amount);
  
  const maxInsurerAmount = insurerData.length > 0 ? Math.max(...insurerData.map(i => i.amount)) : 0;
  
  // == SECTION 3: CLIENT DISTRIBUTION ==
  // By type
  const typeCounts = {
    individual: allClients?.filter(c => c.type === 'individual').length || 0,
    sme: allClients?.filter(c => c.type === 'sme').length || 0,
    corporate: allClients?.filter(c => c.type === 'corporate').length || 0,
  };
  
  const totalTypeCount = typeCounts.individual + typeCounts.sme + typeCounts.corporate;
  
  // By tier (with premium calculation)
  const tierData = {
    platinum: { count: 0, premium: 0 },
    gold: { count: 0, premium: 0 },
    silver: { count: 0, premium: 0 },
    bronze: { count: 0, premium: 0 },
  };
  
  allClients?.forEach(client => {
    const tier = client.tier || 'bronze';
    const clientPolicies = activePolicies.filter(p => p.client_id === client.id);
    const clientPremium = clientPolicies.reduce((sum, p) => sum + (Number(p.premium) || 0), 0);
    
    if (tierData[tier as keyof typeof tierData]) {
      tierData[tier as keyof typeof tierData].count++;
      tierData[tier as keyof typeof tierData].premium += clientPremium;
    }
  });
  
  // == SECTION 4: TOP 5 CLIENTS BY PREMIUM ==
  const clientPremiumMap = new Map<string, { name: string; company: string | null; type: string | null; premium: number; policyCount: number; id: string }>();
  
  allClients?.forEach(client => {
    const clientPolicies = activePolicies.filter(p => p.client_id === client.id);
    const clientPremium = clientPolicies.reduce((sum, p) => sum + (Number(p.premium) || 0), 0);
    
    clientPremiumMap.set(client.id, {
      name: client.name,
      company: client.company,
      type: client.type,
      premium: clientPremium,
      policyCount: clientPolicies.length,
      id: client.id,
    });
  });
  
  const topClients = Array.from(clientPremiumMap.values())
    .sort((a, b) => b.premium - a.premium)
    .slice(0, 5);
  
  // == SECTION 5: RENEWAL PIPELINE ==
  const today = new Date();
  const renewalPeriods = [
    { label: 'Next 30 days', days: 30, color: 'danger' },
    { label: '31-60 days', days: 60, color: 'amber' },
    { label: '61-90 days', days: 90, color: 'teal' },
    { label: '90+ days', days: Infinity, color: 'ok' },
  ];
  
  const renewalData = renewalPeriods.map(period => {
    const periodPolicies = activePolicies.filter(policy => {
      if (!policy.renewal_date) return false;
      const renewalDate = new Date(policy.renewal_date);
      const daysUntilRenewal = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilRenewal > 0 && daysUntilRenewal <= period.days;
    });
    
    const periodPremium = periodPolicies.reduce((sum, p) => sum + (Number(p.premium) || 0), 0);
    
    return {
      ...period,
      count: periodPolicies.length,
      premium: periodPremium,
    };
  });
  
  const totalRenewalPremium = renewalData.reduce((sum, r) => sum + r.premium, 0);
  
  // == SECTION 6: COVERAGE GAPS ACROSS BOOK ==
  const coverageGapAnalysis = standardTypes.map(type => {
    let clientsWithCoverage = 0;
    
    allClients?.forEach(client => {
      const clientPolicies = allPolicies?.filter(p => p.client_id === client.id) || [];
      const hasCoverage = clientPolicies.some(p => 
        p.type && p.type.toLowerCase().includes(type.toLowerCase())
      );
      if (hasCoverage) clientsWithCoverage++;
    });
    
    const clientsWithoutCoverage = clientCount - clientsWithCoverage;
    const percentageWithout = clientCount > 0 ? Math.round((clientsWithoutCoverage / clientCount) * 100) : 0;
    
    return {
      type: type.charAt(0).toUpperCase() + type.slice(1),
      clientsWithoutCoverage,
      percentageWithout,
    };
  }).sort((a, b) => b.percentageWithout - a.percentageWithout);

  return (
    <div style={{ width: '100%' }}>
      <h1 style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '28px',
        fontWeight: 400,
        color: '#F5ECD7',
        margin: '0 0 24px 0',
      }}>
        Analytics
      </h1>
      
      {/* == SECTION 1: REVENUE OVERVIEW == */}
      <div className="metric-grid" style={{ marginBottom: '32px' }}>
        {revenueCards.map((card) => (
          <div key={card.id} className={`card card-${card.color}`}>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              color: '#C9B99A',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px',
            }}>
              {card.title}
            </div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '34px',
              fontWeight: 300,
              color: '#F5ECD7',
              lineHeight: 1.1,
              marginBottom: '6px',
            }}>
              {card.value}
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: card.color === 'danger' ? '#E53E3E' : '#5AB87A',
            }}>
              {card.subtitle}
            </div>
          </div>
        ))}
      </div>
      
      {/* Two Column Layout for Sections 2-3 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '32px',
      }}>
        {/* == SECTION 2: PREMIUM BY INSURER == */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Premium by insurer</span>
          </div>
          <div className="panel-body">
            {insurerData.length > 0 ? (
              <div style={{ padding: '16px' }}>
                {insurerData.map((insurer, index) => {
                  const percentage = maxInsurerAmount > 0 ? Math.round((insurer.amount / maxInsurerAmount) * 100) : 0;
                  const marketShare = totalPremium > 0 ? Math.round((insurer.amount / totalPremium) * 100) : 0;
                  
                  return (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '12px',
                    }}>
                      <div style={{
                        width: '120px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#C9B99A',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {insurer.insurer}
                      </div>
                      <div style={{
                        flex: 1,
                        background: '#2E1A0E',
                        borderRadius: '4px',
                        height: '24px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${percentage}%`,
                          background: '#C8813A',
                          borderRadius: '4px',
                          height: '24px',
                        }}></div>
                      </div>
                      <div style={{
                        width: '100px',
                        textAlign: 'right',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#F5ECD7',
                      }}>
                        ${insurer.amount.toLocaleString()} ({marketShare}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#C9B99A',
              }}>
                No insurer data available
              </div>
            )}
          </div>
        </div>
        
        {/* == SECTION 3: CLIENT DISTRIBUTION == */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}>
          {/* Left card — BY TYPE */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Clients by type</span>
            </div>
            <div className="panel-body">
              {totalTypeCount > 0 ? (
                <div style={{ padding: '16px' }}>
                  {Object.entries(typeCounts).map(([type, count]) => {
                    const percentage = totalTypeCount > 0 ? Math.round((count / totalTypeCount) * 100) : 0;
                    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
                    
                    return (
                      <div key={type} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '12px',
                      }}>
                        <div style={{
                          width: '100px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#C9B99A',
                        }}>
                          {typeLabel}
                        </div>
                        <div style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                          <div style={{
                            flex: 1,
                            background: '#2E1A0E',
                            borderRadius: '4px',
                            height: '20px',
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${percentage}%`,
                              background: '#C8813A',
                              borderRadius: '4px',
                              height: '20px',
                            }}></div>
                          </div>
                          <div style={{
                            width: '60px',
                            textAlign: 'right',
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '13px',
                            color: '#F5ECD7',
                          }}>
                            {count} ({percentage}%)
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#C9B99A',
                }}>
                  No client data available
                </div>
              )}
            </div>
          </div>
          
          {/* Right card — BY TIER */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Clients by tier</span>
            </div>
            <div className="panel-body">
              {Object.entries(tierData).map(([tier, data]) => {
                const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
                const tierColor = tier === 'platinum' ? 'teal' : 
                                 tier === 'gold' ? 'amber' : 
                                 tier === 'silver' ? 'ok' : 'danger';
                
                return (
                  <div key={tier} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: '1px solid #2E1A0E',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span className={`pill pill-${tierColor}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                        {tierLabel}
                      </span>
                      <div style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#F5ECD7',
                      }}>
                        {data.count} client{data.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '13px',
                      color: '#C9B99A',
                    }}>
                      ${data.premium.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* == SECTION 4: TOP 5 CLIENTS BY PREMIUM == */}
      <div className="panel" style={{ marginBottom: '32px' }}>
        <div className="panel-header">
          <span className="panel-title">Top 5 clients by premium</span>
        </div>
        <div className="panel-body">
          {topClients.length > 0 ? (
            <div style={{
              overflowX: 'auto',
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}>
                <thead>
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
                      Rank
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
                      Client Name
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
                      Company
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
                      Type
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
                      Total Premium
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
                      Policies
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topClients.map((client, index) => (
                    <tr key={client.id}>
                      <td style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#C9B99A',
                        padding: '10px 12px',
                        verticalAlign: 'middle',
                        borderBottom: '1px solid #2E1A0E',
                      }}>
                        #{index + 1}
                      </td>
                      <td style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#F5ECD7',
                        fontWeight: 500,
                        padding: '10px 12px',
                        verticalAlign: 'middle',
                        borderBottom: '1px solid #2E1A0E',
                      }}>
                        <Link 
                          href={`/dashboard/clients/${client.id}`}
                          style={{
                            color: '#F5ECD7',
                            textDecoration: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {client.name}
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
                        {client.company || '—'}
                      </td>
                      <td style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#C9B99A',
                        padding: '10px 12px',
                        verticalAlign: 'middle',
                        borderBottom: '1px solid #2E1A0E',
                      }}>
                        {client.type ? client.type.charAt(0).toUpperCase() + client.type.slice(1) : '—'}
                      </td>
                      <td style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#F5ECD7',
                        fontWeight: 500,
                        padding: '10px 12px',
                        verticalAlign: 'middle',
                        borderBottom: '1px solid #2E1A0E',
                      }}>
                        ${client.premium.toLocaleString()}
                      </td>
                      <td style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#C9B99A',
                        padding: '10px 12px',
                        verticalAlign: 'middle',
                        borderBottom: '1px solid #2E1A0E',
                      }}>
                        {client.policyCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
            }}>
              No client premium data available
            </div>
          )}
        </div>
      </div>
      
      {/* Two Column Layout for Sections 5-6 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
      }}>
        {/* == SECTION 5: RENEWAL PIPELINE == */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Renewal pipeline</span>
          </div>
          <div className="panel-body">
            {totalRenewalPremium > 0 ? (
              <div style={{ padding: '16px' }}>
                {renewalData.map((period, index) => {
                  const percentage = totalRenewalPremium > 0 ? Math.round((period.premium / totalRenewalPremium) * 100) : 0;
                  
                  return (
                    <div key={index} style={{
                      marginBottom: '16px',
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}>
                        <div style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#F5ECD7',
                          fontWeight: 500,
                        }}>
                          {period.label}
                        </div>
                        <div style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#C9B99A',
                        }}>
                          {period.count} policies, ${period.premium.toLocaleString()}
                        </div>
                      </div>
                      <div style={{
                        background: '#2E1A0E',
                        borderRadius: '4px',
                        height: '20px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${percentage}%`,
                          background: period.color === 'danger' ? '#E53E3E' : 
                                     period.color === 'amber' ? '#C8813A' : 
                                     period.color === 'teal' ? '#20A0A0' : '#38A169',
                          borderRadius: '4px',
                          height: '20px',
                        }}></div>
                      </div>
                    </div>
                  );
                })}
                <div style={{
                  marginTop: '20px',
                  paddingTop: '12px',
                  borderTop: '1px solid #2E1A0E',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#C9B99A',
                  textAlign: 'center',
                }}>
                  Total renewal pipeline: <strong style={{ color: '#F5ECD7' }}>${totalRenewalPremium.toLocaleString()}</strong>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#C9B99A',
              }}>
                No upcoming renewals
              </div>
            )}
          </div>
        </div>
        
        {/* == SECTION 6: COVERAGE GAPS ACROSS BOOK == */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Coverage gaps across book</span>
          </div>
          <div className="panel-body">
            {clientCount > 0 ? (
              <div style={{ padding: '16px' }}>
                {coverageGapAnalysis.map((gap, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: '1px solid #2E1A0E',
                  }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '13px',
                      color: '#F5ECD7',
                    }}>
                      {gap.type}
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                    }}>
                      <div style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#C9B99A',
                      }}>
                        {gap.clientsWithoutCoverage} of {clientCount} clients not covered
                      </div>
                      <div style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '11px',
                        color: gap.percentageWithout > 50 ? '#E53E3E' : gap.percentageWithout > 25 ? '#C8813A' : '#5AB87A',
                      }}>
                        ({gap.percentageWithout}%)
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{
                  marginTop: '20px',
                  paddingTop: '12px',
                  borderTop: '1px solid #2E1A0E',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '12px',
                  color: '#C9B99A',
                  textAlign: 'center',
                }}>
                  Total gaps: <strong style={{ color: '#F5ECD7' }}>{totalCoverageGaps}</strong> across {clientCount} clients
                </div>
              </div>
            ) : (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#C9B99A',
              }}>
                No client data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}