import Link from 'next/link'

export default function HomePage() {

  const ICONS = {
    clock: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="#BA7517" strokeWidth="1.3"/><path d="M10 6v4l2.5 2.5" stroke="#BA7517" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    calendar: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="3" width="16" height="15" rx="2" stroke="#BA7517" strokeWidth="1.3"/><path d="M2 8h16M6 2v2M14 2v2" stroke="#BA7517" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    alert: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3L2 17h16L10 3z" stroke="#BA7517" strokeWidth="1.3" strokeLinejoin="round"/><path d="M10 9v4M10 14.5v.5" stroke="#BA7517" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    moon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 10.5A7 7 0 017.5 3 7 7 0 1015 10.5z" stroke="#BA7517" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
    chat: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1H6l-4 3V5a1 1 0 011-1z" stroke="#BA7517" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
    shield: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V5l7-3z" stroke="#BA7517" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
    doc: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="4" y="1" width="12" height="18" rx="1.5" stroke="#BA7517" strokeWidth="1.3"/><path d="M7 7h6M7 10h6M7 13h4" stroke="#BA7517" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    chart: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 15l4-5 4 3 4-6 3 2" stroke="#BA7517" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 18h14" stroke="#BA7517" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #F7F4F0; color: #1A1410; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
        a { color: inherit; text-decoration: none; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .pulse { animation: pulse 2s infinite; }
        nav a:hover { color: #BA7517; }
        .btn-primary:hover { opacity: 0.9; }
        .btn-outline:hover { background: #1A1410; color: #FFFFFF; }
        .feature-card:hover { border-color: #D4B896; transform: translateY(-1px); }
        .plan-card:hover { border-color: #D4B896; }
        .faq-item summary { cursor: pointer; list-style: none; }
        .faq-item summary::-webkit-details-marker { display: none; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(247,244,240,0.92)', backdropFilter: 'blur(12px)', borderBottom: '0.5px solid #E8E2DA', padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 400, color: '#1A1410' }}>
          espresso<span style={{ color: '#BA7517' }}>.</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {[['How it works', '#how-it-works'], ['Features', '#features'], ['Pricing', '#pricing'], ['Setup', '#setup']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#3D3532' }}>{label}</a>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/login" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#3D3532', padding: '7px 16px' }}>Login</Link>
          <Link href="/trial" style={{ background: '#BA7517', color: '#FFFFFF', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, padding: '8px 18px', borderRadius: 8 }} className="btn-primary">
            Start free trial
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '90px 40px 80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E1F5EE', border: '0.5px solid #9FE1CB', borderRadius: 100, padding: '5px 14px', marginBottom: 28 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1D9E75' }} className="pulse" />
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#0F6E56' }}>Now live in Singapore</span>
        </div>

        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 64, fontWeight: 400, color: '#1A1410', lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.01em' }}>
          Your AI back-office.<br />
          <em style={{ color: '#BA7517' }}>Inside WhatsApp.</em>
        </h1>

        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, color: '#5F5A57', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
          Maya handles intake, renewals, and claims — 24/7, inside the WhatsApp groups you already use.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Link href="/trial" style={{ background: '#BA7517', color: '#FFFFFF', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, padding: '13px 28px', borderRadius: 9, display: 'inline-block' }} className="btn-primary">
            Start 14-day free trial
          </Link>
          <a href="#how-it-works" style={{ background: 'transparent', color: '#3D3532', fontFamily: 'DM Sans, sans-serif', fontSize: 15, padding: '13px 24px', border: '0.5px solid #E8E2DA', borderRadius: 9, display: 'inline-block' }} className="btn-outline">
            See how it works
          </a>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, marginTop: 60, paddingTop: 48, borderTop: '0.5px solid #E8E2DA' }}>
          {[['24/7', 'Maya is always on'], ['<30 min', 'Setup to first client'], ['0', 'App downloads needed'], ['SGD 79', 'Per month to start']].map(([val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 400, color: '#1A1410' }}>{val}</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#9B9088', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHATSAPP DEMO CARD ── */}
      <section style={{ maxWidth: 420, margin: '0 auto 100px', padding: '0 40px' }}>
        <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 40px rgba(26,20,16,0.06)' }}>
          <div style={{ background: '#F7F4F0', padding: '12px 16px', borderBottom: '0.5px solid #E8E2DA', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FEF3E2', border: '1px solid #FAC775', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#854F0B' }}>M</div>
            <div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#1A1410' }}>Maya · Espresso</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#5F5A57' }}>AI assistant to David Tan</div>
            </div>
          </div>
          <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { from: 'client', text: 'Hi! I saw your ad — need insurance for my café.', time: '9:47 AM' },
              { from: 'maya', text: "Hi Sarah! Great to meet you. I'm Maya, David's assistant — I'll help get your café sorted. Can I ask a couple of quick questions first?", time: '9:47 AM' },
              { from: 'client', text: 'Sure, go ahead!', time: '9:48 AM' },
              { from: 'maya', text: 'How many staff do you currently have, including yourself?', time: '9:48 AM' },
              { from: 'client', text: '5 full-time, 2 part-time', time: '9:49 AM' },
            ].map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.from === 'client' ? 'flex-start' : 'flex-end' }}>
                <div style={{ maxWidth: '80%', background: m.from === 'maya' ? '#BA7517' : '#F1EFE8', borderRadius: m.from === 'maya' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', padding: '9px 12px' }}>
                  {m.from === 'maya' && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: 3 }}>Maya</div>}
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: m.from === 'maya' ? '#FFFFFF' : '#1A1410', lineHeight: 1.4 }}>{m.text}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: m.from === 'maya' ? 'rgba(255,255,255,0.6)' : '#9B9088', marginTop: 4, textAlign: 'right' }}>{m.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section style={{ background: '#1A1410', padding: '90px 40px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, textAlign: 'center' }}>The problem</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 400, color: '#F7F4F0', textAlign: 'center', marginBottom: 60, lineHeight: 1.15 }}>
            You're running a 500-client business<br /><em style={{ color: '#BA7517' }}>on WhatsApp and Excel.</em>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: '#2E1A0E' }}>
            {[
              { icon: 'clock', title: 'New enquiries go cold', body: 'Prospects message while you\'re busy. By the time you respond, they\'ve moved on.' },
              { icon: 'calendar', title: 'Renewals sneak up on you', body: 'You track renewals in spreadsheets and memory. One missed renewal is a client lost.' },
              { icon: 'alert', title: 'Claims catch you off guard', body: 'A client calls at 9pm in a panic. You scramble to find the policy and walk them through the process.' },
              { icon: 'moon', title: 'Evenings lost to admin', body: 'Follow-ups, recommendations, forms — all after hours, all unpaid, all keeping you from selling.' },
            ].map(p => (
              <div key={p.title} style={{ background: '#1A1410', padding: '32px 36px' }}>
                <div style={{ marginBottom: 12 }}>{ICONS[p.icon as keyof typeof ICONS]}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 500, color: '#F7F4F0', marginBottom: 8 }}>{p.title}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#9B9088', lineHeight: 1.6 }}>{p.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: '90px 40px', background: '#F7F4F0' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, textAlign: 'center' }}>How it works</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 400, color: '#1A1410', textAlign: 'center', marginBottom: 16, lineHeight: 1.15 }}>
            Three steps. <em style={{ color: '#BA7517' }}>30 minutes.</em> You're live.
          </h2>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, color: '#5F5A57', textAlign: 'center', marginBottom: 60 }}>No app to download. No platform to learn. Just WhatsApp.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { n: '01', title: 'Sign up and connect', body: 'Create your account, add Maya\'s number, upload your client list. Under 30 minutes.' },
              { n: '02', title: 'Add Maya to any client group', body: 'Create a WhatsApp group with your client and add Maya. She handles intake, follow-ups, and renewals from there.' },
              { n: '03', title: 'Check your dashboard, close deals', body: 'Review client briefs, renewals, and alerts in your dashboard. You sell. Maya handles the rest.' },
            ].map(s => (
              <div key={s.n} style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 12, padding: '28px 24px' }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: '#BA7517', marginBottom: 16 }}>{s.n}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 500, color: '#1A1410', marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#5F5A57', lineHeight: 1.6 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '90px 40px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, textAlign: 'center' }}>What Espresso does</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 400, color: '#1A1410', textAlign: 'center', marginBottom: 16, lineHeight: 1.15 }}>
            Everything you need. <em style={{ color: '#BA7517' }}>Nothing you don't.</em>
          </h2>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, color: '#5F5A57', textAlign: 'center', marginBottom: 60 }}>Built for the IFA who works alone but needs to perform like a full team.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { icon: 'chat', title: 'Client intake', body: 'Every new enquiry handled 24/7. Structured discovery, client brief on your dashboard — while you sleep.' },
              { icon: 'calendar', title: 'Renewal management', body: 'Every policy tracked. Renewals managed at 90, 60, 30, 14, and 7 days out. Never miss a follow-up.' },
              { icon: 'shield', title: 'Policy advisory', body: 'Clients ask coverage questions. Maya answers from their policy data — accurate, specific, instant.' },
              { icon: 'alert', title: 'Claims support', body: 'Maya guides clients through claims in real time, at any hour. You get an alert and full report.' },
              { icon: 'doc', title: 'Document management', body: 'Summaries, certificates, endorsements — always complete, always retrievable from your dashboard.' },
              { icon: 'chart', title: 'Quote comparison', body: 'Quotes ranked by quality, presented as a clear comparison. Hours of portal work — gone.' },
            ].map(f => (
              <div key={f.title} className="feature-card" style={{ background: '#FAFAF8', border: '0.5px solid #E8E2DA', borderRadius: 12, padding: '24px', transition: 'all 0.15s' }}>
                <div style={{ marginBottom: 12 }}>{ICONS[f.icon as keyof typeof ICONS]}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, color: '#1A1410', marginBottom: 6 }}>Maya — {f.title}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57', lineHeight: 1.6 }}>{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: '90px 40px', background: '#F7F4F0' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, textAlign: 'center' }}>Pricing</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 400, color: '#1A1410', textAlign: 'center', marginBottom: 16, lineHeight: 1.15 }}>
            Simple pricing. <em style={{ color: '#BA7517' }}>No hidden fees.</em>
          </h2>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#5F5A57', textAlign: 'center', marginBottom: 52 }}>Start free for 14 days. No credit card required. Cancel anytime.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { name: 'Solo', price: '79', period: '/month', tag: null, features: ['1 FA', '50 active clients', 'Maya AI — intake & renewals', 'Dashboard + client briefs', 'Policy CSV import', 'English & Mandarin', 'Email support'], cta: 'Start free trial', href: '/trial' },
              { name: 'Pro', price: '149', period: '/month', tag: 'Most popular', features: ['Everything in Solo', 'Unlimited clients', 'Claims + FNOL support', 'Coverage gap detection', 'Document management', 'Quote comparison', 'Priority support'], cta: 'Start free trial', href: '/trial' },
              { name: 'Team', price: '349', period: '/month', tag: 'Coming soon', features: ['Everything in Pro', 'Up to 5 FA seats', 'Shared dashboard', 'Team renewal calendar', 'Admin controls', 'Dedicated onboarding'], cta: 'Join waitlist', href: 'mailto:hello@espresso.insure?subject=Team plan waitlist' },
              { name: 'Agency', price: 'Custom', period: '/month', tag: null, features: ['Everything in Team', 'Unlimited FA seats', 'White-label Maya', 'API access', 'Custom onboarding', 'SLA + compliance', 'Multi-market support'], cta: 'Contact us', href: 'mailto:hello@espresso.insure' },
            ].map((plan, i) => (
              <div key={plan.name} className="plan-card" style={{ background: i === 1 ? '#1A1410' : '#FFFFFF', border: `0.5px solid ${i === 1 ? '#1A1410' : '#E8E2DA'}`, borderRadius: 14, padding: '28px 22px', position: 'relative', transition: 'all 0.15s', display: 'flex', flexDirection: 'column' }}>
                {plan.tag && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: plan.tag === 'Coming soon' ? '#5F5A57' : '#BA7517', color: '#FFFFFF', fontSize: 10, fontWeight: 500, padding: '3px 12px', borderRadius: 100, whiteSpace: 'nowrap' }}>
                    {plan.tag}
                  </div>
                )}
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, color: i === 1 ? '#F7F4F0' : '#1A1410', marginBottom: 8 }}>{plan.name}</div>
                <div style={{ marginBottom: 20 }}>
                  {plan.price === 'Custom' ? (
                    <>
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#5F5A57' }}>Tailored for</span><br/>
                      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 400, color: '#1A1410' }}>your agency</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: i === 1 ? '#C9B99A' : '#5F5A57' }}>SGD </span>
                      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 400, color: i === 1 ? '#F7F4F0' : '#1A1410' }}>{plan.price}</span>
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: i === 1 ? '#9B9088' : '#5F5A57' }}>{plan.period}</span>
                    </>
                  )}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: i === 1 ? '#C9B99A' : '#3D3532' }}>
                      <span style={{ color: i === 1 ? '#BA7517' : '#0F6E56', flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <a href={plan.href} style={{ display: 'block', textAlign: 'center', padding: '10px 0', background: i === 1 ? '#BA7517' : 'transparent', border: `0.5px solid ${i === 1 ? '#BA7517' : '#E8E2DA'}`, borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: i === 1 ? '#FFFFFF' : '#3D3532' }}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#9B9088', marginTop: 24 }}>
            All prices in SGD. Annual plans available at 2 months free. Need help choosing? <a href="mailto:hello@espresso.insure" style={{ color: '#BA7517' }}>Talk to us →</a>
          </p>
        </div>
      </section>

      {/* ── SETUP ── */}
      <section id="setup" style={{ padding: '90px 40px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, textAlign: 'center' }}>Setup guide</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 400, color: '#1A1410', textAlign: 'center', marginBottom: 16, lineHeight: 1.15 }}>
            From sign-up to <em style={{ color: '#BA7517' }}>first client</em> in 30 minutes.
          </h2>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#5F5A57', textAlign: 'center', marginBottom: 52 }}>If you use WhatsApp, you can use Espresso.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { n: '1', title: 'Create your Espresso account', body: 'Go to espresso.insure/trial, enter your name, email, and mobile number. Start with the 14-day free trial. No credit card needed.' },
              { n: '2', title: "Save Maya's number", body: "After sign-up, you'll receive Maya's WhatsApp number in your dashboard. Save it as Maya — Espresso. This is the number you add to client groups." },
              { n: '3', title: 'Upload your existing policies', body: 'In your dashboard, go to Clients → Import and upload a CSV of your current client policies. Maya immediately begins tracking all renewals.' },
              { n: '4', title: 'Create your first client group', body: 'Open WhatsApp. Create a new group with yourself and a client. Add Maya\'s number. She\'ll introduce herself and take over.' },
              { n: '5', title: 'Watch your dashboard fill up', body: 'Every client brief, renewal flag, and alert appears in your dashboard in real time. Log in once a day to stay on top of your entire book.' },
              { n: '6', title: 'Control Maya from the group', body: 'Type "Maya pause" to step in. Type "Maya take over" to hand back. Type "Maya brief me" for an instant client summary sent privately to you.' },
            ].map((s, i, arr) => (
              <div key={s.n} style={{ display: 'flex', gap: 20, paddingBottom: i < arr.length - 1 ? 32 : 0, marginBottom: i < arr.length - 1 ? 0 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FEF3E2', border: '1px solid #FAC775', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#854F0B', flexShrink: 0 }}>{s.n}</div>
                  {i < arr.length - 1 && <div style={{ width: 1, flex: 1, background: '#E8E2DA', marginTop: 8 }} />}
                </div>
                <div style={{ paddingBottom: i < arr.length - 1 ? 32 : 0, flex: 1 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, color: '#1A1410', marginBottom: 6, marginTop: 6 }}>{s.title}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#5F5A57', lineHeight: 1.6 }}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: '#F7F4F0', border: '0.5px solid #E8E2DA', borderRadius: 12, padding: '24px 28px', marginTop: 48 }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#1A1410', marginBottom: 14 }}>What you need to get started</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['A WhatsApp account (personal or business)', 'A smartphone with WhatsApp installed', 'An email address for your Espresso account', 'Your client policy list in any spreadsheet format', "That's it"].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#3D3532' }}>
                  <span style={{ color: '#0F6E56' }}>✓</span> {item}
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link href="/trial" style={{ background: '#BA7517', color: '#FFFFFF', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, padding: '13px 32px', borderRadius: 9, display: 'inline-block' }}>
              Start your free trial →
            </Link>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#9B9088', marginTop: 14 }}>
              Questions? Email <a href="mailto:hello@espresso.insure" style={{ color: '#BA7517' }}>hello@espresso.insure</a>
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '90px 40px', background: '#F7F4F0' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, textAlign: 'center' }}>FAQs</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 400, color: '#1A1410', textAlign: 'center', marginBottom: 52, lineHeight: 1.15 }}>
            Common questions from <em style={{ color: '#BA7517' }}>IFAs like you.</em>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { q: 'Do my clients know they\'re talking to an AI?', a: "Maya introduces herself as your AI assistant. She's warm, conversational, and helpful — clients experience her as a responsive assistant who works for you. You're always in the group and can jump in anytime." },
              { q: 'Do I need to ask my clients to download anything?', a: "No. Everything runs inside WhatsApp. You add Maya to a group with your client. No app, no account, no friction." },
              { q: 'Is my client data safe?', a: "Espresso never connects to any insurer's system. All client data is encrypted, isolated to your account, and stored in Singapore. We comply with PDPA. Your data is yours — we are your personal tool, not a data aggregator." },
              { q: 'What happens if Maya says something wrong?', a: 'You see every message in real time. Type "Maya pause" and she goes silent. Maya never makes product recommendations or commits to financial terms without your review.' },
              { q: "I'm a tied agent — can I still use Espresso?", a: "Absolutely. Even if you only sell one insurer's products, Maya adds enormous value through intake, renewal management, claims support, coverage gap detection, and document handling — all features that work regardless of which insurer you represent." },
              { q: 'Can I cancel anytime?', a: "Yes, completely. No lock-in. Cancel from your dashboard at any time. Your data remains accessible for 30 days after cancellation so you can export everything." },
              { q: 'Which markets does Espresso support?', a: "Espresso is live in Singapore. Malaysia and Philippines are launching in 2026, followed by Indonesia and Thailand. Email hello@espresso.insure for early access in other markets." },
            ].map((f, i, arr) => (
              <details key={f.q} className="faq-item" style={{ borderBottom: i < arr.length - 1 ? '0.5px solid #E8E2DA' : 'none' }}>
                <summary style={{ padding: '18px 0', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, color: '#1A1410', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  {f.q}
                  <span style={{ flexShrink: 0, color: '#BA7517', fontSize: 18 }}>+</span>
                </summary>
                <div style={{ paddingBottom: 18, fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#5F5A57', lineHeight: 1.7 }}>{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '90px 40px', background: '#1A1410', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 52, fontWeight: 400, color: '#F7F4F0', marginBottom: 16, lineHeight: 1.15 }}>
          Stop doing admin. <em style={{ color: '#BA7517' }}>Start building your book.</em>
        </h2>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, color: '#9B9088', marginBottom: 36 }}>
          14-day free trial. No credit card. Set up in 30 minutes. Maya starts working tonight.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Link href="/trial" style={{ background: '#BA7517', color: '#FFFFFF', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, padding: '13px 32px', borderRadius: 9, display: 'inline-block' }}>
            Start your free trial
          </Link>
          <Link href="/login" style={{ color: '#9B9088', fontFamily: 'DM Sans, sans-serif', fontSize: 14, padding: '13px 20px', display: 'inline-block' }}>
            Already on a plan? Sign in →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#120A06', padding: '40px', borderTop: '0.5px solid #2E1A0E' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 400, color: '#F7F4F0' }}>
            espresso<span style={{ color: '#BA7517' }}>.</span>
          </div>
          <div style={{ display: 'flex', gap: 28 }}>
            {[['How it works', '#how-it-works'], ['Pricing', '#pricing'], ['Setup', '#setup'], ['Contact', 'mailto:hello@espresso.insure'], ['Privacy', '#'], ['Terms', '#']].map(([label, href]) => (
              <a key={label} href={href} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#5F5A57' }}>{label}</a>
            ))}
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#5F5A57' }}>© 2026 Espresso</div>
        </div>
      </footer>
    </>
  )
}
