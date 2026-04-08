import React from 'react';
import Link from 'next/link';

const DashboardBottomNav = () => {
  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠', active: true },
    { id: 'maya', label: 'Chat', icon: '💬', active: false, badge: '3' },
    { id: 'clients', label: 'Clients', icon: '👥', active: false },
    { id: 'alerts', label: 'Alerts', icon: '🔔', active: false, badge: '1' },
    { id: 'settings', label: 'More', icon: '⋯', active: false },
  ];

  return (
    <div className="bnn fixed bottom-0 left-0 right-0 h-15 bg-color-espresso border-t border-color-warm-border z-100 px-1 flex items-center justify-around hidden">
      {navItems.map((item) => (
        <Link
          key={item.id}
          href={`/dashboard/${item.id === 'home' ? '' : item.id}`}
          className={`bni flex flex-col items-center gap-0.75 px-2.5 py-1.5 cursor-pointer rounded-md transition-background duration-150 min-w-13 relative ${
            item.active ? 'active bg-amber/12' : ''
          }`}
        >
          <span className={`bni-ic w-5.5 h-5.5 ${item.active ? 'text-color-amber' : 'text-color-cream-dim'}`}>
            {item.icon}
          </span>
          <span className={`bni-lb text-10 ${item.active ? 'text-color-amber' : 'text-color-cream-dim'}`}>
            {item.label}
          </span>
          {item.badge && (
            <span className="bnbg absolute top-1 right-1.5 bg-color-danger text-white text-9 font-500 w-3.75 h-3.75 rounded-full flex items-center justify-center">
              {item.badge}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
};

export default DashboardBottomNav;