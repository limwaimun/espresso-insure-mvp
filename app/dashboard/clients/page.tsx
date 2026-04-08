import React from 'react';
import Link from 'next/link';

export default function ClientsPage() {
  const clients = [
    { id: 1, name: 'Tan Ah Kow', policies: 3, lastContact: '2 hours ago', status: 'active', premium: '$2,400', avatar: 'TK', type: 'health' },
    { id: 2, name: 'Sarah Lim', policies: 2, lastContact: 'Yesterday', status: 'active', premium: '$1,800', avatar: 'SL', type: 'life' },
    { id: 3, name: 'Raj Patel', policies: 5, lastContact: '3 days ago', status: 'warning', premium: '$4,200', avatar: 'RP', type: 'investment' },
    { id: 4, name: 'Maria Santos', policies: 1, lastContact: '1 week ago', status: 'danger', premium: '$850', avatar: 'MS', type: 'health' },
    { id: 5, name: 'David Wong', policies: 4, lastContact: '2 weeks ago', status: 'active', premium: '$3,600', avatar: 'DW', type: 'life' },
    { id: 6, name: 'Aisha Hassan', policies: 2, lastContact: '1 month ago', status: 'inactive', premium: '$1,200', avatar: 'AH', type: 'health' },
    { id: 7, name: 'Kenji Tanaka', policies: 3, lastContact: '2 months ago', status: 'active', premium: '$2,800', avatar: 'KT', type: 'investment' },
    { id: 8, name: 'Wei Chen', policies: 1, lastContact: '3 months ago', status: 'inactive', premium: '$950', avatar: 'WC', type: 'life' },
  ];

  const filters = ['All', 'Active', 'Pending', 'Renewal Due', 'Inactive'];
  const policyTypes = ['Health', 'Life', 'Investment', 'General'];

  return (
    <div className="view active" id="view-clients">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-28 font-400 text-color-cream mb-2">All Clients</h1>
          <p className="text-color-cream-dim text-14">Manage your client portfolio and policy details</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="btn bg-transparent border border-color-warm-border text-color-cream-dim px-4 py-2 rounded-full text-12 cursor-pointer font-body transition-all duration-200 hover:border-color-amber hover:text-color-cream">
            Export
          </button>
          <button className="btn p bg-color-amber text-color-dark border-color-amber px-4 py-2 rounded-full text-12 cursor-pointer font-body font-500 transition-all duration-200 hover:bg-color-amber-light">
            + Add Client
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              className={`px-4 py-2 rounded-full text-12 transition-all duration-200 ${
                filter === 'All'
                  ? 'bg-color-amber text-color-dark font-500'
                  : 'bg-transparent border border-color-warm-border text-color-cream-dim hover:border-color-amber hover:text-color-cream'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        
        <div className="flex-1">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search clients..."
              className="w-full bg-color-warm-mid border border-color-warm-border rounded-full px-5 py-2.5 text-13 text-color-cream placeholder-color-cream-dim focus:outline-none focus:ring-1 focus:ring-color-amber"
            />
            <div className="absolute right-4 top-2.5 text-color-cream-dim">🔍</div>
          </div>
        </div>
      </div>
      
      {/* Policy Type Filters */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-12 text-color-cream-dim">Policy Type:</span>
        {policyTypes.map((type) => (
          <button
            key={type}
            className="px-3 py-1.5 rounded-full text-11 border border-color-warm-border text-color-cream-dim hover:border-color-amber hover:text-color-cream transition-all duration-200"
          >
            {type}
          </button>
        ))}
      </div>
      
      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <div key={client.id} className="card card-amber p-5 hover:border-color-amber/50 transition-colors duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-color-amber to-[#8B4513] rounded-full flex items-center justify-center font-display text-16 font-500 text-white">
                  {client.avatar}
                </div>
                <div>
                  <div className="text-16 font-500 text-color-cream">{client.name}</div>
                  <div className="text-12 text-color-cream-dim">{client.policies} policies</div>
                </div>
              </div>
              
              <div className={`pill text-11 px-2.5 py-1 rounded-full ${
                client.status === 'active' ? 'bg-ok/15 text-color-ok' :
                client.status === 'warning' ? 'bg-warning/15 text-color-warning' :
                client.status === 'danger' ? 'bg-danger/15 text-color-danger' :
                'bg-color-cream-dim/15 text-color-cream-dim'
              }`}>
                {client.status}
              </div>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-12 text-color-cream-dim">Annual Premium</span>
                <span className="text-14 font-500 text-color-cream">{client.premium}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-12 text-color-cream-dim">Last Contact</span>
                <span className="text-12 text-color-cream-dim">{client.lastContact}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-12 text-color-cream-dim">Policy Type</span>
                <span className={`pill text-11 px-2 py-0.5 rounded-full ${
                  client.type === 'health' ? 'bg-amber/15 text-color-amber' :
                  client.type === 'life' ? 'bg-info/15 text-color-info' :
                  'bg-ok/15 text-color-ok'
                }`}>
                  {client.type}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-4 border-t border-color-warm-border">
              <Link
                href={`/dashboard/client-record/${client.id}`}
                className="flex-1 btn bg-transparent border border-color-warm-border text-color-cream-dim px-3 py-1.5 rounded-full text-11 cursor-pointer text-center transition-all duration-200 hover:border-color-amber hover:text-color-cream"
              >
                View Details
              </Link>
              <Link
                href={`/dashboard/maya?client=${client.id}`}
                className="flex-1 btn p bg-color-amber text-color-dark border-color-amber px-3 py-1.5 rounded-full text-11 cursor-pointer text-center font-500 transition-all duration-200 hover:bg-color-amber-light"
              >
                Message
              </Link>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-color-warm-border">
        <div className="text-12 text-color-cream-dim">
          Showing 8 of 24 clients
        </div>
        
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 flex items-center justify-center border border-color-warm-border rounded text-color-cream-dim hover:border-color-amber hover:text-color-cream transition-colors duration-200">
            ←
          </button>
          <button className="w-8 h-8 flex items-center justify-center bg-color-amber text-color-dark rounded font-500">
            1
          </button>
          <button className="w-8 h-8 flex items-center justify-center border border-color-warm-border rounded text-color-cream-dim hover:border-color-amber hover:text-color-cream transition-colors duration-200">
            2
          </button>
          <button className="w-8 h-8 flex items-center justify-center border border-color-warm-border rounded text-color-cream-dim hover:border-color-amber hover:text-color-cream transition-colors duration-200">
            3
          </button>
          <button className="w-8 h-8 flex items-center justify-center border border-color-warm-border rounded text-color-cream-dim hover:border-color-amber hover:text-color-cream transition-colors duration-200">
            →
          </button>
        </div>
      </div>
    </div>
  );
}