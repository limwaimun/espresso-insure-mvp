import React from 'react';
import Link from 'next/link';
import HeroVisual from '@/components/HeroVisual';

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero min-h-screen flex flex-col justify-center px-12 py-35 relative overflow-hidden">
        <div className="hero-bg absolute inset-0 pointer-events-none bg-radial-gradient(ellipse_80%_60%_at_60%_40%,rgba(200,129,58,0.12)_0%,transparent_70%),radial-gradient(ellipse_50%_50%_at_10%_80%,rgba(200,129,58,0.06)_0%,transparent_60%)" />
        
        <div className="hero-tag inline-flex items-center gap-2 bg-amber/15 border border-amber/30 text-amber-light text-12 tracking-wider uppercase px-4.5 py-2 rounded-full mb-9 w-fit animate-fadeUp">
          <div className="w-1.5 h-1.5 bg-amber rounded-full animate-pulse" />
          AI-Powered Insurance Platform
        </div>
        
        <h1 className="display font-display font-light text-cream max-w-205 mb-7 animate-fadeUp animation-delay-100">
          Your AI back‑office.<br />
          <em className="italic text-amber-light">Inside WhatsApp.</em>
        </h1>
        
        <p className="hero-sub text-18 text-cream-dim max-w-130 mb-12 font-light animate-fadeUp animation-delay-200">
          Give every solo agent the back‑office of a top‑tier brokerage. 
          Espresso is an AI‑powered business platform for insurance agents 
          and IFAs across Southeast Asia.
        </p>
        
        <div className="hero-actions flex items-center gap-5 animate-fadeUp animation-delay-300">
          <Link 
            href="/dashboard" 
            className="btn-primary bg-amber text-dark px-9 py-4 rounded-full text-15 font-medium no-underline transition-all duration-200 hover:bg-amber-light hover:-translate-y-0.5"
          >
            Start Free Trial
          </Link>
          <Link 
            href="#how-it-works" 
            className="btn-ghost text-cream-dim text-14 no-underline flex items-center gap-2 transition-colors duration-200 hover:text-cream"
          >
            See how it works
            <span>→</span>
          </Link>
        </div>
        
        <div className="hero-stat-row flex gap-12 mt-18 pt-12 border-t border-warm-border animate-fadeUp animation-delay-400">
          <div>
            <div className="hero-stat-value font-display text-36 font-medium text-cream leading-none">500+</div>
            <div className="hero-stat-label text-13 text-cream-dim mt-1.5 tracking-wide">Agents Empowered</div>
          </div>
          <div>
            <div className="hero-stat-value font-display text-36 font-medium text-cream leading-none">10K+</div>
            <div className="hero-stat-label text-13 text-cream-dim mt-1.5 tracking-wide">Policies Managed</div>
          </div>
          <div>
            <div className="hero-stat-value font-display text-36 font-medium text-cream leading-none">6</div>
            <div className="hero-stat-label text-13 text-cream-dim mt-1.5 tracking-wide">Countries Served</div>
          </div>
          <div>
            <div className="hero-stat-value font-display text-36 font-medium text-cream leading-none">98%</div>
            <div className="hero-stat-label text-13 text-cream-dim mt-1.5 tracking-wide">Client Satisfaction</div>
          </div>
        </div>
        
        <HeroVisual />
      </section>
      
      {/* Problem Section */}
      <section id="problem" className="problem py-30 px-12">
        <div className="max-w-160 mx-auto">
          <h2 className="font-display text-48 font-light text-cream mb-6 text-center">
            The solo agent's dilemma
          </h2>
          <p className="text-18 text-cream-dim text-center max-w-100 mx-auto mb-16 font-light">
            Independent Financial Advisors spend 60‑70% of their time on admin, 
            leaving little room for growth. They lack the back‑office support 
            that top brokerages provide.
          </p>
          
          <div className="grid grid-cols-3 gap-8">
            <div className="card card-amber p-8">
              <div className="text-amber text-32 mb-4">⏰</div>
              <h3 className="font-display text-24 font-medium text-cream mb-3">Time‑consuming admin</h3>
              <p className="text-cream-dim text-15">
                Client intake, quote generation, policy comparisons, renewal tracking—all manual, all time‑consuming.
              </p>
            </div>
            
            <div className="card card-info p-8">
              <div className="text-info text-32 mb-4">📊</div>
              <h3 className="font-display text-24 font-medium text-cream mb-3">Limited resources</h3>
              <p className="text-cream-dim text-15">
                Solo practitioners can't afford dedicated compliance, claims, or advisory teams like large brokerages.
              </p>
            </div>
            
            <div className="card card-danger p-8">
              <div className="text-danger text-32 mb-4">📉</div>
              <h3 className="font-display text-24 font-medium text-cream mb-3">Growth ceiling</h3>
              <p className="text-cream-dim text-15">
                Without scalable systems, agents hit a revenue plateau while larger competitors continue to grow.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section id="how-it-works" className="py-30 px-12 bg-warm-mid/30">
        <div className="max-w-160 mx-auto">
          <h2 className="font-display text-48 font-light text-cream mb-6 text-center">
            How Espresso works
          </h2>
          <p className="text-18 text-cream-dim text-center max-w-100 mx-auto mb-16 font-light">
            Six specialized AI agents work together inside WhatsApp, 
            giving you the capabilities of a full back‑office team.
          </p>
          
          <div className="grid grid-cols-2 gap-8">
            <div className="flex items-start gap-6">
              <div className="w-14 h-14 rounded-xl bg-amber/10 text-amber text-24 flex items-center justify-center flex-shrink-0">🤖</div>
              <div>
                <h3 className="font-display text-20 font-medium text-cream mb-2">AI‑Powered Client Advisory</h3>
                <p className="text-cream-dim text-15">
                  Maya provides real‑time recommendations and answers client questions 24/7 through WhatsApp.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-6">
              <div className="w-14 h-14 rounded-xl bg-info/10 text-info text-24 flex items-center justify-center flex-shrink-0">📄</div>
              <div>
                <h3 className="font-display text-20 font-medium text-cream mb-2">Automated Policy Management</h3>
                <p className="text-cream-dim text-15">
                  Instant quotes, renewal tracking, and claims processing with AI precision and speed.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-6">
              <div className="w-14 h-14 rounded-xl bg-ok/10 text-ok text-24 flex items-center justify-center flex-shrink-0">🎯</div>
              <div>
                <h3 className="font-display text-20 font-medium text-cream mb-2">Intelligent Client Intake</h3>
                <p className="text-cream-dim text-15">
                  Qualifies leads, schedules meetings, and collects client information automatically.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-6">
              <div className="w-14 h-14 rounded-xl bg-warning/10 text-warning text-24 flex items-center justify-center flex-shrink-0">📊</div>
              <div>
                <h3 className="font-display text-20 font-medium text-cream mb-2">Compliance & Reporting</h3>
                <p className="text-cream-dim text-15">
                  Ensures regulatory compliance and generates detailed performance reports.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="cta-section py-30 px-12 text-center">
        <div className="max-w-120 mx-auto">
          <h2 className="font-display text-48 font-light text-cream mb-6">
            Ready to transform your practice?
          </h2>
          <p className="text-18 text-cream-dim mb-12 font-light">
            Join 500+ agents across Southeast Asia who have already empowered 
            their practices with Espresso.
          </p>
          <Link 
            href="/dashboard" 
            className="btn-primary bg-amber text-dark px-12 py-5 rounded-full text-16 font-medium no-underline inline-block transition-all duration-200 hover:bg-amber-light hover:-translate-y-0.5"
          >
            Launch Dashboard
          </Link>
        </div>
      </section>
    </>
  );
}