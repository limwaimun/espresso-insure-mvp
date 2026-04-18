'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function TrialPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    whatsapp: '',
    company: '',
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
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          whatsapp: formData.whatsapp,
          company: formData.company || null,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to create account');
        setIsLoading(false);
        return;
      }
      
      window.location.href = '/confirmed';
    } catch (error) {
      console.error('Signup error:', error);
      setError('Unable to create account. Please try again.');
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(200,129,58,0.2)',
    borderRadius: '8px',
    color: '#F5ECD7',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '12px',
    color: '#C9B99A',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '6px',
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

      <div style={{
        minHeight: '100vh',
        background: '#0D0603',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <Link href="/" style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '24px',
          fontWeight: 400,
          color: '#F5ECD7',
          textDecoration: 'none',
          marginBottom: '40px',
          letterSpacing: '0.02em',
        }}>
          espresso<span style={{ color: '#C8813A' }}>.</span>
        </Link>

        {/* Card */}
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(28, 15, 10, 0.8)',
          border: '1px solid #2E1A0E',
          borderRadius: '16px',
          padding: '40px',
        }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '28px',
            fontWeight: 400,
            color: '#F5ECD7',
            margin: '0 0 8px',
          }}>
            Start your free trial
          </h1>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#C9B99A',
            margin: '0 0 32px',
          }}>
            14 days free. No credit card required.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Name */}
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input
                name="name"
                type="text"
                required
                placeholder="Lim Wai Mun"
                value={formData.name}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email *</label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label style={labelStyle}>WhatsApp Number *</label>
              <input
                name="whatsapp"
                type="tel"
                required
                placeholder="+65 9123 4567"
                value={formData.whatsapp}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            {/* Company (optional) */}
            <div>
              <label style={labelStyle}>
                Company / Agency <span style={{ color: '#C9B99A', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <input
                name="company"
                type="text"
                placeholder="e.g. Wayne & Co Financial"
                value={formData.company}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password *</label>
              <input
                name="password"
                type="password"
                required
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label style={labelStyle}>Confirm Password *</label>
              <input
                name="confirmPassword"
                type="password"
                required
                placeholder="Repeat your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            {error && (
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#E53E3E',
                margin: 0,
                padding: '10px 14px',
                background: 'rgba(229,62,62,0.1)',
                borderRadius: '6px',
                border: '1px solid rgba(229,62,62,0.2)',
              }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px',
                background: isLoading ? '#2E1A0E' : '#C8813A',
                color: isLoading ? '#C9B99A' : '#120A06',
                border: 'none',
                borderRadius: '8px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '15px',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                marginTop: '4px',
              }}
            >
              {isLoading ? 'Creating account…' : 'Start free trial →'}
            </button>
          </form>

          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px',
            color: '#C9B99A',
            textAlign: 'center',
            marginTop: '24px',
            marginBottom: 0,
          }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#C8813A', textDecoration: 'none' }}>
              Log in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
