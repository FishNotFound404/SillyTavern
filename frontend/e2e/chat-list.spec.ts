import { test, expect } from '@playwright/test'
import { REACT_URL } from '../playwright.config'

test.describe('ChatList Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${REACT_URL}/chat`)
  })

  test('should load and display page with title "Chats"', async ({ page }) => {
    const heading = page.locator('h1', { hasText: 'Chats' })
    await expect(heading).toBeVisible({ timeout: 15_000 })
  })

  test('should show "New Chat" button', async ({ page }) => {
    await page.locator('h1', { hasText: 'Chats' }).waitFor({ timeout: 15_000 })
    const newChatButton = page.locator('button', { hasText: 'New Chat' })
    await expect(newChatButton).toBeVisible()
  })

  test('should show "No chats yet" when no chats exist', async ({ page }) => {
    await page.locator('h1', { hasText: 'Chats' }).waitFor({ timeout: 15_000 })
    await page.waitForLoadState('networkidle')
    const chatItems = page.locator('div.bg-gray-900:has(h2)')
    const count = await chatItems.count()
    if (count === 0) {
      await expect(page.getByText('No chats yet', { exact: false })).toBeVisible()
    } else {
      test.skip(true, 'Chats exist in backend; cannot test empty state.')
    }
  })

  test('should display chat items with character names when chats exist', async ({ page }) => {
    await page.locator('h1', { hasText: 'Chats' }).waitFor({ timeout: 15_000 })
    await page.waitForLoadState('networkidle')
    const chatItems = page.locator('div.bg-gray-900:has(h2)')
    const count = await chatItems.count()
    if (count === 0) {
      test.skip(true, 'No chats in backend; nothing to display.')
    }
    const firstChat = chatItems.first()
    await expect(firstChat).toBeVisible({ timeout: 15_000 })
    const nameHeading = firstChat.locator('h2')
    await expect(nameHeading).toBeVisible()
    const name = await nameHeading.textContent()
    expect(name?.trim().length).toBeGreaterThan(0)
  })

  test('should navigate to chat view when clicking a chat item', async ({ page }) => {
    await page.locator('h1', { hasText: 'Chats' }).waitFor({ timeout: 15_000 })
    await page.waitForLoadState('networkidle')
    const chatItems = page.locator('div.bg-gray-900:has(h2)')
    const count = await chatItems.count()
    if (count === 0) {
      test.skip(true, 'No chats in backend; cannot test navigation.')
    }
    await chatItems.first().click()
    await page.waitForURL('**/chat?*')
    const url = page.url()
    expect(url).toMatch(/avatar=/)
    expect(url).toMatch(/chat=/)
  })
})
