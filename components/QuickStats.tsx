import React from 'react';

const QuickStats = () => {
  const stats = [
    { label: 'Total Clients', value: '24', change: '+3 this month', icon: '👥' },
    { label: 'Active Policies', value: '42', change: '+5 this month', icon: '📄' },
    { label: 'Pending Quotes', value: '8', change: 'Needs attention', icon: '⏳' },
    { label: 'Renewals Due', value: '3', change: 'Next 30 days', icon: '📅' },
    { label: 'Revenue YTD', value: '$42.8K', change: '+18% vs last year', icon: '💰' },
    { label: 'Client Satisfaction', value: '94%', change: '+2% this quarter', icon: '⭐' },
  ];

  return (
    <div className="bg-color-warm-mid border border-color-warm-border rounded-xl p-6">
      <h2 className="text-xl font-display font-semibold text-color-cream mb-6">Quick Stats</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-color-dark border border-color-warm-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">{stat.icon}</div>
              <div className="text-right">
                <div className="text-2xl font-display font-bold text-color-cream">{stat.value}</div>
                <div className="text-xs text-color-cream-dim mt-1">{stat.change}</div>
              </div>
            </div>
            <div className="text-sm text-color-cream-dim">{stat.label}</div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-6 border-t border-color-warm-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-color-cream-dim">AI Assistant Status</div>
            <div className="flex items-center mt-1">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
              <span className="text-color-cream text-sm">Maya is active and assisting clients</span>
            </div>
          </div>
          <button className="btn-primary text-sm px-4 py-2">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickStats;