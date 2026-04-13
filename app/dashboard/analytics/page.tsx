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
  
  // == DATA CALCULATIONS ==
  const activePolicies = allPolicies?.filter(p => p.status === 'active') || [];
  const lapsedPolicies = allPolicies?.filter(p => p.status === 'lapsed') || [];
  const clientCount = allClients?.length || 0;
  const policyCount = allPolicies?.length || 0;
  
  // Premium calculations
  const totalPremium = activePolicies.reduce((sum, p) => sum + (Number(p.premium) || 0), 0);
  const lapsedPremium = lapsedPolicies.reduce((sum, p) => sum + (Number(p.premium) || 0), 0);
  const avgPerClient = clientCount > 0 ? Math.round(totalPremium / clientCount) : 0;
  
  // Renewal pipeline
  const today = new Date();
  const renewalPeriods = [
    { label: '0-30d', days: 30, color: '#E53E3E' },
    { label: '31-60d', days: 60, color: '#C8813A' },
    { label: '61-90d', days: 90, color: '#20A0A0' },
    { label: '90+d', days: Infinity, color: '#38A169' },
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
  
  const urgentRenewals = renewalData[0]; // 0-30 days
  const totalRenewalPremium = renewalData.reduce((sum, r) => sum + r.premium, 0);
  
  // Coverage gaps across all clients
  const standardTypes = ['life', 'health', 'critical illness', 'disability', 'motor', 'travel', 'property', 'professional indemnity'];
  let totalCoverageGaps = 0;
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
    
    totalCoverageGaps += clientsWithoutCoverage;
    
    return {
      type: type.charAt(0).toUpperCase() + type.slice(1),
      clientsWithoutCoverage,
      percentageWithout,
    };
  }).filter(gap => gap.percentageWithout > 50) // Only show gaps where >50% of clients are missing
    .sort((a, b) => b.percentageWithout - a.percentageWithout);
  
  // Premium by insurer (top 5 + others)
  const insurerMap = new Map<string, number>();
  activePolicies.forEach(policy => {
    const insurer = policy.insurer || 'Unknown';
    const current = insurerMap.get(insurer) || 0;
    insurerMap.set(insurer, current + (Number(policy.premium) || 0));
  });
  
  const insurerData = Array.from(insurerMap.entries())
    .map(([insurer, amount]) => ({ insurer, amount }))
    .sort((a, b) => b.amount - a.amount);
  
  const topInsurers = insurerData.slice(0, 5);
  const otherInsurers = insurerData.slice(5);
  const otherTotal = otherInsurers.reduce((sum, i) => sum + i.amount, 0);
  
  if (otherTotal > 0) {
    topInsurers.push({ insurer: 'Others', amount: otherTotal });
  }
  
  const maxInsurerAmount = topInsurers.length > 0 ? Math.max(...topInsurers.map(i => i.amount)) : 0;
  
  // Top 5 clients by premium
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
  
  // Client distribution by type
  const typeCounts = {
    individual: allClients?.filter(c => c.type === 'individual').length || 0,
    sme: allClients?.filter(c => c.type === 'sme').length || 0,
    corporate: allClients?.filter(c => c.type === 'corporate').length || 0,
  };
  
  const totalTypeCount = typeCounts.individual + typeCounts.sme + typeCounts.corporate;
  
  // Client distribution by tier
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
      
      {/* == SECTION A: ACTION REQUIRED == */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '20px',
          fontWeight: 400,
          color: '#F5ECD7',
          margin: '0 0 16px 0',
        }}>
          Action required
        </h2>
        
        {/* 3 Alert Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}>
          {/* LAPSED POLICIES */}
          <div style={{
            background: '#3D2215',
            borderRadius: '8px',
            padding: '16px',
            borderLeft: '4px solid #E53E3E',
          }}>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              color: '#C9B99A',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px',
            }}>
              LAPSED POLICIES
            </div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '28px',
              fontWeight: 300,
              color: '#F5ECD7',
              lineHeight: 1.1,
              marginBottom: '4px',
            }}>
              {lapsedPolicies.length}
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#E53E3E',
            }}>
              ${lapsedPremium.toLocaleString()} at risk
            </div>
          </div>
          
          {/* URGENT RENEWALS */}
          <div style={{
            background: '#3D2215',
            borderRadius: '8px',
            padding: '16px',
            borderLeft: '4px solid #C8813A',
          }}>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              color: '#C9B99A',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px',
            }}>
              URGENT RENEWALS
            </div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '28px',
              fontWeight: 300,
              color: '#F5ECD7',
              lineHeight: 1.1,
              marginBottom: '4px',
            }}>
              {urgentRenewals.count}
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#C8813A',
            }}>
              ${urgentRenewals.premium.toLocaleString()} due
            </div>
          </div>
          
          {/* COVERAGE GAPS */}
          <div style={{
            background: '#3D2215',
            borderRadius: '8px',
            padding: '16px',
            borderLeft: '4px solid #20A0A0',
          }}>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              color: '#C9B99A',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px',
            }}>
              COVERAGE GAPS
            </div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '28px',
              fontWeight: 300,
              color: '#F5ECD7',
              lineHeight: 1.1,
              marginBottom: '4px',
            }}>
              {totalCoverageGaps}
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#20A0A0',
            }}>
              Upsell opportunities
            </div>
          </div>
        </div>
        
        {/* RENEWAL PIPELINE - Single Horizontal Stacked Bar */}
        <div style={{ marginBottom: '24px' }}>
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
              Renewal pipeline
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
            }}>
              Total: ${totalRenewalPremium.toLocaleString()}
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            height: '32px',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '8px',
          }}>
            {renewalData.map((period, index) => {
              const percentage = totalRenewalPremium > 0 ? Math.round((period.premium / totalRenewalPremium) * 100) : 0;
              return (
                <div
                  key={index}
                  style={{
                    flex: percentage,
                    background: period.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={`${period.label}: $${period.premium.toLocaleString()}`}
                >
                  {percentage > 10 && (
                    <span style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#120A06',
                      fontWeight: 600,
                    }}>
                      {percentage}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            color: '#C9B99A',
          }}>
            {renewalData.map((period, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
                <div>{period.label}</div>
                <div style={{ fontWeight: 500, color: '#F5ECD7' }}>
                  ${period.premium.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* COVERAGE GAPS - 2-column grid of cards */}
        {coverageGapAnalysis.length > 0 && (
          <div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#F5ECD7',
              fontWeight: 500,
              marginBottom: '12px',
            }}>
              Critical coverage gaps (>50% of clients)
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
            }}>
              {coverageGapAnalysis.map((gap, index) => (
                <div key={index} style={{
                  background: '#3D2215',
                  borderRadius: '8px',
                  padding: '12px',
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
                      {gap.type}
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '12px',
                      color: '#C9B99A',
                    }}>
                      {gap.clientsWithoutCoverage} of {clientCount} not covered
                    </div>
                  </div>
                  
                  <div style={{
                    background: '#2E1A0E',
                    borderRadius: '4px',
                    height: '8px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${gap.percentageWithout}%`,
                      background: '#E53E3E',
                      height: '8px',
                    }}></div>
                  </div>
                  
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '11px',
                    color: '#E53E3E',
                    textAlign: 'right',
                    marginTop: '4px',
                  }}>
                    {gap.percentageWithout}% uncovered
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* == SECTION B: YOUR BOOK == */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '20px',
          fontWeight: 400,
          color: '#F5ECD7',
          margin: '0 0 16px 0',
        }}>
          Your book
        </h2>
        
        {/* 4 Metric Cards */}
        <div className="metric-grid" style={{ marginBottom: '24px' }}>
          <div className="card card-amber">
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              color: '#C9B99A',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px',
            }}>
              TOTAL AUM
            </div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '34px',
              fontWeight: 300,
              color: '#F5ECD7',
              lineHeight: 1.1,
              marginBottom: '6px',
            }}>
              ${totalPremium.toLocaleString()}
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#5AB87A',
            }}>
              Annual premium managed
            </div>
          </div>
          
          <div className="card card-ok">
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              color: '#C9B99A',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px',
            }}>
              AVG PER CLIENT
            </div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '34px',
              fontWeight: 300,
              color: '#F5ECD7',
              lineHeight: 1.1,
              marginBottom: '6px',
            }}>
              ${avgPerClient.toLocaleString()}
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#5AB87A',
            }}>
              Average annual premium
            </div>
          </div>
          
          <div className="card card-info">
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              color: '#C9B99A',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px',
            }}>
              TOTAL CLIENTS
            </div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '34px',
              fontWeight: 300,
              color: '#F5ECD7',
              lineHeight: 1.1,
              marginBottom: '6px',
            }}>
              {clientCount}
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#5AB87A',
            }}>
              Active clients
            </div>
          </div>
          
          <div className="card card-info">
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              color: '#C9B99A',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px',
            }}>
              TOTAL POLICIES
            </div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '34px',
              fontWeight: 300,
              color: '#F5ECD7',
              lineHeight: 1.1,
              marginBottom: '6px',
            }}>
              {policyCount}
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#5AB87A',
            }}>
              Active policies
            </div>
          </div>
        </div>
        
        {/* Two columns: Premium by Insurer (60%) + Top 5 Clients (40%) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '60% 40%',
          gap: '24px',
        }}>
          {/* Left: Premium by Insurer */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Premium by insurer</span>
            </div>
            <div className="panel-body">
              {topInsurers.length > 0 ? (
                <div style={{ padding: '16px' }}>
                  {topInsurers.map((insurer, index) => {
                    const percentage = maxInsurerAmount > 0 ? Math.round((insurer.amount / maxInsurerAmount) * 100) : 0;
                    const marketShare = totalPremium > 0 ? Math.round((insurer.amount / totalPremium) * 100) : 0;
                    const amberShade = index === 0 ? '#C8813A' : 
                                      index === 1 ? '#D69E2E' : 
                                      index === 2 ? '#ED8936' : 
                                      index === 3 ? '#F6AD55' : 
                                      index === 4 ? '#FBD38D' : '#C8813A';
                    
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
                            background: amberShade,
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
          
          {/* Right: Top 5 Clients as compact cards */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Top 5 clients</span>
            </div>
            <div className="panel-body">
              {topClients.length > 0 ? (
                <div style={{ padding: '8px' }}>
                  {topClients.map((client, index) => (
                    <Link 
                      key={client.id}
                      href={`/dashboard/clients/${client.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        background: '#3D2215',
                        marginBottom: '8px',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#4A2B1A'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#3D2215'}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#C8813A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '14px',
                        color: '#120A06',
                        fontWeight: 600,
                      }}>
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#F5ECD7',
                          fontWeight: 500,
                          marginBottom: '2px',
                        }}>
                          {client.name}
                        </div>
                        <div style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '11px',
                          color: '#C9B99A',
                          marginBottom: '4px',
                        }}>
                          {client.company || '—'}
                        </div>
                        <div style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '12px',
                          color: '#C8813A',
                        }}>
                          ${client.premium.toLocaleString()} · {client.policyCount} polic{client.policyCount !== 1 ? 'ies' : 'y'}
                        </div>
                      </div>
                    </Link>
                  ))}
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
        </div>
      </div>
      
      {/* == SECTION C: CLIENT HEALTH == */}
      <div>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '20px',
          fontWeight: 400,
          color: '#F5ECD7',
          margin: '0 0 16px 0',
        }}>
          Client health
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
        }}>
          {/* Left: Clients by Type - Single horizontal segmented bar */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Clients by type</span>
            </div>
            <div className="panel-body">
              {totalTypeCount > 0 ? (
                <div style={{ padding: '16px' }}>
                  <div style={{
                    display: 'flex',
                    height: '32px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '16px',
                  }}>
                    {Object.entries(typeCounts).map(([type, count], index) => {
                      const percentage = totalTypeCount > 0 ? Math.round((count / totalTypeCount) * 100) : 0;
                      const color = type === 'individual' ? '#C8813A' : 
                                   type === 'sme' ? '#20A0A0' : '#38A169';
                      
                      return (
                        <div
                          key={type}
                          style={{
                            flex: percentage,
                            background: color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title={`${type.charAt(0).toUpperCase() + type.slice(1)}: ${count} (${percentage}%)`}
                        >
                          {percentage > 15 && (
                            <span style={{
                              fontFamily: 'DM Sans, sans-serif',
                              fontSize: '11px',
                              color: '#120A06',
                              fontWeight: 600,
                            }}>
                              {percentage}%
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}>
                    {Object.entries(typeCounts).map(([type, count]) => {
                      const percentage = totalTypeCount > 0 ? Math.round((count / totalTypeCount) * 100) : 0;
                      const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
                      const color = type === 'individual' ? '#C8813A' : 
                                   type === 'sme' ? '#20A0A0' : '#38A169';
                      
                      return (
                        <div key={type} style={{
                          textAlign: 'center',
                        }}>
                          <div style={{
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '13px',
                            color: '#F5ECD7',
                            fontWeight: 500,
                            marginBottom: '4px',
                          }}>
                            {typeLabel}
                          </div>
                          <div style={{
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '11px',
                            color: '#C9B99A',
                          }}>
                            {count} ({percentage}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
          
          {/* Right: Clients by Tier */}
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
    </div>
  );
}