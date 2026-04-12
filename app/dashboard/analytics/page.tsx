'use client';
export default function AnalyticsPage() {
 const F = 'DM Sans, sans-serif';
 const CG = 'Cormorant Garamond, serif';
 const metrics = [
 { label: 'Renewal rate', value: '94.2%', delta: '+2.1% vs last month', cc: 'card card-ok' },
 { label: 'Revenue managed', value: '$284,600', delta: '+$18,400 this month', cc: 'card card-amber' },
 { label: 'Time saved', value: '42h', delta: '+8h this week', cc: 'card card-ok' },
 ];
 const second = [
 { label: 'Coverage opportunities', value: '18', delta: '5 detected this week', cc: 'card card-amber' },
 { label: 'Clients at risk', value: '4', delta: '2 require action', cc: 'card card-danger' },
 { label: 'New clients', value: '6', delta: '+2 vs last month', cc: 'card card-ok' },
 ];
 const bars = [
 {m:'Nov',h:75,r:'91%'},{m:'Dec',h:80,r:'92%'},{m:'Jan',h:85,r:'93%'},
 {m:'Feb',h:78,r:'92%'},{m:'Mar',h:90,r:'94%'},{m:'Apr',h:95,r:'94.2%'}
 ];
 return (
 <div style={{ width: '100%' }}>
 <h1 style={{ fontFamily: CG, fontSize: '28px', fontWeight: 400, color: '#F5ECD7', margin: '0 0 24px 0' }}>Analytics</h1>
 <div className="section-label" style={{ marginBottom: '12px' }}>Performance this month</div>
 <div className="metric-grid" style={{ marginBottom: '24px' }}>
 {metrics.map((m,i) => (
 <div key={i} className={m.cc}>
 <div style={{ fontFamily: F, fontSize: '11px', color: '#C9B99A', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '8px' }}>{m.label}</div>
 <div style={{ fontFamily: CG, fontSize: '34px', fontWeight: 300, color: '#F5ECD7', lineHeight: 1.1, marginBottom: '6px' }}>{m.value}</div>
 <div style={{ fontFamily: F, fontSize: '12px', color: '#5AB87A' }}>{m.delta}</div>
 </div>
 ))}
 </div>
 <div className="panel" style={{ marginBottom: '24px' }}>
 <div className="panel-header"><span className="panel-title">Renewal performance — last 6 months</span></div>
 <div className="panel-body" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '160px' }}>
 {bars.map((b,i) => (
 <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
 <div style={{ fontFamily: F, fontSize: '10px', color: '#C9B99A' }}>{b.r}</div>
 <div style={{ width: '40px', height: b.h + 'px', background: i===5 ? '#C8813A' : 'rgba(200,129,58,0.3)', borderRadius: '4px 4px 0 0' }} />
 <div style={{ fontFamily: F, fontSize: '11px', color: '#C9B99A' }}>{b.m}</div>
 </div>
 ))}
 </div>
 </div>
 </div>
 <div className="section-label" style={{ marginBottom: '12px' }}>Opportunities</div>
 <div className="metric-grid">
 {second.map((m,i) => (
 <div key={i} className={m.cc}>
 <div style={{ fontFamily: F, fontSize: '11px', color: '#C9B99A', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '8px' }}>{m.label}</div>
 <div style={{ fontFamily: CG, fontSize: '34px', fontWeight: 300, color: '#F5ECD7', lineHeight: 1.1, marginBottom: '6px' }}>{m.value}</div>
 <div style={{ fontFamily: F, fontSize: '12px', color: '#C9B99A' }}>{m.delta}</div>
 </div>
 ))}
 </div>
 </div>
 );
}
