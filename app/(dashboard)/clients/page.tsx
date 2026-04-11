'use client';

import React, { useState } from 'react';

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const clients = [
    { id: 1, name: 'Maria Santos', email: 'maria@example.com', phone: '+65 9123 4567', policies: 3, lastContact: '2 days ago', status: 'active' },
    { id: 2, name: 'Robert Chen', email: 'robert@example.com', phone: '+65 9234 5678', policies: 2, lastContact: '1 week ago', status: 'active' },
    { id: 3, name: 'Sarah Lim', email: 'sarah@example.com', phone: '+65 9345 6789', policies: 5, lastContact: 'Today', status: 'active' },
    { id: 4, name: 'James Wong', email: 'james@example.com', phone: '+65 9456 7890', policies: 1, lastContact: '3 weeks ago', status: 'inactive' },
    { id: 5, name: 'Lisa Tan', email: 'lisa@example.com', phone: '+65 9567 8901', policies: 4, lastContact: '1 month ago', status: 'active' },
    { id: 6, name: 'Michael Lee', email: 'michael@example.com', phone: '+65 9678 9012', policies: 2, lastContact: '2 days ago', status: 'active' },
    { id: 7, name: 'Angela Koh', email: 'angela@example.com', phone: '+65 9789 0123', policies: 3, lastContact: '1 week ago', status: 'active' },
    { id: 8, name: 'Thomas Ng', email: 'thomas@example.com', phone: '+65 9890 1234', policies: 1, lastContact: '2 months ago', status: 'inactive' },
  ];

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    }}>
      {/* Page Header */}
      <div>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '28px',
          fontWeight: 400,
          color: '#F5ECD7',
          margin: '0 0 8px 0',
        }}>
          All Clients
        </h1>
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          color: '#C9B99A',
        }}>
          Manage your client portfolio and communication history
        </p>
      </div>

      {/* Search and Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{
          position: 'relative',
          flex: 1,
          maxWidth: '400px',
        }}>
          <input
            type="text"
            placeholder="Search clients by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: '#2E1A0E',
              border: '1px solid #2E1A0E',
              color: '#F5ECD7',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              padding: '10px 16px 10px 40px',
              borderRadius: '100px',
              outline: 'none',
            }}
          />
          <div style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#C9B99A',
          }}>
            🔍
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '12px',
        }}>
          <button style={{
            background: 'transparent',
            border: '1px solid #2E1A0E',
            color: '#C9B99A',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            padding: '10px 20px',
            borderRadius: '100px',
            cursor: 'pointer',
          }}>
            Filter
          </button>
          <button style={{
            background: '#C8813A',
            color: '#120A06',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            fontWeight: 500,
            padding: '10px 20px',
            borderRadius: '100px',
            border: 'none',
            cursor: 'pointer',
          }}>
            + Add Client
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Client Directory</h2>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            color: '#C9B99A',
          }}>
            {filteredClients.length} clients
          </div>
        </div>
        <div className="panel-body">
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr',
            gap: '16px',
            padding: '12px 0',
            borderBottom: '1px solid #2E1A0E',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#C9B99A',
          }}>
            <div>Name</div>
            <div>Contact</div>
            <div>Policies</div>
            <div>Last Contact</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {/* Table Rows */}
          {filteredClients.map((client) => (
            <div key={client.id} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr',
              gap: '16px',
              padding: '16px 0',
              borderBottom: '1px solid #2E1A0E',
              alignItems: 'center',
            }}>
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#C8813A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#120A06',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}>
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#F5ECD7',
                    }}>
                      {client.name}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#F5ECD7',
                  marginBottom: '2px',
                }}>
                  {client.email}
                </div>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '12px',
                  color: '#C9B99A',
                }}>
                  {client.phone}
                </div>
              </div>
              
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#C9B99A',
              }}>
                {client.policies}
              </div>
              
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#C9B99A',
              }}>
                {client.lastContact}
              </div>
              
              <div>
                <span className={`pill ${client.status === 'active' ? 'pill-ok' : 'pill-amber'}`}>
                  {client.status}
                </span>
              </div>
              
              <div>
                <button style={{
                  background: 'transparent',
                  border: '1px solid #2E1A0E',
                  color: '#C9B99A',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '12px',
                  padding: '6px 12px',
                  borderRadius: '100px',
                  cursor: 'pointer',
                }}>
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}