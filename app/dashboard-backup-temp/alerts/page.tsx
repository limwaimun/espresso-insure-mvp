import React from 'react';

export default function AlertsPage() {
  const alerts = [
    { id: 1, type: 'renewal', title: 'Policy Renewal Due', client: 'Sarah Lim', policy: 'Life Insurance', date: '15 Apr 2026', priority: 'high', read: false },
    { id: 2, type: 'payment', title: 'Payment Missed', client: 'Raj Patel', policy: 'Investment Plan', date: '10 Apr 2026', priority: 'high', read: false },
    { id: 3, type: 'document', title: 'Document Expiring', client: 'Tan Ah Kow', policy: 'Health Insurance', date: '30 Apr 2026', priority: 'medium', read: true },
    { id: 4, type: 'compliance', title: 'Compliance Check', client: 'All Clients', policy: 'Annual Review', date: '30 Jun 2026', priority: 'medium', read: true },
    { id: 5, type: 'followup', title: 'Follow-up Required', client: 'Maria Santos', policy: 'Health Insurance', date: '12 Apr 2026', priority: 'low', read: true },
    { id: 6, type: 'market', title: 'Market Update', client: 'All Clients', policy: 'Investment Plans', date: 'Today', priority: 'low', read: true },
  ];

  const alertTypes = [
    { type: 'all', label: 'All Alerts', count: 6 },
    { type: 'unread', label: 'Unread', count: 2 },
    { type: 'renewal', label: 'Renewals', count: 1 },
    { type: 'payment', label: 'Payments', count: 1 },
    { type: 'compliance', label: 'Compliance', count: 1 },
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'renewal': return '📅';
      case 'payment': return '💰';
      case 'document': return '📄';
      case 'compliance': return '📊';
      case 'followup': return '💬';
      case 'market': return '📈';
      default: return '🔔';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-color-danger';
      case 'medium': return 'text-color-warning';
      case 'low': return 'text-color-info';
      default: return 'text-color-cream-dim';
    }
  };

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-color-danger/15';
      case 'medium': return 'bg-color-warning/15';
      case 'low': return 'bg-color-info/15';
      default: return 'bg-color-cream-dim/15';
    }
  };

  return (
    <div className="view active" id="view-alerts">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-28 font-400 text-color-cream mb-2">Alert Center</h1>
          <p className="text-color-cream-dim text-14">Monitor important updates and required actions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="btn bg-transparent border border-color-warm-border text-color-cream-dim px-4 py-2 rounded-full text-12 cursor-pointer font-body transition-all duration-200 hover:border-color-amber hover:text-color-cream">
            Mark All Read
          </button>
          <button className="btn p bg-color-amber text-color-dark border-color-amber px-4 py-2 rounded-full text-12 cursor-pointer font-body font-500 transition-all duration-200 hover:bg-color-amber-light">
            Configure Alerts
          </button>
        </div>
      </div>
      
      {/* Alert Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="card card-danger p-5">
          <div className="ml text-10 tracking-wider uppercase text-color-cream-dim mb-1.25">High Priority</div>
          <div className="mv font-display text-34 font-light text-color-cream leading-none mb-0.75">2</div>
          <div className="ms text-11 text-color-cream-dim">Requires immediate action</div>
        </div>
        
        <div className="card card-warning p-5">
          <div className="ml text-10 tracking-wider uppercase text-color-cream-dim mb-1.25">Medium Priority</div>
          <div className="mv font-display text-34 font-light text-color-cream leading-none mb-0.75">2</div>
          <div className="ms text-11 text-color-cream-dim">Action needed soon</div>
        </div>
        
        <div className="card card-info p-5">
          <div className="ml text-10 tracking-wider uppercase text-color-cream-dim mb-1.25">Low Priority</div>
          <div className="mv font-display text-34 font-light text-color-cream leading-none mb-0.75">2</div>
          <div className="ms text-11 text-color-cream-dim">Informational</div>
        </div>
        
        <div className="card card-amber p-5">
          <div className="ml text-10 tracking-wider uppercase text-color-cream-dim mb-1.25">Total Unread</div>
          <div className="mv font-display text-34 font-light text-color-cream leading-none mb-0.75">2</div>
          <div className="ms text-11 text-color-cream-dim">New alerts</div>
        </div>
      </div>
      
      {/* Alert Type Filters */}
      <div className="flex items-center gap-3 mb-6">
        {alertTypes.map((alertType) => (
          <button
            key={alertType.type}
            className={`px-4 py-2 rounded-full text-12 transition-all duration-200 flex items-center gap-2 ${
              alertType.type === 'all'
                ? 'bg-color-amber text-color-dark font-500'
                : 'bg-transparent border border-color-warm-border text-color-cream-dim hover:border-color-amber hover:text-color-cream'
            }`}
          >
            {alertType.label}
            {alertType.count > 0 && (
              <span className={`text-10 px-1.5 py-0.5 rounded-full ${
                alertType.type === 'all'
                  ? 'bg-color-dark/20 text-color-dark'
                  : 'bg-color-warm-border text-color-cream-dim'
              }`}>
                {alertType.count}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`card p-5 border transition-colors duration-200 hover:border-color-amber/50 ${
              !alert.read ? 'border-color-amber/30 bg-amber/5' : 'border-color-warm-border'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Alert Icon */}
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-20 ${
                getPriorityBg(alert.priority)
              } ${getPriorityColor(alert.priority)}`}>
                {getAlertIcon(alert.type)}
              </div>
              
              {/* Alert Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-16 font-500 text-color-cream">{alert.title}</h3>
                    {!alert.read && (
                      <span className="w-2 h-2 rounded-full bg-color-amber animate-pulse" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`pill text-11 px-2.5 py-1 rounded-full ${getPriorityBg(alert.priority)} ${getPriorityColor(alert.priority)}`}>
                      {alert.priority} priority
                    </span>
                    <span className="text-11 text-color-cream-dim">{alert.date}</span>
                  </div>
                </div>
                
                <div className="text-14 text-color-cream-dim mb-3">
                  {alert.client} • {alert.policy}
                </div>
                
                <div className="flex items-center gap-3">
                  <button className="text-12 text-color-amber hover:text-color-amber-light font-500">
                    Take Action
                  </button>
                  <button className="text-12 text-color-cream-dim hover:text-color-cream">
                    Snooze
                  </button>
                  <button className="text-12 text-color-cream-dim hover:text-color-cream">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Empty State (if no alerts) */}
      <div className="text-center py-12 hidden">
        <div className="text-48 mb-4">🔔</div>
        <h3 className="font-display text-20 font-400 text-color-cream mb-2">No Alerts</h3>
        <p className="text-color-cream-dim text-14 max-w-md mx-auto">
          You're all caught up! No pending alerts require your attention.
        </p>
      </div>
      
      {/* Alert Settings Preview */}
      <div className="mt-8 pt-6 border-t border-color-warm-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-18 font-400 text-color-cream">Alert Settings</h3>
          <button className="text-12 text-color-amber hover:text-color-amber-light font-500">
            Edit Settings
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-color-warm-mid border border-color-warm-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-14 text-color-cream">Email Notifications</span>
              <div className="w-10 h-6 bg-color-amber rounded-full relative">
                <div className="absolute top-1 right-1 w-4 h-4 bg-color-dark rounded-full" />
              </div>
            </div>
            <p className="text-12 text-color-cream-dim">Receive alerts via email</p>
          </div>
          
          <div className="bg-color-warm-mid border border-color-warm-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-14 text-color-cream">WhatsApp Alerts</span>
              <div className="w-10 h-6 bg-color-amber rounded-full relative">
                <div className="absolute top-1 right-1 w-4 h-4 bg-color-dark rounded-full" />
              </div>
            </div>
            <p className="text-12 text-color-cream-dim">Receive alerts via WhatsApp</p>
          </div>
        </div>
      </div>
    </div>
  );
}