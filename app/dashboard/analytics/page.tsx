'use client';
export default function AnalyticsPage() {
 const F = 'DM Sans, sans-serif';
 const CG = 'Cormorant Garamond, serif';
 
 // All 6 metrics in one array
 const allMetrics = [
 { label: 'Renewal rate', value: '94.2%', delta: '+2.1% vs last month', cc: 'card card-ok' },
 { label: 'Revenue managed', value: '$284,600', delta: '+$18,400 this month', cc: 'card card-amber' },
 { label: 'Time saved', value: '42h', delta: '+8h this week', cc: 'card card-ok' },
 { label: 'Coverage opportunities', value: '18', delta: '5 detected this week', cc: 'card card-amber' },
 { label: 'Clients at risk', value: '4', delta: '2 require action', cc: 'card card-danger' },
 { label: 'New clients', value: '6', delta: '+2 vs last month', cc: 'card card-ok' },
 ];
 
 const bars = [
 {m:'Nov',h:75,r:'91%'},{m:'Dec',h:80,r:'92%'},{m:'Jan',h:85,r:'93%'},
 {m:'Feb',h:78,r:'92%'},{m:'Mar',h:90,r:'94%'},{m:'Apr',h:95,r:'94.2%'}
 ];
 
 const gaps = [
 { client: 'Tan Ah Kow', description: 'Group policy missing critical illness rider' },
 { client: 'Angela Foo', description: 'No life insurance coverage' },
 { client: 'Raj Kumar', description: 'Underinsured on property coverage' },
 ];
 
 return (
 <div style={{ width: '100%' }}>
 <h1 style={{ fontFamily: CG, fontSize: '28px', fontWeight: 400, color: '#F5ECD7', margin: '0 0 24px 0' }}>Analytics</h1>
 
 {/* All 6 metrics in full-width grid */}
 <div className="section-label" style={{ marginBottom: '12px' }}>Performance this month</div>
 <div className="metric-grid" style={{ marginBottom: '32px' }}>
 {allMetrics.map((m,i) => (
 <div key={i} className={m.cc}>
 <div style={{ fontFamily: F, fontSize: '11px', color: '#C9B99A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{m.label}</div>
 <div style={{ fontFamily: CG, fontSize: '34px', fontWeight: 300, color: '#F5ECD7', lineHeight: 1.1, marginBottom: '6px' }}>{m.value}</div>
 <div style={{ fontFamily: F, fontSize: '12px', color: i === 4 ? '#E53E3E' : '#5AB87A' }}>{m.delta}</div>
 </div>
 ))}
 </div>
 
 {/* Bar chart in proper panel */}
 <div className="panel" style={{ marginBottom: '32px' }}>
 <div className="panel-header"><span className="panel-title">Renewal performance — last 6 months</span></div>
 <div className="panel-body" style={{ padding: '24px' }}>
 <div style={{ display: 'flex', height: '200px', gap: '24px' }}>
 {/* Y-axis labels */}
 <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', padding: '8px 0' }}>
 <div style={{ fontFamily: F, fontSize: '11px', color: '#C9B99A' }}>100%</div>
 <div style={{ fontFamily: F, fontSize: '11px', color: '#C9B99A' }}>95%</div>
 <div style={{ fontFamily: F, fontSize: '11px', color: '#C9B99A' }}>90%</div>
 <div style={{ fontFamily: F, fontSize: '11px', color: '#C9B99A' }}>85%</div>
 <div style={{ fontFamily: F, fontSize: '11px', color: '#C9B99A' }}>80%</div>
 </div>
 
 {/* Chart bars */}
 <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '16px', height: '160px' }}>
 {bars.map((b,i) => (
 <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
 <div style={{ fontFamily: F, fontSize: '10px', color: '#C9B99A' }}>{b.r}</div>
 <div style={{ width: '100%', height: b.h + 'px', background: i===5 ? '#C8813A' : 'rgba(200,129,58,0.3)', borderRadius: '4px 4px 0 0' }} />
 <div style={{ fontFamily: F, fontSize: '11px', color: '#C9B99A' }}>{b.m}</div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 
 {/* Coverage gaps panel */}
 <div className="panel">
 <div className="panel-header"><span className="panel-title">Coverage gaps by client</span></div>
 <div className="panel-body">
 {gaps.map((gap,i) => (
 <div key={i} style={{ display: 'flex', gap: '16px', padding: '16px 0', borderBottom: i < gaps.length-1 ? '1px solid #2E1A0E' : 'none', alignItems: 'flex-start' }}>
 <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C8813A', flexShrink: 0, marginTop: '6px' }} />
 <div style={{ flex: 1 }}>
 <div style={{ fontFamily: F, fontSize: '14px', color: '#F5ECD7', fontWeight: 500, marginBottom: '4px' }}>{gap.client}</div>
 <div style={{ fontFamily: F, fontSize: '13px', color: '#C9B99A' }}>{gap.description}</div>
 </div>
 <span className="pill pill-amber" style={{ fontSize: '11px', padding: '4px 8px' }}>Review</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}