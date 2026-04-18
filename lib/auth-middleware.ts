import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Verifies the request has a valid authenticated session.
 * Returns the verified user ID from the session — never trust client-passed IDs.
 * 
 * Usage in any API route:
 *   const { userId, error } = await verifySession(request)
 *   if (error) return NextResponse.json({ error }, { status: 401 })
 */
export async function verifySession(request: NextRequest): Promise<{
  userId: string | null
  error: string | null
}> {
  try {
    // Parse cookies from the request
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').filter(Boolean).map(c => {
        const idx = c.indexOf('=')
        return [c.slice(0, idx), c.slice(idx + 1)]
      })
    )

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll: () => Object.entries(cookies).map(([name, value]) => ({ name, value })),
          setAll: () => {}, // read-only in middleware
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { userId: null, error: 'Unauthorized — please log in' }
    }

    return { userId: user.id, error: null }
  } catch {
    return { userId: null, error: 'Session verification failed' }
  }
}

/**
 * Verifies a cron job request from Vercel.
 * Vercel sends a secret header to authenticate scheduled jobs.
 */
export function verifyCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get('x-vercel-cron-signature')
  return secret === process.env.CRON_SECRET
}

/**
 * Sanitise a string to prevent injection attacks.
 * Strips null bytes and limits length.
 */
export function sanitiseString(input: unknown, maxLength = 500): string | null {
  if (input === null || input === undefined) return null
  if (typeof input !== 'string') return null
  return input.replace(/\0/g, '').trim().slice(0, maxLength) || null
}

/**
 * Validates that a string is a valid UUID (Supabase row IDs).
 * Prevents injection of arbitrary strings as IDs.
 */
export function isValidUUID(str: unknown): boolean {
  if (typeof str !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

/**
 * Rate limit check using a simple in-memory store.
 * For production, replace with Redis/Upstash.
 * Allows maxRequests per windowMs per userId.
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  userId: string,
  endpoint: string,
  maxRequests = 20,
  windowMs = 60_000
): { allowed: boolean; remaining: number } {
  const key = `${userId}:${endpoint}`
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count }
}
