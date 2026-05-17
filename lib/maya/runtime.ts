// lib/maya/runtime.ts
//
// runMaya(): the message loop. Single source of truth for how Maya's tool-use
// turn works. Used by:
//   - app/api/maya-playground/route.ts (chunk 1b)
//   - app/api/whatsapp/webhook/route.ts (when WhatsApp goes live)
//   - evals/maya/runner.ts (chunk 2)
//
// What runMaya does:
//   1. Calls Anthropic with system prompt + messages + tools
//   2. If response.stop_reason === 'tool_use', executes the tool via the
//      caller-provided dispatcher, appends the result to messages, calls again
//   3. Repeats until either no more tool calls OR the safety cap is hit
//   4. Returns the final reply text + telemetry
//
// What runMaya does NOT do:
//   - Auth (caller's job)
//   - DB ownership checks (caller's job)
//   - Conversation persistence (caller's job — passes history in, saves after)
//   - Building the system prompt (caller calls buildMayaSystemPrompt from prompt.ts)
//   - Building the Claude messages array (caller's job — wire format conversion)
//
// This keeps runMaya pure-ish: given inputs → returns outputs, no hidden state.
// Eval harness can call it with mocks and synthetic conversations; route calls
// it with real Supabase-backed dispatcher and DB-loaded history.

import Anthropic from '@anthropic-ai/sdk'
import type { ToolDispatcher } from './tools'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export interface ToolCallRecord {
  name: string
  input: unknown
  result: string
}

export interface MayaResult {
  /** Final assistant text reply to surface to the user. May be empty if Maya ended on a tool call cap. */
  replyText: string
  /** Every tool call executed this turn, in order. */
  toolCallsExecuted: ToolCallRecord[]
  /** Sum of input tokens across all Anthropic calls this turn. */
  inputTokens: number
  /** Sum of output tokens across all Anthropic calls this turn. */
  outputTokens: number
  /** True if Maya was forced to stop because she hit the tool-call cap mid-loop. */
  hitToolCap: boolean
  /** Stop reason from the final Anthropic response. */
  finalStopReason: string | null
}

export interface RunMayaParams {
  systemPrompt: string
  /** Anthropic message array — already converted to {role: 'user'|'assistant', content}. */
  initialMessages: Anthropic.MessageParam[]
  /** Tool definitions Maya can choose from. Usually MAYA_TOOLS from tools.ts. */
  tools: Anthropic.Tool[]
  /** How tool calls actually execute. Real (Supabase) or mock (eval). */
  toolDispatcher: ToolDispatcher
  /** Model name — resolved by caller via resolveAgentModel(). */
  model: string
  /** Default 1000. */
  maxTokens?: number
  /** Safety cap on tool calls per turn. Default 5. Prevents runaway loops. */
  maxToolCalls?: number
}

export async function runMaya(params: RunMayaParams): Promise<MayaResult> {
  const {
    systemPrompt,
    initialMessages,
    tools,
    toolDispatcher,
    model,
    maxTokens = 1000,
    maxToolCalls = 5,
  } = params

  const messages: Anthropic.MessageParam[] = [...initialMessages]
  const toolCallsExecuted: ToolCallRecord[] = []
  let totalInputTokens = 0
  let totalOutputTokens = 0
  let toolCallCount = 0

  // ── Initial call ─────────────────────────────────────────────────────────
  let response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
    tools,
  })
  totalInputTokens += response.usage?.input_tokens ?? 0
  totalOutputTokens += response.usage?.output_tokens ?? 0

  // ── Tool-use loop ────────────────────────────────────────────────────────
  while (response.stop_reason === 'tool_use' && toolCallCount < maxToolCalls) {
    const toolUseBlock = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    )
    if (!toolUseBlock) break

    // Execute the tool. Dispatcher should return error strings rather than
    // throw, but we catch anyway as a safety net so a thrown error doesn't
    // bubble out and crash the whole turn.
    let toolResult: string
    try {
      toolResult = await toolDispatcher(toolUseBlock.name, toolUseBlock.input)
    } catch (err) {
      toolResult = `Tool dispatcher threw: ${err instanceof Error ? err.message : String(err)}`
    }

    toolCallCount++
    toolCallsExecuted.push({
      name: toolUseBlock.name,
      input: toolUseBlock.input,
      result: toolResult,
    })

    // Append the assistant turn + tool_result so Claude sees what happened
    // and can compose the next response.
    messages.push(
      { role: 'assistant', content: response.content },
      {
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: toolUseBlock.id,
          content: toolResult,
        }],
      },
    )

    response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
      tools,
    })
    totalInputTokens += response.usage?.input_tokens ?? 0
    totalOutputTokens += response.usage?.output_tokens ?? 0
  }

  const hitToolCap = toolCallCount >= maxToolCalls && response.stop_reason === 'tool_use'
  const replyText = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === 'text'
  )?.text ?? ''

  return {
    replyText,
    toolCallsExecuted,
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    hitToolCap,
    finalStopReason: response.stop_reason,
  }
}
