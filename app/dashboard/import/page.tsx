'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

// Espresso fields that need mapping
const ESPRESSO_FIELDS = [
  { id: 'name', label: 'Client name', required: true, keywords: ['name', 'client', 'full name', 'contact'] },
  { id: 'company', label: 'Company', required: false, keywords: ['company', 'firm', 'organization', 'business'] },
  { id: 'email', label: 'Email', required: false, keywords: ['email', 'e-mail', 'mail'] },
  { id: 'whatsapp', label: 'WhatsApp / Phone', required: false, keywords: ['phone', 'mobile', 'whatsapp', 'contact', 'hp', 'telephone'] },
  { id: 'insurer', label: 'Insurer', required: false, keywords: ['insurer', 'insurance', 'provider', 'carrier'] },
  { id: 'type', label: 'Policy type', required: false, keywords: ['type', 'plan', 'product', 'policy type', 'coverage'] },
  { id: 'premium', label: 'Premium (annual)', required: false, keywords: ['premium', 'amount', 'price', 'cost', 'annual', 'yearly'] },
  { id: 'renewal_date', label: 'Renewal date', required: false, keywords: ['renewal', 'expiry', 'due date', 'expiration', 'valid until'] },
];

export default function ImportPage() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[][]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle file upload and parsing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    try {
      // Check file type
      const fileType = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!['xlsx', 'xls', 'csv'].includes(fileType || '')) {
        throw new Error('Please upload an Excel (.xlsx, .xls) or CSV file');
      }

      // Read file
      const arrayBuffer = await selectedFile.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      if (data.length < 2) {
        throw new Error('File must contain at least a header row and one data row');
      }

      const fileHeaders = data[0].map((h: any) => String(h || '').trim());
      const fileRows = data.slice(1).filter(row => row.some(cell => cell !== null && cell !== ''));

      setHeaders(fileHeaders);
      setRows(fileRows);

      // Auto-detect column mappings
      const autoMap: Record<string, string> = {};
      ESPRESSO_FIELDS.forEach(field => {
        const headerIndex = fileHeaders.findIndex(header => 
          field.keywords.some(keyword => 
            header.toLowerCase().includes(keyword.toLowerCase())
          )
        );
        if (headerIndex !== -1) {
          autoMap[field.id] = fileHeaders[headerIndex];
        }
      });

      setColumnMap(autoMap);
      setStep(2); // Move to mapping step
    } catch (err: any) {
      setError(err.message || 'Failed to parse file');
      setFile(null);
      setHeaders([]);
      setRows([]);
    }
  };

  // Handle column mapping change
  const handleMappingChange = (espressoField: string, fileHeader: string) => {
    setColumnMap(prev => ({
      ...prev,
      [espressoField]: fileHeader === 'skip' ? '' : fileHeader,
    }));
  };

  // Validate mapping before proceeding
  const validateMapping = () => {
    const requiredFields = ESPRESSO_FIELDS.filter(f => f.required);
    const missingRequired = requiredFields.filter(f => !columnMap[f.id] || columnMap[f.id] === '');
    
    if (missingRequired.length > 0) {
      setError(`Please map the required field: ${missingRequired.map(f => f.label).join(', ')}`);
      return false;
    }
    
    setError(null);
    return true;
  };

  // Handle import
  const handleImport = async () => {
    if (!validateMapping()) return;
    
    setImporting(true);
    setError(null);
    
    try {
      // Prepare data for import
      const mappedData = rows.map(row => {
        const data: Record<string, any> = {};
        ESPRESSO_FIELDS.forEach(field => {
          const header = columnMap[field.id];
          if (header && header !== '') {
            const headerIndex = headers.indexOf(header);
            if (headerIndex !== -1) {
              data[field.id] = row[headerIndex];
            }
          }
        });
        return data;
      });

      // TODO: Call API to import data
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setResult({
        success: true,
        imported: mappedData.length,
        skipped: 0,
        errors: [],
      });
      
      setStep(4); // Move to results step
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  // Reset import
  const handleReset = () => {
    setStep(1);
    setFile(null);
    setHeaders([]);
    setRows([]);
    setColumnMap({});
    setImporting(false);
    setResult(null);
    setError(null);
  };

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

      {/* Progress Steps */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px',
        position: 'relative',
      }}>
        {[1, 2, 3, 4].map((stepNum) => (
          <React.Fragment key={stepNum}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 1,
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: step === stepNum ? '#C8813A' : step > stepNum ? '#38A169' : '#2E1A0E',
                border: step === stepNum ? 'none' : '1px solid #2E1A0E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: step === stepNum ? '#120A06' : step > stepNum ? '#120A06' : '#C9B99A',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '8px',
              }}>
                {step > stepNum ? '✓' : stepNum}
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: step >= stepNum ? '#F5ECD7' : '#C9B99A',
                fontWeight: step === stepNum ? 500 : 400,
                whiteSpace: 'nowrap',
              }}>
                {stepNum === 1 && 'Upload'}
                {stepNum === 2 && 'Map columns'}
                {stepNum === 3 && 'Review'}
                {stepNum === 4 && 'Complete'}
              </div>
            </div>
            
            {stepNum < 4 && (
              <div style={{
                flex: 1,
                height: '2px',
                background: step > stepNum ? '#38A169' : '#2E1A0E',
                margin: '0 8px',
                marginTop: '-24px',
              }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: 'rgba(229, 62, 62, 0.1)',
          border: '1px solid #E53E3E',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{ color: '#E53E3E', fontSize: '18px' }}>⚠</div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#F5ECD7',
          }}>
            {error}
          </div>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 1 && (
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
              <label style={{
                width: '100%',
                border: '2px dashed #2E1A0E',
                borderRadius: '12px',
                padding: '48px 32px',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
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
              </label>
              
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
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Map Columns */}
      {step === 2 && (
        <div className="panel">
          <div className="panel-body">
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '32px',
            }}>
              {/* File Info */}
              <div style={{
                background: 'rgba(28, 15, 10, 0.5)',
                border: '1px solid #2E1A0E',
                borderRadius: '8px',
                padding: '16px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#F5ECD7',
                      marginBottom: '4px',
                    }}>
                      {file?.name}
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '12px',
                      color: '#C9B99A',
                    }}>
                      {rows.length} clients found • {headers.length} columns
                    </div>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #2E1A0E',
                      color: '#C9B99A',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '12px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Change file
                  </button>
                </div>
              </div>

              {/* Mapping Table */}
              <div>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#F5ECD7',
                  marginBottom: '16px',
                }}>
                  Map your columns to Espresso fields
                </div>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  {ESPRESSO_FIELDS.map((field) => (
                    <div
                      key={field.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '12px',
                        background: 'rgba(28, 15, 10, 0.3)',
                        border: '1px solid #2E1A0E',
                        borderRadius: '6px',
                      }}
                    >
                      <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <div style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#F5ECD7',
                        }}>
                          {field.label}
                        </div>
                        {field.required && (
                          <span style={{
                            color: '#E53E3E',
                            fontSize: '10px',
                          }}>
                            *
                          </span>
                        )}
                      </div>
                      
                      <select
                        value={columnMap[field.id] || ''}
                        onChange={(e) => handleMappingChange(field.id, e.target.value)}
                        style={{
                          flex: 1,
                          background: '#120A06',
                          border: '1px solid #2E1A0E',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          color: columnMap[field.id] ? '#F5ECD7' : '#C9B99A',
                          minWidth: '200px',
                        }}
                      >
                        <option value="">Select column...</option>
                        <option value="skip">Skip this field</option>
                        {headers.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '24px',
              }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #2E1A0E',
                    color: '#C9B99A',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  ← Back
                </button>
                
                <button
                  onClick={() => {
                    if (validateMapping()) {
                      setStep(3);
                    }
                  }}
                  className="btn-primary"
                  style={{
                    fontSize: '14px',
                    padding: '10px 20px',
                  }}
                >
                  Next: Review →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="panel">
          <div className="panel-body">
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '32px',
            }}>
              {/* Preview */}
              <div>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#F5ECD7',
                  marginBottom: '16px',
                }}>
                  Preview (first 5 clients)
                </div>
                
                <div style={{
                  background: '#120A06',
                  border: '1px solid #2E1A0E',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    overflowX: 'auto',
                  }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                    }}>
                      <thead style={{
                        background: '#1C0F0A',
                      }}>
                        <tr>
                          {ESPRESSO_FIELDS.filter(f => columnMap[f.id] && columnMap[f.id] !== '').map((field) => (
                            <th key={field.id} style={{
                              fontFamily: 'DM Sans, sans-serif',
                              fontSize: '11px',
                              fontWeight: 500,
                              color: '#C8813A',
                              textTransform: 'uppercase',
                              padding: '12px 16px',
                              textAlign: 'left',
                              borderBottom: '1px solid #2E1A0E',
                              whiteSpace: 'nowrap',
                            }}>
                              {field.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 5).map((row, rowIndex) => (
                          <tr key={rowIndex} style={{
                            borderBottom: '1px solid #2E1A0E',
                          }}>
                            {ESPRESSO_FIELDS.filter(f => columnMap[f.id] && columnMap[f.id] !== '').map((field) => {
                              const header = columnMap[field.id];
                              const headerIndex = headers.indexOf(header);
                              const value = headerIndex !== -1 ? row[headerIndex] : '';
                              return (
                                <td key={field.id} style={{
                                  fontFamily: 'DM Sans, sans-serif',
                                  fontSize: '13px',
                                  color: '#C9B99A',
                                  padding: '12px 16px',
                                  verticalAlign: 'top',
                                }}>
                                  {value !== null && value !== undefined ? String(value) : '—'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '12px',
                  color: '#C9B99A',
                  marginTop: '12px',
                  textAlign: 'center',
                }}>
                  Showing 5 of {rows.length} clients
                </div>
              </div>

              {/* Navigation */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '24px',
              }}>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #2E1A0E',
                    color: '#C9B99A',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  ← Back to mapping
                </button>
                
                <button
                  onClick={handleImport}
                  className="btn-primary"
                  disabled={importing}
                  style={{
                    fontSize: '14px',
                    padding: '10px 20px',
                    opacity: importing ? 0.7 : 1,
                    cursor: importing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {importing ? 'Importing...' : `Import ${rows.length} clients →`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === 4 && result && (
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
              {/* Success Icon */}
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#38A169',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                color: '#120A06',
              }}>
                ✓
              </div>
              
              {/* Success Message */}
              <div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '24px',
                  fontWeight: 400,
                  color: '#F5ECD7',
                  marginBottom: '8px',
                }}>
                  Import complete!
                </div>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '16px',
                  color: '#C9B99A',
                  lineHeight: 1.5,
                }}>
                  Successfully imported {result.imported} clients to your dashboard.
                </div>
              </div>
              
              {/* Stats */}
              <div style={{
                display: 'flex',
                gap: '24px',
                width: '100%',
                maxWidth: '400px',
              }}>
                <div style={{
                  flex: 1,
                  background: 'rgba(28, 15, 10, 0.5)',
                  border: '1px solid #2E1A0E',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: '24px',
                    fontWeight: 300,
                    color: '#F5ECD7',
                    marginBottom: '4px',
                  }}>
                    {result.imported}
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '11px',
                    color: '#C9B99A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>
                    Clients added
                  </div>
                </div>
                
                <div style={{
                  flex: 1,
                  background: 'rgba(28, 15, 10, 0.5)',
                  border: '1px solid #2E1A0E',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: '24px',
                    fontWeight: 300,
                    color: '#F5ECD7',
                    marginBottom: '4px',
                  }}>
                    {result.skipped}
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '11px',
                    color: '#C9B99A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>
                    Skipped
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                width: '100%',
                maxWidth: '400px',
              }}>
                <Link href="/dashboard" style={{ textDecoration: 'none', width: '100%' }}>
                  <button className="btn-primary" style={{
                    fontSize: '16px',
                    padding: '16px 32px',
                    width: '100%',
                  }}>
                    Go to dashboard →
                  </button>
                </Link>
                
                <button
                  onClick={handleReset}
                  className="btn-secondary"
                  style={{
                    fontSize: '14px',
                    padding: '12px 24px',
                    width: '100%',
                  }}
                >
                  Import more clients
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}