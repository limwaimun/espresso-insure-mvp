import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{
      background: '#1C0F0A',
      color: '#F5ECD7',
      minHeight: '100vh',
      fontFamily: 'DM Sans, sans-serif',
      overflowX: 'hidden',
    }}>

      {/* Grain */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.03\'/%3E%3C/svg%3E")',
        pointerEvents: 'none', zIndex: 1,
      }} />

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 48px',
        background: 'linear-gradient(to bottom, #1C0F0A, transparent)',
      }}>
        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', color: '#C8813A', letterSpacing: '1px' }}>
          espresso.
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/login" style={{ color: '#C9B99A', textDecoration: 'none', fontSize: '14px' }}>Login</Link>
          <Link href="/trial" style={{
            background: '#C8813A', color: '#120A06', textDecoration: 'none',
            padding: '10px 24px', borderRadius: '6px', fontSize: '14px', fontWeight: 600,
          }}>
            Start free trial
          </Link>
        </div>
      </nav>

      {/* ==================== HERO ==================== */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', textAlign: 'center',
        padding: '120px 24px 60px', position: 'relative', zIndex: 2,
      }}>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(40px, 6vw, 72px)',
          fontWeight: 400, lineHeight: 1.1, maxWidth: '750px', margin: '0 0 24px',
        }}>
          Run a 200-client practice.{' '}
          <span style={{ color: '#C8813A' }}>Solo.</span>
        </h1>

        <p style={{
          fontSize: '18px', lineHeight: 1.6, color: '#C9B99A',
          maxWidth: '480px', margin: '0 0 40px',
        }}>
          Maya is your AI back-office on WhatsApp.
          Renewals, follow-ups, and client admin — handled.
        </p>

        <Link href="/trial" style={{
          background: '#C8813A', color: '#120A06', textDecoration: 'none',
          padding: '16px 40px', borderRadius: '8px', fontSize: '16px', fontWeight: 700,
          display: 'inline-block',
        }}>
          Start free trial →
        </Link>

        <p style={{ fontSize: '13px', color: '#6B5444', marginTop: '14px' }}>
          14 days free · No credit card
        </p>

        {/* Dashboard mockup */}
        <div style={{
          marginTop: '72px', width: '100%', maxWidth: '880px',
          background: '#120A06', border: '1px solid #2E1A0E', borderRadius: '12px',
          padding: '20px', boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
        }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D06060' }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D4A030' }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#5AB87A' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {[
              { label: 'CLIENTS', value: '127', color: '#5AB87A' },
              { label: 'RENEWALS DUE', value: '14', color: '#D06060' },
              { label: 'AUM', value: '$1.2M', color: '#C8813A' },
              { label: 'GAPS FOUND', value: '43', color: '#20A0A0' },
            ].map((c, i) => (
              <div key={i} style={{ background: '#1C0F0A', borderRadius: '8px', padding: '14px', border: '1px solid #2E1A0E' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.15em', color: c.color, marginBottom: '6px' }}>{c.label}</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', color: '#F5ECD7' }}>{c.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== WHAT MAYA DOES ==================== */}
      <section style={{
        padding: '100px 24px', position: 'relative', zIndex: 2,
        borderTop: '1px solid #2E1A0E',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
            {[
              { icon: '📅', title: 'Renewals on autopilot', desc: 'Maya alerts you 90 days out and follows up with clients. No more missed commissions.' },
              { icon: '🛡️', title: 'Gaps become revenue', desc: 'See exactly what each client is missing. Every gap is an upsell conversation waiting to happen.' },
              { icon: '🎂', title: 'Relationships that stick', desc: 'Birthday greetings, check-ins, and follow-ups — Maya keeps your clients warm.' },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>{item.icon}</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: '#F5ECD7', marginBottom: '10px' }}>{item.title}</div>
                <div style={{ fontSize: '14px', color: '#C9B99A', lineHeight: 1.7 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section style={{
        padding: '100px 24px', position: 'relative', zIndex: 2,
        borderTop: '1px solid #2E1A0E', textAlign: 'center',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <p style={{ fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase', color: '#C8813A', marginBottom: '20px' }}>
            3 MINUTES TO SET UP
          </p>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 400, marginBottom: '60px',
          }}>
            Import. Connect. Done.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '48px', textAlign: 'left' }}>
            {[
              { step: '01', title: 'Upload your client list', desc: 'Excel, CSV — Maya maps everything.' },
              { step: '02', title: 'Maya joins WhatsApp', desc: 'She starts managing follow-ups immediately.' },
              { step: '03', title: 'You focus on selling', desc: 'Maya handles the rest.' },
            ].map((item, i) => (
              <div key={i}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '36px', color: '#2E1A0E', marginBottom: '12px' }}>{item.step}</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#F5ECD7', marginBottom: '6px' }}>{item.title}</div>
                <div style={{ fontSize: '14px', color: '#C9B99A', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PRICING ==================== */}
      <section style={{
        padding: '100px 24px', position: 'relative', zIndex: 2,
        borderTop: '1px solid #2E1A0E', textAlign: 'center',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 400, marginBottom: '48px',
          }}>
            One price. Everything included.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              { plan: 'Solo', price: '29', desc: 'Independent IFAs', features: ['1 agent', '100 clients', 'Maya AI', 'Full dashboard'], popular: true },
              { plan: 'Pro', price: '79', desc: 'Growing practices', features: ['1 agent', 'Unlimited clients', 'Priority support', 'Advanced analytics'], popular: false },
              { plan: 'Team', price: '199', desc: 'Agencies', features: ['5 agents', 'Unlimited clients', 'Team dashboard', 'Dedicated support'], popular: false },
            ].map((item, i) => (
              <div key={i} style={{
                background: item.popular ? '#2A1810' : '#120A06',
                border: item.popular ? '2px solid #C8813A' : '1px solid #2E1A0E',
                borderRadius: '12px', padding: '32px 24px', textAlign: 'left',
                position: 'relative',
              }}>
                {item.popular && (
                  <div style={{
                    position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)',
                    background: '#C8813A', color: '#120A06', fontSize: '10px', fontWeight: 700,
                    padding: '3px 14px', borderRadius: '20px', letterSpacing: '1px',
                  }}>
                    POPULAR
                  </div>
                )}
                <div style={{ fontSize: '13px', color: '#C9B99A', marginBottom: '4px' }}>{item.desc}</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#F5ECD7', marginBottom: '4px' }}>{item.plan}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: '20px' }}>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '40px', color: '#F5ECD7' }}>${item.price}</span>
                  <span style={{ fontSize: '13px', color: '#6B5444' }}>/mo</span>
                </div>
                {item.features.map((f, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ color: '#5AB87A', fontSize: '12px' }}>✓</span>
                    <span style={{ fontSize: '13px', color: '#C9B99A' }}>{f}</span>
                  </div>
                ))}
                <Link href="/trial" style={{
                  display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '20px',
                  background: item.popular ? '#C8813A' : 'transparent',
                  color: item.popular ? '#120A06' : '#C8813A',
                  border: item.popular ? 'none' : '1px solid #3D2215',
                  padding: '11px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                }}>
                  Start free trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FINAL CTA ==================== */}
      <section style={{
        padding: '120px 24px', textAlign: 'center', position: 'relative', zIndex: 2,
        borderTop: '1px solid #2E1A0E',
      }}>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 400, maxWidth: '500px', margin: '0 auto 28px', lineHeight: 1.2,
        }}>
          Stop chasing. Start closing.
        </h2>
        <Link href="/trial" style={{
          background: '#C8813A', color: '#120A06', textDecoration: 'none',
          padding: '16px 48px', borderRadius: '8px', fontSize: '16px', fontWeight: 700,
          display: 'inline-block',
        }}>
          Start free trial →
        </Link>
        <p style={{ fontSize: '13px', color: '#6B5444', marginTop: '14px' }}>
          14 days free · No credit card
        </p>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: '32px 48px', borderTop: '1px solid #2E1A0E',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', zIndex: 2,
      }}>
        <div>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', color: '#C8813A' }}>espresso.</span>
          <span style={{ fontSize: '12px', color: '#6B5444', marginLeft: '12px' }}>© 2026</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <a href="mailto:hello@espresso.insure" style={{ color: '#6B5444', textDecoration: 'none', fontSize: '12px' }}>hello@espresso.insure</a>
        </div>
      </footer>
    </div>
  );
}