import React from 'react';
import Link from 'next/link';

const DashboardSidebar = () => {
  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠', active: true, badge: null },
    { id: 'maya', label: 'Conversations', icon: '💬', active: false, badge: '3' },
    { id: 'alerts', label: 'Alert Center', icon: '🔔', active: false, badge: '1' },
    { id: 'clients', label: 'All Clients', icon: '👥', active: false, badge: null },
    { id: 'client-record', label: 'Client Records', icon: '📁', active: false, badge: null },
    { id: 'renewals', label: 'Renewal Calendar', icon: '📅', active: false, badge: '2' },
    { id: 'claims', label: 'Claims Details', icon: '📄', active: false, badge: null },
    { id: 'medical', label: 'Medical Assistance', icon: '🏥', active: false, badge: null },
    { id: 'settings', label: 'Settings', icon: '⚙️', active: false, badge: null },
  ];

  return (
    <div className="sb w-60 bg-color-espresso border-r border-color-warm-border flex flex-col h-screen fixed left-0 top-0 z-200 transition-transform duration-300">
      {/* Logo */}
      <div className="sbl px-5 py-5 border-b border-color-warm-border flex items-center justify-between">
        <Link href="/dashboard" className="lt font-display text-20 font-500 tracking-wider uppercase text-color-cream no-underline">
          Espresso<span className="text-color-amber">.</span>
        </Link>
        <button className="sbc bg-transparent border-none text-color-cream-dim text-20 cursor-pointer p-1 leading-none hidden" id="sidebar-close">
          ×
        </button>
      </div>
      
      {/* Navigation */}
      <div className="sbn flex-1 py-2.5 overflow-y-auto">
        <div className="nsl text-10 tracking-wider uppercase text-color-amber px-5 py-2.5 opacity-60">
          Navigation
        </div>
        
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={`/dashboard/${item.id === 'home' ? '' : item.id}`}
            className={`ni flex items-center gap-2.5 px-5 py-2.5 cursor-pointer border-l-2 border-transparent text-color-cream-dim text-13.5 transition-all duration-150 user-select-none hover:bg-amber/6 hover:text-color-cream ${
              item.active ? 'active bg-amber/10 border-l-color-amber text-color-cream' : ''
            }`}
          >
            <span className="ni-icon w-4 h-4 flex-shrink-0 opacity-70">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className={`nb bg-color-amber text-color-dark text-10 font-500 px-1.75 py-0.5 rounded-full min-w-4.5 text-center ${
                item.badge === '1' ? 'r bg-color-danger text-white' : ''
              }`}>
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
      
      {/* IFA Profile */}
      <div className="sbf px-5 py-3.5 border-t border-color-warm-border">
        <div className="ifap flex items-center gap-2.5">
          <div className="ifaav w-8 h-8 bg-gradient-to-br from-color-amber to-[#8B4513] rounded-full flex items-center justify-center font-display text-14 font-500 text-white flex-shrink-0">
            IF
          </div>
          <div>
            <div className="ifan text-13 text-color-cream font-400">Independent Financial Advisor</div>
            <div className="ifapl text-11 text-color-amber">Active • Singapore</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;