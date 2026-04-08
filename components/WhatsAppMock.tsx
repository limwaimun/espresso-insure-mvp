'use client';

import React, { useState } from 'react';

const WhatsAppMock = () => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'client', text: 'Hi, I need health insurance for my family', time: '10:30 AM' },
    { id: 2, sender: 'ai', text: 'Hello! I\'m Maya, your AI assistant. I can help with that. How many family members?', time: '10:31 AM' },
    { id: 3, sender: 'client', text: '4 people - me, spouse, and 2 kids (8 & 12)', time: '10:32 AM' },
    { id: 4, sender: 'ai', text: 'Great! I\'ll find the best plans for your family. Any pre-existing conditions?', time: '10:33 AM' },
    { id: 5, sender: 'client', text: 'No, we\'re all healthy', time: '10:34 AM' },
  ]);
  
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const newMsg = {
      id: messages.length + 1,
      sender: 'ai',
      text: newMessage,
      time: 'Just now'
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
    
    // Simulate AI response after 2 seconds
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        sender: 'client',
        text: 'Thanks! That sounds good. Can you send me the quotes?',
        time: 'Just now'
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 2000);
  };

  return (
    <div className="bg-color-warm-mid border border-color-warm-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center mr-3">
            <span className="text-white text-xl">✉️</span>
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold text-color-cream">WhatsApp Integration</h2>
            <div className="text-sm text-color-cream-dim flex items-center">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
              Connected • Mock Mode
            </div>
          </div>
        </div>
        <div className="text-color-amber text-sm font-medium">+65 9123 4567</div>
      </div>
      
      {/* Chat Container */}
      <div className="bg-color-dark border border-color-warm-border rounded-lg h-96 overflow-hidden flex flex-col">
        {/* Chat Header */}
        <div className="border-b border-color-warm-border p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-color-amber to-color-amber-light flex items-center justify-center mr-3">
              <span className="text-color-dark font-semibold text-sm">TK</span>
            </div>
            <div>
              <div className="font-semibold text-color-cream">Tan Ah Kow</div>
              <div className="text-xs text-color-cream-dim">Health Insurance Inquiry</div>
            </div>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'ai' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-xs rounded-lg p-3 ${
                  msg.sender === 'ai'
                    ? 'bg-color-warm-border text-color-cream'
                    : 'bg-color-amber text-color-dark'
                }`}
              >
                <div className="text-sm">{msg.text}</div>
                <div className={`text-xs mt-1 ${
                  msg.sender === 'ai' ? 'text-color-cream-dim' : 'text-color-dark/70'
                }`}>
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Message Input */}
        <div className="border-t border-color-warm-border p-4">
          <div className="flex items-center">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-color-dark border border-color-warm-border rounded-l-lg px-4 py-3 text-color-cream placeholder-color-cream-dim focus:outline-none focus:ring-2 focus:ring-color-amber focus:border-transparent"
            />
            <button
              onClick={handleSendMessage}
              className="bg-color-amber hover:bg-color-amber-light text-color-dark font-semibold px-6 py-3 rounded-r-lg transition-colors duration-200"
            >
              Send
            </button>
          </div>
          <div className="text-xs text-color-cream-dim mt-2 text-center">
            Mock WhatsApp interface • Real API can be swapped in
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button className="bg-color-dark border border-color-warm-border rounded-lg p-3 text-sm text-color-cream hover:border-color-amber/30 transition-colors duration-200">
          <div className="flex items-center justify-center mb-1">
            <span className="text-lg">📋</span>
          </div>
          Collect Info
        </button>
        <button className="bg-color-dark border border-color-warm-border rounded-lg p-3 text-sm text-color-cream hover:border-color-amber/30 transition-colors duration-200">
          <div className="flex items-center justify-center mb-1">
            <span className="text-lg">💰</span>
          </div>
          Generate Quote
        </button>
        <button className="bg-color-dark border border-color-warm-border rounded-lg p-3 text-sm text-color-cream hover:border-color-amber/30 transition-colors duration-200">
          <div className="flex items-center justify-center mb-1">
            <span className="text-lg">📅</span>
          </div>
          Schedule Call
        </button>
        <button className="bg-color-dark border border-color-warm-border rounded-lg p-3 text-sm text-color-cream hover:border-color-amber/30 transition-colors duration-200">
          <div className="flex items-center justify-center mb-1">
            <span className="text-lg">📁</span>
          </div>
          Attach Docs
        </button>
      </div>
      
      <div className="mt-6 p-4 bg-color-dark/50 border border-color-warm-border rounded-lg">
        <div className="text-sm text-color-cream-dim">
          <div className="font-medium text-color-cream mb-1">Integration Status:</div>
          <div className="flex items-center mb-2">
            <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></div>
            <span>Mock mode active • Ready for real WhatsApp API</span>
          </div>
          <div className="text-xs">
            This mock interface uses the same UI components as the real integration. 
            Switching to real WhatsApp Business API requires only backend changes.
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppMock;