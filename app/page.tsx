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
        .lp-nav-link:hover { color: #BA7517; }
        .lp-btn-amber { background: #BA7517; color: #FFF; border: none; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer; display: inline-block; transition: opacity .15s; text-decoration: none; }
        .lp-btn-amber:hover { opacity: .9; }
        .lp-btn-out { background: transparent; color: #3D3532; border: 0.5px solid #E8E2DA; border-radius: 8px; font-family: 'DM Sans', sans-serif; cursor: pointer; display: inline-block; transition: all .15s; text-decoration: none; }
        .lp-btn-out:hover { background: #1A1410; color: #FFF; border-color: #1A1410; }
        .lp-card { background: #FFF; border: 0.5px solid #E8E2DA; border-radius: 14px; }
        .lp-feature:hover { border-color: #D4B896; transform: translateY(-2px); transition: all .15s; }
        .lp-faq summary { cursor: pointer; list-style: none; user-select: none; }
        .lp-faq summary::-webkit-details-marker { display: none; }
        .g3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .g4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
        .g2 { display: grid; grid-template-columns: repeat(2,1fr); gap: 1px; background: #2E1A0E; }
        .iphone-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 32px; }
        .stats-row { display: flex; justify-content: center; gap: 64px; }
        .hero-btns { display: flex; gap: 12px; justify-content: center; align-items: center; }
        .footer-inner { display: flex; justify-content: space-between; align-items: center; }
        .footer-links { display: flex; gap: 28px; }
        .nav-links { display: flex; gap: 32px; }
        .lp-section { padding: 96px 40px; }

        /* Tablet */
        @media (max-width: 1024px) {
          .iphone-grid { gap: 16px; }
        }
        @media (max-width: 900px) {
          .g3 { grid-template-columns: 1fr 1fr; }
          .g4 { grid-template-columns: 1fr 1fr; }
          .g2 { grid-template-columns: 1fr; }
          .iphone-grid { grid-template-columns: 1fr; max-width: 340px; margin: 0 auto; }
        }
        /* Mobile */
        @media (max-width: 640px) {
          .g3 { grid-template-columns: 1fr; }
          .g4 { grid-template-columns: 1fr 1fr; }
          .stats-row { flex-wrap: wrap; gap: 24px; justify-content: space-around; }
          .stats-row > div { width: 40%; }
          .hero-btns { flex-direction: column; width: 100%; }
          .hero-btns a, .hero-btns button { width: 100%; text-align: center !important; }
          .nav-links { display: none !important; }
          .nav-login { display: none !important; }
          .footer-inner { flex-direction: column; gap: 20px; text-align: center; }
          .footer-links { flex-wrap: wrap; justify-content: center; gap: 14px; }
          .demo-tabs { flex-direction: column; }
          .lp-section { padding: 64px 20px !important; }
          .lp-h1 { font-size: 44px !important; }
          .lp-h2 { font-size: 36px !important; }
          .lp-hero { padding: 52px 20px 48px !important; }
          .lp-nav { padding: 0 20px !important; }
          .g2 > div { padding: 28px 24px !important; }
          .g4 { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 400px) {
          .g4 { grid-template-columns: 1fr; }
          .stats-row > div { width: 45%; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(247,244,240,0.95)', backdropFilter: 'blur(12px)', borderBottom: '0.5px solid #E8E2DA' }}>
        <div className="lp-nav" style={{ maxWidth: 1080, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
          <a href="/" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 400, color: '#1A1410' }}>espresso<span style={{ color: '#BA7517' }}>.</span></a>
          <div className="nav-links" style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            {[['How it works', '#how-it-works'], ['Pricing', '#pricing']].map(([l, h]) => (
              <a key={l} href={h} className="lp-nav-link" style={{ fontSize: 14, color: '#3D3532' }}>{l}</a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link href="/login" className="nav-login" style={{ fontSize: 14, color: '#3D3532', padding: '8px 14px' }}>Login</Link>
            <Link href="/trial" className="lp-btn-amber" style={{ fontSize: 14, padding: '9px 20px' }}>Start free trial</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero" style={{ background: '#F7F4F0', padding: '80px 40px 72px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#E1F5EE', border: '0.5px solid #9FE1CB', borderRadius: 100, padding: '6px 16px', marginBottom: 32 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1D9E75' }} />
            <span style={{ fontSize: 13, color: '#0F6E56' }}>Now live in Singapore</span>
          </div>
          <h1 className="lp-h1" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 68, fontWeight: 400, color: '#1A1410', lineHeight: 1.08, marginBottom: 24, letterSpacing: '-0.01em' }}>
            Your AI back-office.<br /><em style={{ color: '#BA7517' }}>Inside WhatsApp.</em>
          </h1>
          <p style={{ fontSize: 19, color: '#5F5A57', maxWidth: 540, margin: '0 auto 40px', lineHeight: 1.75 }}>Maya handles intake, renewals, and claims — 24/7, inside the WhatsApp groups you already use with clients.</p>
          <div className="hero-btns">
            <Link href="/trial" className="lp-btn-amber" style={{ fontSize: 16, padding: '14px 32px' }}>Start 14-day free trial</Link>
            <a href="#how-it-works" className="lp-btn-out" style={{ fontSize: 16, padding: '14px 26px' }}>See how it works</a>
          </div>
          <div className="stats-row" style={{ marginTop: 64, paddingTop: 52, borderTop: '0.5px solid #E8E2DA' }}>
            {[['24/7', 'Maya is always on'], ['< 30 min', 'Setup to first client'], ['0', 'App downloads needed'], ['SGD 79', 'Per month to start']].map(([v, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, color: '#1A1410', lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 12, color: '#9B9088', marginTop: 6 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MAYA IN ACTION */}
      <section className="lp-section" style={{ background: '#FFFFFF', padding: '96px 40px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 16 }}>Maya in action</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 50, fontWeight: 400, color: '#1A1410', textAlign: 'center', lineHeight: 1.15, marginBottom: 14 }}>Maya handles the conversation.<br /><em style={{ color: '#BA7517' }}>You close the deal.</em></h2>
          <p style={{ fontSize: 16, color: '#5F5A57', textAlign: 'center', marginBottom: 64 }}>All three conversations happen inside existing WhatsApp groups — with you, your client, and Maya together.</p>
          <div className="iphone-grid">
            {([
              {
                label: 'New client enquiry',
                group: "Sarah's café — insurance group",
                members: 'David Tan · Sarah Lim · Maya',
                msgs: [
                  { from: 'client', name: 'Sarah', text: 'Hi David, saw your ad. Need insurance for my café.' },
                  { from: 'maya', text: "Hi Sarah! I'm Maya, David's assistant. Let me help. How many staff do you have?" },
                  { from: 'client', name: 'Sarah', text: '5 full-time, 2 part-time. We also do catering.' },
                  { from: 'maya', text: "Got it. I'll prepare a full brief for David — expect a call today!" },
                  { from: 'fa', name: 'David', text: "Thanks Maya. Sarah, I'll call you at 3pm!" },
                ],
                confirm: '✓ Client brief sent to your dashboard',
                confirmColor: '#0F6E56',
              },
              {
                label: 'Renewal follow-up',
                group: "Kevin's health plan group",
                members: 'David Tan · Kevin Teo · Maya',
                msgs: [
                  { from: 'maya', text: 'Hi Kevin! Your Great Eastern health plan renews on 21 April — just 10 days away.' },
                  { from: 'client', name: 'Kevin', text: 'Thanks for the heads up. Any better options?' },
                  { from: 'maya', text: "I've compared 3 plans. Prudential saves ~$400/yr with better coverage. I'll send David the comparison." },
                  { from: 'fa', name: 'David', text: "Kevin, I'll call you tomorrow to go through the options!" },
                  { from: 'client', name: 'Kevin', text: 'Perfect, thanks David!' },
                ],
                confirm: '✓ Comparison report ready in dashboard',
                confirmColor: '#854F0B',
              },
              {
                label: 'Claims support',
                group: "Priya's accident claim group",
                members: 'David Tan · Priya Nair · Maya',
                msgs: [
                  { from: 'client', name: 'Priya', text: 'David! I was in an accident. What do I do for the claim?' },
                  { from: 'maya', text: "Priya, don't worry — I'll guide you. Please send a photo of the damage and the police report." },
                  { from: 'client', name: 'Priya', text: '📎 photo_damage.jpg  📎 police_report.pdf' },
                  { from: 'maya', text: "Got them — saved to your claim file. David will pre-fill the AIA form for you." },
                  { from: 'fa', name: 'David', text: "Priya, form is ready. I'll submit it by end of today." },
                ],
                confirm: '✓ Attachments + claim alert in dashboard',
                confirmColor: '#A32D2D',
              },
            ] as any[]).map((card: any) => (
              <div key={card.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Label above phone */}
                <div style={{ fontSize: 13, fontWeight: 500, color: '#3D3532', marginBottom: 20, letterSpacing: '-0.01em' }}>{card.label}</div>

                {/* iPhone frame */}
                <div style={{ width: 300, background: '#1A1410', borderRadius: 44, padding: '12px 12px', boxShadow: '0 24px 64px rgba(26,20,16,0.18), 0 0 0 1px rgba(255,255,255,0.06) inset' }}>
                  {/* Dynamic island */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                    <div style={{ width: 120, height: 34, background: '#000000', borderRadius: 20 }} />
                  </div>

                  {/* Screen */}
                  <div style={{ background: '#ECE5DD', borderRadius: 34, overflow: 'hidden' }}>
                    {/* WA Header */}
                    <div style={{ background: '#075E54', padding: '10px 12px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 8L7 5M10 8L7 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#128C7E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 500 }}>G</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', fontFamily: 'system-ui, sans-serif', lineHeight: 1.2 }}>{card.group}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', fontFamily: 'system-ui, sans-serif' }}>{card.members}</div>
                      </div>
                    </div>

                    {/* WA date stamp */}
                    <div style={{ background: '#ECE5DD', padding: '8px 12px 4px', display: 'flex', justifyContent: 'center' }}>
                      <div style={{ background: 'rgba(0,0,0,0.12)', borderRadius: 8, padding: '2px 10px', fontSize: 10, color: '#3D3D3D', fontFamily: 'system-ui, sans-serif' }}>Today</div>
                    </div>

                    {/* Messages */}
                    <div style={{ padding: '4px 10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {card.msgs.map((m: any, i: number) => {
                        const isRight = m.from !== 'client'
                        const bg = m.from === 'maya' ? '#BA7517' : m.from === 'fa' ? '#DCF8C6' : '#FFFFFF'
                        const textColor = m.from === 'maya' ? '#FFFFFF' : '#111'
                        const nameColor = m.from === 'maya' ? 'rgba(255,255,255,0.75)' : m.from === 'fa' ? '#128C7E' : '#BA7517'
                        const displayName = m.from === 'maya' ? 'Maya' : m.name
                        return (
                          <div key={i} style={{ display: 'flex', justifyContent: isRight ? 'flex-end' : 'flex-start' }}>
                            <div style={{ maxWidth: '78%', background: bg, borderRadius: isRight ? '8px 0px 8px 8px' : '0px 8px 8px 8px', padding: '5px 8px 4px', boxShadow: '0 1px 2px rgba(0,0,0,0.13)' }}>
                              <div style={{ fontSize: 9, fontWeight: 600, color: nameColor, fontFamily: 'system-ui, sans-serif', marginBottom: 2 }}>{displayName}</div>
                              <div style={{ fontSize: 11.5, color: textColor, lineHeight: 1.4, fontFamily: 'system-ui, sans-serif' }}>{m.text}</div>
                              <div style={{ fontSize: 9, color: m.from === 'maya' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)', textAlign: 'right', marginTop: 2, fontFamily: 'system-ui, sans-serif' }}>
                                {9 + i}:4{i} {i % 2 === 0 ? '✓✓' : '✓'}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* WA Input bar */}
                    <div style={{ background: '#F0F0F0', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, background: '#FFFFFF', borderRadius: 20, padding: '6px 12px', fontSize: 11, color: '#999', fontFamily: 'system-ui, sans-serif' }}>Message</div>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#075E54', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M12 7L2 2l2 5-2 5 10-5z" fill="white"/></svg>
                      </div>
                    </div>
                  </div>

                  {/* Home indicator */}
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
                    <div style={{ width: 100, height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 2 }} />
                  </div>
                </div>

                {/* Confirmation below phone */}
                <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 500, color: card.confirmColor }}>
                  {card.confirm}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="lp-section" style={{ background: '#1A1410', padding: '96px 40px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 16 }}>The problem</p>
          <h2 className="lp-h2" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 50, fontWeight: 400, color: '#F7F4F0', textAlign: 'center', lineHeight: 1.15, marginBottom: 64 }}>You're running a 500-client business<br /><em style={{ color: '#BA7517' }}>on WhatsApp and Excel.</em></h2>
          <div className="g2">
            {[
              { title: 'New enquiries go cold', body: "Prospects message while you're busy. By the time you respond, they've moved on to someone else.", svg: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9" stroke="#BA7517" strokeWidth="1.4"/><path d="M11 6v5l3.5 3.5" stroke="#BA7517" strokeWidth="1.4" strokeLinecap="round"/></svg> },
              { title: 'Renewals sneak up on you', body: 'You track renewals in spreadsheets and memory. One missed renewal is a client — and a commission — lost.', svg: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="3.5" width="18" height="16" rx="2" stroke="#BA7517" strokeWidth="1.4"/><path d="M6 1.5v3M16 1.5v3M2 9h18" stroke="#BA7517" strokeWidth="1.4" strokeLinecap="round"/><path d="M15 14l-4-2.5V8" stroke="#BA7517" strokeWidth="1.4" strokeLinecap="round"/></svg> },
              { title: 'Claims catch you off guard', body: 'A client calls at 9pm in a panic. You scramble to find the right form, the right insurer, the right process.', svg: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 2L2 19h18L11 2z" stroke="#BA7517" strokeWidth="1.4" strokeLinejoin="round"/><path d="M11 9v5M11 16v1.5" stroke="#BA7517" strokeWidth="1.4" strokeLinecap="round"/></svg> },
              { title: 'Evenings lost to admin', body: 'Follow-ups, form preparation, quotes — all after hours, all unpaid, all keeping you from growing your book.', svg: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 2a9 9 0 100 18A9 9 0 0011 2z" stroke="#BA7517" strokeWidth="1.4"/><path d="M15 11a4 4 0 01-4 4" stroke="#BA7517" strokeWidth="1.4" strokeLinecap="round"/><path d="M3 11h1.5M17.5 11H19M11 3v1.5M11 17.5V19" stroke="#BA7517" strokeWidth="1.4" strokeLinecap="round"/></svg> },
            ].map(p => (
              <div key={p.title} style={{ background: '#1A1410', padding: '44px 48px' }}>
                <div style={{ marginBottom: 20 }}>{p.svg}</div>
                <div style={{ fontSize: 18, fontWeight: 500, color: '#F7F4F0', marginBottom: 10 }}>{p.title}</div>
                <div style={{ fontSize: 15, color: '#9B9088', lineHeight: 1.75 }}>{p.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIME SAVINGS */}
      <section style={{ background: '#FFFFFF', padding: '80px 40px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 16 }}>Time saved per week</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 50, fontWeight: 400, color: '#1A1410', textAlign: 'center', lineHeight: 1.15, marginBottom: 14 }}>FAs using Espresso<br /><em style={{ color: '#BA7517' }}>save 8+ hours every week.</em></h2>
          <p style={{ fontSize: 16, color: '#5F5A57', textAlign: 'center', marginBottom: 64 }}>Here's where the time goes — and where it comes back.</p>
          <div className="g4" style={{ maxWidth: 920, margin: '0 auto 56px' }}>
            {[
              { task: 'Client intake & follow-up', before: '3 hrs', after: '0 hrs', saving: '3 hrs back', color: '#0F6E56' },
              { task: 'Chasing renewals', before: '2.5 hrs', after: '15 min', saving: '2+ hrs back', color: '#0F6E56' },
              { task: 'Claims coordination', before: '2 hrs', after: '20 min', saving: '1.5 hrs back', color: '#0F6E56' },
              { task: 'Document collection', before: '1 hr', after: '5 min', saving: '55 min back', color: '#0F6E56' },
            ].map(row => (
              <div key={row.task} className="lp-card" style={{ padding: '28px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1410', lineHeight: 1.4 }}>{row.task}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#9B9088' }}>Without Espresso</span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#A32D2D', textDecoration: 'line-through' }}>{row.before}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#9B9088' }}>With Espresso</span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#0F6E56' }}>{row.after}</span>
                  </div>
                </div>
                <div style={{ borderTop: '0.5px solid #E8E2DA', paddingTop: 12, fontSize: 13, fontWeight: 500, color: row.color }}>{row.saving}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: '#FEF3E2', border: '0.5px solid #FAC775', borderRadius: 12, padding: '24px 40px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 42, fontWeight: 400, color: '#1A1410', lineHeight: 1 }}>8+ hrs</div>
              <div style={{ fontSize: 13, color: '#5F5A57', marginTop: 6 }}>saved per week — time you get back with clients, or with family</div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section style={{ background: '#F7F4F0', padding: '72px 40px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 48 }}>What FAs say</p>
          <div className="g3">
            {([
              {
                quote: '"Maya answered a client\'s renewal question at 11pm while I was asleep. The client didn\'t even know she was talking to an AI."',
                name: 'David T.',
                title: 'Independent FA, Singapore',
                initials: 'DT',
              },
              {
                quote: '"I was tracking renewals in three different spreadsheets. Now Maya pings me when something needs attention. I haven\'t missed a renewal in four months."',
                name: 'Priya N.',
                title: 'Licensed FA, 8 years in practice',
                initials: 'PN',
              },
              {
                quote: '"Setup really did take under 30 minutes. My biggest worry was that clients would find it weird \u2014 they don\'t. They love how fast Maya responds."',
                name: 'Kevin L.',
                title: 'Solo FA, 200+ clients',
                initials: 'KL',
              },
            ] as { quote: string; name: string; title: string; initials: string }[]).map(t => (
              <div key={t.name} className="lp-card" style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color: '#BA7517', fontSize: 14 }}>★</span>)}
                </div>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 400, color: '#1A1410', lineHeight: 1.65, margin: 0 }}>{t.quote}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#FEF3E2', border: '0.5px solid #FAC775', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 500, color: '#BA7517', flexShrink: 0 }}>{t.initials}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1410' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#9B9088', marginTop: 2 }}>{t.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section style={{ background: '#F7F4F0', borderTop: '0.5px solid #E8E2DA', borderBottom: '0.5px solid #E8E2DA', padding: '36px 40px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 28 }}>Built for regulated advisers</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px 48px' }}>
            {[
              { icon: '🛡️', label: 'MAS-aware architecture', detail: 'Built with MAS regulatory requirements for licensed advisers in mind' },
              { icon: '🇸🇬', label: 'Singapore data residency', detail: 'Your client data stays in Singapore-region infrastructure' },
              { icon: '📋', label: 'Full audit trail', detail: 'Every action logged — ready for compliance review on demand' },
              { icon: '🔒', label: 'Row-level access controls', detail: 'Each adviser sees only their own clients. Always.' },
            ].map(t => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, maxWidth: 220 }}>
                <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{t.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1410', marginBottom: 3 }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: '#9B9088', lineHeight: 1.5 }}>{t.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="lp-section" style={{ background: '#F7F4F0', padding: '96px 40px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 16 }}>How it works</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 50, fontWeight: 400, color: '#1A1410', textAlign: 'center', lineHeight: 1.15, marginBottom: 14 }}>From sign-up to first client.<br /><em style={{ color: '#BA7517' }}>Under 30 minutes.</em></h2>
          <p style={{ fontSize: 16, color: '#5F5A57', textAlign: 'center', marginBottom: 64 }}>No app to download. No platform to learn. Just WhatsApp.</p>
          <div className="g3">
            {[
              { n: '01', title: 'Create your account', body: "Sign up at espresso.insure/trial — name, email, mobile. No credit card needed. You'll be set up in under 5 minutes." },
              { n: '02', title: 'Maya messages you', body: 'Once confirmed, Maya will WhatsApp you directly to verify everything is working. Save her number as "Maya — Espresso".' },
              { n: '03', title: 'Upload your client list', body: 'Go to Clients → Import and upload a CSV of your policies. Maya begins tracking every renewal from day one.' },
              { n: '04', title: 'Create your first client group', body: "Open WhatsApp, create a group with yourself and a client, and add Maya's number. She introduces herself and takes over." },
              { n: '05', title: 'Your dashboard fills up', body: 'Every brief, renewal flag, and alert appears in real time. Log in once a day to stay across your entire book.' },
              { n: '06', title: 'Control Maya anytime', body: '"Maya pause" to step in. "Maya take over" to hand back. "Maya brief me" for an instant private client summary.' },
            ].map(s => (
              <div key={s.n} className="lp-card" style={{ padding: '32px 28px' }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 40, color: '#BA7517', marginBottom: 18, lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: 16, fontWeight: 500, color: '#1A1410', marginBottom: 10 }}>{s.title}</div>
                <div style={{ fontSize: 14, color: '#5F5A57', lineHeight: 1.75 }}>{s.body}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 12, padding: '28px 36px', marginTop: 40 }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#1A1410', marginBottom: 16 }}>What you need to get started</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 48px' }}>
              {['A WhatsApp account (personal or business)', 'A smartphone with WhatsApp installed', 'An email address for your Espresso account', 'Your client policy list in any spreadsheet format'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#3D3532' }}>
                  <span style={{ color: '#0F6E56' }}>✓</span> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ background: '#FFFFFF', padding: '96px 40px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 16 }}>What Espresso does</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 50, fontWeight: 400, color: '#1A1410', textAlign: 'center', lineHeight: 1.15, marginBottom: 14 }}>Everything you need.<br /><em style={{ color: '#BA7517' }}>Nothing you don't.</em></h2>
          <p style={{ fontSize: 16, color: '#5F5A57', textAlign: 'center', marginBottom: 64 }}>Built for financial advisers who work alone but need to perform like a full team.</p>
          <div className="g3">
            {[
              { title: 'Client intake', body: 'Every new enquiry handled 24/7. Structured discovery, client brief on your dashboard — while you sleep.', svg: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="5.5" r="3" stroke="#BA7517" strokeWidth="1.3"/><path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#BA7517" strokeWidth="1.3" strokeLinecap="round"/></svg> },
              { title: 'Renewal management', body: 'Every policy tracked. Renewals managed at 90, 60, 30, 14, and 7 days out. Never miss a follow-up.', svg: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2.5" width="14" height="13" rx="2" stroke="#BA7517" strokeWidth="1.3"/><path d="M5 1v2M13 1v2M2 7h14" stroke="#BA7517" strokeWidth="1.3" strokeLinecap="round"/></svg> },
              { title: 'Policy advisory', body: 'Clients ask coverage questions. Maya answers from their policy data — accurate, specific, instant.', svg: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L2 6v10h14V6L9 2z" stroke="#BA7517" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7 11h4M7 8h4" stroke="#BA7517" strokeWidth="1.3" strokeLinecap="round"/></svg> },
              { title: 'Claims support', body: 'Maya guides clients through claims in real time, at any hour. You get an alert and a fully pre-filled form.', svg: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="1" width="12" height="16" rx="1.5" stroke="#BA7517" strokeWidth="1.3"/><path d="M6 6h6M6 9h6M6 12h3" stroke="#BA7517" strokeWidth="1.3" strokeLinecap="round"/></svg> },
              { title: 'Document collection', body: 'Clients send photos and PDFs to the WhatsApp group. Maya saves everything to the claim file automatically.', svg: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10 2H4a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V7l-5-5z" stroke="#BA7517" strokeWidth="1.3" strokeLinejoin="round"/><path d="M10 2v5h5" stroke="#BA7517" strokeWidth="1.3" strokeLinejoin="round"/></svg> },
              { title: 'Quote comparison', body: 'Quotes ranked by quality, presented as a clear comparison. Hours of portal work — gone.', svg: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 13L6 8.5l3.5 3L13 8l3 3" stroke="#BA7517" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
            ].map(f => (
              <div key={f.title} className="lp-feature" style={{ background: '#FAFAF8', border: '0.5px solid #E8E2DA', borderRadius: 14, padding: '28px' }}>
                <div style={{ width: 36, height: 36, background: '#FEF3E2', border: '0.5px solid #FAC775', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>{f.svg}</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: '#1A1410', marginBottom: 8 }}>Maya — {f.title}</div>
                <div style={{ fontSize: 14, color: '#5F5A57', lineHeight: 1.75 }}>{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ background: '#F7F4F0', padding: '96px 40px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 16 }}>Pricing</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 50, fontWeight: 400, color: '#1A1410', textAlign: 'center', lineHeight: 1.15, marginBottom: 14 }}>Simple pricing.<br /><em style={{ color: '#BA7517' }}>No hidden fees.</em></h2>
          <p style={{ fontSize: 16, color: '#5F5A57', textAlign: 'center', marginBottom: 64 }}>Start free for 14 days. No credit card required. Cancel anytime.</p>
          <div className="g4">
            {[
              { name: 'Solo', price: '79', dark: false, tag: null, features: ['1 FA · up to 50 clients', 'Maya — intake & renewals', 'Dashboard + client briefs', 'Policy CSV import', 'English & Mandarin', 'Email support'], cta: 'Start free trial', href: '/trial' },
              { name: 'Pro', price: '149', dark: true, tag: 'Most popular', features: ['Everything in Solo', 'Unlimited clients', 'Claims + FNOL support', 'Coverage gap detection', 'Document management', 'Priority support'], cta: 'Start free trial', href: '/trial' },
              { name: 'Team', price: '349', dark: false, tag: 'Coming soon', features: ['Everything in Pro', 'Up to 5 FA seats', 'Shared dashboard', 'Team renewal calendar', 'Admin controls', 'Dedicated onboarding'], cta: 'Join waitlist', href: 'mailto:hello@espresso.insure?subject=Team plan waitlist' },
              { name: 'Agency', price: 'Custom', dark: false, tag: null, features: ['Everything in Team', 'Unlimited FA seats', 'White-label Maya', 'API access', 'Dedicated account manager', 'SLA + compliance'], cta: 'Contact us', href: 'mailto:hello@espresso.insure' },
            ].map(p => (
              <div key={p.name} style={{ background: p.dark ? '#1A1410' : '#FFF', border: `0.5px solid ${p.dark ? '#1A1410' : '#E8E2DA'}`, borderRadius: 14, padding: '32px 24px', position: 'relative', display: 'flex', flexDirection: 'column', opacity: p.tag === 'Coming soon' ? 0.75 : 1 }}>
                {p.tag && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: p.tag === 'Coming soon' ? '#5F5A57' : '#BA7517', color: '#FFF', fontSize: 11, fontWeight: 500, padding: '3px 14px', borderRadius: 100, whiteSpace: 'nowrap' }}>{p.tag}</div>}
                <div style={{ fontSize: 16, fontWeight: 500, color: p.dark ? '#F7F4F0' : '#1A1410', marginBottom: 10 }}>{p.name}</div>
                <div style={{ marginBottom: 22 }}>
                  {p.price === 'Custom' ? <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 30, color: '#1A1410' }}>Custom</span> : <><span style={{ fontSize: 12, color: p.dark ? '#9B9088' : '#5F5A57' }}>SGD </span><span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 40, color: p.dark ? '#F7F4F0' : '#1A1410' }}>{p.price}</span><span style={{ fontSize: 13, color: p.dark ? '#9B9088' : '#5F5A57' }}>/month</span></>}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
                  {p.features.map(f => <div key={f} style={{ display: 'flex', gap: 8, fontSize: 13, color: p.dark ? '#C9B99A' : '#3D3532', alignItems: 'flex-start' }}><span style={{ color: p.dark ? '#BA7517' : '#0F6E56', flexShrink: 0 }}>✓</span><span>{f}</span></div>)}
                </div>
                <a href={p.href} style={{ display: 'block', textAlign: 'center', padding: '11px 0', background: p.dark ? '#BA7517' : 'transparent', border: `0.5px solid ${p.dark ? '#BA7517' : '#E8E2DA'}`, borderRadius: 8, fontSize: 14, fontWeight: p.dark ? 500 : 400, color: p.dark ? '#FFF' : '#3D3532', textDecoration: 'none' }}>{p.cta}</a>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#9B9088', marginTop: 28 }}>All prices in SGD · Annual plans available at 2 months free · <a href="mailto:hello@espresso.insure" style={{ color: '#BA7517' }}>hello@espresso.insure</a></p>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="lp-section" style={{ background: '#FFFFFF', padding: '96px 40px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 16 }}>Pricing</p>
          <h2 className="lp-h2" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 50, fontWeight: 400, color: '#1A1410', textAlign: 'center', lineHeight: 1.15, marginBottom: 14 }}>Simple, transparent pricing.<br /><em style={{ color: '#BA7517' }}>14 days free to start.</em></h2>
          <p style={{ fontSize: 16, color: '#5F5A57', textAlign: 'center', marginBottom: 64 }}>No credit card required. Cancel anytime.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, maxWidth: 760, margin: '0 auto 48px' }}>
            {/* Solo */}
            <div className="lp-card" style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#BA7517', marginBottom: 8 }}>Solo</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 52, fontWeight: 400, color: '#1A1410', lineHeight: 1 }}>SGD 79<span style={{ fontSize: 18, color: '#9B9088', fontFamily: 'DM Sans, sans-serif', fontWeight: 300 }}>/mo</span></div>
                <div style={{ fontSize: 13, color: '#9B9088', marginTop: 6 }}>Up to 50 active clients</div>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, padding: 0, margin: 0 }}>
                {['Maya 24/7 in WhatsApp', 'Renewal tracking & alerts', 'Claims intake support', 'Client dashboard', 'CSV import'].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#3D3532' }}>
                    <span style={{ color: '#1D9E75', flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/trial" className="lp-btn-out" style={{ fontSize: 15, padding: '13px 24px', textAlign: 'center', marginTop: 'auto' }}>Start free trial</Link>
            </div>
            {/* Pro */}
            <div className="lp-card" style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', gap: 24, border: '1.5px solid #BA7517', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#BA7517', color: '#FFF', fontSize: 11, fontWeight: 500, padding: '4px 14px', borderRadius: 100, whiteSpace: 'nowrap' }}>Most popular</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#BA7517', marginBottom: 8 }}>Pro</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 52, fontWeight: 400, color: '#1A1410', lineHeight: 1 }}>SGD 149<span style={{ fontSize: 18, color: '#9B9088', fontFamily: 'DM Sans, sans-serif', fontWeight: 300 }}>/mo</span></div>
                <div style={{ fontSize: 13, color: '#9B9088', marginTop: 6 }}>Unlimited clients</div>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, padding: 0, margin: 0 }}>
                {['Everything in Solo', 'Unlimited clients', 'Full claims coordination', 'Scout PDF extraction', 'Priority support', 'Compass gap analysis'].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#3D3532' }}>
                    <span style={{ color: '#1D9E75', flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/trial" className="lp-btn-amber" style={{ fontSize: 15, padding: '13px 24px', textAlign: 'center', marginTop: 'auto' }}>Start free trial</Link>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#9B9088', textAlign: 'center' }}>Questions? Email <a href="mailto:hello@espresso.insure" style={{ color: '#BA7517' }}>hello@espresso.insure</a></p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: '#FFFFFF', padding: '96px 40px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 16 }}>FAQs</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 50, fontWeight: 400, color: '#1A1410', textAlign: 'center', lineHeight: 1.15, marginBottom: 56 }}>Common questions from <em style={{ color: '#BA7517' }}>advisers like you.</em></h2>
          {[
            { q: "Do my clients know they're talking to an AI?", a: "Maya introduces herself as your AI assistant. She's warm, conversational, and helpful. Clients experience her as a responsive assistant who works for you. You're always in the group and can jump in anytime." },
            { q: 'Do I need to ask my clients to download anything?', a: "No. Everything runs inside WhatsApp. You add Maya to a group with your client. No app, no account, no friction." },
            { q: 'Is my client data safe?', a: "All client data is encrypted, isolated to your account, and stored in Singapore. We comply with PDPA. Your data is yours — Espresso is your personal tool, not a data aggregator." },
            { q: 'What happens if Maya says something wrong?', a: 'You see every message in real time. Type "Maya pause" and she goes silent immediately. Maya never makes product recommendations or commits to financial terms without your review.' },
            { q: "I'm a tied agent or independent adviser — can I still use Espresso?", a: "Absolutely. Maya adds value through intake, renewal management, claims support, and document handling — all independent of which insurer you represent." },
            { q: 'Can I cancel anytime?', a: "Yes, completely. No lock-in. Cancel from your dashboard at any time. Your data remains accessible for 30 days so you can export everything." },
            { q: 'Which markets does Espresso support?', a: "Espresso is live in Singapore. Malaysia and Philippines launch in 2026. Email hello@espresso.insure for early access elsewhere." },
          ].map((f, i, arr) => (
            <details key={f.q} className="lp-faq" style={{ borderBottom: i < arr.length - 1 ? '0.5px solid #E8E2DA' : 'none' }}>
              <summary style={{ padding: '20px 0', fontSize: 15, fontWeight: 500, color: '#1A1410', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                {f.q}<span style={{ color: '#BA7517', fontSize: 22, flexShrink: 0, fontWeight: 300 }}>+</span>
              </summary>
              <div style={{ paddingBottom: 20, fontSize: 14, color: '#5F5A57', lineHeight: 1.75 }}>{f.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#1A1410', padding: '96px 40px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 54, fontWeight: 400, color: '#F7F4F0', marginBottom: 16, lineHeight: 1.12 }}>Stop doing admin.<br /><em style={{ color: '#BA7517' }}>Start building your book.</em></h2>
        <p style={{ fontSize: 16, color: '#9B9088', marginBottom: 40 }}>14-day free trial · No credit card · Set up in 30 minutes · Maya starts working tonight.</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <Link href="/trial" className="lp-btn-amber" style={{ fontSize: 16, padding: '14px 36px' }}>Start your free trial</Link>
          <Link href="/login" style={{ color: '#9B9088', fontSize: 14, padding: '14px 16px', display: 'inline-block' }}>Already on a plan? Sign in →</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#120A06', borderTop: '0.5px solid #2E1A0E', padding: '36px 40px' }}>
        <div className="footer-inner" style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: '#F7F4F0' }}>espresso<span style={{ color: '#BA7517' }}>.</span></div>
          <div className="footer-links" style={{ display: 'flex', gap: 28 }}>
            {[['How it works', '#how-it-works'], ['Features', '#features'], ['Pricing', '#pricing'], ['Contact', 'mailto:hello@espresso.insure'], ['Privacy', '#'], ['Terms', '#']].map(([l, h]) => (
              <a key={l} href={h} style={{ fontSize: 13, color: '#5F5A57' }}>{l}</a>
            ))}
          </div>
          <div style={{ fontSize: 13, color: '#5F5A57' }}>© 2026 Espresso</div>
        </div>
      </footer>
    </>
  )
}
