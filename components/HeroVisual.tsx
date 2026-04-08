import React from 'react';

const HeroVisual = () => {
  return (
    <div className="hero-visual absolute right-12 top-1/2 -translate-y-1/2 w-85 animate-fadeUp animation-delay-500">
      <div className="wa-phone bg-[#111B21] rounded-8xl py-7 px-0 border border-white/8 shadow-[0_40px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)] overflow-hidden">
        {/* WhatsApp Header */}
        <div className="wa-header px-5 pb-4 border-b border-white/6 flex items-center gap-3">
          <div className="wa-avatar w-9.5 h-9.5 bg-gradient-to-br from-amber to-[#8B4513] rounded-full flex items-center justify-center font-display text-16 font-medium text-white">
            TK
          </div>
          <div className="wa-header-info flex-1">
            <div className="wa-name text-14 font-medium text-[#E9EDEF]">Tan Ah Kow</div>
            <div className="wa-status text-12 text-[#8696A0]">Health Insurance Inquiry</div>
          </div>
        </div>
        
        {/* Chat Messages */}
        <div className="wa-chat p-5 space-y-3">
          {/* Client Message */}
          <div className="flex justify-end">
            <div className="bg-amber text-dark rounded-2xl rounded-br-none px-4 py-3 max-w-48">
              <div className="text-14">Hi, I need health insurance for my family</div>
              <div className="text-11 text-dark/70 mt-1 text-right">10:30 AM</div>
            </div>
          </div>
          
          {/* AI Message */}
          <div className="flex justify-start">
            <div className="bg-[#202C33] text-[#E9EDEF] rounded-2xl rounded-bl-none px-4 py-3 max-w-48">
              <div className="text-14">Hello! I'm Maya, your AI assistant. How many family members?</div>
              <div className="text-11 text-[#8696A0] mt-1">10:31 AM</div>
            </div>
          </div>
          
          {/* Client Message */}
          <div className="flex justify-end">
            <div className="bg-amber text-dark rounded-2xl rounded-br-none px-4 py-3 max-w-48">
              <div className="text-14">4 people - me, spouse, and 2 kids (8 & 12)</div>
              <div className="text-11 text-dark/70 mt-1 text-right">10:32 AM</div>
            </div>
          </div>
          
          {/* AI Message */}
          <div className="flex justify-start">
            <div className="bg-[#202C33] text-[#E9EDEF] rounded-2xl rounded-bl-none px-4 py-3 max-w-48">
              <div className="text-14">Great! I'll find the best plans. Any pre-existing conditions?</div>
              <div className="text-11 text-[#8696A0] mt-1">10:33 AM</div>
            </div>
          </div>
        </div>
        
        {/* Input Area */}
        <div className="wa-input px-5 pt-4 border-t border-white/6">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-[#2A3942] rounded-full px-4 py-3">
              <div className="text-14 text-[#8696A0]">Type a message...</div>
            </div>
            <div className="w-10 h-10 bg-amber rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute -top-6 -left-6 w-12 h-12 bg-amber/10 rounded-full blur-sm" />
      <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-info/10 rounded-full blur-sm" />
    </div>
  );
};

export default HeroVisual;