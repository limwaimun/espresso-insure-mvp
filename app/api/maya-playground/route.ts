import { NextRequest, NextResponse } from 'next/server';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface RequestBody {
  messages: Message[];
  temperature?: number;
  systemPrompt?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { messages, temperature = 0.7, systemPrompt } = body;

    // Format messages for Anthropic API
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));

    // Get the last user message
    const lastUserMessage = messages
      .filter(msg => msg.role === 'user')
      .pop()?.content || '';

    // Default system prompt if not provided
    const defaultSystemPrompt = `You are Maya, an AI assistant for insurance advisors in Southeast Asia. You are warm, professional, and deeply knowledgeable about insurance products, regulations, and client management.

Key characteristics:
1. **Expertise**: Insurance products (life, health, critical illness, education, retirement), regulations (PDPA, MAS), claims processes
2. **Tone**: Warm, professional, concise, practical
3. **Context**: Singapore/Malaysia/Indonesia markets, local regulations and practices
4. **Purpose**: Help IFAs with client communication, policy analysis, sales strategy, and compliance

Always provide actionable, practical advice. Be concise but thorough. Use examples when helpful.`;

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        temperature: temperature,
        system: systemPrompt || defaultSystemPrompt,
        messages: formattedMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the response content
    const content = data.content?.[0]?.text || "I apologize, but I couldn't generate a response. Please try again.";

    return NextResponse.json({
      content,
      model: data.model,
      usage: data.usage,
    });

  } catch (error) {
    console.error('Error in Maya Playground API:', error);
    
    // Fallback response if API fails
    const fallbackResponses = [
      "I understand you're asking about insurance advice. Based on typical scenarios, here's what I'd recommend...",
      "That's an excellent question for an insurance advisor. Here are some key considerations...",
      "Let me help you think through this insurance scenario. Here are some practical suggestions...",
      "Based on common best practices in the insurance industry, here's how I'd approach this...",
      "I'd be happy to help with that insurance-related question. Here are some thoughts...",
    ];
    
    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    return NextResponse.json({
      content: randomResponse,
      model: 'fallback',
      usage: { input_tokens: 0, output_tokens: 0 },
    }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Maya Playground API is running',
    endpoints: {
      POST: '/api/maya-playground',
    },
    description: 'Chat interface for testing Maya AI responses',
  });
}