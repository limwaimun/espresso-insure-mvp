import React from 'react';

const ClientList = () => {
  const clients = [
    { name: 'Tan Ah Kow', lastContact: '2 hours ago', policies: 3, status: 'Active', avatar: 'TK' },
    { name: 'Sarah Lim', lastContact: 'Yesterday', policies: 2, status: 'Active', avatar: 'SL' },
    { name: 'Raj Patel', lastContact: '3 days ago', policies: 5, status: 'Follow-up needed', avatar: 'RP' },
    { name: 'Maria Santos', lastContact: '1 week ago', policies: 1, status: 'Renewal due', avatar: 'MS' },
    { name: 'David Wong', lastContact: '2 weeks ago', policies: 4, status: 'Active', avatar: 'DW' },
    { name: 'Aisha Hassan', lastContact: '1 month ago', policies: 2, status: 'Inactive', avatar: 'AH' },
  ];

  return (
    <div className="bg-color-warm-mid border border-color-warm-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display font-semibold text-color-cream">Recent Clients</h2>
        <button className="btn-secondary text-sm px-4 py-2">
          View All Clients
        </button>
      </div>
      
      <div className="space-y-4">
        {clients.map((client) => (
          <div key={client.name} className="bg-color-dark border border-color-warm-border rounded-lg p-4 hover:border-color-amber/30 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-color-amber to-color-amber-light flex items-center justify-center mr-4">
                  <span className="text-color-dark font-semibold">{client.avatar}</span>
                </div>
                <div>
                  <div className="font-semibold text-color-cream">{client.name}</div>
                  <div className="text-sm text-color-cream-dim">{client.policies} policies • Last contact: {client.lastContact}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  client.status === 'Active' ? 'bg-green-500/10 text-green-500' :
                  client.status === 'Follow-up needed' ? 'bg-yellow-500/10 text-yellow-500' :
                  client.status === 'Renewal due' ? 'bg-orange-500/10 text-orange-500' :
                  'bg-gray-500/10 text-gray-500'
                }`}>
                  {client.status}
                </div>
                <button className="text-color-amber hover:text-color-amber-light text-sm font-medium">
                  Message
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-6 border-t border-color-warm-border">
        <div className="flex items-center justify-between">
          <div className="text-sm text-color-cream-dim">
            Showing {clients.length} of 24 total clients
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm border border-color-warm-border rounded text-color-cream-dim hover:text-color-cream">
              Previous
            </button>
            <button className="px-3 py-1 text-sm border border-color-warm-border rounded text-color-cream-dim hover:text-color-cream">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientList;