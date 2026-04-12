'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function TrialPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    country: 'Singapore',
    plan: 'solo'
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
    { id: 'solo', name: 'Solo', price: 'SGD $29/month', clients: 'Up to 100 clients', popular: true },
    { id: 'pro', name: 'Pro', price: 'SGD $79/month', clients: 'Unlimited clients' },
    { id: 'team', name: 'Team', price: 'SGD $199/month', clients: '5 advisors, unlimited clients' }
  ];

  return (
    <>
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
      
      {/* Main Content Container */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '480px',
        padding: '0 16px',
      }}>
        {/* Logo */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '40px',
            fontWeight: 400,
            color: '#F5ECD7',
            margin: 0,
          }}>
            espresso<span style={{ color: '#C8813A' }}>.</span>
          </h1>
        </div>

        {/* Heading */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '32px',
            fontWeight: 400,
            color: '#F5ECD7',
            margin: '0 0 12px 0',
          }}>
            Start your free trial
          </h2>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#C9B99A',
            lineHeight: 1.6,
            maxWidth: '380px',
            margin: '0 auto',
          }}>
            Set up in 5 minutes. Maya will message you on WhatsApp within minutes of signing up.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}>
          {/* Full Name */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
              marginBottom: '8px',
            }}>
              Full name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
              required
              className="input"
            />
          </div>

          {/* Email */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
              marginBottom: '8px',
            }}>
              Email address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              className="input"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
              marginBottom: '8px',
            }}>
              WhatsApp number
            </label>
            <input
              type="tel"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              placeholder="+65 / +60 / +63 / +62 / +66 / +84"
              required
              className="input"
            />
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#C9B99A',
              marginTop: '8px',
              lineHeight: 1.5,
            }}>
              We will send you a WhatsApp message within 5 minutes to get you set up and ready.
            </p>
          </div>

          {/* Country */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
              marginBottom: '8px',
            }}>
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
              <option value="Vietnam">Vietnam</option>
            </select>
          </div>

          {/* Plan Selector */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
              marginBottom: '12px',
            }}>
              Choose your plan
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '12px',
              paddingTop: '16px',
            }}>
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => handlePlanSelect(plan.id)}
                  style={{
                    position: 'relative',
                    background: '#3D2215',
                    border: formData.plan === plan.id 
                      ? '1px solid #C8813A' 
                      : '1px solid #2E1A0E',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                >
                  {/* Top accent line when selected */}
                  {formData.plan === plan.id && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: '#C8813A',
                      borderRadius: '12px 12px 0 0',
                    }} />
                  )}

                  {/* Most popular badge */}
                  {plan.popular && (
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#C8813A',
                      color: '#120A06',
                      fontSize: '10px',
                      fontWeight: 500,
                      padding: '2px 10px',
                      borderRadius: '100px',
                      whiteSpace: 'nowrap',
                      fontFamily: 'DM Sans, sans-serif',
                    }}>
                      Most popular
                    </div>
                  )}

                  <div style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: '18px',
                    fontWeight: 400,
                    color: '#F5ECD7',
                    marginBottom: '4px',
                    marginTop: plan.popular ? '8px' : '0',
                  }}>
                    {plan.name}
                  </div>

                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#C8813A',
                    marginBottom: '8px',
                  }}>
                    {plan.price}
                  </div>

                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '12px',
                    color: '#C9B99A',
                  }}>
                    {plan.clients}
                  </div>

                  {/* Selection indicator */}
                  <div style={{
                    marginTop: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: formData.plan === plan.id 
                        ? '2px solid #C8813A' 
                        : '2px solid #2E1A0E',
                      background: formData.plan === plan.id ? '#C8813A' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {formData.plan === plan.id && (
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#120A06',
                        }} />
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
            className="btn-primary"
            style={{
              marginTop: '8px',
            }}
          >
            Start my 14-day free trial →
          </button>

          {/* Terms */}
          <div style={{
            textAlign: 'center',
            paddingTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#C9B99A',
              lineHeight: 1.5,
            }}>
              14-day free trial. No credit card charged until your trial ends. Cancel anytime.
            </p>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              color: 'rgba(201, 185, 154, 0.8)',
              lineHeight: 1.5,
            }}>
              By signing up you agree to{' '}
              <Link href="/terms" style={{
                color: '#C8813A',
                textDecoration: 'none',
              }}>
                Espresso's Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" style={{
                color: '#C8813A',
                textDecoration: 'none',
              }}>
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </form>

        {/* Already have an account? */}
        <div style={{
          textAlign: 'center',
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid #2E1A0E',
        }}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            color: '#C9B99A',
          }}>
            Already have an account?{' '}
            <Link href="/login" style={{
              color: '#C8813A',
              fontWeight: 500,
              textDecoration: 'none',
            }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}