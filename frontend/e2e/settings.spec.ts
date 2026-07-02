import { test, expect } from '@playwright/test'

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
  })

  test('should load settings page with title', async ({ page }) => {
    await expect(page.locator('h1', { hasText: 'Settings' })).toBeVisible({ timeout: 15_000 })
  })

  test('should show connection settings section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Connection', exact: true })).toBeVisible()
  })

  test('should show API keys section', async ({ page }) => {
    await expect(page.locator('h2', { hasText: 'API Keys' })).toBeVisible()
  })

  test('should show generation presets section', async ({ page }) => {
    await expect(page.locator('h2', { hasText: 'Generation Presets' })).toBeVisible()
  })

  test('should show about section', async ({ page }) => {
    await expect(page.locator('h2', { hasText: 'About' })).toBeVisible()
  })
})
