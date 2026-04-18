import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: totalFAs },
    { count: totalClients },
    { count: totalPolicies },
    { data: recentFAs },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('policies').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('id, name, company, plan, created_at').order('created_at', { ascending: false }).limit(10),
  ])

  const panelStyle = {
    background: '#1C0F0A',
    border: '1px solid #2E1A0E',
    borderRadius: 12,
    padding: 24,
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100 }}>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 400, color: '#F5ECD7', margin: '0 0 8px' }}>
        Admin Overview
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#C9B99A', margin: '0 0 28px' }}>
        espresso. system status
      </p>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Registered FAs', value: totalFAs || 0 },
          { label: 'Total clients', value: totalClients || 0 },
          { label: 'Total policies', value: totalPolicies || 0 },
        ].map(k => (
          <div key={k.label} style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: 10, padding: '20px 24px' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#C9B99A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: '#F5ECD7' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Agent status */}
      <div style={{ ...panelStyle, marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 400, color: '#F5ECD7', margin: '0 0 20px' }}>
          Agent fleet
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { name: 'Maya', route: '/api/maya-playground', status: 'live', role: 'Client relationship' },
            { name: 'Relay', route: '/api/relay', status: 'live', role: 'Orchestrator' },
            { name: 'Scout', route: '/api/scout', status: 'live', role: 'Product research' },
            { name: 'Sage', route: '/api/sage', status: 'live', role: 'Premium estimates' },
            { name: 'Compass', route: '/api/compass', status: 'live', role: 'Policy comparison' },
            { name: 'Atlas', route: '/api/atlas', status: 'live', role: 'Claims pre-fill' },
            { name: 'Lens', route: '/api/lens', status: 'live', role: 'FA analytics' },
            { name: 'Harvester', route: '/api/forms/harvest', status: 'live', role: 'Form collection' },
            { name: 'Webhook', route: '/api/webhook/whatsapp', status: 'pending_meta', role: 'WhatsApp handler' },
          ].map(agent => (
            <div key={agent.name} style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#F5ECD7', fontWeight: 500 }}>{agent.name}</span>
                <span style={{
                  fontSize: 9, padding: '2px 6px', borderRadius: 100,
                  fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase',
                  background: agent.status === 'live' ? 'rgba(90,184,122,0.15)' : 'rgba(200,129,58,0.15)',
                  color: agent.status === 'live' ? '#5AB87A' : '#D4A030',
                  border: `1px solid ${agent.status === 'live' ? '#2E5A3A' : '#3D2215'}`,
                }}>
                  {agent.status === 'live' ? 'Live' : 'Pending'}
                </span>
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#C9B99A' }}>{agent.role}</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#6B5444', marginTop: 4 }}>{agent.route}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent FA signups */}
      <div style={panelStyle}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 400, color: '#F5ECD7', margin: '0 0 20px' }}>
          FA accounts
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(recentFAs || []).map(fa => (
            <div key={fa.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#120A06', borderRadius: 8, border: '1px solid #2E1A0E' }}>
              <div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#F5ECD7', fontWeight: 500 }}>{fa.name || 'Unnamed'}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#C9B99A' }}>{fa.company || 'No company'}</div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 100,
                  fontFamily: 'DM Sans, sans-serif', textTransform: 'capitalize',
                  background: 'rgba(200,129,58,0.1)', color: '#C8813A',
                  border: '1px solid #3D2215',
                }}>
                  {fa.plan || 'trial'}
                </span>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#C9B99A' }}>
                  {new Date(fa.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
