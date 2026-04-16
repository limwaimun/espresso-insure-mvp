import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>

      {/* ── NAV ── */}
      <nav style={{
        background: '#120A06', borderBottom: '1px solid #2E1A0E',
        padding: '16px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 500, letterSpacing: '0.08em', color: '#F5ECD7' }}>
          espresso<span style={{ color: '#C8813A' }}>.</span>insure
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <a href="#features" style={{ fontSize: 13, color: '#C9B99A', textDecoration: 'none' }}>Features</a>
          <a href="#how" style={{ fontSize: 13, color: '#C9B99A', textDecoration: 'none' }}>How it works</a>
          <a href="#pricing" style={{ fontSize: 13, color: '#C9B99A', textDecoration: 'none' }}>Pricing</a>
          <Link href="/trial" style={{
            background: '#C8813A', color: '#120A06', border: 'none',
            padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', textDecoration: 'none',
          }}>Start free trial</Link>
        </div>
      </nav>

      {/* ── HERO — DARK ── */}
      <section style={{ background: '#1C0F0A', padding: '96px 48px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 50% at 85% 30%, rgba(200,129,58,0.12) 0%, transparent 65%), radial-gradient(ellipse 40% 40% at 5% 85%, rgba(200,129,58,0.06) 0%, transparent 60%)',
        }} />
        <div style={{ position: 'relative', maxWidth: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C8813A', marginBottom: 28 }}>
            <span style={{ width: 24, height: 1, background: '#C8813A', display: 'inline-block' }} />
            AI back-office for Financial Advisors
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 72, fontWeight: 300, lineHeight: 0.95, letterSpacing: '-0.02em', color: '#F5ECD7', marginBottom: 20 }}>
            Run a 200-client<br />
            <em style={{ fontStyle: 'italic', color: '#E8A55A', display: 'block' }}>practice. Solo.</em>
          </h1>
          <p style={{ fontSize: 17, color: '#C9B99A', lineHeight: 1.7, marginBottom: 36, fontWeight: 300, maxWidth: 480 }}>
            Espresso gives every Financial Advisor the power of a full brokerage — handling renewals, claims, and client service 24/7, inside the WhatsApp groups you already use.
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/trial" style={{
              background: '#C8813A', color: '#120A06', border: 'none',
              padding: '12px 28px', borderRadius: 6, fontSize: 15, fontWeight: 500,
              cursor: 'pointer', textDecoration: 'none',
            }}>Start 14-day free trial</Link>
            <a href="#how" style={{
              background: 'transparent', color: '#F5ECD7',
              border: '1px solid rgba(245,236,215,0.3)',
              padding: '12px 24px', borderRadius: 6, fontSize: 14,
              cursor: 'pointer', textDecoration: 'none',
            }}>See how it works</a>
          </div>
          <p style={{ fontSize: 12, color: '#6B4C3A', marginTop: 14 }}>No credit card required · Solo plan from $29/mo</p>
        </div>
      </section>

      {/* ── STATS — DARK ── */}
      <section style={{ background: '#1C0F0A', padding: '0 48px 72px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {[
            { num: '200+', label: 'clients per advisor, managed solo' },
            { num: '24/7', label: 'Maya active in your client groups' },
            { num: '14', label: 'day free trial, no card needed' },
          ].map(s => (
            <div key={s.num} style={{ background: '#3D2215', borderRadius: 8, padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 52, fontWeight: 300, color: '#E8A55A', lineHeight: 1, marginBottom: 6 }}>{s.num}</div>
              <div style={{ fontSize: 13, color: '#C9B99A' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES — LIGHT ── */}
      <section id="features" style={{ background: '#FDFAF5', padding: '72px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C8813A', marginBottom: 14 }}>
            <span style={{ width: 24, height: 1, background: '#C8813A', display: 'inline-block' }} />
            What Espresso does
            <span style={{ width: 24, height: 1, background: '#C8813A', display: 'inline-block' }} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 300, lineHeight: 1, color: '#1C0F0A', marginBottom: 12 }}>
            Everything you need.<br />
            <em style={{ fontStyle: 'italic', color: '#C8813A' }}>Nothing you don't.</em>
          </h2>
          <p style={{ fontSize: 15, color: '#7A6050', lineHeight: 1.7, margin: '0 auto' }}>
            Built for the Financial Advisor who works alone but needs to perform like a full team.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>

          {/* Card 1 */}
          <div style={{ background: '#FDFAF5', border: '1px solid #E8D5B8', borderRadius: 12, padding: '28px 24px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C8813A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: '#1C0F0A', margin: '14px 0 6px' }}>Client conversations</div>
            <div style={{ fontSize: 13, color: '#7A6050', lineHeight: 1.65 }}>Maya responds to client WhatsApp messages automatically — in your voice, within your active hours.</div>
          </div>

          {/* Card 2 */}
          <div style={{ background: '#FDFAF5', border: '1px solid #E8D5B8', borderRadius: 12, padding: '28px 24px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C8813A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: '#1C0F0A', margin: '14px 0 6px' }}>Renewal management</div>
            <div style={{ fontSize: 13, color: '#7A6050', lineHeight: 1.65 }}>Maya alerts you 90 days out and follows up with clients automatically. No renewal slips through.</div>
          </div>

          {/* Card 3 */}
          <div style={{ background: '#FDFAF5', border: '1px solid #E8D5B8', borderRadius: 12, padding: '28px 24px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C8813A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: '#1C0F0A', margin: '14px 0 6px' }}>Claims processing</div>
            <div style={{ fontSize: 13, color: '#7A6050', lineHeight: 1.65 }}>Maya detects claim situations, identifies the right insurer form, and pre-fills it with client data for your review.</div>
          </div>

          {/* Card 4 */}
          <div style={{ background: '#F5ECD7', border: '1px solid #E8D5B8', borderRadius: 12, padding: '28px 24px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C8813A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: '#1C0F0A', margin: '14px 0 6px' }}>Coverage gap detection</div>
            <div style={{ fontSize: 13, color: '#7A6050', lineHeight: 1.65 }}>Maya spots what each client is missing and surfaces upsell opportunities naturally at the right moment.</div>
          </div>

          {/* Card 5 */}
          <div style={{ background: '#F5ECD7', border: '1px solid #E8D5B8', borderRadius: 12, padding: '28px 24px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C8813A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: '#1C0F0A', margin: '14px 0 6px' }}>Dashboard & analytics</div>
            <div style={{ fontSize: 13, color: '#7A6050', lineHeight: 1.65 }}>Your full book of business in one view. Alerts, renewals, claims, and client health — at a glance.</div>
          </div>

          {/* Card 6 */}
          <div style={{ background: '#F5ECD7', border: '1px solid #E8D5B8', borderRadius: 12, padding: '28px 24px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C8813A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: '#1C0F0A', margin: '14px 0 6px' }}>Birthday greetings</div>
            <div style={{ fontSize: 13, color: '#7A6050', lineHeight: 1.65 }}>Maya remembers every client's birthday and sends a personalised message — strengthening the relationship.</div>
          </div>

        </div>
      </section>

      {/* ── HOW IT WORKS — CREAM ── */}
      <section id="how" style={{ background: '#F5ECD7', padding: '72px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C8813A', marginBottom: 14 }}>
            <span style={{ width: 24, height: 1, background: '#C8813A', display: 'inline-block' }} />
            How it works
            <span style={{ width: 24, height: 1, background: '#C8813A', display: 'inline-block' }} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 300, lineHeight: 1, color: '#1C0F0A' }}>
            Up and running<br />
            <em style={{ fontStyle: 'italic', color: '#C8813A' }}>in minutes.</em>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            {[
              { n: '01', title: 'Sign up and import your clients', desc: 'Upload your client list via Excel or CSV. Espresso maps the columns and loads your book in seconds.' },
              { n: '02', title: 'Connect Maya to WhatsApp', desc: 'Maya joins a WhatsApp group with you and each client. One group per client. She\'s always there, respecting your hours.' },
              { n: '03', title: 'Maya goes to work', desc: 'Renewals, claims, coverage gaps, birthday greetings — Maya handles it all. You stay in control of every decision.' },
              { n: '04', title: 'Watch your book grow', desc: 'With the admin handled, you have time to advise, acquire, and build the practice you always wanted.' },
            ].map((s, i, arr) => (
              <div key={s.n} style={{ display: 'flex', gap: 20, alignItems: 'flex-start', padding: '22px 0', borderBottom: i < arr.length - 1 ? '1px solid #E8D5B8' : 'none' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#C8813A', letterSpacing: '0.08em', minWidth: 28, paddingTop: 2 }}>{s.n}</div>
                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: '#1C0F0A', marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: '#7A6050', lineHeight: 1.65 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* WhatsApp mockup */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: '#1C0F0A', border: '1px solid #2E1A0E', borderRadius: 16, overflow: 'hidden', width: '100%', maxWidth: 300 }}>
              <div style={{ background: '#120A06', borderBottom: '1px solid #2E1A0E', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#5AB87A' }} />
                <span style={{ fontSize: 12, color: '#F5ECD7', fontWeight: 500 }}>Amanda · Maya · Wai Mun</span>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ alignSelf: 'flex-end', maxWidth: '75%', background: '#1A3A2A', border: '1px solid #2A5A3A', borderRadius: '14px 14px 3px 14px', padding: '9px 13px', fontSize: 12, color: '#F5ECD7', lineHeight: 1.5 }}>
                  Hi, when does my policy expire?
                </div>
                <div style={{ alignSelf: 'flex-start', maxWidth: '82%' }}>
                  <div style={{ fontSize: 9, color: '#C8813A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Maya</div>
                  <div style={{ background: '#3D2215', border: '1px solid rgba(200,129,58,0.2)', borderRadius: '3px 14px 14px 14px', padding: '9px 13px', fontSize: 12, color: '#F5ECD7', lineHeight: 1.5 }}>
                    Hi Amanda! Your Great Eastern Life policy renews in 46 days. Everything looks good — shall I ask Wai Mun to walk you through any changes?
                  </div>
                </div>
                <div style={{ alignSelf: 'flex-end', maxWidth: '75%', background: '#1A3A2A', border: '1px solid #2A5A3A', borderRadius: '14px 14px 3px 14px', padding: '9px 13px', fontSize: 12, color: '#F5ECD7', lineHeight: 1.5 }}>
                  Yes please. Also I was in an accident last week
                </div>
                <div style={{ alignSelf: 'flex-start', maxWidth: '82%' }}>
                  <div style={{ fontSize: 9, color: '#C8813A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Maya</div>
                  <div style={{ background: '#3D2215', border: '1px solid rgba(200,129,58,0.2)', borderRadius: '3px 14px 14px 14px', padding: '9px 13px', fontSize: 12, color: '#F5ECD7', lineHeight: 1.5 }}>
                    I'm sorry to hear that — are you okay? I can see your Motor policy with NTUC Income. I'll start preparing the claim form. Can you share what happened and any photos when ready?
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAYA — DARK ── */}
      <section style={{ background: '#1C0F0A', padding: '72px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C8813A', marginBottom: 14 }}>
            <span style={{ width: 24, height: 1, background: '#C8813A', display: 'inline-block' }} />
            Meet Maya
            <span style={{ width: 24, height: 1, background: '#C8813A', display: 'inline-block' }} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, fontWeight: 300, lineHeight: 1, color: '#F5ECD7' }}>
            Your AI assistant,<br />
            <em style={{ fontStyle: 'italic', color: '#E8A55A' }}>inside WhatsApp.</em>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 15, color: '#C9B99A', lineHeight: 1.75, marginBottom: 28 }}>
              Maya lives in a WhatsApp group with you and each client. She speaks in your voice, works your hours, and never makes a move without your approval.
            </p>
            {[
              { title: 'Always in your voice', desc: "Clients feel they're talking to your team, not a chatbot." },
              { title: 'You stay in control', desc: 'Maya supports. You advise. Every decision stays with you.' },
              { title: 'Configurable to your practice', desc: 'Set her hours, welcome message, and which insurers she favours.' },
            ].map(item => (
              <div key={item.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8813A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 3 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <div>
                  <div style={{ fontSize: 14, color: '#F5ECD7', fontWeight: 500, marginBottom: 2 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: '#C9B99A', lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: '#3D2215', border: '1px solid rgba(200,129,58,0.25)', borderRadius: 16, padding: 28, maxWidth: 280, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #2E1A0E' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1C0F0A', border: '1px solid #C8813A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#C8813A' }}>M</div>
                <div>
                  <div style={{ fontSize: 13, color: '#F5ECD7', fontWeight: 500 }}>Maya</div>
                  <div style={{ fontSize: 11, color: '#5AB87A' }}>Active · 9am–6pm</div>
                </div>
              </div>
              {['Auto-reply', 'Renewal reminders', 'Coverage gap alerts', 'Birthday greetings'].map(label => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 12, color: '#C9B99A' }}>{label}</span>
                  <div style={{ width: 36, height: 20, borderRadius: 100, background: '#C8813A', position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', right: 2, top: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING — LIGHT ── */}
      <section id="pricing" style={{ background: '#FDFAF5', padding: '72px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C8813A', marginBottom: 14 }}>
            <span style={{ width: 24, height: 1, background: '#C8813A', display: 'inline-block' }} />
            Pricing
            <span style={{ width: 24, height: 1, background: '#C8813A', display: 'inline-block' }} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 300, lineHeight: 1, color: '#1C0F0A', marginBottom: 12 }}>
            Simple pricing.<br />
            <em style={{ fontStyle: 'italic', color: '#C8813A' }}>No surprises.</em>
          </h2>
          <p style={{ fontSize: 15, color: '#7A6050' }}>14-day free trial on all plans. No credit card required.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            {
              name: 'Solo', price: '$29', badge: 'Solo', featured: false,
              desc: 'For the independent Financial Advisor building a serious practice alone.',
              features: ['Up to 100 clients', 'Maya on WhatsApp', 'Renewals & claims', 'Dashboard & alerts'],
            },
            {
              name: 'Pro', price: '$79', badge: 'Most popular', featured: true,
              desc: 'For the established Financial Advisor ready to scale to 200+ clients.',
              features: ['Up to 200 clients', 'Everything in Solo', 'Analytics & insights', 'Priority support'],
            },
            {
              name: 'Team', price: '$199', badge: 'Team', featured: false,
              desc: 'For Financial Advisor teams and small brokerages growing together.',
              features: ['Up to 5 advisors', 'Everything in Pro', 'Shared client book', 'Team analytics'],
            },
          ].map(plan => (
            <div key={plan.name} style={{
              background: '#FDFAF5',
              border: plan.featured ? '2px solid #C8813A' : '1px solid #E8D5B8',
              borderRadius: 12, padding: '28px 24px',
            }}>
              <div style={{ display: 'inline-block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C8813A', background: 'rgba(200,129,58,0.08)', border: '1px solid rgba(200,129,58,0.25)', borderRadius: 100, padding: '3px 10px', marginBottom: 16 }}>{plan.badge}</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 400, color: '#1C0F0A', marginBottom: 4 }}>{plan.name}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 32, color: '#C8813A', marginBottom: 4 }}>
                {plan.price}<span style={{ fontSize: 14, color: '#7A6050' }}>/mo</span>
              </div>
              <div style={{ fontSize: 12, color: '#7A6050', marginBottom: 20, lineHeight: 1.5 }}>{plan.desc}</div>
              <hr style={{ border: 'none', borderTop: '1px solid #E8D5B8', marginBottom: 16 }} />
              {plan.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#3D2215', marginBottom: 8, lineHeight: 1.4 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C8813A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {f}
                </div>
              ))}
              <Link href="/trial" style={{
                display: 'block', marginTop: 20, textAlign: 'center',
                background: plan.featured ? '#C8813A' : 'transparent',
                color: plan.featured ? '#120A06' : '#C8813A',
                border: `1px solid ${plan.featured ? '#C8813A' : '#C8813A'}`,
                padding: '10px 0', borderRadius: 6, fontSize: 13, fontWeight: 500,
                textDecoration: 'none',
              }}>Start free trial</Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA — DARK ── */}
      <section style={{ background: '#1C0F0A', padding: '80px 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C8813A', marginBottom: 24 }}>
            <span style={{ width: 24, height: 1, background: '#C8813A', display: 'inline-block' }} />
            Get started today
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 52, fontWeight: 300, lineHeight: 1, color: '#F5ECD7', marginBottom: 16 }}>
            Your practice.<br />
            <em style={{ fontStyle: 'italic', color: '#E8A55A' }}>Fully covered.</em>
          </h2>
          <p style={{ fontSize: 15, color: '#C9B99A', lineHeight: 1.75, marginBottom: 32 }}>
            Join Financial Advisors in Singapore who are running bigger books with less admin — and still delivering the personal service their clients expect.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/trial" style={{
              background: '#C8813A', color: '#120A06', border: 'none',
              padding: '12px 28px', borderRadius: 6, fontSize: 15, fontWeight: 500,
              cursor: 'pointer', textDecoration: 'none',
            }}>Start 14-day free trial</Link>
            <a href="mailto:hello@espresso.insure" style={{
              background: 'transparent', color: '#F5ECD7',
              border: '1px solid rgba(245,236,215,0.3)',
              padding: '12px 24px', borderRadius: 6, fontSize: 14,
              cursor: 'pointer', textDecoration: 'none',
            }}>Book a demo</a>
          </div>
          <p style={{ fontSize: 12, color: '#6B4C3A', marginTop: 16 }}>No credit card · Cancel anytime · Singapore-based support</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0A0604', borderTop: '1px solid #2E1A0E', padding: '28px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 400, color: '#C9B99A', letterSpacing: '0.08em' }}>
          espresso<span style={{ color: '#C8813A' }}>.</span>insure
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="mailto:hello@espresso.insure" style={{ fontSize: 12, color: '#6B4C3A', textDecoration: 'none' }}>hello@espresso.insure</a>
          <span style={{ fontSize: 12, color: '#6B4C3A' }}>© 2026 Espresso · Singapore</span>
        </div>
      </footer>

    </div>
  )
}
