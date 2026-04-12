'use client';
export default function ClientProfilePage() {
 const F = 'DM Sans, sans-serif';
 const CG = 'Cormorant Garamond, serif';
 const activity = [
 'Renewal reminder sent for AIA policy',
 'Coverage gap detected in group insurance',
 'Claim opened — medical expense',
 'Policy document stored',
 ];
 const metrics = [
 {l:'Policies',v:'3'},{l:'Annual premium',v:'$7,140'},
 {l:'Next renewal',v:'13 Apr'},{l:'Renewal rate',v:'100%'},
 {l:'Open claims',v:'1'},{l:'Client since',v:'2021'},
 ];
 return (
 <div style={{ width: '100%' }}>
 <div style={{ marginBottom: '16px' }}>
 <span style={{ fontFamily: F, fontSize: '13px', color: '#C8813A', cursor: 'pointer' }}>← All clients</span>
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
 <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#C8813A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: CG, fontSize: '24px', color: '#120A06' }}>T</div>
 <div>
 <h1 style={{ fontFamily: CG, fontSize: '28px', fontWeight: 400, color: '#F5ECD7', margin: 0 }}>Tan Ah Kow</h1>
 <div style={{ fontFamily: F, fontSize: '13px', color: '#C9B99A' }}>TAK Technologies Pte Ltd · SME</div>
 </div>
 <span className="pill pill-amber">Gold</span>
 </div>
 <div className="metric-grid" style={{ marginBottom: '24px' }}>
 {metrics.map((m,i) => (
 <div key={i} className="card">
 <div style={{ fontFamily: F, fontSize: '11px', color: '#C9B99A', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '6px' }}>{m.l}</div>
 <div style={{ fontFamily: CG, fontSize: '28px', fontWeight: 300, color: '#F5ECD7' }}>{m.v}</div>
 </div>
 ))}
 </div>
 <div className="panel">
 <div className="panel-header"><span className="panel-title">Recent activity</span></div>
 <div className="panel-body">
 {activity.map((a,i) => (
 <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid #2E1A0E', fontFamily: F, fontSize: '13px', color: '#C9B99A', alignItems: 'center' }}>
 <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C8813A', flexShrink: 0 }} />
 {a}
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}
