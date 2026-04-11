import React from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardTopbar from '@/components/DashboardTopbar';
import DashboardBottomNav from '@/components/DashboardBottomNav';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen bg-color-dark text-color-cream font-body font-weight-300 text-14 overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar />
      
      {/* Overlay for mobile */}
      <div className="ov fixed inset-0 bg-black/60 z-190 hidden" id="sidebar-overlay" />
      
      {/* Main content */}
      <div className="mn ml-60 h-screen flex flex-col overflow-hidden">
        <DashboardTopbar />
        
        {/* Content area */}
        <div className="ct flex-1 overflow-y-auto overflow-x-hidden py-5.5 px-6">
          {children}
        </div>
      </div>
      
      {/* Bottom navigation for mobile */}
      <DashboardBottomNav />
    </div>
  );
}