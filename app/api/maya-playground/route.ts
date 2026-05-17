/**
 * Maya Playground — dev/training sandbox
 * ─────────────────────────────────────────
 * This route is the BROWSER-SIDE entry point into Maya. It handles:
 *   - Browser session auth (verifySession)
 *   - Ownership check (client belongs to verified FA)
 *   - Conversation persistence (load/save/summarise via Supabase
 *     conversations + messages tables with status='playground')
 *   - WhatsApp-style message format conversion (buildClaudeMessages)
 *   - Per-invocation logging
 *
 * The actual Maya runtime — system prompt, tool definitions, the Anthropic
 * tool-use loop — lives in lib/maya/ and is shared with the (future)
 * WhatsApp webhook and the eval harness. This route is a thin adapter.
 *
 * Refactored in chunk 1b of Maya Product B week 1. Was 730 lines; now ~300.
 * Behavior is identical to the previous version except:
 *   - inputTokens / outputTokens in the response/logs now SUM tokens across
 *     all Anthropic calls in the tool-use loop (previous version reported only
 *     the last call's tokens, which under-counted when tools were used).
 *   - Two new metadata fields in logs: hitToolCap and finalStopReason.
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { verifySession } from '@/lib/auth-middleware'
import { logAgentInvocation } from '@/lib/agent-log'
import { resolveAgentModel } from '@/lib/agent-model'
import { buildMayaSystemPrompt } from '@/lib/maya/prompt'
import { MAYA_TOOLS, createMayaToolDispatcher } from '@/lib/maya/tools'
import { runMaya } from '@/lib/maya/runtime'
import type {
  Client,
  ConversationMessage,
  OpenClaim,
  Policy,
} from '@/lib/maya/types'

// Anthropic client still needed here for generateAndSaveSummary (a route-local
// summarisation call, distinct from the Maya turn itself which goes via runMaya).
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const MEMORY_WINDOW = 20      // messages kept in full
const SUMMARY_TRIGGER = 20    // generate summary every N messages

// ── Memory functions ───────────────────────────────────────────────────────
// These stay route-local because they're tied to the Supabase conversations/
// messages tables with status='playground'. The future WhatsApp webhook will
// have its own memory layer with different status + WhatsApp message metadata,
// so we deliberately do NOT extract this to lib/maya/.

async function getOrCreateConversation(faId: string, clientId: string): Promise<string> {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('fa_id', faId)
    .eq('client_id', clientId)
    .eq('status', 'playground')
    .single()

  if (existing?.id) return existing.id

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({
      fa_id: faId,
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
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)

  const { data: messages } = await supabase
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(MEMORY_WINDOW)

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

  await supabase
    .from('conversations')
    .update({ last_message: mayaContent.slice(0, 200), last_message_at: now })
    .eq('id', conversationId)

  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)

  return count ?? 0
}

async function generateAndSaveSummary(
  conversationId: string,
  clientName: string,
  faName: string
): Promise<void> {
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
    model: resolveAgentModel('maya-playground'),
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `You are summarising a conversation between ${faName} (FA), ${clientName} (client), and Maya (AI assistant) for an insurance platform.

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
// Route-local because format conversion is channel-specific: the browser sends
// ConversationMessage with roles client/fa/maya, while the future WhatsApp
// webhook will receive WhatsApp's payload shape. Both end up as Anthropic's
// {role: 'user'|'assistant', content} but the prefixing rules differ per
// channel (browser prefixes with "[Name]:", WhatsApp uses participant numbers).

function buildClaudeMessages(
  messages: ConversationMessage[],
  client: Client,
  faName: string
): Anthropic.MessageParam[] {
  const result: Anthropic.MessageParam[] = []

  for (const msg of messages) {
    const prefix = msg.role === 'client' ? `[${client.name}]: ` : `[${faName}]: `

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
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const bodyFaId = searchParams.get('faId')
    if (bodyFaId && bodyFaId !== userId) {
      console.warn(`[maya-playground GET] ignored mismatched faId: param=${bodyFaId} session=${userId}`)
    }

    if (!clientId) {
      return NextResponse.json({ messages: [], conversationId: null, summary: null })
    }

    const { data: clientCheck } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('fa_id', userId)
      .single()

    if (!clientCheck) {
      return NextResponse.json({ messages: [], conversationId: null, summary: null })
    }

    const { data: conv } = await supabase
      .from('conversations')
      .select('id, summary')
      .eq('fa_id', userId)
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
  const start = Date.now()
  let resolvedUserId: string | undefined

  try {
    // ── Auth ─────────────────────────────────────────────────────────────
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) {
      await logAgentInvocation({
        agent: 'maya-playground',
        userId: null,
        source: 'session',
        outcome: 'unauthorized',
        statusCode: 401,
        latencyMs: Date.now() - start,
      })
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }
    resolvedUserId = userId

    // ── Parse body ───────────────────────────────────────────────────────
    const {
      client, policies, faName, messages,
      preferredInsurers, speakingAs, faId: _unused, claims,
    } = await request.json() as {
      client: Client
      policies: Policy[]
      faName: string
      messages: ConversationMessage[]
      preferredInsurers?: string[]
      speakingAs: 'client' | 'fa'
      faId?: string
      claims?: OpenClaim[]
    }

    if (_unused && _unused !== userId) {
      console.warn(`[maya-playground POST] ignored mismatched faId: body=${_unused} session=${userId}`)
    }

    if (!client || !messages?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // ── Ownership check ──────────────────────────────────────────────────
    const { data: clientCheck } = await supabase
      .from('clients')
      .select('id')
      .eq('id', client.id)
      .eq('fa_id', userId)
      .single()

    if (!clientCheck) {
      return NextResponse.json({ error: 'Client not found or unauthorized' }, { status: 404 })
    }

    // ── Memory load ──────────────────────────────────────────────────────
    let conversationId: string | null = null
    let summary: string | null = null

    try {
      conversationId = await getOrCreateConversation(userId, client.id)
      const history = await loadHistory(conversationId)
      summary = history.summary
    } catch (err) {
      console.error('[memory] failed to load/create conversation:', err)
    }

    // ── Open claims for system prompt ────────────────────────────────────
    const openClaims = (claims ?? [])
      .filter(c => c.status !== 'resolved')
      .map(c => ({ title: c.title, daysSinceUpdate: c.daysSinceUpdate }))

    // ── System prompt (now from lib/maya/prompt) ─────────────────────────
    const systemPrompt = buildMayaSystemPrompt({
      client,
      policies: policies ?? [],
      faName: faName ?? 'Your Advisor',
      preferredInsurers: preferredInsurers ?? [],
      conversationSummary: summary ?? undefined,
      openClaims: openClaims.length > 0 ? openClaims : undefined,
    })

    // ── Claim lookup for the dispatcher (friendly titles in result strings)
    const claimLookup = Object.fromEntries((claims ?? []).map(c => [c.id, c]))

    // ── Convert ConversationMessage[] → Anthropic.MessageParam[] ─────────
    const claudeMessages = buildClaudeMessages(messages, client, faName)

    // ── Build the real, Supabase-backed tool dispatcher ──────────────────
    const toolDispatcher = createMayaToolDispatcher({
      supabase,
      faId: userId,
      claimLookup,
    })

    // ── Run Maya (this replaces the entire previous Anthropic loop) ──────
    const result = await runMaya({
      systemPrompt,
      initialMessages: claudeMessages,
      tools: MAYA_TOOLS,
      toolDispatcher,
      model: resolveAgentModel('maya-playground'),
      maxTokens: 1000,
    })

    // Count successful claim updates. The dispatcher returns strings starting
    // with "Successfully" on success and "Error" on failure. This matches the
    // previous semantics (toolResults.length > 0 only counted successes).
    const successfulClaimUpdates = result.toolCallsExecuted.filter(
      t => t.name === 'update_claim' && t.result.startsWith('Successfully')
    ).length

    // ── Save to memory ───────────────────────────────────────────────────
    if (conversationId) {
      const lastUserMsg = messages[messages.length - 1]
      try {
        const newTotal = await saveMessages(
          conversationId,
          lastUserMsg.role,
          lastUserMsg.content,
          result.replyText
        )
        if (newTotal > 0 && newTotal % SUMMARY_TRIGGER === 0) {
          generateAndSaveSummary(conversationId, client.name, faName).catch(err =>
            console.error('[summary] generation failed:', err)
          )
        }
      } catch (err) {
        console.error('[memory] failed to save messages:', err)
      }
    }

    await logAgentInvocation({
      agent: 'maya-playground',
      userId: resolvedUserId,
      source: 'session',
      outcome: 'ok',
      statusCode: 200,
      latencyMs: Date.now() - start,
      model: resolveAgentModel('maya-playground'),
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      metadata: {
        clientId: client?.id,
        speakingAs,
        claimsUpdated: successfulClaimUpdates > 0,
        toolCallCount: result.toolCallsExecuted.length,
        hitToolCap: result.hitToolCap,
        finalStopReason: result.finalStopReason,
      },
    })

    return NextResponse.json({
      response: result.replyText,
      systemPrompt,
      conversationId,
      claimsUpdated: successfulClaimUpdates > 0,
      thinking: null,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    })
  } catch (err) {
    console.error('[maya-playground] error:', err)
    await logAgentInvocation({
      agent: 'maya-playground',
      userId: resolvedUserId,
      source: 'session',
      outcome: 'error',
      statusCode: 500,
      latencyMs: Date.now() - start,
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Maya failed to respond. Check server logs.' }, { status: 500 })
  }
}
