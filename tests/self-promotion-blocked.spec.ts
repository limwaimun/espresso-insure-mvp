import { test, expect, APIRequestContext } from '@playwright/test'

/**
 * Batch 15 — Smoke test #2: Self-promotion blocked (locks in Batch 12b).
 *
 * Authenticates as a pre-seeded test FA, attempts to PATCH the sensitive
 * columns of their own profile row, and asserts that RLS blocks it with
 * the expected error code (42501). Also verifies legitimate column updates
 * (e.g. `company`) still work.
 *
 * This test would catch regressions in the `profiles` UPDATE RLS policy's
 * WITH CHECK clause. Any future accidental removal or loosening of the
 * policy would be caught immediately.
 */

const SUPABASE_URL = process.env.SUPABASE_URL!
const PUB_KEY = process.env.SUPABASE_PUB_KEY!
const TEST_EMAIL = process.env.E2E_TEST_FA_EMAIL!
const TEST_PASSWORD = process.env.E2E_TEST_FA_PASSWORD!

if (!SUPABASE_URL || !PUB_KEY || !TEST_EMAIL || !TEST_PASSWORD) {
  throw new Error(
    'Missing env vars. Copy .env.test.example to .env.test and fill in values.'
  )
}

// Helpers
async function login(request: APIRequestContext) {
  const res = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: PUB_KEY, 'Content-Type': 'application/json' },
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  })
  expect(res.status(), 'login should succeed').toBe(200)
  const body = await res.json()
  return { jwt: body.access_token as string, userId: body.user.id as string }
}

async function readProfile(request: APIRequestContext, jwt: string, userId: string) {
  const res = await request.get(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=id,plan,role,company`,
    { headers: { apikey: PUB_KEY, Authorization: `Bearer ${jwt}` } }
  )
  expect(res.status()).toBe(200)
  const rows = await res.json()
  expect(rows).toHaveLength(1)
  return rows[0]
}

async function attemptPatch(
  request: APIRequestContext,
  jwt: string,
  userId: string,
  body: Record<string, unknown>
) {
  return request.patch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    headers: {
      apikey: PUB_KEY,
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    data: body,
  })
}

test.describe('RLS: profiles UPDATE with_check blocks self-promotion', () => {
  test('cannot promote plan from trial/solo to team', async ({ request }) => {
    const { jwt, userId } = await login(request)
    const before = await readProfile(request, jwt, userId)

    const res = await attemptPatch(request, jwt, userId, { plan: 'team' })
    expect(res.status()).toBe(403)
    const err = await res.json()
    expect(err.code).toBe('42501')

    const after = await readProfile(request, jwt, userId)
    expect(after.plan).toBe(before.plan)
  })

  test('cannot promote role to admin', async ({ request }) => {
    const { jwt, userId } = await login(request)
    const before = await readProfile(request, jwt, userId)

    const res = await attemptPatch(request, jwt, userId, { role: 'admin' })
    expect(res.status()).toBe(403)
    const err = await res.json()
    expect(err.code).toBe('42501')

    const after = await readProfile(request, jwt, userId)
    expect(after.role).toBe(before.role)
  })

  test('legitimate company update still succeeds', async ({ request }) => {
    const { jwt, userId } = await login(request)
    const newCompany = `E2E Test Co ${Date.now()}`

    const res = await attemptPatch(request, jwt, userId, { company: newCompany })
    expect(res.status()).toBe(200)
    const updated = await res.json()
    expect(updated[0].company).toBe(newCompany)
  })
})