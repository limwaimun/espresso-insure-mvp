'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type SessionData = {
  success: boolean;
  customer_email?: string;
  customer_name?: string;
  plan?: string;
  payment_status?: string;
  error?: string;
};

export default function ConfirmedPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found');
      setIsLoading(false);
      return;
    }

    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/stripe/session?session_id=${sessionId}`);
        const data = await res.json();
        
        if (res.ok) {
          setSessionData(data);
        } else {
          setError(data.error || 'Failed to fetch session');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#1C0F0A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          color: '#C9B99A',
        }}>
          Loading your subscription details...
        </div>
      </div>
    );
  }

  if (error || !sessionData?.success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#1C0F0A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px',
          textAlign: 'center' as const,
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: '#E53E3E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            color: '#120A06',
            fontWeight: 'bold',
          }}>
            ✗
          </div>

          <div>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '36px',
              fontWeight: 400,
              color: '#F5ECD7',
              margin: '0 0 16px 0',
            }}>
              Something went wrong
            </h1>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: '#C9B99A',
              lineHeight: 1.6,
              maxWidth: '320px',
            }}>
              {error || 'Unable to verify your payment. Please contact support.'}
            </p>
          </div>

          <Link href="/trial" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ width: '100%', maxWidth: '300px' }}>
              Try again
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1C0F0A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
        textAlign: 'center' as const,
      }}>
        {/* Green Checkmark */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: '#38A169',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
          color: '#120A06',
          fontWeight: 'bold',
        }}>
          ✓
        </div>

        {/* Heading */}
        <div>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '36px',
            fontWeight: 400,
            color: '#F5ECD7',
            margin: '0 0 16px 0',
          }}>
            You're all set!
          </h1>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#C9B99A',
            lineHeight: 1.6,
            maxWidth: '320px',
          }}>
            Welcome to Espresso, {sessionData.customer_name}! Your {sessionData.plan} plan is now active.
          </p>
          
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: 'rgba(56, 161, 105, 0.1)',
            border: '1px solid #38A169',
            borderRadius: '8px',
            textAlign: 'left' as const,
          }}>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#38A169',
              fontWeight: 500,
              marginBottom: '8px',
            }}>
              Check your email
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#C9B99A',
              lineHeight: 1.5,
            }}>
              We've sent a welcome email to {sessionData.customer_email} with your account details and next steps.
            </div>
          </div>
          
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#C9B99A',
            lineHeight: 1.6,
            maxWidth: '320px',
            marginTop: '24px',
          }}>
            Maya will message you on WhatsApp within 5 minutes to help you get started.
          </p>
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          maxWidth: '300px',
        }}>
          <button className="btn-primary" style={{ width: '100%' }}>
            Open WhatsApp
          </button>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary" style={{ width: '100%' }}>
              Go to dashboard
            </button>
          </Link>
        </div>

        {/* Footer Note */}
        <div style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '12px',
          color: '#C9B99A',
          marginTop: '24px',
        }}>
          Questions? Contact support@espresso.insure
        </div>
      </div>
    </div>
  );
}
