'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function TrialPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          whatsapp: formData.whatsapp,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to create account');
        setIsLoading(false);
        return;
      }
      
      // Redirect to confirmed page on success
      window.location.href = '/confirmed';
    } catch (error) {
      console.error('Signup error:', error);
      setError('Unable to create account. Please try again.');
      setIsLoading(false);
    }
  };

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
            No credit card required. Get 14 days free to try Espresso with your clients.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}>
          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(229, 62, 62, 0.1)',
              border: '1px solid #E53E3E',
              borderRadius: '8px',
              padding: '12px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#E53E3E',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}
          
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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

          {/* CTA Button */}
          <button
            type="submit"
            className="btn-primary"
            style={{
              marginTop: '8px',
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Start My 14-Day Trial'}
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
              14-day free trial. No credit card required. Cancel anytime.
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