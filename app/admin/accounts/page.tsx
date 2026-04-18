import { createClient } from '@/lib/supabase/server'

export default async function AdminAccountsPage() {
  const supabase = await createClient()

  const { data: fas } = await supabase
    .from('profiles')
    .select('id, name, company, phone, plan, created_at, trial_ends_at, preferred_insurers')
    .order('created_at', { ascending: false })

  const clientCounts = await Promise.all(
    (fas || []).map(async fa => {
      const { count } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('ifa_id', fa.id)
      return { id: fa.id, count: count || 0 }
    })
  )
  const countMap = Object.fromEntries(clientCounts.map(c => [c.id, c.count]))

  const PLAN_COLORS: Record<string, string> = {
    platinum: '#E5E4E2', gold: '#C8813A', pro: '#4A9EBF',
    solo: '#C8813A', team: '#5AB87A', trial: '#C9B99A',
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000 }}>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 400, color: '#F5ECD7', margin: '0 0 8px' }}>
        FA Accounts
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#C9B99A', margin: '0 0 28px' }}>
        {fas?.length || 0} registered financial advisors
      </p>

      <div style={{ background: '#1C0F0A', border: '1px solid #2E1A0E', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#120A06' }}>
              {['Name', 'Company', 'Plan', 'Clients', 'WhatsApp', 'Trial ends', 'Joined'].map(h => (
                <th key={h} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#C8813A', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #2E1A0E' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(fas || []).map((fa, i) => {
              const trialDays = fa.trial_ends_at
                ? Math.max(0, Math.ceil((new Date(fa.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                : null
              return (
                <tr key={fa.id} style={{ borderBottom: i < (fas?.length || 0) - 1 ? '1px solid #2E1A0E' : 'none' }}>
                  <td style={{ padding: '14px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#F5ECD7', fontWeight: 500 }}>
                    {fa.name || '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#C9B99A' }}>
                    {fa.company || '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontFamily: 'DM Sans, sans-serif', fontSize: 10, textTransform: 'capitalize',
                      padding: '2px 10px', borderRadius: 100,
                      background: 'rgba(200,129,58,0.1)', border: '1px solid #3D2215',
                      color: PLAN_COLORS[fa.plan] || '#C9B99A',
                    }}>
                      {fa.plan || 'trial'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#F5ECD7', textAlign: 'center' }}>
                    {countMap[fa.id] || 0}
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#C9B99A' }}>
                    {fa.phone || '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: trialDays !== null && trialDays <= 3 ? '#D06060' : '#C9B99A' }}>
                    {trialDays !== null ? `${trialDays}d left` : '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#C9B99A' }}>
                    {new Date(fa.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
