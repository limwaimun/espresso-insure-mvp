import { defineConfig } from '@playwright/test'
import 'dotenv/config'
import { config } from 'dotenv'

// Load .env.test for test-specific credentials (gitignored)
config({ path: '.env.test' })

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: false,   // tests touch the same test user; run serially
  workers: 1,             // same reason — avoid race conditions
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'https://espresso-mvp.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
})