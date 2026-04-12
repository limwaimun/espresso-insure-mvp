'use client';
export default function ClaimsPage() {
 const F = 'DM Sans, sans-serif';
 const CG = 'Cormorant Garamond, serif';
 const claims = [
 { client: 'Tan Ah Kow', policy: 'Group Insurance', insurer: 'Prudential', opened: '2 Apr', status: 'Claim open', sc: 'pill-danger' },
 { client: 'Angela Foo', policy: 'Medical Insurance', insurer: 'AIA', opened: '5 Apr', status: 'Pending insurer', sc: 'pill-amber' },
 { client: 'David Wong', policy: 'Car Insurance', insurer: 'AXA', opened: '8 Apr', status: 'Claim open', sc: 'pill-danger' },
 { client: 'Nurul Huda', policy: 'Health Insurance', insurer: 'NTUC Income', opened: '1 Apr', status: 'Pending insurer', sc: 'pill-amber' },
 { client: 'Robert Chen', policy: 'Home Insurance', insurer: 'AXA', opened: '15 Mar', status: 'Resolved', sc: 'pill-ok' },
 ];
 const thS: React.CSSProperties = { fontFamily: F, fontSize: '11px', fontWeight: 500, color: '#C8813A', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #2E1A0E', background: '#1C0F0A', whiteSpace: 'nowrap' };
 const tdS: React.CSSProperties = { fontFamily: F, fontSize: '13px', color: '#C9B99A', padding: '10px 12px', verticalAlign: 'middle', borderBottom: '1px solid #2E1A0E' };
 return (
 <div style={{ width: '100%' }}>
 <h1 style={{ fontFamily: CG, fontSize: '28px', fontWeight: 400, color: '#F5ECD7', margin: '0 0 20px 0' }}>Claims</h1>
 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
 <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
 <tr>
 <th style={thS}>Client</th><th style={thS}>Policy</th><th style={thS}>Insurer</th>
 <th style={thS}>Opened</th><th style={thS}>Status</th><th style={thS}>Action</th>
 </tr>
 </thead>
 <tbody>
 {claims.map((c, i) => (
 <tr key={i}>
 <td style={{ ...tdS, color: '#F5ECD7', fontWeight: 500 }}>{c.client}</td>
 <td style={tdS}>{c.policy}</td>
 <td style={tdS}>{c.insurer}</td>
 <td style={{ ...tdS, fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>{c.opened}</td>
 <td style={tdS}><span className={'pill ' + c.sc}>{c.status}</span></td>
 <td style={tdS}><span style={{ color: '#C8813A', fontSize: '12px', cursor: 'pointer' }}>View claim →</span></td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 );
}
