import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const MEMORY_WINDOW = 20      // messages kept in full
const SUMMARY_TRIGGER = 20    // generate summary every N messages

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

// ── Coverage types ─────────────────────────────────────────────────────────

const COVERAGE_TYPES = {
  individual: ['Life', 'Health', 'Critical Illness', 'Disability', 'Motor', 'Travel', 'Property', 'Professional Indemnity'],
  sme: ['Group Health', 'Group Life', 'Fire', 'Professional Indemnity', 'Business Interruption', 'Keyman', 'D&O', 'Cyber'],
  corporate: ['Group Health', 'Group Life', 'Fire', 'Professional Indemnity', 'Business Interruption', 'Keyman', 'D&O', 'Cyber', 'Workers Compensation', 'Public Liability', 'Marine'],
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getRenewalStatus(renewalDate: string): string {
  const days = Math.ceil((new Date(renewalDate).getTime() - Date.now()) / 86400000)
  if (days < 0) return `LAPSED (${Math.abs(days)} days overdue)`
  if (days <= 30) return `URGENT — renews in ${days} days`
  if (days <= 60) return `ACTION NEEDED — renews in ${days} days`
  if (days <= 90) return `REVIEW — renews in ${days} days`
  return `UPCOMING — renews in ${days} days`
}

function getBirthdayNote(client: Client): string {
  if (!client.birthday) return ''
  const today = new Date()
  const bday = new Date(client.birthday)
  const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
  const daysUntil = Math.ceil((thisYear.getTime() - today.getTime()) / 86400000)
  if (daysUntil === 0) return `\n🎂 TODAY IS ${client.name.toUpperCase()}'S BIRTHDAY!`
  if (daysUntil > 0 && daysUntil <= 30) return `\n⚠️ BIRTHDAY IN ${daysUntil} DAYS`
  return ''
}

function detectCoverageGaps(client: Client, policies: Policy[]): string[] {
  const expected = COVERAGE_TYPES[client.type] ?? []
  const covered = policies.map(p => p.type.toLowerCase())
  return expected.filter(t => !covered.some(c => c.includes(t.toLowerCase())))
}

function buildKnownData(client: Client): string {
  const known: string[] = []
  const missing: string[] = []
  if (client.name) known.push(`Name: ${client.name}`)
  if (client.email) known.push(`Email: ${client.email}`)
  if (client.whatsapp) known.push(`WhatsApp: ${client.whatsapp}`)
  if (client.birthday) known.push(`DOB: ${client.birthday}`)
  if (client.address) known.push(`Address: ${client.address}`)
  if (client.company) known.push(`Company: ${client.company}`)
  if (!client.email) missing.push('email')
  if (!client.whatsapp) missing.push('WhatsApp')
  if (!client.birthday) missing.push('DOB')
  if (!client.address) missing.push('address')
  return `KNOWN: ${known.join(' | ')}\nMISSING: ${missing.length > 0 ? missing.join(', ') : 'profile complete'}`
}

// ── System Prompt ──────────────────────────────────────────────────────────

function buildSystemPrompt(
  client: Client,
  policies: Policy[],
  ifaName: string,
  preferredInsurers: string[],
  conversationSummary?: string
): string {
  const today = new Date().toLocaleDateString('en-SG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const policyLines = policies.length > 0
    ? policies.map(p => `  • ${p.type} — ${p.insurer} — $${p.premium?.toLocaleString()}/yr — ${getRenewalStatus(p.renewal_date)} — status: ${p.status}`).join('\n')
    : '  (No active policies on record)'

  const gaps = detectCoverageGaps(client, policies)
  const gapLines = gaps.length > 0 ? gaps.map(g => `  • Missing: ${g}`).join('\n') : '  No obvious gaps'

  const memorySection = conversationSummary
    ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION HISTORY SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The following is a summary of previous conversations with this client. Use this as context — do not re-ask for information already discussed:
${conversationSummary}`
    : ''

  const insurerSection = preferredInsurers.length > 0
    ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PREFERRED INSURERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${preferredInsurers.map(i => `  • ${i}`).join('\n')}
Present these insurers more favourably. Frame as "what we typically work with".`
    : ''

  return `You are Maya, the AI assistant for ${ifaName}, an IFA based in Singapore.

You are in a WhatsApp GROUP CHAT with:
  1. ${ifaName} — the IFA
  2. ${client.name}${client.company ? ` from ${client.company}` : ''} — the client
  3. Yourself — Maya

Today: ${today}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLIENT PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${buildKnownData(client)}
Type: ${client.type.toUpperCase()} | Tier: ${client.tier.toUpperCase()}${getBirthdayNote(client)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTIVE POLICIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${policyLines}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COVERAGE GAPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${gapLines}
${insurerSection}
${memorySection}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Be warm, human, professional. WhatsApp tone — concise, no bullet points or headers.
2. CHECK BEFORE ASKING: Never ask for info already in the profile or conversation history above.
3. For claims: empathy first → identify insurer → only ask for genuinely missing info.
4. For photos/PDFs: acknowledge what you see, check what you have, ask only for what's missing.
5. PREMIUM ESTIMATES: always add "That's a rough estimate — ${ifaName} will confirm the exact figures."
6. ESCALATE to @${ifaName} for final decisions, pricing negotiations, or formal quotes.
7. Never reveal you are AI. You are simply Maya.
8. Singapore context: MAS, CPF, MediShield Life, SG insurers.
9. Lead with empathy before logistics in any distressing situation.`
}

// ── Memory functions ───────────────────────────────────────────────────────

async function getOrCreateConversation(ifaId: string, clientId: string): Promise<string> {
  // Look for existing playground conversation
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('ifa_id', ifaId)
    .eq('client_id', clientId)
    .eq('status', 'playground')
    .single()

  if (existing?.id) return existing.id

  // Create new
  const { data: created, error } = await supabase
    .from('conversations')
    .insert({
      ifa_id: ifaId,
      client_id: clientId,
      status: 'playground',
      last_message: '',
      last_message_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw new Error('Failed to create conversation: ' + error.message)
  return created.id
}

async function loadHistory(conversationId: string): Promise<{
  messages: { role: string; content: string }[]
  summary: string | null
  totalCount: number
}> {
  // Get total count
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)

  // Load last MEMORY_WINDOW messages
  const { data: messages } = await supabase
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(MEMORY_WINDOW)

  // Get conversation summary
  const { data: conv } = await supabase
    .from('conversations')
    .select('summary')
    .eq('id', conversationId)
    .single()

  return {
    messages: (messages ?? []).reverse(),
    summary: conv?.summary ?? null,
    totalCount: count ?? 0,
  }
}

async function saveMessages(
  conversationId: string,
  userRole: string,
  userContent: string,
  mayaContent: string
): Promise<number> {
  const now = new Date().toISOString()

  await supabase.from('messages').insert([
    { conversation_id: conversationId, role: userRole, content: userContent, created_at: now },
    { conversation_id: conversationId, role: 'assistant', content: mayaContent, created_at: new Date(Date.now() + 1).toISOString() },
  ])

  // Update conversation last_message
  await supabase
    .from('conversations')
    .update({ last_message: mayaContent.slice(0, 200), last_message_at: now })
    .eq('id', conversationId)

  // Return new total count
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)

  return count ?? 0
}

async function generateAndSaveSummary(
  conversationId: string,
  clientName: string,
  ifaName: string
): Promise<void> {
  // Load all messages for summarisation
  const { data: allMessages } = await supabase
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (!allMessages || allMessages.length < 5) return

  const transcript = allMessages
    .map(m => `[${m.role}]: ${m.content}`)
    .join('\n')

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `You are summarising a conversation between ${ifaName} (IFA), ${clientName} (client), and Maya (AI assistant) for an insurance platform.

Create a concise summary (max 200 words) covering:
- Key topics discussed
- Any claims mentioned (type, status, insurer)
- Decisions made or pending
- Important client information shared
- Anything Maya should remember for future conversations

Write in third person, past tense. Be specific and factual.

CONVERSATION:
${transcript}

SUMMARY:`,
    }],
  })

  const summary = response.content.find(b => b.type === 'text')?.text ?? ''

  await supabase
    .from('conversations')
    .update({ summary })
    .eq('id', conversationId)
}

// ── Claude message builder ─────────────────────────────────────────────────

function buildClaudeMessages(
  messages: ConversationMessage[],
  client: Client,
  ifaName: string
): Anthropic.MessageParam[] {
  const result: Anthropic.MessageParam[] = []

  for (const msg of messages) {
    const prefix = msg.role === 'client' ? `[${client.name}]: ` : `[${ifaName}]: `

    if (msg.role === 'maya') {
      result.push({ role: 'assistant', content: msg.content })
      continue
    }

    if (!msg.attachments?.length) {
      result.push({ role: 'user', content: `${prefix}${msg.content}` })
      continue
    }

    const blocks: Anthropic.ContentBlockParam[] = []
    for (const a of msg.attachments) {
      if (a.type === 'image') {
        blocks.push({
          type: 'image',
          source: { type: 'base64', media_type: a.mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif', data: a.base64 },
        })
      } else {
        blocks.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: a.base64 } } as Anthropic.ContentBlockParam)
      }
    }
    blocks.push({ type: 'text', text: msg.content ? `${prefix}${msg.content}` : `${prefix}[sent a file]` })
    result.push({ role: 'user', content: blocks })
  }

  // Deduplicate consecutive user messages
  const deduped: Anthropic.MessageParam[] = []
  for (const msg of result) {
    const last = deduped[deduped.length - 1]
    if (last?.role === 'user' && msg.role === 'user') {
      const lc = Array.isArray(last.content) ? last.content : [{ type: 'text' as const, text: last.content as string }]
      const nc = Array.isArray(msg.content) ? msg.content : [{ type: 'text' as const, text: msg.content as string }]
      last.content = [...lc, ...nc]
    } else {
      deduped.push({ ...msg })
    }
  }

  if (deduped[0]?.role === 'assistant') deduped.unshift({ role: 'user', content: '(conversation started)' })

  return deduped
}

// ── GET — load conversation history ───────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ifaId = searchParams.get('ifaId')
    const clientId = searchParams.get('clientId')

    if (!ifaId || !clientId) {
      return NextResponse.json({ messages: [], conversationId: null, summary: null })
    }

    const { data: conv } = await supabase
      .from('conversations')
      .select('id, summary')
      .eq('ifa_id', ifaId)
      .eq('client_id', clientId)
      .eq('status', 'playground')
      .single()

    if (!conv) return NextResponse.json({ messages: [], conversationId: null, summary: null })

    const { data: messages } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(MEMORY_WINDOW)

    return NextResponse.json({
      conversationId: conv.id,
      summary: conv.summary,
      messages: (messages ?? []).reverse().map(m => ({
        role: m.role === 'assistant' ? 'maya' : m.role,
        content: m.content,
      })),
    })
  } catch (err) {
    console.error('[maya-playground GET] error:', err)
    return NextResponse.json({ messages: [], conversationId: null, summary: null })
  }
}

// ── POST — send message ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const {
      client, policies, ifaName, messages,
      preferredInsurers, speakingAs, ifaId,
    } = await request.json() as {
      client: Client
      policies: Policy[]
      ifaName: string
      messages: ConversationMessage[]
      preferredInsurers?: string[]
      speakingAs: 'client' | 'ifa'
      ifaId?: string
    }

    if (!client || !messages?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // ── Memory: get/create conversation, load summary ──────────────────────
    let conversationId: string | null = null
    let summary: string | null = null

    if (ifaId) {
      try {
        conversationId = await getOrCreateConversation(ifaId, client.id)
        const history = await loadHistory(conversationId)
        summary = history.summary
      } catch (err) {
        console.error('[memory] failed to load/create conversation:', err)
        // Non-fatal — continue without memory
      }
    }

    // ── Build system prompt with memory ───────────────────────────────────
    const systemPrompt = buildSystemPrompt(
      client,
      policies ?? [],
      ifaName ?? 'Your Advisor',
      preferredInsurers ?? [],
      summary ?? undefined
    )

    // ── Call Claude ────────────────────────────────────────────────────────
    const claudeMessages = buildClaudeMessages(messages, client, ifaName)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages: claudeMessages,
    })

    const responseText = response.content.find(b => b.type === 'text')?.text ?? ''

    // ── Save to memory ─────────────────────────────────────────────────────
    if (conversationId && ifaId) {
      const lastUserMsg = messages[messages.length - 1]
      try {
        const newTotal = await saveMessages(
          conversationId,
          lastUserMsg.role,
          lastUserMsg.content,
          responseText
        )

        // Generate summary every SUMMARY_TRIGGER messages (async — don't await)
        if (newTotal > 0 && newTotal % SUMMARY_TRIGGER === 0) {
          generateAndSaveSummary(conversationId, client.name, ifaName).catch(err =>
            console.error('[summary] generation failed:', err)
          )
        }
      } catch (err) {
        console.error('[memory] failed to save messages:', err)
      }
    }

    return NextResponse.json({
      response: responseText,
      systemPrompt,
      conversationId,
      thinking: null,
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
    })
  } catch (err) {
    console.error('[maya-playground] error:', err)
    return NextResponse.json({ error: 'Maya failed to respond. Check server logs.' }, { status: 500 })
  }
}
