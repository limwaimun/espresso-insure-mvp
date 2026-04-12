import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function ImportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return <div>Please log in</div>;
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Link href="/dashboard" style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            color: '#C8813A',
            textDecoration: 'none',
            cursor: 'pointer',
          }}>
            ← Back to dashboard
          </Link>
        </div>
        
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '32px',
          fontWeight: 400,
          color: '#F5ECD7',
          margin: '0 0 8px 0',
        }}>
          Import clients
        </h1>
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '16px',
          color: '#C9B99A',
          lineHeight: 1.5,
        }}>
          Upload your client list from Excel or CSV to get started with Maya.
        </p>
      </div>

      {/* Import Card */}
      <div className="panel" style={{
        maxWidth: '640px',
        margin: '0 auto',
      }}>
        <div className="panel-body" style={{ padding: '40px' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '32px',
            textAlign: 'center',
          }}>
            {/* Upload Area */}
            <div style={{
              width: '100%',
              border: '2px dashed #2E1A0E',
              borderRadius: '12px',
              padding: '48px 32px',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              ':hover': {
                borderColor: '#C8813A',
              },
            }}>
              <div style={{
                fontSize: '48px',
                color: '#C8813A',
                marginBottom: '16px',
              }}>
                📄
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '16px',
                fontWeight: 500,
                color: '#F5ECD7',
                marginBottom: '8px',
              }}>
                Drop your Excel or CSV file here
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#C9B99A',
                marginBottom: '24px',
              }}>
                or click to browse files
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#C9B99A',
                background: 'rgba(201, 185, 154, 0.1)',
                padding: '8px 16px',
                borderRadius: '6px',
                display: 'inline-block',
              }}>
                Supports .xlsx, .xls, .csv up to 10MB
              </div>
            </div>
            
            {/* Or manual option */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              width: '100%',
            }}>
              <div style={{
                flex: 1,
                height: '1px',
                background: '#2E1A0E',
              }} />
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#C9B99A',
                whiteSpace: 'nowrap',
              }}>
                or
              </div>
              <div style={{
                flex: 1,
                height: '1px',
                background: '#2E1A0E',
              }} />
            </div>
            
            {/* Manual entry button */}
            <Link href="/dashboard/clients/new" style={{ textDecoration: 'none', width: '100%' }}>
              <button className="btn-secondary" style={{
                fontSize: '16px',
                padding: '16px 32px',
                width: '100%',
              }}>
                Add clients manually instead
              </button>
            </Link>
            
            {/* Requirements */}
            <div style={{
              textAlign: 'left',
              width: '100%',
              padding: '24px',
              background: 'rgba(28, 15, 10, 0.5)',
              borderRadius: '8px',
              border: '1px solid #2E1A0E',
            }}>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: '#F5ECD7',
                marginBottom: '16px',
              }}>
                File requirements
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}>
                  <div style={{
                    color: '#C8813A',
                    fontSize: '14px',
                    flexShrink: 0,
                  }}>
                    •
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '13px',
                    color: '#C9B99A',
                    lineHeight: 1.5,
                  }}>
                    <strong>Required columns:</strong> Name, Email, Phone
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}>
                  <div style={{
                    color: '#C8813A',
                    fontSize: '14px',
                    flexShrink: 0,
                  }}>
                    •
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '13px',
                    color: '#C9B99A',
                    lineHeight: 1.5,
                  }}>
                    <strong>Optional columns:</strong> Company, Type (Individual/SME/Corporate), Status
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}>
                  <div style={{
                    color: '#C8813A',
                    fontSize: '14px',
                    flexShrink: 0,
                  }}>
                    •
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '13px',
                    color: '#C9B99A',
                    lineHeight: 1.5,
                  }}>
                    <strong>Format:</strong> First row should contain column headers
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}>
                  <div style={{
                    color: '#C8813A',
                    fontSize: '14px',
                    flexShrink: 0,
                  }}>
                    •
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '13px',
                    color: '#C9B99A',
                    lineHeight: 1.5,
                  }}>
                    <strong>Privacy:</strong> Data is encrypted and stored securely in your account
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}