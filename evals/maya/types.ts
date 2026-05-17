// evals/maya/types.ts
//
// Type definitions for Maya eval scenarios. Scenarios are TypeScript modules
// rather than YAML/JSON because:
//   - Type-checked, no parse errors at runtime
//   - Mock dispatchers can be functions, not just strings
//   - No new dependency
//
// A scenario is a sequence of TURNS. Each turn is a message Maya receives,
// plus ASSERTIONS that her response must satisfy.

import type { Client, ConversationMessage, OpenClaim, Policy } from '@/lib/maya/types'
import type { MockToolResponse } from '@/lib/maya/tools'

/**
 * Assertion types — simple, mechanical checks. No LLM judges (yet).
 * Each assertion fails open: if a check can't be performed, it does not
 * fail the turn — only mismatches do.
 */
export type Assertion =
  // Maya must call this tool at least once on this turn.
  | { type: 'called_tool'; tool: string }
  // Maya must NOT call this tool on this turn.
  | { type: 'did_not_call_tool'; tool: string }
  // The call_relay tool input must have query matching this regex.
  | { type: 'tool_input_matches'; tool: string; field: string; pattern: string; flags?: string }
  // Reply contains this substring (case-insensitive).
  | { type: 'reply_contains'; needle: string }
  // Reply does NOT contain this substring (case-insensitive). Use for hallucination checks.
  | { type: 'reply_does_not_contain'; needle: string }
  // Reply contains all of these substrings.
  | { type: 'reply_contains_all'; needles: string[] }
  // Reply matches this regex.
  | { type: 'reply_matches'; pattern: string; flags?: string }
  // Reply length in characters is at least N.
  | { type: 'reply_min_length'; chars: number }
  // Reply length in characters is at most N.
  | { type: 'reply_max_length'; chars: number }
  // Reply word count is at most N. WhatsApp tone check.
  | { type: 'reply_max_words'; words: number }

export interface Turn {
  /** Who's "speaking" — client or fa. Affects how the message is prefixed in Maya's context. */
  speaker: 'client' | 'fa'
  /** The message text. */
  message: string
  /** Assertions to check against Maya's reply. */
  assertions: Assertion[]
}

export interface ScenarioContext {
  client: Client
  policies: Policy[]
  claims?: OpenClaim[]
  faName: string
  faId: string
  preferredInsurers?: string[]
  conversationSummary?: string
}

export interface Scenario {
  id: string
  description: string
  context: ScenarioContext
  /** Mock responses for each tool Maya might call. Keys are tool names. */
  mocks: Record<string, MockToolResponse>
  turns: Turn[]
}

// ── Runner output types ─────────────────────────────────────────────────────

export interface AssertionResult {
  assertion: Assertion
  passed: boolean
  detail?: string
}

export interface TurnResult {
  turnIndex: number
  speaker: 'client' | 'fa'
  message: string
  reply: string
  toolCallsExecuted: { name: string; input: unknown; result: string }[]
  inputTokens: number
  outputTokens: number
  assertions: AssertionResult[]
  passed: boolean
}

export interface ScenarioResult {
  scenarioId: string
  description: string
  startedAt: string
  finishedAt: string
  durationMs: number
  totalTurns: number
  passedTurns: number
  failedTurns: number
  passed: boolean
  totalInputTokens: number
  totalOutputTokens: number
  turns: TurnResult[]
}
