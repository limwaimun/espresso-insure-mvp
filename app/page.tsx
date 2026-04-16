'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  useEffect(() => {
    // FAQ accordion
    document.querySelectorAll('.faq-q').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        if (!item) return;
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });

    // Smooth nav scroll
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (!href) return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Stagger reveal on scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
  :root {
    --espresso: #1E1210;
    --dark: #140C07;
    --cream: #F5ECD7;
    --cream-dim: #D4C4A8;
    --amber: #C8813A;
    --amber-light: #E8A55A;
    --warm-mid: #352012;
    --warm-border: #3A2416;
    --white: #FDFAF5;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  html { scroll-behavior: smooth; }

  body {
    background: var(--espresso);
    color: var(--cream);
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    font-size: 16px;
    line-height: 1.7;
    overflow-x: hidden;
  }

  /* NOISE TEXTURE OVERLAY */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 999;
    opacity: 0.4;
  }

  /* TYPOGRAPHY */
  h1, h2, h3, h4 {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 400;
    line-height: 1.15;
    letter-spacing: -0.01em;
  }

  .display {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(52px, 7vw, 96px);
    font-weight: 300;
    line-height: 1.05;
    letter-spacing: -0.02em;
  }

  .display em {
    font-style: italic;
    color: var(--amber-light);
  }

  /* NAV */
  nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    padding: 20px 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(to bottom, rgba(28,15,10,0.95) 0%, rgba(28,15,10,0) 100%);
  }

  .nav-logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--cream);
    text-decoration: none;
  }

  .nav-logo span {
    color: var(--amber);
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 36px;
    list-style: none;
  }

  .nav-links a {
    color: var(--cream-dim);
    text-decoration: none;
    font-size: 14px;
    letter-spacing: 0.02em;
    transition: color 0.2s;
  }

  .nav-links a:hover { color: var(--cream); }

  .nav-cta {
    background: var(--amber) !important;
    color: var(--dark) !important;
    padding: 10px 24px;
    border-radius: 100px;
    font-weight: 500 !important;
    font-size: 14px !important;
    transition: background 0.2s, transform 0.15s !important;
  }

  .nav-cta:hover {
    background: var(--amber-light) !important;
    transform: translateY(-1px);
  }

  /* HERO */
  .hero {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 140px 48px 80px;
    position: relative;
    overflow: hidden;
  }

  .hero-bg {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 80% 60% at 60% 40%, rgba(200,129,58,0.12) 0%, transparent 70%),
                radial-gradient(ellipse 50% 50% at 10% 80%, rgba(200,129,58,0.06) 0%, transparent 60%);
    pointer-events: none;
  }

  .hero-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(200,129,58,0.15);
    border: 1px solid rgba(200,129,58,0.3);
    color: var(--amber-light);
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 8px 18px;
    border-radius: 100px;
    margin-bottom: 36px;
    width: fit-content;
    animation: fadeUp 0.8s ease both;
  }

  .hero-tag::before {
    content: '';
    width: 6px; height: 6px;
    background: var(--amber);
    border-radius: 50%;
    animation: pulse 2s ease infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .hero h1 {
    max-width: 820px;
    margin-bottom: 28px;
    animation: fadeUp 0.8s 0.1s ease both;
  }

  .hero-sub {
    font-size: 18px;
    color: var(--cream-dim);
    max-width: 520px;
    margin-bottom: 48px;
    font-weight: 300;
    animation: fadeUp 0.8s 0.2s ease both;
  }

  .hero-actions {
    display: flex;
    align-items: center;
    gap: 20px;
    animation: fadeUp 0.8s 0.3s ease both;
  }

  .btn-primary {
    background: var(--amber);
    color: var(--dark);
    padding: 16px 36px;
    border-radius: 100px;
    font-size: 15px;
    font-weight: 500;
    text-decoration: none;
    transition: background 0.2s, transform 0.15s;
    letter-spacing: 0.01em;
  }

  .btn-primary:hover {
    background: var(--amber-light);
    transform: translateY(-2px);
  }

  .btn-ghost {
    color: var(--cream-dim);
    font-size: 14px;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: color 0.2s;
    letter-spacing: 0.02em;
  }

  .btn-ghost:hover { color: var(--cream); }
  .btn-ghost::after { content: '→'; }

  .hero-stat-row {
    display: flex;
    gap: 48px;
    margin-top: 72px;
    padding-top: 48px;
    border-top: 1px solid var(--warm-border);
    animation: fadeUp 0.8s 0.4s ease both;
  }

  .hero-stat-value {
    font-family: 'Cormorant Garamond', serif;
    font-size: 36px;
    font-weight: 500;
    color: var(--cream);
    line-height: 1;
  }

  .hero-stat-label {
    font-size: 13px;
    color: var(--cream-dim);
    margin-top: 6px;
    letter-spacing: 0.02em;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* WHATSAPP MOCKUP */
  .hero-visual {
    position: absolute;
    right: 48px;
    top: 50%;
    transform: translateY(-50%);
    width: 340px;
    animation: fadeUp 0.8s 0.5s ease both;
  }

  .wa-phone {
    background: #111B21;
    border-radius: 32px;
    padding: 28px 0 20px;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04);
    overflow: hidden;
  }

  .wa-header {
    padding: 0 20px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .wa-avatar {
    width: 38px; height: 38px;
    background: linear-gradient(135deg, var(--amber) 0%, #8B4513 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 16px;
    font-weight: 500;
    color: white;
    flex-shrink: 0;
  }

  .wa-header-info { flex: 1; }
  .wa-name { font-size: 14px; font-weight: 500; color: #E9EDEF; }
  .wa-status { font-size: 12px; color: #8696A0; }

  .wa-messages {
    padding: 16px 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 320px;
  }

  .wa-msg {
    max-width: 85%;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.5;
    animation: msgIn 0.4s ease both;
  }

  .wa-msg.received {
    background: #202C33;
    color: #E9EDEF;
    align-self: flex-start;
    border-radius: 0 8px 8px 8px;
  }

  .wa-msg.sent {
    background: #005C4B;
    color: #E9EDEF;
    align-self: flex-end;
    border-radius: 8px 8px 0 8px;
  }

  .wa-msg.maya {
    background: linear-gradient(135deg, #1A3A2A 0%, #0D2B1F 100%);
    border: 1px solid rgba(200,129,58,0.2);
    color: #E9EDEF;
    align-self: flex-start;
    border-radius: 0 8px 8px 8px;
  }

  .wa-msg-sender {
    font-size: 11px;
    color: var(--amber-light);
    margin-bottom: 3px;
    font-weight: 500;
  }

  .wa-time { font-size: 10px; color: #8696A0; text-align: right; margin-top: 3px; }

  .wa-typing {
    background: #202C33;
    border-radius: 0 8px 8px 8px;
    padding: 10px 14px;
    align-self: flex-start;
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .wa-typing span {
    width: 6px; height: 6px;
    background: #8696A0;
    border-radius: 50%;
    animation: typing 1.2s ease infinite;
  }

  .wa-typing span:nth-child(2) { animation-delay: 0.2s; }
  .wa-typing span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes typing {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-4px); opacity: 1; }
  }

  @keyframes msgIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  /* SECTION COMMON */
  section { padding: 100px 48px; }

  .section-tag {
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--amber);
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .section-tag::before {
    content: '';
    width: 24px; height: 1px;
    background: var(--amber);
  }

  .section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(36px, 4vw, 56px);
    font-weight: 400;
    line-height: 1.1;
    margin-bottom: 16px;
  }

  .section-title em {
    font-style: italic;
    color: var(--amber-light);
  }

  .section-sub {
    color: var(--cream-dim);
    font-size: 17px;
    max-width: 540px;
    font-weight: 300;
  }

  .divider {
    width: 100%;
    height: 1px;
    background: var(--warm-border);
  }

  /* PROBLEM SECTION */
  .problem {
    background: var(--dark);
  }

  .problem-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: var(--warm-border);
    border: 1px solid var(--warm-border);
    border-radius: 16px;
    overflow: hidden;
    margin-top: 60px;
  }

  .problem-item {
    background: var(--dark);
    padding: 36px 40px;
    position: relative;
  }



  .problem-item h4 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px;
    font-weight: 400;
    margin-bottom: 10px;
    color: var(--cream);
  }

  .problem-item p {
    font-size: 14px;
    color: var(--cream-dim);
    line-height: 1.7;
  }

  /* HOW IT WORKS */
  .steps-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
    margin-top: 64px;
    position: relative;
  }

  .step {
    padding: 40px 36px;
    background: var(--warm-mid);
    border-radius: 12px;
    position: relative;
    transition: background 0.25s;
  }

  .step:hover { background: #4A2A18; }

  .step-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 64px;
    font-weight: 300;
    color: rgba(200,129,58,0.2);
    line-height: 1;
    margin-bottom: 20px;
  }

  .step h3 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 26px;
    font-weight: 400;
    margin-bottom: 12px;
    color: var(--cream);
  }

  .step p {
    font-size: 14px;
    color: var(--cream-dim);
    line-height: 1.75;
  }

  .step-arrow {
    position: absolute;
    right: -20px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--amber);
    font-size: 20px;
    z-index: 2;
  }

  /* FEATURES */
  .features { background: var(--dark); }

  .features-header {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    align-items: end;
    margin-bottom: 64px;
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: var(--warm-border);
    border: 1px solid var(--warm-border);
    border-radius: 16px;
    overflow: hidden;
  }

  .feature-card {
    background: var(--dark);
    padding: 36px 32px;
    transition: background 0.2s;
  }

  .feature-card:hover { background: #1A0F09; }

  .feature-icon {
    width: 44px; height: 44px;
    background: rgba(200,129,58,0.12);
    border: 1px solid rgba(200,129,58,0.2);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    margin-bottom: 20px;
  }

  .feature-card h4 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px;
    font-weight: 400;
    margin-bottom: 8px;
    color: var(--cream);
  }

  .feature-card p {
    font-size: 13.5px;
    color: var(--cream-dim);
    line-height: 1.7;
  }

  .feature-tag {
    display: inline-block;
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--amber);
    border: 1px solid rgba(200,129,58,0.3);
    padding: 3px 10px;
    border-radius: 100px;
    margin-bottom: 12px;
  }

  /* PRICING */
  .pricing-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-top: 64px;
  }

  .pricing-card {
    background: var(--warm-mid);
    border: 1px solid var(--warm-border);
    border-radius: 16px;
    padding: 36px 28px;
    position: relative;
    transition: transform 0.2s, border-color 0.2s;
  }

  .pricing-card:hover {
    transform: translateY(-4px);
    border-color: rgba(200,129,58,0.3);
  }

  .pricing-card.featured {
    background: linear-gradient(145deg, #3D2215 0%, #2A1508 100%);
    border-color: var(--amber);
  }

  .pricing-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--amber);
    color: var(--dark);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 4px 16px;
    border-radius: 100px;
    white-space: nowrap;
  }

  .pricing-tier {
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--amber);
    margin-bottom: 16px;
  }

  .pricing-price {
    font-family: 'Cormorant Garamond', serif;
    font-size: 52px;
    font-weight: 300;
    color: var(--cream);
    line-height: 1;
    margin-bottom: 4px;
  }

  .pricing-price sup {
    font-size: 22px;
    vertical-align: super;
  }

  .pricing-period {
    font-size: 13px;
    color: var(--cream-dim);
    margin-bottom: 24px;
  }

  .pricing-desc {
    font-size: 13.5px;
    color: var(--cream-dim);
    line-height: 1.6;
    margin-bottom: 28px;
    padding-bottom: 28px;
    border-bottom: 1px solid var(--warm-border);
  }

  .pricing-features {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 32px;
  }

  .pricing-features li {
    font-size: 13.5px;
    color: var(--cream-dim);
    display: flex;
    align-items: flex-start;
    gap: 10px;
    line-height: 1.5;
  }

  .pricing-features li::before {
    content: '✓';
    color: var(--amber);
    font-size: 13px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .btn-pricing {
    display: block;
    text-align: center;
    padding: 13px 20px;
    border-radius: 100px;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s;
    letter-spacing: 0.01em;
  }

  .btn-pricing-outline {
    border: 1px solid rgba(200,129,58,0.4);
    color: var(--amber-light);
  }

  .btn-pricing-outline:hover {
    border-color: var(--amber);
    background: rgba(200,129,58,0.08);
  }

  .btn-pricing-filled {
    background: var(--amber);
    color: var(--dark);
  }

  .btn-pricing-filled:hover {
    background: var(--amber-light);
  }

  .pricing-note {
    text-align: center;
    margin-top: 28px;
    font-size: 13px;
    color: var(--cream-dim);
  }

  /* SETUP SECTION */
  .setup { background: var(--dark); }

  .setup-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    align-items: start;
    margin-top: 64px;
  }

  .setup-steps {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .setup-step {
    display: flex;
    gap: 24px;
    padding: 28px 0;
    border-bottom: 1px solid var(--warm-border);
    cursor: pointer;
    transition: all 0.2s;
  }

  .setup-step:first-child { padding-top: 0; }
  .setup-step:last-child { border-bottom: none; }

  .setup-step:hover .setup-step-num { background: var(--amber); color: var(--dark); }

  .setup-step-num {
    width: 36px; height: 36px;
    border: 1px solid rgba(200,129,58,0.4);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 16px;
    color: var(--amber);
    flex-shrink: 0;
    transition: all 0.2s;
  }

  .setup-step-content h4 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px;
    font-weight: 400;
    color: var(--cream);
    margin-bottom: 6px;
  }

  .setup-step-content p {
    font-size: 14px;
    color: var(--cream-dim);
    line-height: 1.65;
  }

  .setup-step-content code {
    background: rgba(200,129,58,0.12);
    border: 1px solid rgba(200,129,58,0.2);
    color: var(--amber-light);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-family: monospace;
  }

  .setup-callout {
    background: var(--warm-mid);
    border: 1px solid var(--warm-border);
    border-radius: 16px;
    padding: 36px;
    position: sticky;
    top: 100px;
  }

  .setup-callout h3 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 400;
    margin-bottom: 20px;
  }

  .setup-callout p {
    font-size: 14px;
    color: var(--cream-dim);
    line-height: 1.7;
    margin-bottom: 16px;
  }

  .setup-time {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(200,129,58,0.1);
    border: 1px solid rgba(200,129,58,0.2);
    border-radius: 10px;
    padding: 14px 18px;
    margin-top: 24px;
    margin-bottom: 24px;
  }

  .setup-time-icon { font-size: 22px; }

  .setup-time-text {
    font-size: 13px;
    color: var(--amber-light);
    line-height: 1.4;
  }

  .setup-time-text strong {
    display: block;
    font-weight: 500;
    font-size: 16px;
    color: var(--cream);
  }

  .requirement-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .requirement-list li {
    font-size: 13.5px;
    color: var(--cream-dim);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .requirement-list li::before {
    content: '';
    width: 6px; height: 6px;
    background: var(--amber);
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* FAQ */
  .faq-list {
    max-width: 740px;
    margin-top: 56px;
  }

  .faq-item {
    border-bottom: 1px solid var(--warm-border);
  }

  .faq-q {
    width: 100%;
    background: none;
    border: none;
    color: var(--cream);
    font-family: 'DM Sans', sans-serif;
    font-size: 16px;
    font-weight: 400;
    text-align: left;
    padding: 24px 0;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    transition: color 0.2s;
  }

  .faq-q:hover { color: var(--amber-light); }

  .faq-q::after {
    content: '+';
    font-size: 22px;
    color: var(--amber);
    flex-shrink: 0;
    transition: transform 0.2s;
  }

  .faq-item.open .faq-q::after { transform: rotate(45deg); }

  .faq-a {
    font-size: 14px;
    color: var(--cream-dim);
    line-height: 1.75;
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease, padding 0.3s;
  }

  .faq-item.open .faq-a {
    max-height: 300px;
    padding-bottom: 24px;
  }

  /* CTA SECTION */
  .cta-section {
    text-align: center;
    padding: 120px 48px;
    position: relative;
    overflow: hidden;
  }

  .cta-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 60% 60% at 50% 50%, rgba(200,129,58,0.1) 0%, transparent 70%);
    pointer-events: none;
  }

  .cta-section h2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(40px, 5vw, 68px);
    font-weight: 300;
    margin-bottom: 20px;
  }

  .cta-section h2 em {
    font-style: italic;
    color: var(--amber-light);
  }

  .cta-section p {
    color: var(--cream-dim);
    font-size: 17px;
    max-width: 480px;
    margin: 0 auto 40px;
  }

  /* FOOTER */
  footer {
    padding: 48px;
    border-top: 1px solid var(--warm-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .footer-logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--cream-dim);
  }

  .footer-logo span { color: var(--amber); }

  .footer-links {
    display: flex;
    gap: 28px;
    list-style: none;
  }

  .footer-links a {
    font-size: 13px;
    color: var(--cream-dim);
    text-decoration: none;
    transition: color 0.2s;
  }

  .footer-links a:hover { color: var(--cream); }

  .footer-copy {
    font-size: 12px;
    color: #5C4030;
  }

  /* RESPONSIVE */
  /* ===== RESPONSIVE ===== */
  @media (max-width: 1100px) {
    .hero-visual { display: none; }
    .pricing-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 768px) {
    nav { padding: 16px 24px; }
    .nav-links { gap: 16px; }
    .nav-links li:nth-child(1),
    .nav-links li:nth-child(2),
    .nav-links li:nth-child(3),
    .nav-links li:nth-child(4) { display: none; }
    section { padding: 60px 20px; }
    .hero { padding: 100px 20px 60px; min-height: auto; }
    .hero-visual { display: none; }
    .display { font-size: 36px; }
    .hero-sub { font-size: 16px; }
    .hero-stat-row { flex-wrap: wrap; gap: 24px; }
    .hero-stat-value { font-size: 28px; }
    .hero-actions { flex-wrap: wrap; }
    .section-title { font-size: 30px; }
    .section-sub { font-size: 15px; }
    .problem-grid { grid-template-columns: 1fr; }
    .steps-row { grid-template-columns: 1fr; }
    .step-arrow { display: none; }
    .features-header { grid-template-columns: 1fr; gap: 24px; }
    .feature-grid { grid-template-columns: 1fr; }
    .pricing-grid { grid-template-columns: 1fr; }
    .setup-grid { grid-template-columns: 1fr; }
    .setup-callout { position: static; margin-top: 40px; }
    .cta-section { padding: 80px 20px; }
    .cta-section h2 { font-size: 32px; }
    footer { flex-direction: column; gap: 24px; text-align: center; padding: 32px 20px; }
    .footer-links { flex-wrap: wrap; justify-content: center; gap: 16px; }
  }

  @media (max-width: 480px) {
    nav { padding: 14px 16px; }
    .nav-logo { font-size: 18px; }
    .nav-cta { padding: 8px 16px; font-size: 12px; }
    .hero { padding: 80px 16px 40px; }
    .display { font-size: 28px; }
    .hero-sub { font-size: 14px; }
    .hero-stat-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .hero-stat-value { font-size: 24px; }
    .hero-actions { flex-direction: column; align-items: flex-start; }
    section { padding: 48px 16px; }
    .section-title { font-size: 26px; }
    .problem-item { padding: 24px 20px; }
    .step { padding: 28px 20px; }
    .step-num { font-size: 48px; }
    .feature-card { padding: 24px 20px; }
    .pricing-card { padding: 28px 20px; }
    .pricing-price { font-size: 40px; }
    .faq-q { font-size: 15px; padding: 20px 0; }
    .cta-section { padding: 60px 16px; }
    .cta-section h2 { font-size: 26px; }
    .setup-step { gap: 16px; }
  }
` }} />
      {/* NAV */}
<nav>
  <a href="#" className="nav-logo">espresso<span>.</span>insure</a>
  <ul className="nav-links">
    <li><a href="#how-it-works">How it works</a></li>
    <li><a href="#features">Features</a></li>
    <li><a href="#pricing">Pricing</a></li>
    <li><a href="#setup">Setup</a></li>
    <li><a href="/login">Login</a></li>
    <li><a href="/trial" className="nav-cta">Start free trial</a></li>
  </ul>
</nav>

{/* HERO */}
<section className="hero">
  <div className="hero-bg"></div>

  <div className="hero-tag">Now live in Singapore</div>

  <h1 className="display">
    Your AI back-office.<br/>
    <em>Inside WhatsApp.</em>
  </h1>

  <p className="hero-sub">
    Maya handles intake, renewals, claims, and client service — 24/7, inside the WhatsApp groups you already use.
  </p>

  <div className="hero-actions">
    <a href="/trial" className="btn-primary">Start 14-day free trial</a>
    <a href="#how-it-works" className="btn-ghost">See how it works</a>
  </div>

  <div className="hero-stat-row">
    <div>
      <div className="hero-stat-value">24/7</div>
      <div className="hero-stat-label">Maya is always on</div>
    </div>
    <div>
      <div className="hero-stat-value">&lt;30min</div>
      <div className="hero-stat-label">Setup to first client</div>
    </div>
    <div>
      <div className="hero-stat-value">0</div>
      <div className="hero-stat-label">App downloads needed</div>
    </div>
    <div>
      <div className="hero-stat-value">SGD 29</div>
      <div className="hero-stat-label">Per month to start</div>
    </div>
  </div>

  {/* WhatsApp mockup */}
  <div className="hero-visual">
    <div className="wa-phone">
      <div className="wa-header">
        <div className="wa-avatar">M</div>
        <div className="wa-header-info">
          <div className="wa-name">Maya · Espresso</div>
          <div className="wa-status">AI assistant to David Tan</div>
        </div>
      </div>
      <div className="wa-messages">
        <div className="wa-msg received">
          <div>Hi! I saw your ad — need insurance for my café.</div>
          <div className="wa-time">9:47 AM</div>
        </div>
        <div className="wa-msg maya">
          <div className="wa-msg-sender">Maya</div>
          <div>Hi Sarah! Great to meet you. I'm Maya, David's assistant — I'll help get your café sorted properly. Can I ask a couple of quick questions first?</div>
          <div className="wa-time">9:47 AM</div>
        </div>
        <div className="wa-msg received">
          <div>Sure, go ahead!</div>
          <div className="wa-time">9:48 AM</div>
        </div>
        <div className="wa-msg maya">
          <div className="wa-msg-sender">Maya</div>
          <div>How many staff do you currently have, including yourself?</div>
          <div className="wa-time">9:48 AM</div>
        </div>
        <div className="wa-msg received">
          <div>5 full-time, 2 part-time</div>
          <div className="wa-time">9:49 AM</div>
        </div>
        <div className="wa-typing">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  </div>
</section>

<div className="divider"></div>

{/* PROBLEM */}
<section className="problem" id="problem">
  <div className="section-tag">The problem</div>
  <h2 className="section-title">You're running a<br/><em>500-client business</em> on WhatsApp and Excel.</h2>
  <p className="section-sub">Your best hours are going to admin that doesn't earn you a cent.</p>

  <div className="problem-grid">
    <div className="problem-item">
      <div style={{"width":"44px","height":"44px","background":"rgba(200,129,58,0.12)","border":"1px solid rgba(200,129,58,0.2)","borderRadius":"10px","display":"flex","alignItems":"center","justifyContent":"center","marginBottom":"16px"}}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C8813A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><h4>New enquiries go cold</h4>
      <p>A prospect messages while you're busy. By the time you respond, they've moved on.</p>
    </div>
    <div className="problem-item">
      <div style={{"width":"44px","height":"44px","background":"rgba(200,129,58,0.12)","border":"1px solid rgba(200,129,58,0.2)","borderRadius":"10px","display":"flex","alignItems":"center","justifyContent":"center","marginBottom":"16px"}}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C8813A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div><h4>Renewals sneak up on you</h4>
      <p>You track renewals in spreadsheets and memory. One missed renewal is a client lost.</p>
    </div>
    <div className="problem-item">
      <div style={{"width":"44px","height":"44px","background":"rgba(200,129,58,0.12)","border":"1px solid rgba(200,129,58,0.2)","borderRadius":"10px","display":"flex","alignItems":"center","justifyContent":"center","marginBottom":"16px"}}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C8813A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><h4>Claims catch you off guard</h4>
      <p>A client calls at 9pm in a panic. You scramble to find the policy and walk them through the process.</p>
    </div>
    <div className="problem-item">
      <div style={{"width":"44px","height":"44px","background":"rgba(200,129,58,0.12)","border":"1px solid rgba(200,129,58,0.2)","borderRadius":"10px","display":"flex","alignItems":"center","justifyContent":"center","marginBottom":"16px"}}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C8813A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg></div><h4>Evenings lost to admin</h4>
      <p>Follow-ups, recommendations, forms — all after hours, all unpaid, all keeping you from selling.</p>
    </div>
  </div>
</section>

{/* HOW IT WORKS */}
<section id="how-it-works">
  <div className="section-tag">How it works</div>
  <h2 className="section-title">Three steps.<br/><em>30 minutes.</em> You're live.</h2>
  <p className="section-sub">No app to download. No platform to learn. Just WhatsApp.</p>

  <div className="steps-row">
    <div className="step">
      <div className="step-num">01</div>
      <h3>Sign up and connect</h3>
      <p>Create your account, add Maya's number, upload your client list. Under 30 minutes.</p>
      <div className="step-arrow">→</div>
    </div>
    <div className="step">
      <div className="step-num">02</div>
      <h3>Add Maya to any client group</h3>
      <p>Create a WhatsApp group with your client and add Maya. She handles intake, follow-ups, and renewals from there.</p>
      <div className="step-arrow">→</div>
    </div>
    <div className="step">
      <div className="step-num">03</div>
      <h3>Check your dashboard, close deals</h3>
      <p>Review client briefs, renewals, and alerts in your dashboard. You sell. Maya handles the rest.</p>
    </div>
  </div>
</section>

<div className="divider"></div>

{/* FEATURES */}
<section className="features" id="features">
  <div className="features-header">
    <div>
      <div className="section-tag">What Espresso does</div>
      <h2 className="section-title">One assistant.<br/><em>Everything</em><br/>handled.</h2>
    </div>
    <p className="section-sub">Your clients see Maya — warm, knowledgeable, always available. She handles every part of the insurance journey seamlessly.</p>
  </div>

  <div className="feature-grid">
    <div className="feature-card">
            <div className="feature-icon">🎯</div>
      <h4>Maya — Client intake</h4>
      <p>Maya handles every new enquiry 24/7 in WhatsApp. Structured discovery, complete brief, sent to your dashboard — while you sleep.</p>
    </div>
    <div className="feature-card">
            <div className="feature-icon">🗓</div>
      <h4>Renewal management</h4>
      <p>Maya tracks every policy and manages renewals automatically — 90, 60, 30, 14, and 7 days out. Never lose a client to a missed follow-up.</p>
    </div>
    <div className="feature-card">
            <div className="feature-icon">💬</div>
      <h4>Policy advisory</h4>
      <p>Client asks a coverage question? Maya pulls the answer from their policy data instantly — accurate, specific, plain English.</p>
    </div>
    <div className="feature-card">
            <div className="feature-icon">🚨</div>
      <h4>Claims support</h4>
      <p>Client has a claim? Maya guides them through the process in real time, at any hour. You get an alert and full report.</p>
    </div>
    <div className="feature-card">
            <div className="feature-icon">📄</div>
      <h4>Document management</h4>
      <p>Policy summaries, certificates, endorsements — Maya keeps every document complete and instantly retrievable.</p>
    </div>
    <div className="feature-card">
            <div className="feature-icon">📊</div>
      <h4>Quote comparison</h4>
      <p>Maya aggregates quotes, ranks by quality (not just price), and prepares a clear comparison — saving hours of portal work.</p>
    </div>
  </div>
</section>

{/* PRICING */}
<section id="pricing">
  <div className="section-tag">Pricing</div>
  <h2 className="section-title">Simple pricing.<br/><em>No hidden fees.</em></h2>
  <p className="section-sub">Start free for 14 days. No credit card required. Cancel anytime.</p>

  <div className="pricing-grid">

    {/* Solo */}
    <div className="pricing-card">
      <div className="pricing-tier">Solo</div>
      <div className="pricing-price"><sup>$</sup>29</div>
      <div className="pricing-period">SGD per month · billed monthly</div>
      <div className="pricing-desc">For IFAs getting started. Intake and renewals handled around the clock.</div>
      <ul className="pricing-features">
        <li>24/7 client intake in WhatsApp groups</li>
        <li>Full renewal management</li>
        <li>Up to 100 active clients</li>
        <li>IFA dashboard with client briefs</li>
        <li>Policy CSV import</li>
        <li>English and Mandarin support</li>
        <li>Email support</li>
      </ul>
      <a href="/trial" className="btn-pricing btn-pricing-outline">Start free trial</a>
    </div>

    {/* Pro */}
    <div className="pricing-card featured">
      <div className="pricing-badge">Most popular</div>
      <div className="pricing-tier">Pro</div>
      <div className="pricing-price"><sup>$</sup>79</div>
      <div className="pricing-period">SGD per month · billed monthly</div>
      <div className="pricing-desc">The full experience. Unlimited clients, claims support, and a portal that makes you look enterprise.</div>
      <ul className="pricing-features">
        <li>Everything in Solo</li>
        <li>Unlimited clients</li>
        <li>Policy Q&amp;A and advisory</li>
        <li>24/7 claims and FNOL support</li>
        <li>Documents and compliance</li>
        <li>Quote comparison reports</li>
        <li>Coverage gap detection alerts</li>
        <li>Client-facing policy portal</li>
        <li>Priority support</li>
      </ul>
      <a href="/trial" className="btn-pricing btn-pricing-filled">Start free trial</a>
    </div>

    {/* Team */}
    <div className="pricing-card">
      <div className="pricing-tier">Team</div>
      <div className="pricing-price"><sup>$</sup>199</div>
      <div className="pricing-period">SGD per month · up to 5 agents</div>
      <div className="pricing-desc">Share a book, a dashboard, and the full suite across up to 5 advisors.</div>
      <ul className="pricing-features">
        <li>Everything in Pro</li>
        <li>Up to 5 IFA seats</li>
        <li>Shared team dashboard</li>
        <li>Shared book of business</li>
        <li>Team renewal calendar</li>
        <li>Admin controls</li>
        <li>Dedicated onboarding call</li>
      </ul>
      <a href="/trial" className="btn-pricing btn-pricing-outline">Start free trial</a>
    </div>

    {/* Agency */}
    <div className="pricing-card">
      <div className="pricing-tier">Agency</div>
      <div className="pricing-price" style={{"fontSize":"36px","paddingTop":"8px"}}>Custom</div>
      <div className="pricing-period">Tailored for your agency</div>
      <div className="pricing-desc">White-label branding, API access, and enterprise support for 20+ advisors.</div>
      <ul className="pricing-features">
        <li>Everything in Team</li>
        <li>Unlimited IFA seats</li>
        <li>White-label Maya (your brand name)</li>
        <li>API access and integrations</li>
        <li>Custom onboarding and training</li>
        <li>Dedicated account manager</li>
        <li>SLA and compliance reporting</li>
        <li>Multi-market support</li>
      </ul>
      <a href="mailto:hello@espresso.insure" className="btn-pricing btn-pricing-outline">Contact us</a>
    </div>

  </div>

  <p className="pricing-note">All prices in SGD. Annual plans available at 2 months free. Need help choosing? <a href="mailto:hello@espresso.insure" style={{"color":"var(--amber-light)","textDecoration":"none"}}>Talk to us →</a></p>
</section>

<div className="divider"></div>

{/* SETUP GUIDE */}
<section className="setup" id="setup">
  <div className="section-tag">Setup guide</div>
  <h2 className="section-title">From sign-up to<br/><em>first client</em> in 30 minutes.</h2>
  <p className="section-sub">If you can use WhatsApp, you can use Espresso.</p>

  <div className="setup-grid">
    <div className="setup-steps">

      <div className="setup-step">
        <div className="setup-step-num">1</div>
        <div className="setup-step-content">
          <h4>Create your Espresso account</h4>
          <p>Go to <code>espresso.insure/trial</code>, enter your name, email, and mobile number. Choose your plan — or start with the 14-day free trial. No credit card needed.</p>
        </div>
      </div>

      <div className="setup-step">
        <div className="setup-step-num">2</div>
        <div className="setup-step-content">
          <h4>Save Maya's number</h4>
          <p>After sign-up, you'll receive Maya's WhatsApp number in your dashboard. Save it in your phone contacts as <code>Maya — Espresso</code>. This is the number you will add to client groups.</p>
        </div>
      </div>

      <div className="setup-step">
        <div className="setup-step-num">3</div>
        <div className="setup-step-content">
          <h4>Upload your existing policies</h4>
          <p>In your dashboard, go to <code>Clients → Import</code> and upload a CSV of your current client policies. Use our template or let the importer map your existing columns. Maya immediately begins tracking all renewals.</p>
        </div>
      </div>

      <div className="setup-step">
        <div className="setup-step-num">4</div>
        <div className="setup-step-content">
          <h4>Create your first client group</h4>
          <p>Open WhatsApp. Create a new group with yourself and a client. Add Maya's number to the group. That's it — Maya will introduce herself and take over the conversation.</p>
        </div>
      </div>

      <div className="setup-step">
        <div className="setup-step-num">5</div>
        <div className="setup-step-content">
          <h4>Watch your dashboard fill up</h4>
          <p>Every client brief, every renewal flag, and every alert appears in your dashboard in real time. Log in once a day to stay on top of your entire book.</p>
        </div>
      </div>

      <div className="setup-step">
        <div className="setup-step-num">6</div>
        <div className="setup-step-content">
          <h4>Control Maya from the group</h4>
          <p>Type <code>Maya pause</code> to silence her while you speak directly to the client. Type <code>Maya take over</code> to hand back control. Type <code>Maya brief me</code> for an instant client summary sent privately to you.</p>
        </div>
      </div>

    </div>

    <div className="setup-callout">
      <h3>What you need to get started</h3>
      <p>Espresso is designed to work with tools you already have. No new software, no technical setup, no IT department needed.</p>

      <ul className="requirement-list">
        <li>A WhatsApp account (personal or business)</li>
        <li>A smartphone with WhatsApp installed</li>
        <li>An email address for your Espresso account</li>
        <li>Your client policy list in any spreadsheet format</li>
        <li>That's it</li>
      </ul>

      <div className="setup-time">
        <div className="setup-time-icon">⏱</div>
        <div className="setup-time-text">
          <strong>Under 30 minutes</strong>
          From account creation to your first live Maya conversation
        </div>
      </div>

      <a href="/trial" className="btn-primary" style={{"display":"block","textAlign":"center","textDecoration":"none"}}>Start your free trial →</a>

      <p style={{"marginTop":"16px","fontSize":"12px","color":"var(--cream-dim)","textAlign":"center"}}>
        Questions? WhatsApp us at +65 XXXX XXXX or email <a href="mailto:hello@espresso.insure" style={{"color":"var(--amber-light)","textDecoration":"none"}}>hello@espresso.insure</a>
      </p>
    </div>
  </div>
</section>

{/* FAQ */}
<section id="faq">
  <div className="section-tag">FAQs</div>
  <h2 className="section-title">Common questions<br/>from <em>IFAs like you.</em></h2>

  <div className="faq-list">

    <div className="faq-item">
      <button className="faq-q">Do my clients know they're talking to an AI?</button>
      <div className="faq-a">Maya introduces herself as your AI assistant. She's warm, conversational, and helpful. Clients experience her as a responsive assistant who works for you. You're always in the group and can jump in anytime.</div>
    </div>

    <div className="faq-item">
      <button className="faq-q">Do I need to ask my clients to download anything?</button>
      <div className="faq-a">No. Everything runs inside WhatsApp. You add Maya to a group with your client. No app, no account, no friction.</div>
    </div>

    <div className="faq-item">
      <button className="faq-q">Is my client data safe?</button>
      <div className="faq-a">Espresso never connects to any insurer's system. You import your own data — just like using a personal spreadsheet, except smarter. All client data is encrypted, isolated to your account only, and stored in Singapore. No advisor can ever see another advisor's data. We comply with PDPA and equivalent data protection requirements. Your data is yours — we are your personal tool, not a data aggregator.</div>
    </div>

    <div className="faq-item">
      <button className="faq-q">What happens if Maya says something wrong to my client?</button>
      <div className="faq-a">You see every message in real time. Type "Maya pause" and she goes silent. Maya never makes product recommendations or commits to financial terms without your review.</div>
    </div>

    <div className="faq-item">
      <button className="faq-q">I'm a tied agent — can I still use Espresso?</button>
      <div className="faq-a">Absolutely. Even if you can only sell one insurer's products, Maya adds enormous value through client intake, renewal management, claims support, coverage gap detection, and document handling — all features that work regardless of which insurer you represent.</div>
    </div>

    <div className="faq-item">
      <button className="faq-q">Can I cancel anytime?</button>
      <div className="faq-a">Yes, completely. No lock-in contracts. Cancel from your dashboard at any time. Your data remains accessible for 30 days after cancellation so you can export everything before you go.</div>
    </div>

    <div className="faq-item">
      <button className="faq-q">Which markets does Espresso support?</button>
      <div className="faq-a">Espresso is live in Singapore. Malaysia and Philippines are launching in 2026, followed by Indonesia and Thailand. If you are based in another SEA market and want early access, email us at hello@espresso.insure.</div>
    </div>

  </div>
</section>

{/* CTA */}
<section className="cta-section">
  <h2>Stop doing admin.<br/><em>Start building your book.</em></h2>
  <p>14-day free trial. No credit card. Set up in 30 minutes. Maya could handle your next enquiry tonight.</p>
  <a href="/trial" className="btn-primary" style={{"fontSize":"16px","padding":"18px 44px"}}>Start your free trial</a>
  <p style={{"marginTop":"20px","fontSize":"13px","color":"var(--cream-dim)"}}>Already on a plan? <a href="/login" style={{"color":"var(--amber-light)","textDecoration":"none"}}>Sign in →</a></p>
</section>

{/* FOOTER */}
<footer>
  <div className="footer-logo">espresso<span>.</span>insure</div>
  <ul className="footer-links">
    <li><a href="#how-it-works">How it works</a></li>
    <li><a href="#pricing">Pricing</a></li>
    <li><a href="#setup">Setup</a></li>
    <li><a href="mailto:hello@espresso.insure">Contact</a></li>
    <li><a href="#">Privacy</a></li>
    <li><a href="#">Terms</a></li>
  </ul>
  <div className="footer-copy">© 2026 Espresso. All rights reserved.</div>
</footer>
    </>
  );
}
