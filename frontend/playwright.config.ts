import { defineConfig, devices } from '@playwright/test'

const REACT_URL = 'http://localhost:5173'
const LEGACY_URL = 'http://localhost:8000'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: REACT_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  expect: { timeout: 10_000 },
})

export { REACT_URL, LEGACY_URL }