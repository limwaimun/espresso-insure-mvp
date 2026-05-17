// lib/maya/tools.ts
//
// Maya's available tools + dispatcher factories. The runtime (lib/maya/runtime.ts)
// is decoupled from how tools execute — it calls a generic ToolDispatcher function
// that callers provide. This lets:
//
//   - The playground route inject a real Supabase-backed dispatcher
//   - The eval harness inject a mock dispatcher (no DB, scripted responses)
//   - Future WhatsApp webhook inject the same real dispatcher as playground
//
// Current tools:
//   - update_claim: directly mutate alerts.status/priority for a known claim
//   - call_relay: invoke Relay to route a question to a specialist agent and
//     get a substantive answer back. This is Maya's connection to the rest of
//     the agent fleet (Brief, Compass, Lens, Sage, Atlas, Scout, Harbour).

import type Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { OpenClaim } from './types'

// ── Tool definitions ────────────────────────────────────────────────────────

export const UPDATE_CLAIM_TOOL: Anthropic.Tool = {
  name: 'update_claim',
  description: 'Update the status or priority of a claim for this client. Use when the FA explicitly asks to change a claim\'s status or priority.',
  input_schema: {
    type: 'object' as const,
    properties: {
      claim_id: {
        type: 'string',
        description: 'The ID of the claim to update',
      },
      status: {
        type: 'string',
        enum: ['open', 'in_progress', 'resolved'],
        description: 'New status for the claim',
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'New priority for the claim',
      },
    },
    required: ['claim_id'],
  },
}

export const CALL_RELAY_TOOL: Anthropic.Tool = {
  name: 'call_relay',
  description: `Route a question to the right specialist agent and receive a substantive, factual answer. Use this for ANY question that needs specific facts about: a client's existing policies, coverage details, deductibles, co-insurance, exclusions, sum assured, claim limits, premiums, coverage gaps, market comparisons, claim filing procedure, portfolio analytics, or investment holdings.

This is your connection to the rest of the platform. ALWAYS try this BEFORE deflecting to the FA — you have access to parsed policy data and specialist analysis via this tool.

Reformulate the client's casual question into a clear, specific query before calling. Example: client says "what about my knee?" → query: "What does the client's health policy cover for knee surgery, including deductibles, co-insurance, and panel hospital requirements?"

The tool returns a JSON object with: ok (whether the call succeeded), routed_to (which specialist answered), intent (what was classified), answer (the substantive response in natural language). Read 'answer' carefully and synthesize it into warm, conversational language for the client — DO NOT just paste the JSON.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'A specific, well-formed question for the specialist. Reformulate the client\'s natural question into something explicit and self-contained. Include the client\'s name and any relevant context the specialist will need.',
      },
      client_id: {
        type: 'string',
        description: 'The current client\'s UUID (use the value provided in the CLIENT PROFILE section of your system context).',
      },
    },
    required: ['query', 'client_id'],
  },
}

export const MAYA_TOOLS: Anthropic.Tool[] = [UPDATE_CLAIM_TOOL, CALL_RELAY_TOOL]

// ── Tool input types ────────────────────────────────────────────────────────

export interface UpdateClaimInput {
  claim_id: string
  status?: 'open' | 'in_progress' | 'resolved'
  priority?: 'low' | 'medium' | 'high'
}

export interface CallRelayInput {
  query: string
  client_id: string
}

// ── Dispatcher contract ─────────────────────────────────────────────────────

/**
 * A ToolDispatcher takes a tool name + input and returns a string result for
 * Claude to consume. The runtime calls this; the caller provides the impl.
 *
 * Errors should be returned as strings (e.g. "Error: ...") rather than thrown,
 * because Claude needs to see the error in the tool_result content to react
 * appropriately. The runtime adds a generic catch as a safety net.
 */
export type ToolDispatcher = (toolName: string, input: unknown) => Promise<string>

// ── Real dispatcher factory (Supabase-backed + Relay HTTP-backed) ───────────

export interface MayaDispatcherContext {
  supabase: SupabaseClient
  faId: string                    // verified userId — used for DB scoping AND as x-relay-user-id
  claimLookup: Record<string, OpenClaim>  // for friendly "claim title" in update_claim result strings
}

/**
 * Build a dispatcher that executes Maya's tools against real systems:
 *   - update_claim → Supabase
 *   - call_relay → POST to /api/relay with internal auth header
 *
 * The playground route uses this. The future WhatsApp webhook uses this.
 */
export function createMayaToolDispatcher(ctx: MayaDispatcherContext): ToolDispatcher {
  // ── update_claim impl ─────────────────────────────────────────────────────
  const dispatchUpdateClaim = async (input: UpdateClaimInput): Promise<string> => {
    if (!input.claim_id) return 'Error: missing claim_id'

    const patch: Record<string, unknown> = {}
    if (input.status) {
      patch.status = input.status
      patch.resolved = input.status === 'resolved'
    }
    if (input.priority) patch.priority = input.priority

    if (Object.keys(patch).length === 0) {
      return 'Error: nothing to update — provide status or priority'
    }

    // Scoped to verified userId — prevents claim updates on other FAs' data.
    const { error } = await ctx.supabase
      .from('alerts')
      .update(patch)
      .eq('id', input.claim_id)
      .eq('fa_id', ctx.faId)

    if (error) return `Error updating claim: ${error.message}`

    const claim = ctx.claimLookup[input.claim_id]
    const summary = Object.entries(patch)
      .filter(([k]) => k !== 'resolved')
      .map(([k, v]) => `${k} = ${v}`)
      .join(', ')
    return `Successfully updated claim "${claim?.title ?? input.claim_id}": ${summary}`
  }

  // ── call_relay impl ───────────────────────────────────────────────────────
  // Maya invokes Relay over HTTP with internal-auth credentials. Relay handles
  // intent classification and dispatch to the appropriate specialist agent
  // (Brief, Compass, Lens, etc.), then returns the specialist's answer.
  //
  // We normalize Relay's response: extract the specialist's natural-language
  // answer if present, fall back to the full result otherwise. This keeps Maya
  // focused on the answer instead of parsing each specialist's bespoke shape.
  const dispatchCallRelay = async (input: CallRelayInput): Promise<string> => {
    if (!input.query || typeof input.query !== 'string') {
      return 'Error: missing or invalid query'
    }
    if (!input.client_id || typeof input.client_id !== 'string') {
      return 'Error: missing or invalid client_id'
    }

    const key = process.env.RELAY_INTERNAL_KEY
    if (!key) {
      return 'Error: RELAY_INTERNAL_KEY not configured on this server'
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://espresso.insure'

    try {
      const res = await fetch(`${baseUrl}/api/relay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-relay-key': key,
          'x-relay-user-id': ctx.faId,
        },
        body: JSON.stringify({
          message: input.query,
          clientId: input.client_id,
        }),
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '(no body)')
        return `Relay returned ${res.status}: ${errText.slice(0, 500)}`
      }

      const data = await res.json() as {
        intent?: string
        summary?: string
        agent?: string
        result?: {
          mayaSummary?: string
          analysis?: { answer?: string; confidence?: string; caveats?: string | null; needs_other_agent?: string | null }
          [k: string]: unknown
        }
        message?: string  // present when intent is 'unknown'
      }

      // Unknown intent — Relay couldn't classify. Pass back the clarification ask.
      if (data.intent === 'unknown' && data.message) {
        return JSON.stringify({
          ok: false,
          reason: 'intent_unknown',
          message: data.message,
        })
      }

      // Standard path — extract the natural-language answer if available.
      const answer = data.result?.mayaSummary || data.result?.analysis?.answer || null
      const analysisMeta = data.result?.analysis
        ? {
            confidence: data.result.analysis.confidence,
            caveats: data.result.analysis.caveats,
            needs_other_agent: data.result.analysis.needs_other_agent,
          }
        : undefined

      if (answer) {
        return JSON.stringify({
          ok: true,
          routed_to: data.agent,
          intent: data.intent,
          answer,
          ...(analysisMeta ? { meta: analysisMeta } : {}),
        })
      }

      // Specialist didn't produce a clean mayaSummary — return the full result
      // for Maya to interpret. Less ideal but keeps her unblocked.
      return JSON.stringify({
        ok: true,
        routed_to: data.agent,
        intent: data.intent,
        full_result: data.result,
      })
    } catch (err) {
      return `Relay call failed: ${err instanceof Error ? err.message : String(err)}`
    }
  }

  // ── Dispatch ──────────────────────────────────────────────────────────────
  return async function dispatch(toolName, input) {
    if (toolName === 'update_claim') {
      return dispatchUpdateClaim(input as UpdateClaimInput)
    }
    if (toolName === 'call_relay') {
      return dispatchCallRelay(input as CallRelayInput)
    }
    return `Error: unknown tool "${toolName}"`
  }
}

// ── Mock dispatcher factory (for evals + tests) ─────────────────────────────

/**
 * Build a dispatcher that returns scripted responses without touching any
 * external system. Used by the eval harness. Each tool gets either a fixed
 * string or a function that examines the input.
 *
 * Example:
 *   const dispatcher = createMockToolDispatcher({
 *     update_claim: 'Successfully updated claim "Cancer Diagnosis": status = resolved',
 *     call_relay: (input) => {
 *       const query = (input as { query?: string }).query ?? ''
 *       if (/cancer|cover/i.test(query)) return JSON.stringify({
 *         ok: true, routed_to: 'brief', intent: 'policy_lookup',
 *         answer: 'AIA HealthShield covers cancer treatment up to $200K...',
 *       })
 *       return JSON.stringify({ ok: false, reason: 'intent_unknown' })
 *     },
 *   })
 */
export type MockToolResponse =
  | string
  | ((input: unknown) => string | Promise<string>)

export function createMockToolDispatcher(
  responses: Record<string, MockToolResponse>
): ToolDispatcher {
  return async function dispatch(toolName, input) {
    const r = responses[toolName]
    if (r === undefined) return `Error: no mock configured for tool "${toolName}"`
    if (typeof r === 'function') return await r(input)
    return r
  }
}
