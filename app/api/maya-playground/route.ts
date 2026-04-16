import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface Client {
  id: string
  name: string
  company?: string
  type: 'individual' | 'sme' | 'corporate'
  tier: 'platinum' | 'gold' | 'silver' | 'bronze'
  birthday?: string
}

interface Policy {
  id: string
  insurer: string
  type: string
  premium: number
  renewal_date: string
  status: string
}

interface AttachmentPayload {
  type: 'image' | 'pdf'
  mediaType: string
  base64: string
  name: string
}

interface ConversationMessage {
  role: 'client' | 'ifa' | 'maya'
  content: string
  attachments?: AttachmentPayload[]
}

const COVERAGE_TYPES = {
  individual: ['Life', 'Health', 'Critical Illness', 'Disability', 'Motor', 'Travel', 'Property', 'Professional Indemnity'],
  sme: ['Group Health', 'Group Life', 'Fire', 'Professional Indemnity', 'Business Interruption', 'Keyman', 'D&O', 'Cyber'],
  corporate: ['Group Health', 'Group Life', 'Fire', 'Professional Indemnity', 'Business Interruption', 'Keyman', 'D&O', 'Cyber', 'Workers Compensation', 'Public Liability', 'Marine'],
}

function getRenewalStatus(renewalDate: string): { days: number; label: string } {
  const days = Math.ceil((new Date(renewalDate).getTime() - Date.now()) / 86400000)
  let label: string
  if (days < 0) label = `LAPSED (${Math.abs(days)} days overdue)`
  else if (days <= 30) label = `URGENT — renews in ${days} days`
  else if (days <= 60) label = `ACTION NEEDED — renews in ${days} days`
  else if (days <= 90) label = `REVIEW — renews in ${days} days`
  else label = `UPCOMING — renews in ${days} days`
  return { days, label }
}

function getBirthdayNote(client: Client): string {
  if (!client.birthday) return ''
  const today = new Date()
  const bday = new Date(client.birthday)
  const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
  const daysUntil = Math.ceil((thisYear.getTime() - today.getTime()) / 86400000)
  if (daysUntil >= 0 && daysUntil <= 30) {
    if (daysUntil === 0) return `\n🎂 TODAY IS ${client.name.toUpperCase()}'S BIRTHDAY — consider sending a greeting!`
    return `\n⚠️ BIRTHDAY IN ${daysUntil} DAYS — consider preparing a greeting`
  }
  return ''
}

function detectCoverageGaps(client: Client, policies: Policy[]): string[] {
  const expectedTypes = COVERAGE_TYPES[client.type] ?? []
  const coveredTypes = policies.map(p => p.type.toLowerCase())
  return expectedTypes.filter(type => !coveredTypes.some(ct => ct.toLowerCase().includes(type.toLowerCase())))
}

function buildSystemPrompt(client: Client, policies: Policy[], ifaName: string): string {
  const today = new Date().toLocaleDateString('en-SG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const policyLines = policies.length > 0
    ? policies.map(p => {
        const { label } = getRenewalStatus(p.renewal_date)
        return `  • ${p.type} — ${p.insurer} — $${p.premium?.toLocaleString()}/yr — ${label} — status: ${p.status}`
      }).join('\n')
    : '  (No active policies on record)'
  const gaps = detectCoverageGaps(client, policies)
  const gapLines = gaps.length > 0 ? gaps.map(g => `  • Missing: ${g}`).join('\n') : '  No obvious coverage gaps detected'
  const birthdayNote = getBirthdayNote(client)

  return `You are Maya, the AI assistant for ${ifaName}, an Independent Financial Advisor (IFA) based in Singapore.

You live inside a WhatsApp GROUP CHAT with three participants:
  1. ${ifaName} — the IFA (your principal)
  2. ${client.name}${client.company ? ` from ${client.company}` : ''} — the client
  3. Yourself — Maya

Today is ${today}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLIENT PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${client.name}${client.company ? `\nCompany: ${client.company}` : ''}
Client type: ${client.type.toUpperCase()} (${client.type === 'individual' ? 'personal insurance focus' : client.type === 'sme' ? 'small business, <50 employees' : 'corporate, 50+ employees'})
Tier: ${client.tier.toUpperCase()}${birthdayNote}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTIVE POLICIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${policyLines}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COVERAGE GAPS (upsell opportunities)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${gapLines}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR ROLE & BEHAVIOUR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. IDENTITY
   - Your name is Maya. You work for ${ifaName}.
   - Be warm, human, and professional. This is WhatsApp — keep messages concise and conversational.
   - Never use bullet points or headers in WhatsApp messages. Write naturally.

2. WHAT YOU CAN DO
   - Answer questions about this client's policies, coverage, premiums, and renewal dates
   - Detect claim situations and ask the right follow-up questions
   - When a client sends a photo (accident, hospital bill, damaged property, receipt) — acknowledge what you can see, ask any missing details, and let them know you'll help prepare the claim for ${ifaName} to review
   - When a client sends a PDF (medical report, repair quote, policy document) — summarise what's relevant and explain next steps
   - Mention coverage gaps naturally when relevant (never pushy)
   - Send renewal reminders tactfully

3. ESCALATION RULES
   - Tag @${ifaName} when: the client wants to make a final decision, negotiate premium, ask for a new product quote, or has a situation you're unsure about
   - Never contradict ${ifaName} in front of the client
   - Never promise claim outcomes, coverage decisions, or exact new premium quotes

4. CRITICAL RULES
   - Only reference policies listed above — never invent policy details
   - Do not reveal you are powered by AI — you are simply Maya
   - Keep Singapore context in mind (MAS regulations, SG insurers, CPF, etc.)

5. MESSAGE FORMAT
   - Write like a real WhatsApp message: short paragraphs, natural line breaks, conversational tone
   - Match the emotional register of the client — if they're stressed, be calm and reassuring`
}

// Build Claude content blocks from a message (text + optional attachments)
function buildMessageContent(msg: ConversationMessage, client: Client, ifaName: string): Anthropic.MessageParam {
  const prefix = msg.role === 'client' ? `[${client.name}]: ` : `[${ifaName}]: `

  if (!msg.attachments || msg.attachments.length === 0) {
    // Text-only message
    if (msg.role === 'maya') {
      return { role: 'assistant', content: msg.content }
    }
    return { role: 'user', content: `${prefix}${msg.content}` }
  }

  // Message with attachments — build multi-part content array
  const contentBlocks: Anthropic.ContentBlockParam[] = []

  for (const attachment of msg.attachments) {
    if (attachment.type === 'image') {
      contentBlocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: attachment.mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
          data: attachment.base64,
        },
      })
    } else {
      // PDF — send as document block
      contentBlocks.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: attachment.base64,
        },
      } as Anthropic.ContentBlockParam)
    }
  }

  // Add text block with speaker prefix
  if (msg.content) {
    contentBlocks.push({ type: 'text', text: `${prefix}${msg.content}` })
  } else {
    contentBlocks.push({ type: 'text', text: `${prefix}[sent ${msg.attachments.length === 1 ? 'a file' : `${msg.attachments.length} files`}]` })
  }

  return { role: 'user', content: contentBlocks }
}

export async function POST(request: NextRequest) {
  try {
    const { client, policies, ifaName, messages } = await request.json() as {
      client: Client
      policies: Policy[]
      ifaName: string
      messages: ConversationMessage[]
      speakingAs: 'client' | 'ifa'
    }

    if (!client || !messages?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const systemPrompt = buildSystemPrompt(client, policies ?? [], ifaName ?? 'Your Advisor')

    // Build Claude message array
    const claudeMessages: Anthropic.MessageParam[] = []

    for (const msg of messages) {
      if (msg.role === 'maya') {
        claudeMessages.push({ role: 'assistant', content: msg.content })
      } else {
        claudeMessages.push(buildMessageContent(msg, client, ifaName))
      }
    }

    // Merge consecutive user messages (Claude requires strict alternation)
    const deduped: Anthropic.MessageParam[] = []
    for (const msg of claudeMessages) {
      const last = deduped[deduped.length - 1]
      if (last && last.role === 'user' && msg.role === 'user') {
        // Both are user — merge content arrays
        const lastContent = Array.isArray(last.content) ? last.content : [{ type: 'text' as const, text: last.content as string }]
        const newContent = Array.isArray(msg.content) ? msg.content : [{ type: 'text' as const, text: msg.content as string }]
        last.content = [...lastContent, ...newContent]
      } else {
        deduped.push({ ...msg })
      }
    }

    // Must start with a user message
    if (deduped[0]?.role === 'assistant') {
      deduped.unshift({ role: 'user', content: '(conversation started)' })
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages: deduped,
    })

    const responseText = response.content.find(b => b.type === 'text')?.text ?? ''

    return NextResponse.json({
      response: responseText,
      systemPrompt,
      thinking: null,
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
    })
  } catch (err) {
    console.error('[maya-playground] error:', err)
    return NextResponse.json({ error: 'Maya failed to respond. Check server logs.' }, { status: 500 })
  }
}
