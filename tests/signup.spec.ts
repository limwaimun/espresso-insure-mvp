import { test, expect } from '@playwright/test'

/**
 * Batch 15 — Smoke test #1: Signup round-trip.
 *
 * Goes through the trial signup form with a unique email per run and asserts
 * that a new FA lands on /dashboard.
 *
 * This test would have caught Batch 12a (the `profiles_plan_check` constraint
 * missing 'trial') — the exact failure pattern we discovered by accident.
 *
 * NOTE: Each run creates a permanent auth user + profiles row in the DB.
 * Cleanup is deferred to a later batch. Test emails use the prefix
 * `e2e-signup-` so they're identifiable for bulk cleanup later.
 */
test('new FA can sign up and land on dashboard', async ({ page }) => {
  const timestamp = Date.now()
  const uniqueEmail = `e2e-signup-${timestamp}@example.com`
  // Unique phone per run — SG mobile format (8 or 9 + 7 digits)
  const uniquePhone = `8${timestamp.toString().slice(-7)}`

  await page.goto('/trial')

  // Use placeholders (more stable than labels with asterisks)
  await page.getByPlaceholder('Sarah Tan').fill('E2E Test User')
  await page.getByPlaceholder('you@email.com').fill(uniqueEmail)
  await page.getByPlaceholder('Wayne & Co').fill('E2E Test Co')
  await page.getByPlaceholder('8123 4567').fill(uniquePhone)

  // Password fields — both have type=password, differentiated by order
  const passwords = page.locator('input[type="password"]')
  await passwords.nth(0).fill('TestPass123')
  await passwords.nth(1).fill('TestPass123')

  await page.getByRole('button', { name: /start free trial/i }).click()

  // Signup success = redirect to /dashboard within 10s
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 })
})