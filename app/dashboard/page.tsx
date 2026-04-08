import React from 'react';
import Link from 'next/link';

export default function DashboardHome() {
  const metrics = [
    { label: 'Total Clients', value: '24', change: '+3 this month', color: 'amber' },
    { label: 'Active Policies', value: '42', change: '+5 this month', color: 'ok' },
    { label: 'Pending Quotes', value: '8', change: 'Needs attention', color: 'info' },
    { label: 'Renewals Due', value: '3', change: 'Next 30 days', color: 'danger' },
  ];

  const recentClients = [
    { name: 'Tan Ah Kow', lastContact: '2 hours ago', policies: 3, status: 'active', avatar: 'TK', renewal: null },
    { name: 'Sarah Lim', lastContact: 'Yesterday', policies: 2, status: 'active', avatar: 'SL', renewal: '15 Apr' },
    { name: 'Raj Patel', lastContact: '3 days ago', policies: 5, status: 'warning', avatar: 'RP', renewal: null },
    { name: 'Maria Santos', lastContact: '1 week ago', policies: 1, status: 'danger', avatar: 'MS', renewal: '10 Apr' },
    { name: 'David Wong', lastContact: '2 weeks ago', policies: 4, status: 'active', avatar: 'DW', renewal: null },
  ];

  const aiAgents = [
    { name: 'Maya', role: 'Client Intake', status: 'active', icon: '💬', color: 'amber' },
    { name: 'Jordan', role: 'Advisory', status: 'active', icon: '🤖', color: 'info' },
    { name: 'Sam', role: 'Policy Management', status: 'active', icon: '📄', color: 'ok' },
    { name: 'Morgan', role: 'Compliance', status: 'active', icon: '📊', color: 'warning' },
  ];

  return (
    <div className="view active" id="view-home">
      {/* Metrics Grid */}
      <div className="mr grid grid-cols-4 gap-2.5 mb-4.5">
        {metrics.map((metric, index) => (
          <div key={index} className={`mc ${metric.color === 'amber' ? 'ca' : metric.color === 'ok' ? 'cg' : metric.color === 'info' ? 'cb' : 'cr'}`}>
            <div className="ml text-10 tracking-wider uppercase text-color-cream-dim mb-1.25">{metric.label}</div>
            <div className="mv font-display text-34 font-light text-color-cream leading-none mb-0.75">{metric.value}</div>
            <div className="ms text-11 text-color-cream-dim">{metric.change}</div>
            <div className={`mch text-11 mt-0.75 ${metric.change.includes('+') ? 'u text-color-ok' : 'd text-color-danger'}`}>
              {metric.change.includes('+') ? '↗' : '↘'} {metric.change}
            </div>
          </div>
        ))}
      </div>
      
      {/* Recent Clients */}
      <div className="pn bg-color-warm-mid border border-color-warm-border rounded-md overflow-hidden mb-3.5">
        <div className="ph px-4 py-3.25 border-b border-color-warm-border flex items-center justify-between">
          <div className="pnt font-display text-17 font-400 text-color-cream">Recent Clients</div>
          <Link href="/dashboard/clients" className="pna text-12 text-color-amber cursor-pointer">
            View all →
          </Link>
        </div>
        
        <div>
          {recentClients.map((client, index) => (
            <div key={index} className="li px-4 py-3 border-b border-color-warm-border flex items-start gap-2.5 cursor-pointer transition-background duration-150 hover:bg-amber/5 last:border-b-0">
              <div className="av w-8.5 h-8.5 bg-gradient-to-br from-color-amber to-[#8B4513] rounded-full flex items-center justify-center font-display text-14 font-500 text-white flex-shrink-0">
                {client.avatar}
              </div>
              
              <div className="im flex-1 min-w-0">
                <div className="in text-13.5 font-500 text-color-cream mb-0.5">{client.name}</div>
                <div className="is text-12 text-color-cream-dim whitespace-nowrap overflow-hidden text-ellipsis">
                  {client.policies} policies • Last contact: {client.lastContact}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {client.renewal && (
                  <div className="rdc text-center flex-shrink-0 w-9">
                    <div className="rd font-display text-22 font-light leading-none">{client.renewal.split(' ')[0]}</div>
                    <div className="rdl text-9 uppercase tracking-wider text-color-cream-dim">Renew</div>
                  </div>
                )}
                
                <div className={`dot w-2 h-2 rounded-full ${
                  client.status === 'active' ? 'a bg-color-ok' :
                  client.status === 'warning' ? 'w bg-color-warning' :
                  'd bg-color-cream-dim opacity-40'
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* AI Agents Status */}
      <div className="pn bg-color-warm-mid border border-color-warm-border rounded-md overflow-hidden">
        <div className="ph px-4 py-3.25 border-b border-color-warm-border">
          <div className="pnt font-display text-17 font-400 text-color-cream">AI Agents Status</div>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {aiAgents.map((agent, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-color-dark/50 rounded-lg border border-color-warm-border">
                <div className={`ai w-8 h-8 rounded-md flex items-center justify-center text-13 flex-shrink-0 ${
                  agent.color === 'amber' ? 'rn bg-amber/15 text-color-amber' :
                  agent.color === 'info' ? 'in2 bg-info/15 text-color-info' :
                  agent.color === 'ok' ? 'cl bg-ok/15 text-color-ok' :
                  'gp bg-warning/15 text-color-warning'
                }`}>
                  {agent.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-13 font-500 text-color-cream">{agent.name}</div>
                  <div className="text-11 text-color-cream-dim">{agent.role}</div>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-color-ok animate-pulse" />
                  <span className="text-11 text-color-cream-dim">Active</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-color-warm-border">
            <div className="text-12 text-color-cream-dim text-center">
              All AI agents are operational and assisting clients
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mt-4 flex gap-3">
        <button className="flex-1 btn p bg-color-amber text-color-dark border-color-amber px-4 py-2.5 rounded-full text-12 cursor-pointer font-body font-500 transition-all duration-200 hover:bg-color-amber-light">
          + New Conversation
        </button>
        <button className="flex-1 btn bg-transparent border border-color-warm-border text-color-cream-dim px-4 py-2.5 rounded-full text-12 cursor-pointer font-body transition-all duration-200 hover:border-color-amber hover:text-color-cream">
          Generate Report
        </button>
      </div>
    </div>
  );
}