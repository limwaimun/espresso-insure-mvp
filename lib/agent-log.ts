// lib/agent-log.ts
//
// Lightweight writer for the `agent_invocations` table. Used by every
// in-product agent route (Maya, Relay, Scout, Sage, Compass, Atlas, Lens,
// Harbour, claim-create, WhatsApp webhook, etc) to emit a single structured
// log row per invocation.
//
// Design goals:
//   - Never throw. A logging failure must never break the agent path.
//   - Fire-and-forget when the caller doesn't await.
//   - Service-role write so RLS doesn't get in the way.
//   - Tiny surface area — one function, one record shape.
//
// Usage (typical pattern inside an agent route):
//
//   const start = Date.now()
//   try {
//     // ... do agent work ...
//     await logAgentInvocation({
//       agent: 'compass',
//       userId,
//       source,                       // from authenticateAgentRequest()
//       outcome: 'ok',
//       statusCode: 200,
//       latencyMs: Date.now() - start,
//       model: 'claude-sonnet-4',
//       inputTokens: usage?.input_tokens,
//       outputTokens: usage?.output_tokens,
//     })
//     return NextResponse.json(...)
//   } catch (err) {
//     await logAgentInvocation({
//       agent: 'compass',
//       userId,
//       outcome: 'error',
//       statusCode: 500,
//       latencyMs: Date.now() - start,
//       errorMessage: err instanceof Error ? err.message : String(err),
//     })
//     throw err
//   }

import { createClient } from '@supabase/supabase-js'

export type AgentName =
  | 'maya'
  | 'maya-playground'
  | 'relay'
  | 'scout'
  | 'sage'
  | 'compass'
  | 'atlas'
  | 'lens'
  | 'harbour'
  | 'harvester'
  | 'claim-create'
  | 'whatsapp'
  | string // allow new agents without code change

export type AgentOutcome = 'ok' | 'error' | 'rate_limited' | 'unauthorized'

export interface AgentInvocationLog {
  agent: AgentName
  userId?: string | null
  source?: 'session' | 'relay' | 'webhook' | 'cron' | string | null
  outcome: AgentOutcome
  statusCode?: number | null
  latencyMs?: number | null
  model?: string | null
  inputTokens?: number | null
  outputTokens?: number | null
  errorMessage?: string | null
  metadata?: Record<string, unknown>
}

let cachedClient: ReturnType<typeof createClient> | null = null

function getClient() {
  if (cachedClient) return cachedClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return null
  }
  cachedClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cachedClient
}

/**
 * Persist a single agent invocation log entry. Never throws.
 * Returns true on success, false on any failure (including missing config).
 */
export async function logAgentInvocation(entry: AgentInvocationLog): Promise<boolean> {
  try {
    const client = getClient()
    if (!client) {
      // Don't spam logs in environments without service-role configured.
      return false
    }
    const row = {
      agent: entry.agent,
      user_id: entry.userId ?? null,
      source: entry.source ?? null,
      outcome: entry.outcome,
      status_code: entry.statusCode ?? null,
      latency_ms: entry.latencyMs ?? null,
      model: entry.model ?? null,
      input_tokens: entry.inputTokens ?? null,
      output_tokens: entry.outputTokens ?? null,
      error_message: entry.errorMessage ? entry.errorMessage.slice(0, 1000) : null,
      metadata: entry.metadata ?? {},
    }
    const { error } = await client.from('agent_invocations').insert(row as any)
    if (error) {
      console.error('[agent-log] insert failed:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.error('[agent-log] threw:', err instanceof Error ? err.message : err)
    return false
  }
}
