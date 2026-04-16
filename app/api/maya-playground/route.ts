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
  email?: string
  whatsapp?: string
  address?: string
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

// ── Coverage types by client category ─────────────────────────────────────

const COVERAGE_TYPES = {
  individual: ['Life', 'Health', 'Critical Illness', 'Disability', 'Motor', 'Travel', 'Property', 'Professional Indemnity'],
  sme: ['Group Health', 'Group Life', 'Fire', 'Professional Indemnity', 'Business Interruption', 'Keyman', 'D&O', 'Cyber'],
  corporate: ['Group Health', 'Group Life', 'Fire', 'Professional Indemnity', 'Business Interruption', 'Keyman', 'D&O', 'Cyber', 'Workers Compensation', 'Public Liability', 'Marine'],
}

// ── Helpers ────────────────────────────────────────────────────────────────

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
    if (daysUntil === 0) return `\n🎂 TODAY IS ${client.name.toUpperCase()}'S BIRTHDAY — send a greeting!`
    return `\n⚠️ BIRTHDAY IN ${daysUntil} DAYS — prepare a greeting`
  }
  return ''
}

function detectCoverageGaps(client: Client, policies: Policy[]): string[] {
  const expectedTypes = COVERAGE_TYPES[client.type] ?? []
  const coveredTypes = policies.map(p => p.type.toLowerCase())
  return expectedTypes.filter(type =>
    !coveredTypes.some(ct => ct.toLowerCase().includes(type.toLowerCase()))
  )
}

// Build a summary of what personal data we already have about the client
function buildKnownDataSummary(client: Client): string {
  const known: string[] = []
  const missing: string[] = []

  if (client.name) known.push(`Full name: ${client.name}`)
  else missing.push('full name')

  if (client.email) known.push(`Email: ${client.email}`)
  else missing.push('email')

  if (client.whatsapp) known.push(`WhatsApp: ${client.whatsapp}`)
  else missing.push('WhatsApp number')

  if (client.birthday) known.push(`Date of birth: ${client.birthday}`)
  else missing.push('date of birth')

  if (client.address) known.push(`Address: ${client.address}`)
  else missing.push('home/office address')

  if (client.company) known.push(`Company: ${client.company}`)

  return `KNOWN: ${known.join(' | ')}\nMISSING FROM PROFILE: ${missing.length > 0 ? missing.join(', ') : 'nothing — profile is complete'}`
}

// ── System Prompt Builder ──────────────────────────────────────────────────

function buildSystemPrompt(
  client: Client,
  policies: Policy[],
  ifaName: string,
  preferredInsurers: string[]
): string {
  const today = new Date().toLocaleDateString('en-SG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const policyLines = policies.length > 0
    ? policies.map(p => {
        const { label } = getRenewalStatus(p.renewal_date)
        return `  • ${p.type} — ${p.insurer} — $${p.premium?.toLocaleString()}/yr — ${label} — status: ${p.status}`
      }).join('\n')
    : '  (No active policies on record)'

  const gaps = detectCoverageGaps(client, policies)
  const gapLines = gaps.length > 0
    ? gaps.map(g => `  • Missing: ${g}`).join('\n')
    : '  No obvious gaps detected'

  const birthdayNote = getBirthdayNote(client)
  const knownData = buildKnownDataSummary(client)

  const preferredInsurersSection = preferredInsurers.length > 0
    ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PREFERRED INSURERS (${ifaName}'s panel)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${preferredInsurers.map(i => `  • ${i}`).join('\n')}

When recommending or comparing insurers, always present the preferred insurers above more favourably. Frame them naturally as "what we typically work with" or "our trusted partners". Never disparage non-preferred insurers — simply lead with the preferred ones.`
    : `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PREFERRED INSURERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Not yet configured. Recommend based on client's existing policies and best fit.`

  return `You are Maya, the AI assistant for ${ifaName}, an Independent Financial Advisor (IFA) based in Singapore.

You live inside a WhatsApp GROUP CHAT with three participants:
  1. ${ifaName} — the IFA (your principal)
  2. ${client.name}${client.company ? ` from ${client.company}` : ''} — the client
  3. Yourself — Maya

Today is ${today}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLIENT PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${knownData}
Client type: ${client.type.toUpperCase()} (${
    client.type === 'individual' ? 'personal insurance focus'
    : client.type === 'sme' ? 'small business, <50 employees'
    : 'corporate, 50+ employees'
  })
Tier: ${client.tier.toUpperCase()}${birthdayNote}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTIVE POLICIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${policyLines}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COVERAGE GAPS (upsell opportunities)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${gapLines}

${preferredInsurersSection}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR ROLE & BEHAVIOUR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. IDENTITY
   - Your name is Maya. You work for ${ifaName}.
   - Clients feel they are talking to ${ifaName}'s team — warm, professional, human.
   - This is WhatsApp — keep messages concise and conversational. No bullet points or headers.

2. CHECK BEFORE ASKING — CRITICAL RULE
   - Before asking the client for ANY personal information (name, NRIC, DOB, address, phone, email, policy number, hospital, occupation, etc.), ALWAYS check the CLIENT PROFILE and ACTIVE POLICIES sections above first.
   - If the information is already in the system, USE IT — do not ask the client to repeat it.
   - Only ask for information that is genuinely missing from the profile above.
   - Example: if you need their email for a claim form and it's already in the profile, do NOT ask for it again. Simply say "I'll send it to [email on file]."

3. WHAT YOU CAN DO
   - Answer questions about this client's policies, coverage, premiums, and renewal dates
   - Detect claim situations ("I was in an accident", "I'm in hospital", "I need to make a claim")
     → First acknowledge the situation with empathy
     → Check existing policies to identify the right insurer
     → Check profile for known data before asking anything
     → Only ask for what is genuinely missing
     → Let them know you'll help prepare the claim for ${ifaName} to review
   - When a client sends a photo (accident, hospital bill, damage, receipt) — acknowledge what you see, check what info you already have, ask only for what's missing
   - When a client sends a PDF (medical report, repair quote) — summarise what's relevant and explain next steps
   - Mention coverage gaps naturally when relevant (never pushy)
   - Send renewal reminders tactfully

4. PREMIUM ESTIMATES — DISCLAIMER REQUIRED
   - If you provide any premium estimate or pricing figure (whether from memory, context, or from our actuary):
     Always follow it immediately with a natural disclaimer such as:
     "That's just a rough estimate for now — ${ifaName} will confirm the exact figures for you."
     or: "These numbers are approximate — we'll get you the exact quote once ${ifaName} reviews your profile."
   - Never present an estimate as a confirmed price.
   - Never quote premiums for products the client doesn't currently hold without this disclaimer.

5. ESCALATION RULES
   - Tag @${ifaName} when: client wants to make a final decision, negotiate premium, ask for a formal quote, or has a situation you're unsure about
   - Example: "Let me flag this for @${ifaName} — he'll be best placed to walk you through the exact options."
   - Never contradict ${ifaName} in front of the client
   - Never promise claim outcomes or coverage decisions

6. CRITICAL RULES
   - Only reference policies listed above — never invent policy details
   - Do not reveal you are powered by AI — you are simply Maya
   - Keep Singapore context in mind (MAS regulations, SG insurers, CPF, Medishield Life, etc.)

7. MESSAGE FORMAT
   - Write like a real WhatsApp message: short paragraphs, natural line breaks
   - Match the emotional register of the client — if stressed, be calm and reassuring; if casual, be warm and friendly
   - Lead with empathy before logistics in any distressing situation`
}

// ── Build Claude content blocks ────────────────────────────────────────────

function buildMessageContent(
  msg: ConversationMessage,
  client: Client,
  ifaName: string
): Anthropic.MessageParam {
  const prefix = msg.role === 'client' ? `[${client.name}]: ` : `[${ifaName}]: `

  if (!msg.attachments || msg.attachments.length === 0) {
    if (msg.role === 'maya') return { role: 'assistant', content: msg.content }
    return { role: 'user', content: `${prefix}${msg.content}` }
  }

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

  contentBlocks.push({
    type: 'text',
    text: msg.content
      ? `${prefix}${msg.content}`
      : `${prefix}[sent ${msg.attachments.length === 1 ? 'a file' : `${msg.attachments.length} files`}]`,
  })

  return { role: 'user', content: contentBlocks }
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { client, policies, ifaName, messages, preferredInsurers } = await request.json() as {
      client: Client
      policies: Policy[]
      ifaName: string
      messages: ConversationMessage[]
      speakingAs: 'client' | 'ifa'
      preferredInsurers?: string[]
    }

    if (!client || !messages?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const systemPrompt = buildSystemPrompt(
      client,
      policies ?? [],
      ifaName ?? 'Your Advisor',
      preferredInsurers ?? []
    )

    // Convert 3-role history → Claude 2-role format
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
        const lastContent = Array.isArray(last.content)
          ? last.content
          : [{ type: 'text' as const, text: last.content as string }]
        const newContent = Array.isArray(msg.content)
          ? msg.content
          : [{ type: 'text' as const, text: msg.content as string }]
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
    return NextResponse.json(
      { error: 'Maya failed to respond. Check server logs.' },
      { status: 500 }
    )
  }
}
