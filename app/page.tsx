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

      {/* Subtle grain overlay */}
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
        padding: '120px 24px 80px', position: 'relative', zIndex: 2,
      }}>
        <div style={{
          fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase',
          color: '#C8813A', marginBottom: '24px',
        }}>
          AI-POWERED BACK-OFFICE FOR INSURANCE ADVISORS
        </div>

        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px, 5vw, 64px)',
          fontWeight: 400, lineHeight: 1.15, maxWidth: '800px', margin: '0 0 24px',
          color: '#F5ECD7',
        }}>
          Your clients deserve follow-ups.<br />
          <span style={{ color: '#C8813A' }}>Maya makes sure they get them.</span>
        </h1>

        <p style={{
          fontSize: '18px', lineHeight: 1.6, color: '#C9B99A',
          maxWidth: '560px', margin: '0 0 40px',
        }}>
          Maya is your AI assistant inside WhatsApp. She handles renewals,
          flags coverage gaps, and sends birthday greetings — while you
          focus on growing your book.
        </p>

        <Link href="/trial" style={{
          background: '#C8813A', color: '#120A06', textDecoration: 'none',
          padding: '16px 40px', borderRadius: '8px', fontSize: '16px', fontWeight: 700,
          letterSpacing: '0.5px', display: 'inline-block',
        }}>
          Start your 14-day free trial →
        </Link>

        <p style={{ fontSize: '13px', color: '#6B5444', marginTop: '16px' }}>
          No credit card required · Cancel anytime
        </p>

        {/* Dashboard preview */}
        <div style={{
          marginTop: '64px', width: '100%', maxWidth: '900px',
          background: '#120A06', border: '1px solid #2E1A0E', borderRadius: '12px',
          padding: '24px', boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
        }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D06060' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D4A030' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#5AB87A' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'CLIENTS', value: '127', color: '#5AB87A' },
              { label: 'RENEWALS DUE', value: '14', color: '#D06060' },
              { label: 'PREMIUM', value: '$1.2M', color: '#5AB87A' },
              { label: 'COVERAGE GAPS', value: '43', color: '#20A0A0' },
            ].map((card, i) => (
              <div key={i} style={{ background: '#1C0F0A', borderRadius: '8px', padding: '14px', border: '1px solid #2E1A0E' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: card.color, marginBottom: '6px' }}>{card.label}</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: '#F5ECD7' }}>{card.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#1C0F0A', borderRadius: '8px', padding: '14px', border: '1px solid #2E1A0E' }}>
              <div style={{ fontSize: '12px', color: '#C9B99A', marginBottom: '8px' }}>Recent conversation</div>
              <div style={{ fontSize: '13px', color: '#F5ECD7', marginBottom: '4px' }}>📱 Lisa Tan · TechStart Pte Ltd</div>
              <div style={{ fontSize: '12px', color: '#C9B99A' }}>"We need to add 5 new employees to our group health plan"</div>
            </div>
            <div style={{ background: '#1C0F0A', borderRadius: '8px', padding: '14px', border: '1px solid #2E1A0E' }}>
              <div style={{ fontSize: '12px', color: '#C9B99A', marginBottom: '8px' }}>Maya auto-reply</div>
              <div style={{ fontSize: '13px', color: '#C8813A', marginBottom: '4px' }}>🤖 Maya</div>
              <div style={{ fontSize: '12px', color: '#C9B99A' }}>"Hi Lisa! I can help with that. Shall I send you the enrollment form?"</div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== PAIN POINTS ==================== */}
      <section style={{
        padding: '100px 24px', textAlign: 'center', position: 'relative', zIndex: 2,
        borderTop: '1px solid #2E1A0E',
      }}>
        <p style={{ fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase', color: '#C8813A', marginBottom: '20px' }}>
          THE PROBLEM
        </p>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 400, maxWidth: '700px', margin: '0 auto 60px', lineHeight: 1.2,
        }}>
          You're managing 50–200 clients with spreadsheets and memory.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
          {[
            { icon: '⏰', title: 'Renewals slip', desc: 'Policies expire. Revenue leaks. Clients lose trust.' },
            { icon: '🔍', title: 'Gaps go unseen', desc: 'Clients are underinsured. Upsell opportunities vanish.' },
            { icon: '🎂', title: 'Birthdays forgotten', desc: 'Relationships stay transactional. Competitors step in.' },
          ].map((item, i) => (
            <div key={i} style={{
              background: '#120A06', border: '1px solid #2E1A0E', borderRadius: '12px',
              padding: '32px 24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>{item.icon}</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: '#F5ECD7', marginBottom: '10px' }}>{item.title}</div>
              <div style={{ fontSize: '14px', color: '#C9B99A', lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        <p style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: '28px',
          color: '#C8813A', marginTop: '60px',
        }}>
          Maya fixes all three. Automatically.
        </p>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section style={{
        padding: '100px 24px', position: 'relative', zIndex: 2,
        borderTop: '1px solid #2E1A0E',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase', color: '#C8813A', marginBottom: '20px' }}>
            HOW IT WORKS
          </p>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 400, marginBottom: '60px', lineHeight: 1.2,
          }}>
            Three steps to a smarter practice.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
            {[
              { step: '01', title: 'Import your clients', desc: 'Upload your Excel or CSV. Maya maps names, policies, premiums, and renewals automatically.' },
              { step: '02', title: 'Maya connects on WhatsApp', desc: 'Maya joins your client chats. She greets, follows up, reminds — 24/7, in your voice.' },
              { step: '03', title: 'You close more deals', desc: 'While Maya handles the admin, you focus on what you do best — advising and selling.' },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '48px', color: '#2E1A0E', marginBottom: '16px' }}>{item.step}</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: '#F5ECD7', marginBottom: '10px' }}>{item.title}</div>
                <div style={{ fontSize: '14px', color: '#C9B99A', lineHeight: 1.7 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FEATURES ==================== */}
      <section style={{
        padding: '100px 24px', position: 'relative', zIndex: 2,
        borderTop: '1px solid #2E1A0E',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase', color: '#C8813A', marginBottom: '20px' }}>
            FEATURES
          </p>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 400, marginBottom: '60px', lineHeight: 1.2,
          }}>
            Everything an IFA needs. Nothing they don't.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              { icon: '📅', title: 'Renewal alerts', desc: '90-day advance warnings. Maya follows up with clients automatically.' },
              { icon: '🛡️', title: 'Coverage gaps', desc: 'Instantly see what each client is missing. Every gap is an opportunity.' },
              { icon: '🎂', title: 'Birthday greetings', desc: 'Maya sends personalized greetings. Your clients feel remembered.' },
              { icon: '📊', title: 'Analytics', desc: 'Total AUM, top clients, renewal pipeline, upsell potential — all in one view.' },
              { icon: '📱', title: 'WhatsApp native', desc: 'Maya lives where your clients already are. No apps to download.' },
              { icon: '🏢', title: 'Any client type', desc: 'Individuals, SMEs, corporates — Maya adapts her approach for each.' },
            ].map((item, i) => (
              <div key={i} style={{
                background: '#120A06', border: '1px solid #2E1A0E', borderRadius: '10px',
                padding: '28px 20px', textAlign: 'left',
              }}>
                <div style={{ fontSize: '24px', marginBottom: '12px' }}>{item.icon}</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#F5ECD7', marginBottom: '8px' }}>{item.title}</div>
                <div style={{ fontSize: '14px', color: '#C9B99A', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PRICING ==================== */}
      <section style={{
        padding: '100px 24px', position: 'relative', zIndex: 2,
        borderTop: '1px solid #2E1A0E',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase', color: '#C8813A', marginBottom: '20px' }}>
            PRICING
          </p>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 400, marginBottom: '16px', lineHeight: 1.2,
          }}>
            Simple, transparent pricing.
          </h2>
          <p style={{ fontSize: '16px', color: '#C9B99A', marginBottom: '60px' }}>
            Start free. Upgrade when you're ready.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              { plan: 'Solo', price: '29', desc: 'For independent IFAs', features: ['1 agent', 'Up to 100 clients', 'Maya AI assistant', 'Analytics dashboard', 'Email support'], popular: true },
              { plan: 'Pro', price: '79', desc: 'For growing practices', features: ['1 agent', 'Unlimited clients', 'Maya AI assistant', 'Advanced analytics', 'Priority support'], popular: false },
              { plan: 'Team', price: '199', desc: 'For agencies', features: ['Up to 5 agents', 'Unlimited clients', 'Maya AI assistant', 'Team dashboard', 'Dedicated support'], popular: false },
            ].map((item, i) => (
              <div key={i} style={{
                background: item.popular ? '#2A1810' : '#120A06',
                border: item.popular ? '2px solid #C8813A' : '1px solid #2E1A0E',
                borderRadius: '12px', padding: '36px 24px', textAlign: 'left',
                position: 'relative',
              }}>
                {item.popular && (
                  <div style={{
                    position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                    background: '#C8813A', color: '#120A06', fontSize: '11px', fontWeight: 700,
                    padding: '4px 16px', borderRadius: '20px', letterSpacing: '0.5px',
                  }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ fontSize: '14px', color: '#C9B99A', marginBottom: '8px' }}>{item.desc}</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: '#F5ECD7', marginBottom: '4px' }}>{item.plan}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '44px', color: '#F5ECD7' }}>${item.price}</span>
                  <span style={{ fontSize: '14px', color: '#C9B99A' }}>/month</span>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  {item.features.map((f, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ color: '#5AB87A', fontSize: '14px' }}>✓</span>
                      <span style={{ fontSize: '14px', color: '#C9B99A' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/trial" style={{
                  display: 'block', textAlign: 'center', textDecoration: 'none',
                  background: item.popular ? '#C8813A' : 'transparent',
                  color: item.popular ? '#120A06' : '#C8813A',
                  border: item.popular ? 'none' : '1px solid #C8813A',
                  padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
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
          fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 4vw, 48px)',
          fontWeight: 400, maxWidth: '600px', margin: '0 auto 32px', lineHeight: 1.2,
        }}>
          Your clients deserve better follow-ups.
        </h2>
        <p style={{ fontSize: '16px', color: '#C9B99A', marginBottom: '40px' }}>
          Join IFAs across Singapore who are growing their practice with Maya.
        </p>
        <Link href="/trial" style={{
          background: '#C8813A', color: '#120A06', textDecoration: 'none',
          padding: '16px 48px', borderRadius: '8px', fontSize: '16px', fontWeight: 700,
          letterSpacing: '0.5px', display: 'inline-block',
        }}>
          Start your 14-day free trial →
        </Link>
        <p style={{ fontSize: '13px', color: '#6B5444', marginTop: '16px' }}>
          No credit card required · Cancel anytime
        </p>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer style={{
        padding: '40px 48px', borderTop: '1px solid #2E1A0E',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', zIndex: 2,
      }}>
        <div>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#C8813A' }}>espresso.</span>
          <span style={{ fontSize: '13px', color: '#6B5444', marginLeft: '16px' }}>© 2026 Espresso Pte Ltd</span>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <Link href="/trial" style={{ color: '#6B5444', textDecoration: 'none', fontSize: '13px' }}>Start trial</Link>
          <Link href="/login" style={{ color: '#6B5444', textDecoration: 'none', fontSize: '13px' }}>Login</Link>
          <a href="mailto:hello@espresso.insure" style={{ color: '#6B5444', textDecoration: 'none', fontSize: '13px' }}>hello@espresso.insure</a>
        </div>
      </footer>
    </div>
  );
}
