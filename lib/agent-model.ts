// lib/agent-model.ts
//
// Runtime model resolver for all Espresso agents.
//
// Each agent reads its model name from an env var:
//   AGENT_MODEL_<AGENT_NAME_UPPERCASE>   e.g. AGENT_MODEL_SAGE
// Falling back to:
//   AGENT_MODEL_DEFAULT
// Falling back to the hardcoded default 'claude-sonnet-4-6'
//
// This lets ops change the model for any agent without a code deploy,
// and provides the hook the admin LLM selector will write to when
// the DB-backed per-agent config is built.
//
// Usage:
//   import { resolveAgentModel } from '@/lib/agent-model'
//   const model = resolveAgentModel('sage')

export type AgentName =
  | 'sage'
  | 'scout'
  | 'compass'
  | 'atlas'
  | 'lens'
  | 'harbour'
  | 'relay'
  | 'maya'
  | 'maya-playground'
  | 'whatsapp'
  | string

/**
 * Default model used when no env override is set.
 * Change this to update the fleet default in one place.
 */
export const DEFAULT_MODEL = 'claude-sonnet-4-6'

/**
 * Resolve the model name for a given agent.
 * Priority:
 *   1. AGENT_MODEL_<AGENT> env var  (e.g. AGENT_MODEL_SAGE)
 *   2. AGENT_MODEL_DEFAULT env var
 *   3. DEFAULT_MODEL constant above
 */
export function resolveAgentModel(agent: AgentName): string {
  const envKey = `AGENT_MODEL_${agent.toUpperCase().replace(/-/g, '_')}`
  return (
    process.env[envKey] ??
    process.env.AGENT_MODEL_DEFAULT ??
    DEFAULT_MODEL
  )
}
