import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ── Types ──────────────────────────────────────────────────────────────────

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

interface ConversationMessage {
  role: 'client' | 'ifa' | 'maya'
  content: string
}

// ── Coverage types per client category ────────────────────────────────────

const COVERAGE_TYPES = {
  individual: [
    'Life',
    'Health',
    'Critical Illness',
    'Disability',
    'Motor',
    'Travel',
    'Property',
    'Professional Indemnity',
  ],
  sme: [
    'Group Health',
    'Group Life',
    'Fire',
    'Professional Indemnity',
    'Business Interruption',
    'Keyman',
    'D&O',
    'Cyber',
  ],
  corporate: [
    'Group Health',
    'Group Life',
    'Fire',
    'Professional Indemnity',
    'Business Interruption',
    'Keyman',
    'D&O',
    'Cyber',
    'Workers Compensation',
    'Public Liability',
    'Marine',
  ],
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getRenewalStatus(renewalDate: string): { days: number; label: string } {
  const days = Math.ceil(
    (new Date(renewalDate).getTime() - Date.now()) / 86400000
  )
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
  return expectedTypes.filter(
    type => !coveredTypes.some(ct => ct.toLowerCase().includes(type.toLowerCase()))
  )
}

// ── System prompt builder ──────────────────────────────────────────────────

function buildSystemPrompt(client: Client, policies: Policy[], ifaName: string): string {
  const today = new Date().toLocaleDateString('en-SG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const policyLines =
    policies.length > 0
      ? policies
          .map(p => {
            const { label } = getRenewalStatus(p.renewal_date)
            return `  • ${p.type} — ${p.insurer} — $${p.premium?.toLocaleString()}/yr — ${label} — status: ${p.status}`
          })
          .join('\n')
      : '  (No active policies on record)'

  const gaps = detectCoverageGaps(client, policies)
  const gapLines =
    gaps.length > 0
      ? gaps.map(g => `  • Missing: ${g}`).join('\n')
      : '  No obvious coverage gaps detected'

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
Client type: ${client.type.toUpperCase()} (${
    client.type === 'individual'
      ? 'personal insurance focus'
      : client.type === 'sme'
      ? 'small business, <50 employees'
      : 'corporate, 50+ employees'
  })
Tier: ${client.tier.toUpperCase()} (${
    client.tier === 'platinum'
      ? '≥$10k/yr total premium'
      : client.tier === 'gold'
      ? '≥$5k/yr total premium'
      : client.tier === 'silver'
      ? '≥$1k/yr total premium'
      : '<$1k/yr total premium'
  })${birthdayNote}

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
   - Clients feel they are talking to ${ifaName}'s team — you are an extension of the advisor, not a generic chatbot.
   - Be warm, human, and professional. This is WhatsApp — not email. Keep messages concise and conversational.
   - Never use bullet points or headers in WhatsApp messages. Write naturally.

2. WHAT YOU CAN DO
   - Answer questions about this client's policies, coverage, premiums, and renewal dates
   - Detect claim situations ("I was in an accident", "I'm in hospital", "I need to make a claim")
     → Ask: what happened, when, which hospital/incident, and whether they have photos/receipts
     → Identify the right insurer from the policies above
     → Let them know you'll help prepare the form for ${ifaName} to review
   - Send renewal reminders tactfully when renewals are approaching
   - Mention coverage gaps naturally when relevant (never pushy)
   - Send birthday greetings when flagged above

3. ESCALATION RULES
   - Tag @${ifaName} when: the client wants to make a final decision, negotiate premium, ask for a quote on a new product, or has a situation you're not sure about
   - Example: "Let me flag this for @${ifaName} — he'll be best placed to walk you through the options."
   - Never contradict ${ifaName} in front of the client
   - Never promise claim outcomes, coverage decisions, or exact new premium quotes

4. CRITICAL RULES
   - Only reference policies listed above — never invent policy details
   - Never quote premiums for products the client doesn't currently hold
   - If you don't know something, say so honestly and offer to check
   - Keep Singapore context in mind (MAS regulations, SG insurers, CPF, etc.)
   - Do not reveal that you are powered by AI or Claude — you are simply "Maya"

5. MESSAGE FORMAT
   - Write like a real WhatsApp message: short paragraphs, natural line breaks, conversational tone
   - Avoid lists and markdown formatting
   - Match the emotional register of the client — if they're stressed, be calm and reassuring; if they're casual, match that energy`
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { client, policies, ifaName, messages, speakingAs } = await request.json() as {
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

    // Convert our 3-role message history to Claude's 2-role format.
    // Maya messages → assistant. Client / IFA messages → user (with speaker prefix).
    const claudeMessages: { role: 'user' | 'assistant'; content: string }[] = []

    for (const msg of messages) {
      if (msg.role === 'maya') {
        claudeMessages.push({ role: 'assistant', content: msg.content })
      } else {
        const prefix = msg.role === 'client' ? `[${client.name}]: ` : `[${ifaName}]: `
        claudeMessages.push({ role: 'user', content: `${prefix}${msg.content}` })
      }
    }

    // Claude requires messages to alternate. If last two are both 'user', merge them.
    const deduped: typeof claudeMessages = []
    for (const msg of claudeMessages) {
      const last = deduped[deduped.length - 1]
      if (last && last.role === msg.role && msg.role === 'user') {
        last.content += `\n${msg.content}`
      } else {
        deduped.push({ ...msg })
      }
    }

    // Must start with a user message
    if (deduped[0]?.role === 'assistant') {
      deduped.unshift({ role: 'user', content: '(conversation started)' })
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: deduped,
    })

    const responseText =
      response.content.find(b => b.type === 'text')?.text ?? ''

    return NextResponse.json({
      response: responseText,
      systemPrompt,
      thinking: null, // Reserved for extended thinking in a future iteration
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
    })
  } catch (err) {
    console.error('[maya-playground] error:', err)
    return NextResponse.json(
      { error: 'Maya failed to respond. Check server logs.' },
      { status: 500 }
    )
  }
}
