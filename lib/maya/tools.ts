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
// Chunk 1a (current): Maya has one tool, update_claim. Same as existing playground.
// Chunk 1b (next deploy): refactor playground to call into this lib.
// Chunk 2 (next session): add call_relay tool + modify Relay to accept x-relay-key.

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

export const MAYA_TOOLS: Anthropic.Tool[] = [UPDATE_CLAIM_TOOL]

// ── Tool input types ────────────────────────────────────────────────────────

export interface UpdateClaimInput {
  claim_id: string
  status?: 'open' | 'in_progress' | 'resolved'
  priority?: 'low' | 'medium' | 'high'
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

// ── Real dispatcher factory (Supabase-backed) ───────────────────────────────

export interface MayaDispatcherContext {
  supabase: SupabaseClient
  faId: string                    // verified userId — used to scope DB writes
  claimLookup: Record<string, OpenClaim>  // for friendly "claim title" in result strings
}

/**
 * Build a dispatcher that executes Maya's tools against real Supabase.
 * The playground route (and future webhook) uses this.
 */
export function createMayaToolDispatcher(ctx: MayaDispatcherContext): ToolDispatcher {
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
    // Same pattern as the original playground route.
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

  return async function dispatch(toolName, input) {
    if (toolName === 'update_claim') {
      return dispatchUpdateClaim(input as UpdateClaimInput)
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
 *       if (/cancer|cover/i.test(query)) return JSON.stringify({ routed_to: 'compass', ... })
 *       return JSON.stringify({ routed_to: 'unknown' })
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
