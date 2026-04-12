import { createClient } from '@/lib/supabase/server';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  
  // Fetch data for analytics
  const { data: clients } = await supabase
    .from('clients')
    .select('*');
  
  const { data: policies } = await supabase
    .from('policies')
    .select('*');
  
  const { data: conversations } = await supabase
    .from('conversations')
    .select('*');

  // Calculate metrics from real data
  const totalClients = clients?.length || 0;
  const totalPolicies = policies?.length || 0;
  const totalPremium = policies?.reduce((sum, p) => sum + (p.premium || 0), 0) || 0;
  const totalConversations = conversations?.length || 0;
  const coverageGaps = conversations?.reduce((sum, c) => sum + (c.gaps_identified || 0), 0) || 0;
  const clientsAtRisk = clients?.filter(c => c.status === 'at-risk').length || 0;

  const metrics = [
    { 
      label: 'Renewal rate', 
      value: '—', 
      delta: 'No data yet',
      class: 'card card-ok'
    },
    { 
      label: 'Revenue managed', 
      value: totalPremium > 0 ? `$${totalPremium.toLocaleString()}` : '$0',
      delta: totalPremium > 0 ? 'From active policies' : 'No policies yet',
      class: 'card card-amber'
    },
    { 
      label: 'Time saved', 
      value: '—', 
      delta: 'Will track with usage',
      class: 'card card-ok'
    },
    { 
      label: 'Coverage opportunities', 
      value: coverageGaps > 0 ? coverageGaps.toString() : '0',
      delta: coverageGaps > 0 ? 'Detected in conversations' : 'No gaps found',
      class: 'card card-amber'
    },
    { 
      label: 'Clients at risk', 
      value: clientsAtRisk > 0 ? clientsAtRisk.toString() : '0',
      delta: clientsAtRisk > 0 ? 'Require attention' : 'All clients stable',
      class: 'card card-danger'
    },
    { 
      label: 'New clients', 
      value: totalClients > 0 ? totalClients.toString() : '0',
      delta: totalClients > 0 ? 'Total clients' : 'No clients yet',
      class: 'card card-ok'
    },
  ];

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

      {/* Performance metrics */}
      <div className="section-label" style={{ marginBottom: '12px' }}>Performance this month</div>
      <div className="metric-grid" style={{ marginBottom: '32px' }}>
        {metrics.map((m, i) => (
          <div key={i} className={m.class}>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              color: '#C9B99A',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px',
            }}>
              {m.label}
            </div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '34px',
              fontWeight: 300,
              color: '#F5ECD7',
              lineHeight: 1.1,
              marginBottom: '6px',
            }}>
              {m.value}
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: i === 4 ? '#E53E3E' : '#5AB87A',
            }}>
              {m.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Chart panel */}
      <div className="panel" style={{ marginBottom: '32px' }}>
        <div className="panel-header">
          <span className="panel-title">Renewal performance</span>
        </div>
        <div className="panel-body" style={{ padding: '24px' }}>
          {totalPolicies > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
            }}>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#C9B99A',
                textAlign: 'center',
                marginBottom: '16px',
              }}>
                Analytics will populate as you add clients and policies.
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#C8813A',
                textAlign: 'center',
              }}>
                {totalPolicies} policies tracked · {totalClients} clients
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
            }}>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#C9B99A',
                textAlign: 'center',
                marginBottom: '16px',
              }}>
                Analytics will populate as you add clients and policies.
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#C8813A',
                textAlign: 'center',
              }}>
                No data yet — start by adding your first client
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Coverage gaps panel */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Coverage gaps by client</span>
        </div>
        <div className="panel-body">
          {coverageGaps > 0 ? (
            conversations
              ?.filter(c => c.gaps_identified && c.gaps_identified > 0)
              .slice(0, 3)
              .map((conv, i) => (
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
                  <div>
                    <div style={{ fontWeight: 500, color: '#F5ECD7' }}>
                      Client conversation
                    </div>
                    <div>
                      {conv.gaps_identified} gap{conv.gaps_identified > 1 ? 's' : ''} identified
                    </div>
                  </div>
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
              No coverage gaps detected yet. Maya will identify gaps during conversations.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}