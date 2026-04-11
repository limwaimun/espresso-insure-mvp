'use client';

import React, { useState } from 'react';

export default function MayaConversations() {
  const [activeChat, setActiveChat] = useState('tan-ah-kow');
  
  const conversations = [
    { id: 'tan-ah-kow', name: 'Tan Ah Kow', lastMessage: 'Thanks! Can you send me the quotes?', time: '10:34 AM', unread: 0, status: 'active', type: 'health' },
    { id: 'sarah-lim', name: 'Sarah Lim', lastMessage: 'What about critical illness coverage?', time: 'Yesterday', unread: 2, status: 'active', type: 'life' },
    { id: 'raj-patel', name: 'Raj Patel', lastMessage: 'I need to update my beneficiaries', time: '2 days ago', unread: 0, status: 'pending', type: 'life' },
    { id: 'maria-santos', name: 'Maria Santos', lastMessage: 'The premium seems high, any alternatives?', time: '3 days ago', unread: 0, status: 'quote', type: 'health' },
    { id: 'david-wong', name: 'David Wong', lastMessage: 'Can we schedule a call next week?', time: '1 week ago', unread: 0, status: 'scheduled', type: 'investment' },
  ];

  const chatMessages = {
    'tan-ah-kow': [
      { id: 1, sender: 'client', text: 'Hi, I need health insurance for my family', time: '10:30 AM' },
      { id: 2, sender: 'maya', text: 'Hello! I\'m Maya, your AI assistant. How many family members?', time: '10:31 AM' },
      { id: 3, sender: 'client', text: '4 people - me, spouse, and 2 kids (8 & 12)', time: '10:32 AM' },
      { id: 4, sender: 'maya', text: 'Great! I\'ll find the best plans. Any pre-existing conditions?', time: '10:33 AM' },
      { id: 5, sender: 'client', text: 'No, we\'re all healthy', time: '10:34 AM' },
      { id: 6, sender: 'maya', text: 'Perfect! I\'ve found 3 suitable plans. Would you like me to generate quotes?', time: '10:35 AM' },
      { id: 7, sender: 'client', text: 'Thanks! Can you send me the quotes?', time: '10:36 AM' },
    ],
    'sarah-lim': [
      { id: 1, sender: 'client', text: 'I want to review my life insurance', time: 'Yesterday, 2:30 PM' },
      { id: 2, sender: 'maya', text: 'I can help with that. Are you looking to increase coverage or review existing policy?', time: 'Yesterday, 2:31 PM' },
      { id: 3, sender: 'client', text: 'Review existing and maybe add critical illness', time: 'Yesterday, 2:32 PM' },
      { id: 4, sender: 'maya', text: 'What about critical illness coverage?', time: 'Yesterday, 2:33 PM' },
    ],
  };

  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState(chatMessages[activeChat as keyof typeof chatMessages] || []);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const newMsg = {
      id: messages.length + 1,
      sender: 'maya' as const,
      text: newMessage,
      time: 'Just now'
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  const activeConversation = conversations.find(c => c.id === activeChat);

  return (
    <div className="view active" id="view-maya" style={{ margin: '-22px -24px', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
      <div className="flex h-full">
        {/* Conversations List */}
        <div className="w-80 border-r border-color-warm-border bg-color-espresso overflow-y-auto">
          <div className="p-4 border-b border-color-warm-border">
            <h2 className="font-display text-20 font-400 text-color-cream mb-3">Conversations</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full bg-color-dark border border-color-warm-border rounded-lg px-4 py-2.5 text-13 text-color-cream placeholder-color-cream-dim focus:outline-none focus:ring-1 focus:ring-color-amber"
              />
              <div className="absolute right-3 top-2.5 text-color-cream-dim">🔍</div>
            </div>
          </div>
          
          <div className="divide-y divide-color-warm-border">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`p-4 cursor-pointer transition-colors duration-150 hover:bg-amber/5 ${
                  activeChat === conv.id ? 'bg-amber/10' : ''
                }`}
                onClick={() => {
                  setActiveChat(conv.id);
                  setMessages(chatMessages[conv.id as keyof typeof chatMessages] || []);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-color-amber to-[#8B4513] rounded-full flex items-center justify-center font-display text-14 font-500 text-white">
                      {conv.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-color-espresso ${
                      conv.status === 'active' ? 'bg-color-ok' :
                      conv.status === 'pending' ? 'bg-color-warning' :
                      'bg-color-cream-dim'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-14 font-500 text-color-cream truncate">{conv.name}</div>
                      <div className="text-11 text-color-cream-dim">{conv.time}</div>
                    </div>
                    
                    <div className="text-12 text-color-cream-dim truncate mb-2">{conv.lastMessage}</div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`pill text-11 px-2 py-0.5 rounded-full ${
                        conv.type === 'health' ? 'bg-amber/15 text-color-amber' :
                        conv.type === 'life' ? 'bg-info/15 text-color-info' :
                        'bg-ok/15 text-color-ok'
                      }`}>
                        {conv.type}
                      </span>
                      
                      <span className={`pill text-11 px-2 py-0.5 rounded-full ${
                        conv.status === 'active' ? 'bg-ok/15 text-color-ok' :
                        conv.status === 'pending' ? 'bg-warning/15 text-color-warning' :
                        conv.status === 'quote' ? 'bg-info/15 text-color-info' :
                        'bg-amber/15 text-color-amber'
                      }`}>
                        {conv.status}
                      </span>
                    </div>
                  </div>
                  
                  {conv.unread > 0 && (
                    <div className="bg-color-danger text-white text-10 font-500 w-5 h-5 rounded-full flex items-center justify-center">
                      {conv.unread}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-color-dark">
          {/* Chat Header */}
          {activeConversation && (
            <div className="border-b border-color-warm-border p-4 bg-color-espresso">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-color-amber to-[#8B4513] rounded-full flex items-center justify-center font-display text-14 font-500 text-white">
                    {activeConversation.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-16 font-500 text-color-cream">{activeConversation.name}</div>
                    <div className="text-12 text-color-cream-dim flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-color-ok animate-pulse" />
                      <span>Maya is typing...</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button className="text-color-cream-dim hover:text-color-cream text-14">
                    📋
                  </button>
                  <button className="text-color-cream-dim hover:text-color-cream text-14">
                    📞
                  </button>
                  <button className="text-color-cream-dim hover:text-color-cream text-14">
                    ⋯
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#0C1317]">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'maya' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-md rounded-2xl px-4 py-3 ${
                      msg.sender === 'maya'
                        ? 'bg-[#202C33] text-[#E9EDEF] rounded-bl-none'
                        : 'bg-color-amber text-color-dark rounded-br-none'
                    }`}
                  >
                    <div className="text-14">{msg.text}</div>
                    <div className={`text-11 mt-1 ${
                      msg.sender === 'maya' ? 'text-[#8696A0]' : 'text-color-dark/70'
                    }`}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Message Input */}
          <div className="border-t border-color-warm-border p-4 bg-color-espresso">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3">
                <button className="text-color-cream-dim hover:text-color-cream text-18">
                  +
                </button>
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="w-full bg-color-dark border border-color-warm-border rounded-full px-5 py-3 text-14 text-color-cream placeholder-color-cream-dim focus:outline-none focus:ring-1 focus:ring-color-amber"
                  />
                </div>
                
                <button
                  onClick={handleSendMessage}
                  className="bg-color-amber hover:bg-color-amber-light text-color-dark font-500 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200"
                >
                  ↑
                </button>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <button className="flex items-center gap-2 text-12 text-color-cream-dim hover:text-color-cream">
                  <span>📋</span>
                  Collect Info
                </button>
                <button className="flex items-center gap-2 text-12 text-color-cream-dim hover:text-color-cream">
                  <span>💰</span>
                  Generate Quote
                </button>
                <button className="flex items-center gap-2 text-12 text-color-cream-dim hover:text-color-cream">
                  <span>📅</span>
                  Schedule Call
                </button>
                <button className="flex items-center gap-2 text-12 text-color-cream-dim hover:text-color-cream">
                  <span>📁</span>
                  Attach Docs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}