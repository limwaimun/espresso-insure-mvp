import Link from 'next/link'

export default function HomePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        html, body { background: #F7F4F0 !important; color: #1A1410; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
        a { color: inherit; text-decoration: none; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .lp-nav-link:hover { color: #BA7517; transition: color 0.15s; }
        .lp-btn-primary { background: #BA7517; color: #FFFFFF; border: none; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer; transition: opacity 0.15s; }
        .lp-btn-primary:hover { opacity: 0.9; }
        .lp-btn-outline { background: transparent; color: #3D3532; border: 0.5px solid #E8E2DA; border-radius: 8px; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s; }
        .lp-btn-outline:hover { background: #1A1410; color: #FFFFFF; border-color: #1A1410; }
        .lp-card { background: #FFFFFF; border: 0.5px solid #E8E2DA; border-radius: 12px; }
        .lp-feature:hover { border-color: #D4B896; transform: translateY(-2px); transition: all 0.15s; }
        .lp-faq summary { cursor: pointer; list-style: none; }
        .lp-faq summary::-webkit-details-marker { display: none; }

        /* ── Mobile responsive ── */
        .lp-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .lp-grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .lp-grid2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; background: #2E1A0E; }
        .lp-stats { display: flex; justify-content: center; gap: 48px; }
        .lp-hero-btns { display: flex; gap: 10px; justify-content: center; align-items: center; }
        .lp-nav-links { display: flex; gap: 24px; }
        .lp-nav-actions { display: flex; gap: 8px; align-items: center; }
        .lp-demo-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 20px; }
        .lp-section-inner { max-width: 960px; margin: 0 auto; }
        .lp-hero-inner { max-width: 860px; margin: 0 auto; text-align: center; }
        .lp-h1 { font-family: 'Cormorant Garamond', serif; font-size: 58px; font-weight: 400; color: #1A1410; line-height: 1.1; margin: 0 0 20px; letter-spacing: -0.01em; }
        .lp-h2 { font-family: 'Cormorant Garamond', serif; font-weight: 400; color: #1A1410; line-height: 1.15; text-align: center; margin: 0 0 12px; }

        @media (max-width: 768px) {
          .lp-nav-links { display: none; }
          .lp-nav-actions .lp-login { display: none; }
          .lp-h1 { font-size: 36px; }
          .lp-h2 { font-size: 32px !important; }
          .lp-grid3 { grid-template-columns: 1fr; }
          .lp-grid4 { grid-template-columns: 1fr 1fr; }
          .lp-grid2 { grid-template-columns: 1fr; }
          .lp-stats { flex-wrap: wrap; gap: 24px; }
          .lp-stats > div { width: 40%; text-align: center; }
          .lp-hero-btns { flex-direction: column; align-items: stretch; }
          .lp-hero-btns button, .lp-hero-btns a { text-align: center; width: 100%; }
          .lp-demo-tabs { grid-template-columns: 1fr; }
          .lp-section-pad { padding: 56px 20px !important; }
          .lp-hero-pad { padding: 48px 20px 40px !important; }
          .lp-nav-pad { padding: 0 20px !important; }
          .lp-footer-inner { flex-direction: column; gap: 16px; text-align: center; }
          .lp-footer-links { flex-wrap: wrap; justify-content: center; }
          .lp-cta-h2 { font-size: 32px !important; }
          .lp-setup-step { flex-direction: column; gap: 12px; }
        }

        @media (max-width: 480px) {
          .lp-grid4 { grid-template-columns: 1fr; }
          .lp-stats > div { width: 45%; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(247,244,240,0.95)', backdropFilter: 'blur(12px)', borderBottom: '0.5px solid #E8E2DA' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }} className="lp-nav-pad">
          <a href="/" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 400, color: '#1A1410' }}>
            espresso<span style={{ color: '#BA7517' }}>.</span>
          </a>
          <div className="lp-nav-links">
            {[['How it works', '#how-it-works'], ['Features', '#features'], ['Pricing', '#pricing'], ['Setup', '#setup']].map(([l, h]) => (
              <a key={l} href={h} className="lp-nav-link" style={{ fontSize: 13, color: '#3D3532' }}>{l}</a>
            ))}
          </div>
          <div className="lp-nav-actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/login" className="lp-login" style={{ fontSize: 13, color: '#3D3532', padding: '7px 14px' }}>Login</Link>
            <Link href="/trial" className="lp-btn-primary" style={{ fontSize: 13, padding: '8px 18px', display: 'inline-block', borderRadius: 8, fontWeight: 500 }}>
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background: '#F7F4F0' }}>
        <div className="lp-hero-inner lp-hero-pad" style={{ padding: '40px 32px 52px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E1F5EE', border: '0.5px solid #9FE1CB', borderRadius: 100, padding: '5px 14px', marginBottom: 24 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1D9E75' }} />
            <span style={{ fontSize: 12, color: '#0F6E56' }}>Now live in Singapore</span>
          </div>
          <h1 className="lp-h1">
            Your AI back-office.<br />
            <em style={{ color: '#BA7517' }}>Inside WhatsApp.</em>
          </h1>
          <p style={{ fontSize: 17, color: '#5F5A57', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Maya handles intake, renewals, and claims — 24/7, inside the WhatsApp groups you already use with clients.
          </p>
          <div className="lp-hero-btns">
            <Link href="/trial" className="lp-btn-primary" style={{ fontSize: 15, padding: '13px 28px', display: 'inline-block', borderRadius: 9 }}>
              Start 14-day free trial
            </Link>
            <a href="#how-it-works" className="lp-btn-outline" style={{ fontSize: 15, padding: '13px 22px', display: 'inline-block', borderRadius: 9 }}>
              See how it works
            </a>
          </div>
          <div className="lp-stats" style={{ marginTop: 56, paddingTop: 44, borderTop: '0.5px solid #E8E2DA' }}>
            {[['24/7', 'Maya is always on'], ['<30 min', 'Setup to first client'], ['0', 'App downloads needed'], ['SGD 79', 'Per month to start']].map(([v, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, color: '#1A1410' }}>{v}</div>
                <div style={{ fontSize: 11, color: '#9B9088', marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHATSAPP GROUP DEMOS ── */}
      <section style={{ background: '#F7F4F0' }}>
        <div className="lp-section-inner lp-section-pad" style={{ padding: '0 32px 80px' }}>
          <p style={{ fontSize: 13, color: '#5F5A57', textAlign: 'center', marginBottom: 20 }}>Maya works inside your existing WhatsApp groups — with you and your client together</p>

          {/* Tab labels */}
          <div className="lp-demo-tabs" style={{ maxWidth: 680, margin: '0 auto 24px' }}>
            {['New enquiry', 'Renewal follow-up', 'Claims support'].map((label, i) => (
              <div key={label} style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '8px 12px', textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#3D3532' }}>
                {label}
              </div>
            ))}
          </div>

          {/* Three chat cards */}
          <div className="lp-grid3" style={{ maxWidth: 1100, margin: '0 auto' }}>

            {/* 1. New enquiry */}
            <div className="lp-card" style={{ overflow: 'hidden', boxShadow: '0 4px 20px rgba(26,20,16,0.06)' }}>
              <div style={{ background: '#F7F4F0', padding: '10px 14px', borderBottom: '0.5px solid #E8E2DA' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#1A1410', marginBottom: 1 }}>Sarah's café — insurance group</div>
                <div style={{ fontSize: 10, color: '#9B9088' }}>David Tan · Sarah Lim · Maya</div>
              </div>
              <div style={{ padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { from: 'client', name: 'Sarah', text: 'Hi David, saw your ad. Need insurance for my café.' },
                  { from: 'maya', text: "Hi Sarah! I'm Maya, David's assistant. Let me help. How many staff do you have?" },
                  { from: 'client', name: 'Sarah', text: '5 full-time, 2 part-time. We also do catering.' },
                  { from: 'maya', text: "Got it. I'll prepare a full brief for David — expect a call today!" },
                  { from: 'fa', name: 'David', text: "Thanks Maya. Sarah, I'll call you at 3pm!" },
                ].map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: m.from === 'fa' || m.from === 'maya' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '82%', background: m.from === 'maya' ? '#BA7517' : m.from === 'fa' ? '#FEF3E2' : '#F1EFE8', borderRadius: m.from === 'client' ? '10px 10px 10px 2px' : '10px 10px 2px 10px', padding: '7px 10px', border: m.from === 'fa' ? '0.5px solid #FAC775' : 'none' }}>
                      {(m as any).name && <div style={{ fontSize: 9, fontWeight: 500, color: m.from === 'maya' ? 'rgba(255,255,255,0.7)' : m.from === 'fa' ? '#854F0B' : '#5F5A57', marginBottom: 2 }}>{(m as any).name || 'Maya'}</div>}
                      {m.from === 'maya' && <div style={{ fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>Maya</div>}
                      <div style={{ fontSize: 12, color: m.from === 'maya' ? '#FFFFFF' : '#1A1410', lineHeight: 1.4 }}>{m.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#E1F5EE', padding: '8px 12px', borderTop: '0.5px solid #9FE1CB' }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#0F6E56' }}>✓ Client brief sent to your dashboard</div>
              </div>
            </div>

            {/* 2. Renewal */}
            <div className="lp-card" style={{ overflow: 'hidden', boxShadow: '0 4px 20px rgba(26,20,16,0.06)' }}>
              <div style={{ background: '#F7F4F0', padding: '10px 14px', borderBottom: '0.5px solid #E8E2DA' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#1A1410', marginBottom: 1 }}>Kevin's health plan group</div>
                <div style={{ fontSize: 10, color: '#9B9088' }}>David Tan · Kevin Teo · Maya</div>
              </div>
              <div style={{ padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { from: 'maya', text: 'Hi Kevin! Your Great Eastern health plan renews on 21 April — just 10 days away.' },
                  { from: 'client', name: 'Kevin', text: 'Oh wow, thanks for the heads up. Any better options?' },
                  { from: 'maya', text: "I've compared 3 plans. Prudential's plan saves ~$400/yr with better coverage. I'll send David the full comparison." },
                  { from: 'fa', name: 'David', text: "Kevin, I'll call you tomorrow to go through the options!" },
                  { from: 'client', name: 'Kevin', text: 'Perfect, thanks David!' },
                ].map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: m.from === 'fa' || m.from === 'maya' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '82%', background: m.from === 'maya' ? '#BA7517' : m.from === 'fa' ? '#FEF3E2' : '#F1EFE8', borderRadius: m.from === 'client' ? '10px 10px 10px 2px' : '10px 10px 2px 10px', padding: '7px 10px', border: m.from === 'fa' ? '0.5px solid #FAC775' : 'none' }}>
                      {(m as any).name && <div style={{ fontSize: 9, fontWeight: 500, color: m.from === 'maya' ? 'rgba(255,255,255,0.7)' : m.from === 'fa' ? '#854F0B' : '#5F5A57', marginBottom: 2 }}>{(m as any).name}</div>}
                      {m.from === 'maya' && !(m as any).name && <div style={{ fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>Maya</div>}
                      <div style={{ fontSize: 12, color: m.from === 'maya' ? '#FFFFFF' : '#1A1410', lineHeight: 1.4 }}>{m.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#FEF3E2', padding: '8px 12px', borderTop: '0.5px solid #FAC775' }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#854F0B' }}>✓ Comparison report ready in dashboard</div>
              </div>
            </div>

            {/* 3. Claims */}
            <div className="lp-card" style={{ overflow: 'hidden', boxShadow: '0 4px 20px rgba(26,20,16,0.06)' }}>
              <div style={{ background: '#F7F4F0', padding: '10px 14px', borderBottom: '0.5px solid #E8E2DA' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#1A1410', marginBottom: 1 }}>Priya's accident claim group</div>
                <div style={{ fontSize: 10, color: '#9B9088' }}>David Tan · Priya Nair · Maya</div>
              </div>
              <div style={{ padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { from: 'client', name: 'Priya', text: 'David! I was in an accident. What do I do for the claim?' },
                  { from: 'maya', text: "Priya, I'm so sorry. Don't worry — I'll guide you through this. First, please send a photo of the damage and the police report." },
                  { from: 'client', name: 'Priya', text: '📎 photo_damage.jpg  📎 police_report.pdf' },
                  { from: 'maya', text: "Got them — I've saved both to your claim file. David will pre-fill the AIA form for you. Sit tight!" },
                  { from: 'fa', name: 'David', text: "Priya, form is ready. I'll submit it by end of today." },
                ].map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: m.from === 'fa' || m.from === 'maya' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '82%', background: m.from === 'maya' ? '#BA7517' : m.from === 'fa' ? '#FEF3E2' : '#F1EFE8', borderRadius: m.from === 'client' ? '10px 10px 10px 2px' : '10px 10px 2px 10px', padding: '7px 10px', border: m.from === 'fa' ? '0.5px solid #FAC775' : 'none' }}>
                      {(m as any).name && <div style={{ fontSize: 9, fontWeight: 500, color: m.from === 'fa' ? '#854F0B' : '#5F5A57', marginBottom: 2 }}>{(m as any).name}</div>}
                      {m.from === 'maya' && <div style={{ fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>Maya</div>}
                      <div style={{ fontSize: 12, color: m.from === 'maya' ? '#FFFFFF' : '#1A1410', lineHeight: 1.4 }}>{m.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#FCEBEB', padding: '8px 12px', borderTop: '0.5px solid #F7C1C1' }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#A32D2D' }}>✓ Attachments + claim alert in dashboard</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section style={{ background: '#1A1410' }}>
        <div className="lp-section-inner lp-section-pad" style={{ padding: '80px 32px' }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, textAlign: 'center' }}>The problem</p>
          <h2 className="lp-h2" style={{ fontSize: 44, color: '#F7F4F0', marginBottom: 48 }}>
            You're running a 500-client business<br /><em style={{ color: '#BA7517' }}>on WhatsApp and Excel.</em>
          </h2>
          <div className="lp-grid2">
            {[
              { title: 'New enquiries go cold', body: 'Prospects message while you\'re busy. By the time you respond, they\'ve moved on.' },
              { title: 'Renewals sneak up on you', body: 'You track renewals in spreadsheets and memory. One missed renewal is a client lost.' },
              { title: 'Claims catch you off guard', body: 'A client calls at 9pm in a panic. You scramble to find the policy and walk them through the process.' },
              { title: 'Evenings lost to admin', body: 'Follow-ups, recommendations, forms — all after hours, all unpaid, all keeping you from selling.' },
            ].map((p, i) => (
              <div key={p.title} style={{ background: '#1A1410', padding: '28px 32px' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#BA7517', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: '#FFFFFF', marginBottom: 12 }}>{i + 1}</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: '#F7F4F0', marginBottom: 6 }}>{p.title}</div>
                <div style={{ fontSize: 13, color: '#9B9088', lineHeight: 1.65 }}>{p.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ background: '#F7F4F0' }}>
        <div className="lp-section-inner lp-section-pad" style={{ padding: '80px 32px' }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, textAlign: 'center' }}>How it works</p>
          <h2 className="lp-h2" style={{ fontSize: 44, marginBottom: 12 }}>Three steps. <em style={{ color: '#BA7517' }}>30 minutes.</em> You're live.</h2>
          <p style={{ fontSize: 15, color: '#5F5A57', textAlign: 'center', marginBottom: 48 }}>No app to download. No platform to learn. Just WhatsApp.</p>
          <div className="lp-grid3">
            {[
              { n: '01', title: 'Sign up and connect', body: 'Create your account, upload your client list. Maya messages you on WhatsApp to confirm everything is set up.' },
              { n: '02', title: 'Add Maya to any client group', body: 'Create a WhatsApp group with your client and add Maya\'s number. She introduces herself and takes over.' },
              { n: '03', title: 'Check your dashboard, close deals', body: 'Every brief, renewal, and alert in your dashboard in real time. You sell. Maya handles the rest.' },
            ].map(s => (
              <div key={s.n} className="lp-card" style={{ padding: '28px 24px' }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, color: '#BA7517', marginBottom: 14 }}>{s.n}</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: '#1A1410', marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: '#5F5A57', lineHeight: 1.65 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ background: '#FFFFFF' }}>
        <div className="lp-section-inner lp-section-pad" style={{ padding: '80px 32px' }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, textAlign: 'center' }}>What Espresso does</p>
          <h2 className="lp-h2" style={{ fontSize: 44, marginBottom: 12 }}>Everything you need. <em style={{ color: '#BA7517' }}>Nothing you don't.</em></h2>
          <p style={{ fontSize: 15, color: '#5F5A57', textAlign: 'center', marginBottom: 48 }}>Built for the IFA who works alone but needs to perform like a full team.</p>
          <div className="lp-grid3">
            {[
              { svg: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="#BA7517" strokeWidth="1.3"/><path d="M2 14c0-2.761 2.686-5 6-5s6 2.239 6 5" stroke="#BA7517" strokeWidth="1.3" strokeLinecap="round"/></svg>, title: 'Client intake', body: 'Every new enquiry handled 24/7. Structured discovery, client brief on your dashboard — while you sleep.' },
              { svg: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="#BA7517" strokeWidth="1.3"/><path d="M5 1v2M11 1v2M2 6h12" stroke="#BA7517" strokeWidth="1.3" strokeLinecap="round"/></svg>, title: 'Renewal management', body: 'Every policy tracked. Renewals managed at 90, 60, 30, 14, and 7 days out. Never miss a follow-up.' },
              { svg: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L2 5v9h12V5L8 1.5z" stroke="#BA7517" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 10h4M6 7h4" stroke="#BA7517" strokeWidth="1.3" strokeLinecap="round"/></svg>, title: 'Policy advisory', body: 'Clients ask coverage questions. Maya answers from their policy data — accurate, specific, instant.' },
              { svg: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="1" width="10" height="14" rx="1.5" stroke="#BA7517" strokeWidth="1.3"/><path d="M6 5h4M6 8h4M6 11h2" stroke="#BA7517" strokeWidth="1.3" strokeLinecap="round"/></svg>, title: 'Claims support', body: 'Maya guides clients through claims in real time, at any hour. You get an alert and a fully pre-filled form.' },
              { svg: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4h8M4 7h8M4 10h5" stroke="#BA7517" strokeWidth="1.3" strokeLinecap="round"/><path d="M10 9l4 4M12 13l-2-2" stroke="#BA7517" strokeWidth="1.3" strokeLinecap="round"/></svg>, title: 'Document collection', body: 'Clients send photos and PDFs to the WhatsApp group. Maya saves them to the claim file automatically.' },
              { svg: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12L5.5 7.5 8.5 10 11 7l3 3" stroke="#BA7517" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>, title: 'Quote comparison', body: 'Quotes ranked by quality, presented as a clear comparison. Hours of portal work — gone.' },
            ].map(f => (
              <div key={f.title} className="lp-feature" style={{ background: '#FAFAF8', border: '0.5px solid #E8E2DA', borderRadius: 12, padding: '24px' }}>
                <div style={{ width: 32, height: 32, background: '#FEF3E2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>{f.svg}</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1410', marginBottom: 6 }}>Maya — {f.title}</div>
                <div style={{ fontSize: 13, color: '#5F5A57', lineHeight: 1.65 }}>{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ background: '#F7F4F0' }}>
        <div className="lp-section-inner lp-section-pad" style={{ padding: '80px 32px', maxWidth: 1040, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, textAlign: 'center' }}>Pricing</p>
          <h2 className="lp-h2" style={{ fontSize: 44, marginBottom: 12 }}>Simple pricing. <em style={{ color: '#BA7517' }}>No hidden fees.</em></h2>
          <p style={{ fontSize: 15, color: '#5F5A57', textAlign: 'center', marginBottom: 52 }}>Start free for 14 days. No credit card required. Cancel anytime.</p>
          <div className="lp-grid4">
            {[
              { name: 'Solo', price: '79', sub: '/month', tag: null, dark: false, features: ['1 FA · 50 clients', 'Maya AI — intake & renewals', 'Dashboard + client briefs', 'Policy CSV import', 'English & Mandarin', 'Email support'], cta: 'Start free trial', href: '/trial' },
              { name: 'Pro', price: '149', sub: '/month', tag: 'Most popular', dark: true, features: ['Everything in Solo', 'Unlimited clients', 'Claims + FNOL support', 'Coverage gap detection', 'Document management', 'Priority support'], cta: 'Start free trial', href: '/trial' },
              { name: 'Team', price: '349', sub: '/month', tag: 'Coming soon', dark: false, features: ['Everything in Pro', 'Up to 5 FA seats', 'Shared dashboard', 'Team renewal calendar', 'Admin controls', 'Dedicated onboarding'], cta: 'Join waitlist', href: 'mailto:hello@espresso.insure?subject=Team plan waitlist' },
              { name: 'Agency', price: 'Custom', sub: '', tag: null, dark: false, features: ['Everything in Team', 'Unlimited FA seats', 'White-label Maya', 'API access', 'Dedicated account manager', 'SLA + compliance'], cta: 'Contact us', href: 'mailto:hello@espresso.insure' },
            ].map(p => (
              <div key={p.name} style={{ background: p.dark ? '#1A1410' : '#FFFFFF', border: `0.5px solid ${p.dark ? '#1A1410' : '#E8E2DA'}`, borderRadius: 14, padding: '28px 22px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {p.tag && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: p.tag === 'Coming soon' ? '#5F5A57' : '#BA7517', color: '#FFFFFF', fontSize: 10, fontWeight: 500, padding: '3px 12px', borderRadius: 100, whiteSpace: 'nowrap' }}>
                    {p.tag}
                  </div>
                )}
                <div style={{ fontSize: 15, fontWeight: 500, color: p.dark ? '#F7F4F0' : '#1A1410', marginBottom: 8 }}>{p.name}</div>
                <div style={{ marginBottom: 20 }}>
                  {p.price === 'Custom' ? (
                    <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, color: p.dark ? '#F7F4F0' : '#1A1410' }}>Custom</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 11, color: p.dark ? '#9B9088' : '#5F5A57' }}>SGD </span>
                      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, color: p.dark ? '#F7F4F0' : '#1A1410' }}>{p.price}</span>
                      <span style={{ fontSize: 12, color: p.dark ? '#9B9088' : '#5F5A57' }}>{p.sub}</span>
                    </>
                  )}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: p.dark ? '#C9B99A' : '#3D3532' }}>
                      <span style={{ color: p.dark ? '#BA7517' : '#0F6E56', flexShrink: 0 }}>✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <a href={p.href} style={{ display: 'block', textAlign: 'center', padding: '10px 0', background: p.dark ? '#BA7517' : 'transparent', border: `0.5px solid ${p.dark ? '#BA7517' : '#E8E2DA'}`, borderRadius: 8, fontSize: 13, fontWeight: p.dark ? 500 : 400, color: p.dark ? '#FFFFFF' : '#3D3532', textDecoration: 'none' }}>
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#9B9088', marginTop: 24 }}>
            All prices in SGD · Annual plans available at 2 months free · <a href="mailto:hello@espresso.insure" style={{ color: '#BA7517' }}>hello@espresso.insure</a>
          </p>
        </div>
      </section>

      {/* ── SETUP ── */}
      <section id="setup" style={{ background: '#FFFFFF' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }} className="lp-section-pad">
          <div style={{ padding: '80px 32px' }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, textAlign: 'center' }}>Setup guide</p>
          <h2 className="lp-h2" style={{ fontSize: 44, marginBottom: 12 }}>From sign-up to <em style={{ color: '#BA7517' }}>first client</em> in 30 minutes.</h2>
          <p style={{ fontSize: 15, color: '#5F5A57', textAlign: 'center', marginBottom: 48 }}>If you use WhatsApp, you can use Espresso.</p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { n: '1', title: 'Create your Espresso account', body: 'Go to espresso.insure/trial, enter your name, email, and mobile number. No credit card needed — start with the 14-day free trial.' },
              { n: '2', title: 'Maya messages you on WhatsApp', body: 'Once your account is set up, Maya will WhatsApp you directly to confirm everything is working. Save her number as "Maya — Espresso". This is the number you add to client groups.' },
              { n: '3', title: 'Upload your existing policies', body: 'Go to Clients → Import and upload a CSV of your current client policies. Maya immediately begins tracking all renewals from day one.' },
              { n: '4', title: 'Create your first client group', body: 'Open WhatsApp. Create a new group with yourself and a client. Add Maya\'s number. She\'ll introduce herself and take over the conversation.' },
              { n: '5', title: 'Watch your dashboard fill up', body: 'Every client brief, renewal flag, and alert appears in your dashboard in real time. Log in once a day to stay on top of your entire book.' },
              { n: '6', title: 'Control Maya from the group', body: 'Type "Maya pause" to step in. "Maya take over" to hand back. "Maya brief me" for an instant private summary of the client.' },
            ].map((s, i, arr) => (
              <div key={s.n} className="lp-setup-step" style={{ display: 'flex', gap: 20, paddingBottom: i < arr.length - 1 ? 0 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FEF3E2', border: '1px solid #FAC775', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500, color: '#854F0B', flexShrink: 0 }}>{s.n}</div>
                  {i < arr.length - 1 && <div style={{ width: 1, height: 32, background: '#E8E2DA', marginTop: 6 }} />}
                </div>
                <div style={{ paddingBottom: i < arr.length - 1 ? 28 : 0, flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: '#1A1410', marginBottom: 5, marginTop: 6 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: '#5F5A57', lineHeight: 1.65 }}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: '#F7F4F0', border: '0.5px solid #E8E2DA', borderRadius: 12, padding: '22px 24px', marginTop: 40 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1410', marginBottom: 12 }}>What you need to get started</div>
            {['A WhatsApp account (personal or business)', 'A smartphone with WhatsApp installed', 'An email address for your Espresso account', 'Your client policy list in any spreadsheet format', "That's it"].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#3D3532', marginBottom: 7 }}>
                <span style={{ color: '#0F6E56' }}>✓</span> {item}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link href="/trial" className="lp-btn-primary" style={{ fontSize: 15, padding: '13px 32px', display: 'inline-block', borderRadius: 9 }}>
              Start your free trial →
            </Link>
            <p style={{ fontSize: 13, color: '#9B9088', marginTop: 14 }}>
              Questions? Email <a href="mailto:hello@espresso.insure" style={{ color: '#BA7517' }}>hello@espresso.insure</a>
            </p>
          </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ background: '#F7F4F0' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '80px 32px' }} className="lp-section-pad">
          <p style={{ fontSize: 11, fontWeight: 500, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, textAlign: 'center' }}>FAQs</p>
          <h2 className="lp-h2" style={{ fontSize: 44, marginBottom: 48 }}>Common questions from <em style={{ color: '#BA7517' }}>IFAs like you.</em></h2>
          {[
            { q: 'Do my clients know they\'re talking to an AI?', a: "Maya introduces herself as your AI assistant. She's warm, conversational, and helpful. Clients experience her as a responsive assistant who works for you. You're always in the group and can jump in anytime." },
            { q: 'Do I need to ask my clients to download anything?', a: "No. Everything runs inside WhatsApp. You add Maya to a group with your client. No app, no account, no friction for the client." },
            { q: 'Is my client data safe?', a: "Espresso never connects to any insurer's system. All client data is encrypted, isolated to your account, and stored in Singapore. We comply with PDPA. Your data is yours." },
            { q: 'What happens if Maya says something wrong?', a: 'You see every message in real time. Type "Maya pause" and she goes silent immediately. Maya never makes product recommendations or commits to financial terms without your review.' },
            { q: "I'm a tied agent — can I still use Espresso?", a: "Absolutely. Even if you only sell one insurer's products, Maya adds value through intake, renewal management, claims support, and document handling — all independent of which insurer you represent." },
            { q: 'Can I cancel anytime?', a: "Yes, completely. No lock-in contracts. Cancel from your dashboard at any time. Your data remains accessible for 30 days after cancellation so you can export everything." },
            { q: 'Which markets does Espresso support?', a: "Espresso is live in Singapore. Malaysia and Philippines launch in 2026, followed by Indonesia and Thailand. Email hello@espresso.insure for early access in other markets." },
          ].map((f, i, arr) => (
            <details key={f.q} className="lp-faq" style={{ borderBottom: i < arr.length - 1 ? '0.5px solid #E8E2DA' : 'none' }}>
              <summary style={{ padding: '16px 0', fontSize: 14, fontWeight: 500, color: '#1A1410', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                {f.q}
                <span style={{ color: '#BA7517', fontSize: 18, flexShrink: 0 }}>+</span>
              </summary>
              <div style={{ paddingBottom: 16, fontSize: 13, color: '#5F5A57', lineHeight: 1.7 }}>{f.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: '#1A1410', padding: '80px 32px', textAlign: 'center' }}>
        <h2 className="lp-cta-h2" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 400, color: '#F7F4F0', marginBottom: 14, lineHeight: 1.15 }}>
          Stop doing admin. <em style={{ color: '#BA7517' }}>Start building your book.</em>
        </h2>
        <p style={{ fontSize: 15, color: '#9B9088', marginBottom: 32 }}>14-day free trial · No credit card · Set up in 30 minutes · Maya starts working tonight.</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/trial" className="lp-btn-primary" style={{ fontSize: 15, padding: '13px 32px', display: 'inline-block', borderRadius: 9 }}>
            Start your free trial
          </Link>
          <Link href="/login" style={{ color: '#9B9088', fontSize: 14, padding: '13px 16px', display: 'inline-block' }}>
            Already on a plan? Sign in →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#120A06', borderTop: '0.5px solid #2E1A0E', padding: '32px' }}>
        <div className="lp-footer-inner" style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#F7F4F0' }}>
            espresso<span style={{ color: '#BA7517' }}>.</span>
          </div>
          <div className="lp-footer-links" style={{ display: 'flex', gap: 24 }}>
            {[['How it works', '#how-it-works'], ['Pricing', '#pricing'], ['Setup', '#setup'], ['Contact', 'mailto:hello@espresso.insure'], ['Privacy', '#'], ['Terms', '#']].map(([l, h]) => (
              <a key={l} href={h} style={{ fontSize: 12, color: '#5F5A57' }}>{l}</a>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#5F5A57' }}>© 2026 Espresso</div>
        </div>
      </footer>
    </>
  )
}
