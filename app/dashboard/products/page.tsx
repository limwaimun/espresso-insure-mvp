'use client';

import React, { useState } from 'react';

export default function ProductsPage() {
  const [showComingSoon, setShowComingSoon] = useState(false);

  const handleUploadClick = () => {
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 3000);
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      padding: '0',
      minHeight: '100vh',
    }}>
      <div className="px-8 py-6">
        {/* Title and Actions Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '28px',
            fontWeight: 400,
            color: '#F5ECD7',
            margin: 0,
          }}>Product Library</h1>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={handleUploadClick}
              className="btn-primary" 
              style={{
                fontSize: '13px',
                padding: '8px 16px',
              }}
            >
              Upload PDF
            </button>
          </div>
        </div>

        {/* Coming Soon Alert */}
        {showComingSoon && (
          <div style={{
            background: 'rgba(200, 129, 58, 0.1)',
            border: '1px solid #C8813A',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span style={{ fontSize: '20px' }}>📱</span>
            <div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: '#F5ECD7',
                marginBottom: '4px',
              }}>
                Coming soon — forward PDFs to Maya on WhatsApp for now
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#C9B99A',
              }}>
                Maya will process product PDFs automatically when you forward them via WhatsApp
              </div>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div style={{
          background: 'rgba(90, 184, 122, 0.1)',
          border: '1px solid #5AB87A',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
        }}>
          <div style={{
            fontSize: '24px',
            lineHeight: 1,
          }}>
            📱
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '16px',
              fontWeight: 500,
              color: '#F5ECD7',
              marginBottom: '8px',
            }}>
              How it works
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: '#C9B99A',
              lineHeight: 1.6,
            }}>
              Forward product PDFs to Maya on WhatsApp. She'll process them and add them to your library automatically.
              <br />
              Maya extracts insurer details, benefits, premiums, and riders — no manual data entry needed.
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div style={{
          background: '#120A06',
          border: '1px solid #2E1A0E',
          borderRadius: '12px',
          padding: '80px 40px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '24px',
            opacity: 0.5,
          }}>
            📚
          </div>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '24px',
            color: '#F5ECD7',
            marginBottom: '16px',
          }}>
            No products in your library yet
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#C9B99A',
            lineHeight: 1.6,
            maxWidth: '400px',
            margin: '0 auto 24px auto',
          }}>
            Forward a product PDF to Maya on WhatsApp to get started.
            <br />
            Maya will extract insurer details, benefits, premiums, and riders automatically.
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px',
            color: '#6B5444',
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid #2E1A0E',
            maxWidth: '500px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            <div style={{ fontWeight: 500, marginBottom: '8px' }}>Supported insurers:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {['AIA', 'Prudential', 'Great Eastern', 'Manulife', 'Aviva', 'HSBC', 'Tokio Marine', 'FWD'].map((insurer) => (
                <span key={insurer} style={{
                  background: 'rgba(200, 129, 58, 0.1)',
                  border: '1px solid #3D2215',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  color: '#C9B99A',
                }}>
                  {insurer}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Future Table Structure (commented out for now) */}
        {/*
        <div style={{ marginTop: '48px' }}>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '20px',
            fontWeight: 400,
            color: '#F5ECD7',
            marginBottom: '20px',
          }}>
            Product Library
          </h2>
          
          <div style={{
            background: '#120A06',
            border: '1px solid #2E1A0E',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <div style={{
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 400px)',
              scrollbarGutter: 'stable',
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
              }}>
                <colgroup>
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '180px' }} />
                  <col style={{ width: '100px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '100px' }} />
                </colgroup>
                <thead style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  background: '#1C0F0A',
                }}>
                  <tr>
                    <th style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#C8813A',
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderBottom: '1px solid #2E1A0E',
                    }}>
                      INSURER
                    </th>
                    <th style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#C8813A',
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderBottom: '1px solid #2E1A0E',
                    }}>
                      PRODUCT NAME
                    </th>
                    <th style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#C8813A',
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderBottom: '1px solid #2E1A0E',
                    }}>
                      TYPE
                    </th>
                    <th style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#C8813A',
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderBottom: '1px solid #2E1A0E',
                    }}>
                      PREMIUM RANGE
                    </th>
                    <th style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#C8813A',
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderBottom: '1px solid #2E1A0E',
                    }}>
                      LAST UPDATED
                    </th>
                    <th style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#C8813A',
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderBottom: '1px solid #2E1A0E',
                    }}>
                      STATUS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} style={{
                      borderBottom: '1px solid #2E1A0E',
                    }}>
                      <td style={{
                        padding: '12px 16px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#F5ECD7',
                      }}>
                        {product.insurer}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#C9B99A',
                      }}>
                        {product.name}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#C9B99A',
                      }}>
                        {product.type}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#C9B99A',
                      }}>
                        {product.premiumRange}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#C9B99A',
                      }}>
                        {product.lastUpdated}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#C9B99A',
                      }}>
                        <span style={{
                          display: 'inline-block',
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '11px',
                          fontWeight: 500,
                          padding: '4px 8px',
                          borderRadius: '100px',
                          background: product.status === 'Processed' ? 'rgba(90, 184, 122, 0.2)' : 
                                     product.status === 'Processing' ? 'rgba(200, 129, 58, 0.2)' : 'rgba(229, 62, 62, 0.2)',
                          color: product.status === 'Processed' ? '#5AB87A' : 
                                 product.status === 'Processing' ? '#C8813A' : '#E53E3E',
                          border: `1px solid ${product.status === 'Processed' ? '#5AB87A' : 
                                                  product.status === 'Processing' ? '#C8813A' : '#E53E3E'}`,
                        }}>
                          {product.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        */}
      </div>
    </div>
  );
}