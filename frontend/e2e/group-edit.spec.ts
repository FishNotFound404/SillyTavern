import { test, expect } from '@playwright/test'
import { REACT_URL } from '../playwright.config'

test.describe('GroupEdit Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${REACT_URL}/groups/new`)
  })

  test('should load group edit form with title "Create Group"', async ({ page }) => {
    const heading = page.locator('h1', { hasText: 'Create Group' })
    await expect(heading).toBeVisible({ timeout: 15_000 })
  })

  test('should show group name input field', async ({ page }) => {
    await page.locator('h1', { hasText: 'Create Group' }).waitFor({ timeout: 15_000 })
    const nameInput = page.locator('#group-name')
    await expect(nameInput).toBeVisible()
  })

  test('should show character selection list', async ({ page }) => {
    await page.locator('h1', { hasText: 'Create Group' }).waitFor({ timeout: 15_000 })
    await page.waitForLoadState('networkidle')
    const membersHeading = page.locator('h2', { hasText: 'Members' })
    await expect(membersHeading).toBeVisible({ timeout: 15_000 })
  })

  test('should show "Create Group" submit button', async ({ page }) => {
    await page.locator('h1', { hasText: 'Create Group' }).waitFor({ timeout: 15_000 })
    const createButton = page.locator('button[type="submit"]', { hasText: 'Create Group' })
    await expect(createButton).toBeVisible()
  })

  test('should show "Cancel" button that navigates back to groups list', async ({ page }) => {
    await page.locator('h1', { hasText: 'Create Group' }).waitFor({ timeout: 15_000 })
    const cancelButton = page.locator('button[type="button"]', { hasText: 'Cancel' })
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()
    await page.waitForURL('**/groups')
  })
})
