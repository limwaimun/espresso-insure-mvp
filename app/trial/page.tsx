'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function TrialPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    country: 'Singapore',
    plan: 'pro'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlanSelect = (plan: string) => {
    setFormData(prev => ({ ...prev, plan }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: formData.plan,
          email: formData.email,
          name: formData.name,
        }),
      });
      
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Unable to start checkout. Please try again.');
    }
  };

  const plans = [
    { id: 'solo', name: 'Solo', price: 'SGD $29/month', clients: 'Up to 100 clients' },
    { id: 'pro', name: 'Pro', price: 'SGD $79/month', clients: 'Unlimited clients', popular: true },
    { id: 'team', name: 'Team', price: 'SGD $199/month', clients: '5 advisors, unlimited clients' }
  ];

  return (
    <div className="min-h-screen bg-espresso flex flex-col items-center justify-center p-4">
      {/* Noise texture overlay from globals.css */}
      
      {/* Amber radial glow */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(200,129,58,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      
      {/* Logo */}
      <div className="mb-8 text-center" style={{ position: 'relative', zIndex: 1 }}>
        <h1 className="font-display text-40 font-400 text-cream">
          espresso<span className="text-amber">.</span>
        </h1>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md" style={{ position: 'relative', zIndex: 1 }}>
        {/* Heading */}
        <div className="text-center mb-8">
          <h2 className="font-display text-32 font-400 text-cream mb-3">
            Start your free trial
          </h2>
          <p className="font-body text-14 text-cream-dim leading-relaxed max-w-sm mx-auto">
            Set up in 5 minutes. Maya will message you on WhatsApp within minutes of signing up.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block font-body text-13 text-cream-dim mb-2">
              Full name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
              className="input"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-body text-13 text-cream-dim mb-2">
              Email address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="input"
              required
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block font-body text-13 text-cream-dim mb-2">
              WhatsApp number
            </label>
            <input
              type="tel"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              placeholder="+65 XXXX XXXX"
              className="input"
              required
            />
            <p className="font-body text-12 text-cream-dim mt-2">
              We will send you a WhatsApp message within 5 minutes to get you set up and ready.
            </p>
          </div>

          {/* Country */}
          <div>
            <label className="block font-body text-13 text-cream-dim mb-2">
              Country
            </label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="Singapore">Singapore</option>
              <option value="Malaysia">Malaysia</option>
              <option value="Philippines">Philippines</option>
              <option value="Indonesia">Indonesia</option>
              <option value="Thailand">Thailand</option>
            </select>
          </div>

          {/* Plan Selector */}
          <div>
            <label className="block font-body text-13 text-cream-dim mb-3">
              Choose your plan
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative bg-warm-mid border rounded-12 p-4 cursor-pointer transition-all duration-200 ${
                    formData.plan === plan.id
                      ? 'border-amber'
                      : 'border-warm-border hover:border-amber/50'
                  }`}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  {/* Top accent line for selected plan */}
                  {formData.plan === plan.id && (
                    <div className="absolute top-0 left-0 right-0 h-2 bg-amber rounded-t-12" />
                  )}

                  {/* Most Popular badge */}
                  {plan.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="bg-amber text-dark font-body text-10 font-500 px-2 py-1 rounded-full">
                        Most popular
                      </span>
                    </div>
                  )}

                  <div className={`pt-${plan.popular ? '2' : '0'}`}>
                    <div className="font-display text-18 font-400 text-cream mb-1">
                      {plan.name}
                    </div>
                    <div className="font-body text-14 font-500 text-amber mb-2">
                      {plan.price}
                    </div>
                    <div className="font-body text-12 text-cream-dim">
                      {plan.clients}
                    </div>
                  </div>

                  {/* Selection indicator */}
                  <div className="mt-4 flex items-center justify-center">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      formData.plan === plan.id
                        ? 'border-amber bg-amber'
                        : 'border-warm-border'
                    }`}>
                      {formData.plan === plan.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-dark" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <button
            type="submit"
            className="btn-primary w-full mt-2"
          >
            Start my 14-day free trial →
          </button>

          {/* Terms */}
          <div className="text-center space-y-2 pt-4">
            <p className="font-body text-12 text-cream-dim leading-relaxed">
              14-day free trial. No credit card charged until your trial ends. Cancel anytime.
            </p>
            <p className="font-body text-11 text-cream-dim/80 leading-relaxed">
              By signing up you agree to{' '}
              <Link href="/terms" className="text-amber hover:text-amber-light">
                Espresso's Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-amber hover:text-amber-light">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </form>

        {/* Already have an account? */}
        <div className="text-center mt-8 pt-6 border-t border-warm-border">
          <p className="font-body text-13 text-cream-dim">
            Already have an account?{' '}
            <Link href="/login" className="text-amber hover:text-amber-light font-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}