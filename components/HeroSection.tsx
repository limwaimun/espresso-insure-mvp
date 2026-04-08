import React from 'react';
import Link from 'next/link';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-color-dark to-color-warm-mid">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-cream-dim) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full bg-color-amber/10 px-4 py-2 text-sm font-medium text-color-amber ring-1 ring-inset ring-color-amber/20 mb-8">
            <span className="mr-2">✨</span>
            AI-Powered Insurance Platform
          </div>
          
          {/* Main Heading */}
          <h1 className="font-display text-5xl font-bold tracking-tight text-color-cream sm:text-6xl md:text-7xl lg:text-8xl">
            Give every solo agent the{' '}
            <span className="bg-gradient-to-r from-color-amber to-color-amber-light bg-clip-text text-transparent">
              back-office
            </span>{' '}
            of a top-tier brokerage
          </h1>
          
          {/* Subheading */}
          <p className="mx-auto mt-8 max-w-2xl text-xl text-color-cream-dim">
            Espresso is an AI-powered business platform for insurance agents and IFAs across Southeast Asia. 
            We handle your admin, advise your clients, and grow your book of business.
          </p>
          
          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="btn-primary inline-flex items-center justify-center px-8 py-4 text-lg font-semibold"
            >
              Start Free Trial
              <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/demo"
              className="btn-secondary inline-flex items-center justify-center px-8 py-4 text-lg font-semibold"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch Demo
            </Link>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-16">
            <p className="text-sm font-semibold uppercase tracking-wider text-color-cream-dim mb-6">
              Trusted by insurance professionals across Southeast Asia
            </p>
            <div className="flex flex-wrap justify-center gap-8 opacity-70">
              {['Singapore', 'Malaysia', 'Indonesia', 'Thailand', 'Philippines', 'Vietnam'].map((country) => (
                <div key={country} className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-color-amber mr-2" />
                  <span className="text-color-cream font-medium">{country}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Bar */}
      <div className="border-t border-color-warm-border bg-color-dark/50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Agents Empowered', value: '500+' },
              { label: 'Policies Managed', value: '10K+' },
              { label: 'Countries Served', value: '6' },
              { label: 'Client Satisfaction', value: '98%' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-display font-bold text-color-amber">{stat.value}</div>
                <div className="text-sm text-color-cream-dim mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;