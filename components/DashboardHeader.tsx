import React from 'react';
import Link from 'next/link';

const DashboardHeader = () => {
  return (
    <header className="sticky top-0 z-50 bg-color-dark/95 backdrop-blur supports-[backdrop-filter]:bg-color-dark/60 border-b border-color-warm-border">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-color-amber to-color-amber-light flex items-center justify-center">
                <span className="text-color-dark font-display font-bold text-lg">☕</span>
              </div>
              <span className="text-xl font-display font-semibold text-color-cream">Espresso</span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link href="/dashboard" className="text-color-cream px-3 py-2 text-sm font-medium transition-colors duration-200">
                Dashboard
              </Link>
              <Link href="/dashboard/clients" className="text-color-cream-dim hover:text-color-cream px-3 py-2 text-sm font-medium transition-colors duration-200">
                Clients
              </Link>
              <Link href="/dashboard/conversations" className="text-color-cream-dim hover:text-color-cream px-3 py-2 text-sm font-medium transition-colors duration-200">
                Conversations
              </Link>
              <Link href="/dashboard/reports" className="text-color-cream-dim hover:text-color-cream px-3 py-2 text-sm font-medium transition-colors duration-200">
                Reports
              </Link>
              <Link href="/dashboard/settings" className="text-color-cream-dim hover:text-color-cream px-3 py-2 text-sm font-medium transition-colors duration-200">
                Settings
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center px-4 py-2 text-sm font-medium text-color-cream">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-color-amber to-color-amber-light flex items-center justify-center mr-2">
                <span className="text-color-dark font-semibold text-sm">IF</span>
              </div>
              <span>Independent Financial Advisor</span>
            </div>
            <button className="btn-secondary inline-flex items-center px-4 py-2 text-sm font-semibold">
              Logout
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default DashboardHeader;