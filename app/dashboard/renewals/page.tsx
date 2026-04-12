'use client';
export default function RenewalsPage() {
 const F = 'DM Sans, sans-serif';
 const CG = 'Cormorant Garamond, serif';
 const renewals = [
 { client: 'Angela Foo', policy: 'Life Insurance', insurer: 'AIA', due: '18 Apr', premium: '$2,240/yr', status: 'urgent', sc: 'pill-danger' },
 { client: 'Tan Ah Kow', policy: 'Group Insurance', insurer: 'Prudential', due: '20 Apr', premium: '$7,140/yr', status: 'urgent', sc: 'pill-danger' },
 { client: 'James Wong', policy: 'Life Insurance', insurer: 'Great Eastern', due: '22 Apr', premium: '$3,200/yr', status: 'due', sc: 'pill-amber' },
 { client: 'Thomas Ng', policy: 'Health Insurance', insurer: 'NTUC Income', due: '25 Apr', premium: '$1,800/yr', status: 'due', sc: 'pill-amber' },
 { client: 'Jessica Lim', policy: 'Car Insurance', insurer: 'AXA', due: '28 Apr', premium: '$1,200/yr', status: 'upcoming', sc: 'pill-ok' },
 { client: 'David Tan', policy: 'Travel Insurance', insurer: 'AIA', due: '30 Apr', premium: '$450/yr', status: 'upcoming', sc: 'pill-ok' },
 { client: 'Sarah Lim', policy: 'Travel Insurance', insurer: 'Aviva', due: '5 May', premium: '$380/yr', status: 'upcoming', sc: 'pill-ok' },
 { client: 'Robert Chen', policy: 'Home Insurance', insurer: 'AXA', due: '10 May', premium: '$890/yr', status: 'upcoming', sc: 'pill-ok' },
 ];
 const thS: React.CSSProperties = { fontFamily: F, fontSize: '11px', fontWeight: 500, color: '#C8813A', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #2E1A0E', background: '#1C0F0A', whiteSpace: 'nowrap' };
 const tdS: React.CSSProperties = { fontFamily: F, fontSize: '13px', color: '#C9B99A', padding: '10px 12px', verticalAlign: 'middle', borderBottom: '1px solid #2E1A0E' };
 return (
 <div style={{ width: '100%' }}>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
 <h1 style={{ fontFamily: CG, fontSize: '28px', fontWeight: 400, color: '#F5ECD7', margin: 0 }}>Renewals</h1>
 <button className="btn-secondary" style={{ fontSize: '13px', padding: '8px 16px' }}>View calendar</button>
 </div>
 <div style={{ background: 'rgba(200,129,58,0.06)', borderRadius: '8px', padding: '8px 16px', marginBottom: '16px', fontFamily: F, fontSize: '13px', color: '#C9B99A' }}>
 8 renewals due this month · 3 require immediate action
 </div>
 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
 <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
 <tr>
 <th style={thS}>Client</th><th style={thS}>Policy</th><th style={thS}>Insurer</th>
 <th style={thS}>Due</th><th style={thS}>Premium</th><th style={thS}>Status</th><th style={thS}>Action</th>
 </tr>
 </thead>
 <tbody>
 {renewals.map((r, i) => (
 <tr key={i}>
 <td style={{ ...tdS, color: '#F5ECD7', fontWeight: 500 }}>{r.client}</td>
 <td style={tdS}>{r.policy}</td>
 <td style={tdS}>{r.insurer}</td>
 <td style={{ ...tdS, fontFamily: 'DM Mono, monospace', fontSize: '12px', color: r.status === 'urgent' ? '#D06060' : r.status === 'due' ? '#D4A030' : '#C9B99A' }}>{r.due}</td>
 <td style={{ ...tdS, fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>{r.premium}</td>
 <td style={tdS}><span className={'pill ' + r.sc}>{r.status}</span></td>
 <td style={tdS}><span style={{ color: '#C8813A', fontSize: '12px', cursor: 'pointer' }}>Send reminder →</span></td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 );
}
