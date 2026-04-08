import React from 'react';

const DashboardTopbar = () => {
  return (
    <div className="tb bg-color-espresso border-b border-color-warm-border px-6 h-14 flex items-center justify-between flex-shrink-0">
      {/* Left side */}
      <div className="tbl flex items-center gap-3">
        <button className="hb hidden bg-transparent border border-color-warm-border text-color-cream-dim w-8 h-8 rounded-md cursor-pointer items-center justify-center flex-col gap-1" id="hamburger">
          <span className="block w-3.5 h-0.5 bg-current rounded-sm" />
          <span className="block w-3.5 h-0.5 bg-current rounded-sm" />
          <span className="block w-3.5 h-0.5 bg-current rounded-sm" />
        </button>
        <div className="tbt font-display text-20 font-400 text-color-cream">Dashboard</div>
      </div>
      
      {/* Right side */}
      <div className="tbr flex items-center gap-3">
        <div className="mast flex items-center gap-1.5 text-12 text-color-cream-dim">
          <div className="sl w-1.75 h-1.75 bg-color-ok rounded-full animate-pulse" />
          <span>Maya is active</span>
        </div>
        
        <button className="btn bg-transparent border border-color-warm-border text-color-cream-dim px-3.5 py-1.75 rounded-full text-12 cursor-pointer font-body transition-all duration-200 hover:border-color-amber hover:text-color-cream">
          Help
        </button>
        
        <button className="btn p bg-color-amber text-color-dark border-color-amber px-3.5 py-1.75 rounded-full text-12 cursor-pointer font-body font-500 transition-all duration-200 hover:bg-color-amber-light">
          + New Client
        </button>
      </div>
    </div>
  );
};

export default DashboardTopbar;