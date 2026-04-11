'use client';

import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import { useState } from 'react';

const cormorant = Cormorant_Garamond({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
});

const dmSans = DM_Sans({
  weight: ['400', '500'],
  subsets: ['latin'],
});

export default function ClientsPage() {
  const [activeTab, setActiveTab] = useState('All');

  const tabs = ['All', 'Platinum', 'Gold', 'Silver', 'Bronze', 'At risk'];

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
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '28px',
            fontWeight: 400,
            color: '#F5ECD7',
            margin: 0,
          }}>All clients</h1>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-primary" style={{
              fontSize: '13px',
              padding: '8px 16px',
            }}>+ Add client</button>
            <button className="btn-secondary" style={{
              fontSize: '13px',
              padding: '8px 16px',
            }}>Import</button>
            <button className="btn-secondary" style={{
              fontSize: '13px',
              padding: '8px 16px',
            }}>Export</button>
          </div>
        </div>

        {/* Search Bar */}
        <input 
          className="input"
          style={{ width: '100%', marginBottom: '12px' }}
          placeholder="Search clients..."
        />

        {/* Stats Bar */}
        <div className="mb-6 bg-amber/5 rounded-lg px-6 py-4">
          <div className={`${dmSans.className} text-sm text-amber`}>
            <span className="font-medium">247 Total</span> · 
            <span className="font-medium"> 231 Active</span> · 
            <span className="font-medium"> 12 Renewing soon</span> · 
            <span className="font-medium"> 4 Need attention</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              // Define colors for each tab
              let color = '#C9B99A';
              let borderColor = '#C9B99A';
              
              if (tab === 'All') {
                color = '#C8813A';
                borderColor = '#C8813A';
              } else if (tab === 'Platinum') {
                color = '#E8E8F0';
                borderColor = '#E8E8F0';
              } else if (tab === 'Gold') {
                color = '#C8813A';
                borderColor = '#C8813A';
              } else if (tab === 'Silver') {
                color = '#A0A8B0';
                borderColor = '#A0A8B0';
              } else if (tab === 'Bronze') {
                color = '#CD7F32';
                borderColor = '#CD7F32';
              } else if (tab === 'At risk') {
                color = '#D06060';
                borderColor = '#D06060';
              }
              
              return (
                <span
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    display: 'inline-flex',
                    padding: '3px 10px',
                    borderRadius: '100px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    border: `1px solid ${borderColor}`,
                    color: activeTab === tab ? '#120A06' : color,
                    backgroundColor: activeTab === tab ? '#C8813A' : 'transparent',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {tab}
                </span>
              );
            })}
          </div>
        </div>

        {/* Table - Desktop */}
        <div className="hidden md:block">
          <div className="overflow-x-auto rounded-lg border border-cream-dim" style={{ overflowY: "auto", maxHeight: "calc(100vh - 280px)" }}>
            <table style={{
              width: '100%',
              tableLayout: 'fixed',
              borderCollapse: 'collapse',
            }}>
              <colgroup>
 <col style={{ width: '180px' }} />
 <col style={{ width: '80px' }} />
 <col style={{ width: '70px' }} />
 <col style={{ width: '90px' }} />
 <col style={{ width: '100px' }} />
 <col style={{ width: '130px' }} />
 <col style={{ width: '50px' }} />
</colgroup>
              <th style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 500, color: "#C8813A", textTransform: "uppercase", letterSpacing: "0.06em", padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #2E1A0E", whiteSpace: "nowrap" }}>
                <tr>
                  <th style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 500, color: "#C8813A", textTransform: "uppercase", letterSpacing: "0.06em", padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #2E1A0E", whiteSpace: "nowrap" }}>
                    CLIENT
                  </th>
                  <th style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 500, color: "#C8813A", textTransform: "uppercase", letterSpacing: "0.06em", padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #2E1A0E", whiteSpace: "nowrap" }}>
                    TYPE
                  </th>
                  <th style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 500, color: "#C8813A", textTransform: "uppercase", letterSpacing: "0.06em", padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #2E1A0E", whiteSpace: "nowrap" }}>
                    POLICIES
                  </th>
                  <th style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 500, color: "#C8813A", textTransform: "uppercase", letterSpacing: "0.06em", padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #2E1A0E", whiteSpace: "nowrap" }}>
                    RENEWAL
                  </th>
                  <th style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 500, color: "#C8813A", textTransform: "uppercase", letterSpacing: "0.06em", padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #2E1A0E", whiteSpace: "nowrap" }}>
                    PREMIUM
                  </th>
                  <th style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 500, color: "#C8813A", textTransform: "uppercase", letterSpacing: "0.06em", padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #2E1A0E", whiteSpace: "nowrap" }}>
                    STATUS
                  </th>
                  <th style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 500, color: "#C8813A", textTransform: "uppercase", letterSpacing: "0.06em", padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #2E1A0E", whiteSpace: "nowrap" }}>
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-dim/20">
                {/* Row 1 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      Tan Ah Kow
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      TAK Technologies
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>SME</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>3</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#D06060',
                    }}>
                      13 Apr
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$7,140/yr</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-danger">Claim open</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>

                {/* Row 2 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      Sarah Lim
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      Café Latte
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>SME</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>—</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#5A8AD4',
                    }}>
                      New
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>—</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-amber">Intake active</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>

                {/* Row 3 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      Kwek Industries Pte Ltd
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      SME
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>SME</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>4</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#D4A030',
                    }}>
                      28 Apr
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$11,340/yr</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-amber">Gap detected</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>

                {/* Row 4 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      Angela Foo
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      Individual
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>Individual</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>2</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#D06060',
                    }}>
                      18 Apr
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$2,240/yr</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-danger">Renewal urgent</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>

                {/* Row 5 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      James Ong
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      Individual
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>Individual</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>3</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>15 May</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$6,780/yr</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-ok">Active</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>
                {/* Row 6 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      Tan Wei Ming
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      Tech Solutions
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>SME</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>1</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#D06060',
                    }}>
                      20 Apr
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$2,500/yr</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-ok">Active</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>

                {/* Row 7 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      Chen Li Na
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      Global Traders
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>Individual</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>2</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#D06060',
                    }}>
                      25 Apr
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$3,800/yr</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-danger">Renewal urgent</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>

                {/* Row 8 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      Raj Kumar
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      Medical Group
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>Corporate</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>3</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#D06060',
                    }}>
                      30 Apr
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$5,200/yr</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-amber">Gap detected</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>

                {/* Row 9 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      Siti Aishah
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      Consulting Partners
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>SME</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>4</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#D06060',
                    }}>
                      5 May
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$4,100/yr</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-ok">Active</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>

                {/* Row 10 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      David Wong
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      Retail Chain
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>Individual</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>5</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#D06060',
                    }}>
                      10 May
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$6,900/yr</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-danger">Claim open</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>
                {/* Row 11 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      Priya Sharma
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      Manufacturing Inc
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>Corporate</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>—</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#D06060',
                    }}>
                      15 May
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$8,300/yr</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-amber">Intake active</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>

                {/* Row 12 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      Mohamed Ali
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      Logistics Co
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>SME</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>1</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#D06060',
                    }}>
                      20 May
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$1,800/yr</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-ok">Active</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>

                {/* Row 13 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      Jessica Tan
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      Finance Corp
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>Individual</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>2</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#D06060',
                    }}>
                      25 May
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$9,500/yr</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-danger">Renewal urgent</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>

                {/* Row 14 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      Kumar Suresh
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      Real Estate Ltd
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>Corporate</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>3</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#D06060',
                    }}>
                      30 May
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$7,200/yr</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-amber">Gap detected</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>

                {/* Row 15 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      Anita Lim
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      Hospitality Group
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>SME</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>—</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#5A8AD4',
                    }}>
                      New
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>—</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-amber">Intake active</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>
                {/* Row 16 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      Robert Chen
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      Education Center
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>Individual</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>1</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#C9B99A',
                    }}>
                      20 Apr
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$2,500/yr</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-ok">Active</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>

                {/* Row 17 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      Nurul Huda
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      Healthcare Pte
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>Corporate</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>2</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#D06060',
                    }}>
                      25 Apr
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$3,800/yr</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-danger">Renewal urgent</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>

                {/* Row 18 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      Samuel Lee
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      Construction Ltd
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>SME</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>3</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#D06060',
                    }}>
                      30 Apr
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$5,200/yr</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-amber">Gap detected</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>

                {/* Row 19 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      Mei Ling
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      Food Services
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>Individual</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>4</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#D06060',
                    }}>
                      5 May
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$4,100/yr</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-ok">Active</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>

                {/* Row 20 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      Vikram Patel
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      Transportation
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>SME</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>5</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#D06060',
                    }}>
                      10 May
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$6,900/yr</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-danger">Claim open</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>

                {/* Row 21 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      Sophia Ng
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      Energy Solutions
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>Individual</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>—</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#D06060',
                    }}>
                      15 May
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$8,300/yr</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-amber">Intake active</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>

                {/* Row 22 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      Arjun Singh
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      Media Group
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>Corporate</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>1</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#D06060',
                    }}>
                      20 May
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$1,800/yr</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-ok">Active</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>

                {/* Row 23 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      Clara Koh
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      Pharmaceuticals
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>SME</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>2</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#D06060',
                    }}>
                      25 May
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$9,500/yr</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-danger">Renewal urgent</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>

                {/* Row 24 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      Benjamin Teo
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      Agriculture Co
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>Corporate</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>3</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#D06060',
                    }}>
                      30 May
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>$7,200/yr</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-amber">Gap detected</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>

                {/* Row 25 */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      Fatimah Binte
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      Telecom Ltd
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>SME</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>—</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '#5A8AD4',
                    }}>
                      New
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className={`${dmSans.className} text-sm text-cream-dim`}>—</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span className="pill pill-amber">Intake active</span>
                  </td>
                  <td style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#C9B99A", padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #2E1A0E" }}>
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #2E1A0E',
            flexWrap: 'wrap',
          }}>
            <span style={{
              padding: '6px 14px',
              border: '1px solid #2E1A0E',
              borderRadius: '100px',
              color: '#C9B99A',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}>← Prev</span>

            <span style={{
              width: '32px', height: '32px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              background: '#C8813A',
              color: '#120A06',
              fontSize: '12px',
              fontFamily: 'DM Sans, sans-serif',
              cursor: 'pointer',
            }}>1</span>

            <span style={{
              width: '32px', height: '32px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              border: '1px solid #2E1A0E',
              color: '#C9B99A',
              fontSize: '12px',
              fontFamily: 'DM Sans, sans-serif',
              cursor: 'pointer',
            }}>2</span>

            <span style={{
              width: '32px', height: '32px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              border: '1px solid #2E1A0E',
              color: '#C9B99A',
              fontSize: '12px',
              fontFamily: 'DM Sans, sans-serif',
              cursor: 'pointer',
            }}>3</span>

            <span style={{
              color: '#C9B99A',
              fontSize: '14px',
              padding: '0 2px',
            }}>···</span>

            <span style={{
              width: '32px', height: '32px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              border: '1px solid #2E1A0E',
              color: '#C9B99A',
              fontSize: '12px',
              fontFamily: 'DM Sans, sans-serif',
              cursor: 'pointer',
            }}>50</span>

            <span style={{
              padding: '6px 14px',
              border: '1px solid #2E1A0E',
              borderRadius: '100px',
              color: '#C9B99A',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}>Next →</span>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="show-mobile space-y-4" style={{ display: 'none' }}>
          {/* Card 1 */}
          <div className="bg-cream border border-cream-dim rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">Tan Ah Kow</div>
                <div className="text-sm text-cream-dim">TAK Technologies · SME</div>
              </div>
              <span className="pill pill-danger">Claim open</span>
            </div>
            <div className="mt-3 text-sm text-cream-dim">
              <div>3 policies · Next renewal: <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: '#D06060' }}>13 Apr</span></div>
              <div>Premium: $7,140/yr</div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-cream border border-cream-dim rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">Sarah Lim</div>
                <div className="text-sm text-cream-dim">Café Latte · SME</div>
              </div>
              <span className="pill pill-amber">Intake active</span>
            </div>
            <div className="mt-3 text-sm text-cream-dim">
              <div>New client · No policies yet</div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-cream border border-cream-dim rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">Kwek Industries Pte Ltd</div>
                <div className="text-sm text-cream-dim">SME</div>
              </div>
              <span className="pill pill-amber">Gap detected</span>
            </div>
            <div className="mt-3 text-sm text-cream-dim">

              <div>4 policies · Next renewal: <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: '#D4A030' }}>28 Apr</span></div>
              <div>Premium: $11,340/yr</div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-cream border border-cream-dim rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">Angela Foo</div>
                <div className="text-sm text-cream-dim">Individual</div>
              </div>
              <span className="pill pill-danger">Renewal urgent</span>
            </div>
            <div className="mt-3 text-sm text-cream-dim">
              <div>2 policies · Next renewal: <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: '#D06060' }}>18 Apr</span></div>
              <div>Premium: $2,240/yr</div>
            </div>
          </div>

          {/* Card 5 */}
          <div className="bg-cream border border-cream-dim rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">James Ong</div>
                <div className="text-sm text-cream-dim">Individual</div>
              </div>
              <span className="pill pill-ok">Active</span>
            </div>
            <div className="mt-3 text-sm text-cream-dim">
              <div>3 policies · Next renewal: 15 May</div>
              <div>Premium: $6,780/yr</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
