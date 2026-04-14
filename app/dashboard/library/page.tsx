'use client';

import React, { useState } from 'react';

type TabType = 'products' | 'claims-forms';

interface ClaimForm {
  id: string;
  insurer: string;
  formType: string;
  formName: string;
}

export default function LibraryPage() {
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('products');

  const handleUploadClick = () => {
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 3000);
  };

  // Pre-populated claims forms data
  const claimsForms: ClaimForm[] = [
    // AIA
    { id: '1', insurer: 'AIA', formType: 'Life Claim', formName: 'AIA Life/TPD Claim Form' },
    { id: '2', insurer: 'AIA', formType: 'Health Claim', formName: 'AIA Medical Claim Form' },
    { id: '3', insurer: 'AIA', formType: 'Motor Claim', formName: 'AIA Motor Claim Form' },
    { id: '4', insurer: 'AIA', formType: 'Critical Illness', formName: 'AIA Critical Illness Claim Form' },
    
    // Great Eastern
    { id: '5', insurer: 'Great Eastern', formType: 'Life Claim', formName: 'GE Life Claim Form' },
    { id: '6', insurer: 'Great Eastern', formType: 'Health Claim', formName: 'GE Medical Claim Form' },
    { id: '7', insurer: 'Great Eastern', formType: 'Motor Claim', formName: 'GE Motor Claim Form' },
    
    // Prudential
    { id: '8', insurer: 'Prudential', formType: 'Life Claim', formName: 'PRU Life Claim Form' },
    { id: '9', insurer: 'Prudential', formType: 'Health Claim', formName: 'PRU Medical Claim Form' },
    { id: '10', insurer: 'Prudential', formType: 'Critical Illness', formName: 'PRU CI Claim Form' },
    
    // Manulife
    { id: '11', insurer: 'Manulife', formType: 'Life Claim', formName: 'Manulife Life Claim Form' },
    { id: '12', insurer: 'Manulife', formType: 'Health Claim', formName: 'Manulife Medical Claim Form' },
    
    // NTUC Income
    { id: '13', insurer: 'NTUC Income', formType: 'Life Claim', formName: 'Income Life Claim Form' },
    { id: '14', insurer: 'NTUC Income', formType: 'Health Claim', formName: 'Income Medical Claim Form' },
    { id: '15', insurer: 'NTUC Income', formType: 'Motor Claim', formName: 'Income Motor Claim Form' },
    
    // AXA
    { id: '16', insurer: 'AXA', formType: 'General Claim', formName: 'AXA General Insurance Claim Form' },
    { id: '17', insurer: 'AXA', formType: 'Travel Claim', formName: 'AXA Travel Claim Form' },
  ];

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
          }}>Library</h1>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={handleUploadClick}
              className="btn-primary" 
              style={{
                fontSize: '13px',
                padding: '8px 16px',
              }}
            >
              {activeTab === 'products' ? 'Upload PDF' : 'Upload form'}
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
                Maya will process documents automatically when you forward them via WhatsApp
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '32px',
          paddingBottom: '16px',
          borderBottom: '1px solid #2E1A0E',
        }}>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: '6px',
              background: activeTab === 'products' ? '#C8813A' : 'transparent',
              color: activeTab === 'products' ? '#120A06' : '#C9B99A',
              border: activeTab === 'products' ? 'none' : '1px solid #2E1A0E',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab('claims-forms')}
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: '6px',
              background: activeTab === 'claims-forms' ? '#C8813A' : 'transparent',
              color: activeTab === 'claims-forms' ? '#120A06' : '#C9B99A',
              border: activeTab === 'claims-forms' ? 'none' : '1px solid #2E1A0E',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Claims Forms
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <>
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
          </>
        )}

        {/* Claims Forms Tab */}
        {activeTab === 'claims-forms' && (
          <>
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
                🤖
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#F5ECD7',
                  marginBottom: '8px',
                }}>
                  Smart claims processing
                </div>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  color: '#C9B99A',
                  lineHeight: 1.6,
                }}>
                  When Maya is active, she'll automatically select and pre-fill the right form based on your client's policy. Just review and submit.
                </div>
              </div>
            </div>

            {/* Claims Forms Table */}
            <div style={{
              background: '#120A06',
              border: '1px solid #2E1A0E',
              borderRadius: '8px',
              overflow: 'hidden',
            }}>
              <div style={{
                overflow: 'hidden',
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  tableLayout: 'fixed',
                }}>
                  <colgroup>
                    <col style={{ width: '120px' }} />
                    <col style={{ width: '120px' }} />
                    <col style={{ width: '200px' }} />
                    <col style={{ width: '180px' }} />
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
                        FORM TYPE
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
                        FORM NAME
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
                        ACTION
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {claimsForms.map((form) => (
                      <tr key={form.id} style={{
                        borderBottom: '1px solid #2E1A0E',
                      }}>
                        <td style={{
                          padding: '12px 16px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#F5ECD7',
                        }}>
                          {form.insurer}
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#C9B99A',
                        }}>
                          {form.formType}
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#C9B99A',
                        }}>
                          {form.formName}
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: '#C9B99A',
                        }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={handleUploadClick}
                              style={{
                                fontFamily: 'DM Sans, sans-serif',
                                fontSize: '11px',
                                fontWeight: 500,
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: 'rgba(200, 129, 58, 0.1)',
                                color: '#C9B99A',
                                border: '1px solid #3D2215',
                                cursor: 'not-allowed',
                                opacity: 0.5,
                              }}
                            >
                              Download
                            </button>
                            <button
                              onClick={handleUploadClick}
                              style={{
                                fontFamily: 'DM Sans, sans-serif',
                                fontSize: '11px',
                                fontWeight: 500,
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: 'rgba(90, 184, 122, 0.1)',
                                color: '#C9B99A',
                                border: '1px solid #2E4A3D',
                                cursor: 'not-allowed',
                                opacity: 0.5,
                              }}
                            >
                              Pre-fill for client
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table Footer Note */}
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: 'rgba(28, 15, 10, 0.5)',
              border: '1px solid #2E1A0E',
              borderRadius: '6px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#6B5444',
              textAlign: 'center',
            }}>
              <div style={{ marginBottom: '4px' }}>Missing a form? Upload your own using the "Upload form" button above.</div>
              <div>Download and pre-fill features coming soon — Maya will handle this automatically.</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}