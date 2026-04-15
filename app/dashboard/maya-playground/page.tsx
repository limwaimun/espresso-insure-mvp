'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Copy, RotateCw, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function MayaPlaygroundPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm Maya, your AI assistant for insurance advisors. I can help you draft client responses, analyze policies, explain insurance concepts, or brainstorm sales strategies. What would you like to work on today?",
      timestamp: new Date(Date.now() - 300000),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/maya-playground', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          temperature,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleClear = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hi! I'm Maya, your AI assistant for insurance advisors. I can help you draft client responses, analyze policies, explain insurance concepts, or brainstorm sales strategies. What would you like to work on today?",
        timestamp: new Date(),
      },
    ]);
  };

  const examples = [
    "Draft a warm follow-up message for a client who just had a baby and might need education planning insurance.",
    "Explain the difference between term life and whole life insurance to a 30-year-old professional.",
    "How should I approach a client who's hesitant about critical illness coverage due to cost?",
    "What are the key PDPA considerations when handling client medical information?",
    "Help me create a checklist for a client's annual policy review.",
  ];

  return (
    <div className="min-h-screen bg-[#0F0A05] text-[#F5ECD7] font-sans">
      {/* Header */}
      <div className="p-6 border-b border-[#2E1A0E] bg-[#120A06]">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C8813A] to-[#E5A76A] flex items-center justify-center text-[#120A06]">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#F5ECD7] font-serif">
              Maya Playground
            </h1>
            <p className="text-sm text-[#C9B99A] mt-1">
              Test and refine Maya's responses before sending to clients
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Chat */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto mb-6 pr-2">
            <div className="flex flex-col gap-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-start gap-3 max-w-[80%]">
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C8813A] to-[#E5A76A] flex items-center justify-center text-[#120A06] flex-shrink-0">
                        <Bot size={16} />
                      </div>
                    )}
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      message.role === 'user' 
                        ? 'bg-[#C8813A] text-[#120A06] rounded-br-sm' 
                        : 'bg-[#2E1A0E] text-[#F5ECD7] rounded-bl-sm'
                    }`}>
                      {message.content}
                      {message.role === 'assistant' && (
                        <button
                          onClick={() => handleCopy(message.content)}
                          className="mt-2 px-2 py-1 bg-[rgba(200,129,58,0.2)] border border-[rgba(200,129,58,0.3)] rounded text-[#C8813A] text-xs flex items-center gap-1"
                        >
                          <Copy size={10} />
                          Copy
                        </button>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-[#2E1A0E] flex items-center justify-center text-[#C9B99A] flex-shrink-0">
                        <MessageSquare size={16} />
                      </div>
                    )}
                  </div>
                  <div className={`text-xs text-[#C9B99A] mt-1 ${
                    message.role === 'assistant' ? 'ml-11' : 'mr-11'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3 max-w-[80%]">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C8813A] to-[#E5A76A] flex items-center justify-center text-[#120A06] flex-shrink-0">
                    <Bot size={16} />
                  </div>
                  <div className="p-4 rounded-2xl bg-[#2E1A0E] text-[#F5ECD7] text-sm flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#C8813A] animate-pulse" />
                    <div className="w-1 h-1 rounded-full bg-[#C8813A] animate-pulse delay-200" />
                    <div className="w-1 h-1 rounded-full bg-[#C8813A] animate-pulse delay-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="border-t border-[#2E1A0E] pt-6">
            <div className="relative mb-4">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Maya anything about insurance, client management, or sales strategy..."
                className="w-full min-h-[100px] p-4 bg-[#1C0F0A] border border-[#2E1A0E] rounded-xl text-[#F5ECD7] text-sm leading-relaxed resize-y font-sans outline-none focus:border-[#C8813A] transition-colors"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={`absolute bottom-4 right-4 w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                  isLoading || !input.trim()
                    ? 'bg-[#2E1A0E] text-[#C9B99A] cursor-not-allowed'
                    : 'bg-gradient-to-br from-[#C8813A] to-[#E5A76A] text-[#120A06] cursor-pointer'
                }`}
              >
                {isLoading ? (
                  <RotateCw size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-xs text-[#C9B99A]">
                Press <span className="bg-[#2E1A0E] px-1.5 py-0.5 rounded font-mono">Enter</span> to send,{' '}
                <span className="bg-[#2E1A0E] px-1.5 py-0.5 rounded font-mono">Shift+Enter</span> for new line
              </div>
              
              <div className="flex gap-3 items-center">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2 bg-transparent border border-[#2E1A0E] rounded text-[#C9B99A] text-xs flex items-center gap-1.5 hover:bg-[rgba(229,62,62,0.1)] hover:border-[#E53E3E] hover:text-[#E53E3E] transition-all"
                >
                  <RotateCw size={12} />
                  Clear Chat
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Panel - Settings & Examples */}
        <div className="w-80 border-l border-[#2E1A0E] p-6 bg-[#120A06] overflow-y-auto">
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-[#F5ECD7] mb-4 flex items-center gap-2">
              <Sparkles size={16} />
              Quick Examples
            </h3>
            <div className="flex flex-col gap-2">
              {examples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example)}
                  className="p-3 bg-[#1C0F0A] border border-[#2E1A0E] rounded-lg text-[#C9B99A] text-sm text-left hover:bg-[#2E1A0E] hover:border-[#C8813A] hover:text-[#F5ECD7] transition-all"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-[#F5ECD7] mb-4 flex items-center gap-2">
              <Sparkles size={16} />
              Creativity Level
            </h3>
            <div className="mb-3">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-[#C9B99A]">Precise</span>
                <span className="text-xs text-[#C9B99A]">Creative</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-1 bg-gradient-to-r from-[#2E1A0E] to-[#C8813A] rounded outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#C8813A]"
              />
              <div className="text-center mt-2 text-xs text-[#C8813A] font-medium">
                {temperature.toFixed(1)}
              </div>
            </div>
            <p className="text-xs text-[#C9B99A] leading-relaxed">
              Lower values make responses more focused and deterministic. Higher values allow for more creative and varied responses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}