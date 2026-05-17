import 'dotenv/config'

// evals/maya/runner.ts
//
// Eval harness for Maya. Loads a scenario, simulates each turn by calling
// runMaya() with a mock dispatcher, evaluates assertions, writes results.
//
// Usage:
//   npx tsx evals/maya/runner.ts evals/maya/scenarios/01-wei-ming-knee-surgery.ts
//
// Output:
//   evals/maya/runs/<scenarioId>-<timestamp>.json
//
// Exit code 0 = all turns passed. Non-zero = at least one assertion failed.

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

import { runMaya } from '@/lib/maya/runtime'
import { MAYA_TOOLS, createMockToolDispatcher } from '@/lib/maya/tools'
import { buildMayaSystemPrompt } from '@/lib/maya/prompt'
import type {
  Scenario,
  Turn,
  Assertion,
  AssertionResult,
  TurnResult,
  ScenarioResult,
} from './types'
import type { ConversationMessage } from '@/lib/maya/types'
import type Anthropic from '@anthropic-ai/sdk'

const DEFAULT_MODEL = process.env.AGENT_MODEL_DEFAULT || 'claude-sonnet-4-20250514'

async function loadScenario(path: string): Promise<Scenario> {
  const absPath = resolve(process.cwd(), path)
  if (!existsSync(absPath)) {
    throw new Error(`Scenario file not found: ${absPath}`)
  }
  const url = pathToFileURL(absPath).href
  const mod = await import(url) as { scenario?: Scenario; default?: Scenario }
  const scenario = mod.scenario || mod.default
  if (!scenario) {
    throw new Error(`Scenario file ${path} must export 'scenario' or default`)
  }
  return scenario
}

/**
 * Build the Anthropic messages array from accumulated ConversationMessages.
 * Same logic as buildClaudeMessages in the playground route, simplified —
 * no attachments handling because eval scenarios don't include attachments.
 */
function buildEvalMessages(
  history: ConversationMessage[],
  clientName: string,
  faName: string
): Anthropic.MessageParam[] {
  const result: Anthropic.MessageParam[] = []

  for (const msg of history) {
    if (msg.role === 'maya') {
      result.push({ role: 'assistant', content: msg.content })
      continue
    }
    const prefix = msg.role === 'client' ? `[${clientName}]: ` : `[${faName}]: `
    result.push({ role: 'user', content: `${prefix}${msg.content}` })
  }

  // Collapse consecutive user messages.
  const deduped: Anthropic.MessageParam[] = []
  for (const msg of result) {
    const last = deduped[deduped.length - 1]
    if (last?.role === 'user' && msg.role === 'user') {
      last.content = `${last.content as string}\n${msg.content as string}`
    } else {
      deduped.push({ ...msg })
    }
  }

  if (deduped[0]?.role === 'assistant') {
    deduped.unshift({ role: 'user', content: '(conversation started)' })
  }

  return deduped
}

function evaluateAssertion(
  assertion: Assertion,
  reply: string,
  toolCalls: { name: string; input: unknown; result: string }[]
): AssertionResult {
  const replyLower = reply.toLowerCase()

  switch (assertion.type) {
    case 'called_tool': {
      const called = toolCalls.some(t => t.name === assertion.tool)
      return {
        assertion,
        passed: called,
        detail: called ? `tool '${assertion.tool}' was called` : `tool '${assertion.tool}' was NOT called`,
      }
    }

    case 'did_not_call_tool': {
      const called = toolCalls.some(t => t.name === assertion.tool)
      return {
        assertion,
        passed: !called,
        detail: called ? `tool '${assertion.tool}' WAS called (expected: not)` : `tool '${assertion.tool}' was not called`,
      }
    }

    case 'tool_input_matches': {
      const matching = toolCalls.filter(t => t.name === assertion.tool)
      if (matching.length === 0) {
        return { assertion, passed: false, detail: `tool '${assertion.tool}' was not called` }
      }
      const re = new RegExp(assertion.pattern, assertion.flags ?? 'i')
      const anyMatch = matching.some(t => {
        const input = t.input as Record<string, unknown>
        const value = input?.[assertion.field]
        if (typeof value !== 'string') return false
        return re.test(value)
      })
      return {
        assertion,
        passed: anyMatch,
        detail: anyMatch ? `tool input.${assertion.field} matched /${assertion.pattern}/` : `tool input.${assertion.field} did not match`,
      }
    }

    case 'reply_contains': {
      const passed = replyLower.includes(assertion.needle.toLowerCase())
      return {
        assertion,
        passed,
        detail: passed ? `found "${assertion.needle}"` : `missing "${assertion.needle}"`,
      }
    }

    case 'reply_does_not_contain': {
      const found = replyLower.includes(assertion.needle.toLowerCase())
      return {
        assertion,
        passed: !found,
        detail: found ? `unexpectedly contains "${assertion.needle}"` : `does not contain "${assertion.needle}" ✓`,
      }
    }

    case 'reply_contains_all': {
      const missing = assertion.needles.filter(n => !replyLower.includes(n.toLowerCase()))
      return {
        assertion,
        passed: missing.length === 0,
        detail: missing.length === 0 ? `all ${assertion.needles.length} needles found` : `missing: ${missing.join(', ')}`,
      }
    }

    case 'reply_matches': {
      const re = new RegExp(assertion.pattern, assertion.flags ?? 'i')
      const passed = re.test(reply)
      return {
        assertion,
        passed,
        detail: passed ? `matches /${assertion.pattern}/` : `does not match /${assertion.pattern}/`,
      }
    }

    case 'reply_min_length': {
      const len = reply.length
      const passed = len >= assertion.chars
      return {
        assertion,
        passed,
        detail: `${len} chars (min ${assertion.chars})`,
      }
    }

    case 'reply_max_length': {
      const len = reply.length
      const passed = len <= assertion.chars
      return {
        assertion,
        passed,
        detail: `${len} chars (max ${assertion.chars})`,
      }
    }

    case 'reply_max_words': {
      const words = reply.split(/\s+/).filter(w => w.length > 0).length
      const passed = words <= assertion.words
      return {
        assertion,
        passed,
        detail: `${words} words (max ${assertion.words})`,
      }
    }
  }
}

async function runScenario(scenario: Scenario): Promise<ScenarioResult> {
  const startedAt = new Date()
  console.log(`\n━━━ Scenario: ${scenario.id} ━━━`)
  console.log(scenario.description)
  console.log()

  // Build the system prompt once — it's not turn-dependent for this scenario.
  const systemPrompt = buildMayaSystemPrompt({
    client: scenario.context.client,
    policies: scenario.context.policies,
    faName: scenario.context.faName,
    preferredInsurers: scenario.context.preferredInsurers,
    conversationSummary: scenario.context.conversationSummary,
    openClaims: scenario.context.claims && scenario.context.claims.length > 0
      ? scenario.context.claims.map(c => ({ title: c.title, daysSinceUpdate: c.daysSinceUpdate }))
      : undefined,
  })

  const dispatcher = createMockToolDispatcher(scenario.mocks)

  const conversation: ConversationMessage[] = []
  const turnResults: TurnResult[] = []
  let totalInputTokens = 0
  let totalOutputTokens = 0

  for (let i = 0; i < scenario.turns.length; i++) {
    const turn = scenario.turns[i]
    conversation.push({ role: turn.speaker, content: turn.message })

    const initialMessages = buildEvalMessages(conversation, scenario.context.client.name, scenario.context.faName)

    const result = await runMaya({
      systemPrompt,
      initialMessages,
      tools: MAYA_TOOLS,
      toolDispatcher: dispatcher,
      model: DEFAULT_MODEL,
      maxTokens: 1500,
    })

    totalInputTokens += result.inputTokens
    totalOutputTokens += result.outputTokens

    const assertionResults = turn.assertions.map(a => evaluateAssertion(a, result.replyText, result.toolCallsExecuted))
    const allPassed = assertionResults.every(a => a.passed)

    turnResults.push({
      turnIndex: i,
      speaker: turn.speaker,
      message: turn.message,
      reply: result.replyText,
      toolCallsExecuted: result.toolCallsExecuted,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      assertions: assertionResults,
      passed: allPassed,
    })

    // Add Maya's reply to the conversation history for the next turn
    conversation.push({ role: 'maya', content: result.replyText })

    // Log to stdout
    console.log(`Turn ${i + 1} [${turn.speaker}]: "${turn.message.slice(0, 80)}${turn.message.length > 80 ? '...' : ''}"`)
    console.log(`  → Reply: "${result.replyText.slice(0, 120)}${result.replyText.length > 120 ? '...' : ''}"`)
    if (result.toolCallsExecuted.length > 0) {
      console.log(`  → Tools called: ${result.toolCallsExecuted.map(t => t.name).join(', ')}`)
    }
    for (const a of assertionResults) {
      const icon = a.passed ? '✓' : '✗'
      console.log(`  ${icon} [${a.assertion.type}] ${a.detail || ''}`)
    }
    console.log()
  }

  const finishedAt = new Date()
  const passedTurns = turnResults.filter(t => t.passed).length
  const failedTurns = turnResults.length - passedTurns

  const finalResult: ScenarioResult = {
    scenarioId: scenario.id,
    description: scenario.description,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    totalTurns: turnResults.length,
    passedTurns,
    failedTurns,
    passed: failedTurns === 0,
    totalInputTokens,
    totalOutputTokens,
    turns: turnResults,
  }

  return finalResult
}

function writeResult(result: ScenarioResult): string {
  const runsDir = resolve(process.cwd(), 'evals/maya/runs')
  if (!existsSync(runsDir)) mkdirSync(runsDir, { recursive: true })
  const timestamp = result.startedAt.replace(/[:.]/g, '-')
  const filename = `${result.scenarioId}-${timestamp}.json`
  const path = resolve(runsDir, filename)
  writeFileSync(path, JSON.stringify(result, null, 2))
  return path
}

async function main() {
  const scenarioPath = process.argv[2]
  if (!scenarioPath) {
    console.error('Usage: npx tsx evals/maya/runner.ts <scenario-path>')
    process.exit(2)
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set in environment')
    process.exit(2)
  }

  const scenario = await loadScenario(scenarioPath)
  const result = await runScenario(scenario)
  const outputPath = writeResult(result)

  console.log('━━━ Summary ━━━')
  console.log(`Result: ${result.passed ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Turns: ${result.passedTurns}/${result.totalTurns} passed`)
  console.log(`Duration: ${(result.durationMs / 1000).toFixed(1)}s`)
  console.log(`Tokens: ${result.totalInputTokens} in / ${result.totalOutputTokens} out`)
  console.log(`Result written to: ${outputPath}`)

  process.exit(result.passed ? 0 : 1)
}

main().catch(err => {
  console.error('Runner crashed:', err)
  process.exit(2)
})
