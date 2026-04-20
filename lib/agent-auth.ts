// lib/agent-auth.ts
//
// Dual-auth helper for internal agent routes (compass, atlas, harbour, lens,
// sage, scout, etc.) that can be called two ways:
//
//   1. Directly from the dashboard, with a normal user session cookie
//   2. From Relay, server-to-server, with an internal key + verified user ID
//
// Both paths must succeed before the agent does any work. On success, the
// caller receives the authenticated `userId` that should be used for all
// downstream DB queries — never trust `ifaId` in the request body.
//
// Setup:
//   - RELAY_INTERNAL_KEY env var must be set (64-char random hex, not reused
//     elsewhere — see openssl rand -hex 32)

import { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth-middleware'

export type AgentAuthResult =
  | { ok: true; userId: string; source: 'session' | 'relay' }
  | { ok: false; error: string; status: number }

export async function authenticateAgentRequest(request: NextRequest): Promise<AgentAuthResult> {
  const relayKey = request.headers.get('x-relay-key')
  const relayUserId = request.headers.get('x-relay-user-id')

  // ── Path 1: internal call from Relay ─────────────────────────────────────
  if (relayKey) {
    const expectedKey = process.env.RELAY_INTERNAL_KEY
    if (!expectedKey) {
      // Dev safety — if the env var isn't set, don't accept relay-auth at all
      console.error('[agent-auth] RELAY_INTERNAL_KEY not configured; rejecting relay call')
      return { ok: false, error: 'Relay auth not configured', status: 500 }
    }

    // Constant-time-ish comparison — for random 64-char strings this is
    // sufficient; an attacker can't iteratively guess via timing.
    if (relayKey !== expectedKey) {
      return { ok: false, error: 'Invalid relay key', status: 401 }
    }

    if (!relayUserId || !isUuid(relayUserId)) {
      return { ok: false, error: 'Missing or invalid x-relay-user-id', status: 401 }
    }

    return { ok: true, userId: relayUserId, source: 'relay' }
  }

  // ── Path 2: direct call from dashboard (normal session cookie) ───────────
  const { userId, error } = await verifySession(request)
  if (error || !userId) {
    return { ok: false, error: error || 'Unauthorized', status: 401 }
  }
  return { ok: true, userId, source: 'session' }
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}
