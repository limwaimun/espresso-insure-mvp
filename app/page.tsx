import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{
      backgroundColor: '#1C0F0A',
      color: '#F5ECD7',
      minHeight: '100vh',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      {/* NAVBAR */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1C0F0A',
        borderBottom: '1px solid #2E1A0E',
        padding: '16px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '24px',
          fontWeight: 600,
          color: '#F5ECD7',
        }}>
          espresso.
        </div>

        {/* Right side: Login + Trial button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/login" style={{
            color: '#C9B99A',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
          }}>
            Login
          </Link>
          <Link href="/trial" style={{
            backgroundColor: '#C8813A',
            color: '#120A06',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600,
            padding: '10px 20px',
            borderRadius: '6px',
            transition: 'background-color 0.2s',
          }}>
            Start free trial
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '120px 40px 80px',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '64px',
          fontWeight: 400,
          lineHeight: 1.1,
          marginBottom: '24px',
          color: '#F5ECD7',
        }}>
          Give every solo agent the back-office of a top-tier brokerage.
        </h1>
        
        <p style={{
          fontSize: '20px',
          lineHeight: 1.6,
          color: '#C9B99A',
          marginBottom: '40px',
          maxWidth: '700px',
        }}>
          Maya is your AI assistant inside WhatsApp. She manages renewals, flags coverage gaps, sends birthday greetings, and keeps your clients engaged — so you can focus on selling.
        </p>

        <div style={{ marginBottom: '40px' }}>
          <Link href="/trial" style={{
            backgroundColor: '#C8813A',
            color: '#120A06',
            textDecoration: 'none',
            fontSize: '18px',
            fontWeight: 600,
            padding: '16px 32px',
            borderRadius: '8px',
            display: 'inline-block',
            transition: 'background-color 0.2s',
            marginBottom: '16px',
          }}>
            Start your 14-day free trial →
          </Link>
          <p style={{
            fontSize: '14px',
            color: '#C9B99A',
            opacity: 0.8,
          }}>
            No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* THE PROBLEM SECTION */}
      <section style={{
        padding: '80px 40px',
        backgroundColor: '#120A06',
        borderTop: '1px solid #2E1A0E',
        borderBottom: '1px solid #2E1A0E',
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '36px',
            fontWeight: 400,
            marginBottom: '24px',
            color: '#F5ECD7',
          }}>
            Most IFAs manage 50–200 clients with spreadsheets and memory.
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '32px',
            marginTop: '48px',
          }}>
            <div style={{
              padding: '24px',
              backgroundColor: '#1C0F0A',
              borderRadius: '8px',
              border: '1px solid #2E1A0E',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#D06060',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '24px',
              }}>📅</div>
              <h3 style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '8px',
                color: '#F5ECD7',
              }}>Renewals slip</h3>
              <p style={{
                fontSize: '14px',
                color: '#C9B99A',
                lineHeight: 1.5,
              }}>
                Policies expire unnoticed, revenue leaks, clients lapse.
              </p>
            </div>
            
            <div style={{
              padding: '24px',
              backgroundColor: '#1C0F0A',
              borderRadius: '8px',
              border: '1px solid #2E1A0E',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#D4A030',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '24px',
              }}>🕳️</div>
              <h3 style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '8px',
                color: '#F5ECD7',
              }}>Coverage gaps unnoticed</h3>
              <p style={{
                fontSize: '14px',
                color: '#C9B99A',
                lineHeight: 1.5,
              }}>
                Clients are underinsured, upsell opportunities missed.
              </p>
            </div>
            
            <div style={{
              padding: '24px',
              backgroundColor: '#1C0F0A',
              borderRadius: '8px',
              border: '1px solid #2E1A0E',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#20A0A0',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '24px',
              }}>🎂</div>
              <h3 style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '8px',
                color: '#F5ECD7',
              }}>Birthdays forgotten</h3>
              <p style={{
                fontSize: '14px',
                color: '#C9B99A',
                lineHeight: 1.5,
              }}>
                Relationships stay transactional, loyalty fades.
              </p>
            </div>
          </div>
          
          <p style={{
            fontSize: '20px',
            color: '#C8813A',
            fontWeight: 600,
            marginTop: '48px',
            padding: '16px',
            backgroundColor: 'rgba(200, 129, 58, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(200, 129, 58, 0.3)',
          }}>
            Maya fixes all three. Automatically.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section style={{
        padding: '80px 40px',
        maxWidth: '1000px',
        margin: '0 auto',
      }}>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '36px',
          fontWeight: 400,
          marginBottom: '48px',
          textAlign: 'center',
          color: '#F5ECD7',
        }}>
          How it works
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '40px',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#C8813A',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '32px',
              color: '#120A06',
              fontWeight: 'bold',
            }}>1</div>
            <h3 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '24px',
              fontWeight: 400,
              marginBottom: '16px',
              color: '#F5ECD7',
            }}>Import your clients</h3>
            <p style={{
              fontSize: '16px',
              color: '#C9B99A',
              lineHeight: 1.6,
            }}>
              Upload your client list or connect your CRM. Maya organizes everything in minutes.
            </p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#C8813A',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '32px',
              color: '#120A06',
              fontWeight: 'bold',
            }}>2</div>
            <h3 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '24px',
              fontWeight: 400,
              marginBottom: '16px',
              color: '#F5ECD7',
            }}>Maya connects on WhatsApp</h3>
            <p style={{
              fontSize: '16px',
              color: '#C9B99A',
              lineHeight: 1.6,
            }}>
              She introduces herself to your clients, manages conversations, and builds relationships 24/7.
            </p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#C8813A',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '32px',
              color: '#120A06',
              fontWeight: 'bold',
            }}>3</div>
            <h3 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '24px',
              fontWeight: 400,
              marginBottom: '16px',
              color: '#F5ECD7',
            }}>You close more deals</h3>
            <p style={{
              fontSize: '16px',
              color: '#C9B99A',
              lineHeight: 1.6,
            }}>
              With Maya handling admin, you focus on what matters: understanding needs and selling solutions.
            </p>
          </div>
        </div>
        
        <div style={{
          textAlign: 'center',
          marginTop: '60px',
          padding: '40px',
          backgroundColor: '#120A06',
          borderRadius: '12px',
          border: '1px solid #2E1A0E',
        }}>
          <h3 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '28px',
            fontWeight: 400,
            marginBottom: '16px',
            color: '#F5ECD7',
          }}>
            Ready to transform your practice?
          </h3>
          <p style={{
            fontSize: '18px',
            color: '#C9B99A',
            marginBottom: '32px',
          }}>
            Join hundreds of IFAs who trust Maya with their client relationships.
          </p>
          <Link href="/trial" style={{
            backgroundColor: '#C8813A',
            color: '#120A06',
            textDecoration: 'none',
            fontSize: '18px',
            fontWeight: 600,
            padding: '16px 32px',
            borderRadius: '8px',
            display: 'inline-block',
            transition: 'background-color 0.2s',
          }}>
            Start free trial →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: '40px',
        backgroundColor: '#120A06',
        borderTop: '1px solid #2E1A0E',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '24px',
          fontWeight: 600,
          marginBottom: '16px',
          color: '#F5ECD7',
        }}>
          espresso.
        </div>
        <p style={{
          fontSize: '14px',
          color: '#C9B99A',
          opacity: 0.7,
          marginBottom: '8px',
        }}>
          © 2026 Espresso. All rights reserved.
        </p>
        <p style={{
          fontSize: '14px',
          color: '#C9B99A',
          opacity: 0.7,
        }}>
          hello@espresso.insure
        </p>
      </footer>
    </div>
  );
}