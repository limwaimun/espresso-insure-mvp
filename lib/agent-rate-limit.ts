// lib/agent-rate-limit.ts
//
// Lightweight per-FA per-agent rate limiter.
// Uses an in-process Map with sliding window (resets on cold start — good enough for Vercel
// serverless where each function instance has its own memory, and the log table provides
// the real audit trail).
//
// ⚠️  TECH DEBT (B84+): This is SOFT protection, not real rate limiting.
//     Vercel runs serverless functions across many hot instances. Each instance
//     has its own Map. With N hot instances, the effective limit becomes N×limit.
//     Acceptable today (solo user, no public abuse vector) but BEFORE opening to
//     real users, replace with shared state:
//       - Postgres-backed table 'rate_limit_buckets' (cheap, already have Supabase), OR
//       - Vercel KV (Redis-flavored, faster), OR
//       - Upstash Redis (works across providers).
//     This middleware will catch accidental client-side runaway loops on a single
//     instance, but will NOT stop a determined attacker.
//
// Limits:
//   - Default: 30 requests per agent per FA per hour
//   - Scout PDF extraction: 10 per hour (expensive)
//   - Compass/Harbour: 20 per hour (multi-LLM-call agents)
//
// Usage:
//   const { allowed, remaining } = checkRateLimit(userId, 'compass')
//   if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

export type RateLimitedAgent =
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

const LIMITS: Record<string, number> = {
  scout: 10,      // PDF extraction is very token-heavy
  compass: 20,    // runs 2 LLM calls
  harbour: 20,    // runs 2 LLM calls
  atlas: 20,
  lens: 30,
  sage: 30,
  relay: 30,
  'maya-playground': 20,
  maya: 40,
  whatsapp: 60,   // webhook — higher because it's event-driven
}

const DEFAULT_LIMIT = 30
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

interface WindowEntry {
  count: number
  windowStart: number
}

// In-process store — shared across requests on the same serverless instance
const store = new Map<string, WindowEntry>()

/**
 * Check and increment the rate limit for a given userId + agent pair.
 * Returns { allowed: boolean, remaining: number, limit: number }
 */
export function checkRateLimit(
  userId: string,
  agent: RateLimitedAgent
): { allowed: boolean; remaining: number; limit: number } {
  const limit = LIMITS[agent] ?? DEFAULT_LIMIT
  const key = `${userId}:${agent}`
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    // New window
    store.set(key, { count: 1, windowStart: now })
    return { allowed: true, remaining: limit - 1, limit }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, limit }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, limit }
}
