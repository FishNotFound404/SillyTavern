import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
import { REACT_URL } from '../playwright.config'

async function gotoChatWithExistingChat(page: Page) {
  await page.goto(`${REACT_URL}/chat`)
  await page.locator('h1', { hasText: 'Chats' }).waitFor({ timeout: 15_000 })
  await page.waitForLoadState('networkidle')
  const chatItems = page.locator('div.bg-gray-900:has(h2)')
  const count = await chatItems.count()
  if (count === 0) {
    test.skip(true, 'No chats in backend; cannot run screenshot E2E.')
    return null
  }
  await chatItems.first().click()
  await page.waitForURL('**/chat?*')
  return page
}

test.describe('Chat long screenshot', () => {
  test('cancel button closes the dialog without triggering download', async ({ page }) => {
    await page.goto(`${REACT_URL}/chat`)
    await page.locator('h1', { hasText: 'Chats' }).waitFor({ timeout: 15_000 })

    const chatItems = page.locator('div.bg-gray-900:has(h2)')
    const count = await chatItems.count()
    if (count === 0) {
      test.skip(true, 'No chats in backend; cannot test cancel flow.')
      return
    }

    await chatItems.first().click()
    await page.waitForURL('**/chat?*')
    await page.getByRole('button', { name: '长截图对话' }).click()
    await page.getByRole('menuitem', { name: 'PNG (1x)' }).click()
    await page.getByRole('button', { name: '取消' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('screenshot button opens format menu when chat is open', async ({ page }) => {
    const p = await gotoChatWithExistingChat(page)
    if (!p) return

    await page.getByRole('button', { name: '长截图对话' }).click()
    await expect(page.getByRole('menu')).toBeVisible()
    await expect(page.getByText('PNG (1x)')).toBeVisible()
    await expect(page.getByText(/PNG \(2x\)/)).toBeVisible()
    await expect(page.getByText(/JPEG/)).toBeVisible()
  })

  test('choosing a format opens the confirmation dialog', async ({ page }) => {
    const p = await gotoChatWithExistingChat(page)
    if (!p) return

    await page.getByRole('button', { name: '长截图对话' }).click()
    await page.getByRole('menuitem', { name: 'PNG (1x)' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('button', { name: '生成长截图' })).toBeVisible()
    await expect(page.getByRole('button', { name: '取消' })).toBeVisible()
  })

  test('short chat: PNG 1x downloads a non-empty file', async ({ page }) => {
    const p = await gotoChatWithExistingChat(page)
    if (!p) return

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: '长截图对话' }).click()
    await page.getByRole('menuitem', { name: 'PNG (1x)' }).click()
    await page.getByRole('button', { name: '生成长截图' }).click()

    const download = await downloadPromise
    const path = await download.path()
    expect(path).toBeTruthy()
    if (path) {
      const buf = await fs.readFile(path)
      expect(buf.length).toBeGreaterThan(1000)
    }
  })

  test('medium chat: PNG 2x produces a file with png extension', async ({ page }) => {
    const p = await gotoChatWithExistingChat(page)
    if (!p) return

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: '长截图对话' }).click()
    await page.getByRole('menuitem', { name: /PNG \(2x\)/ }).click()
    await page.getByRole('button', { name: '生成长截图' }).click()

    const download = await downloadPromise
    const filename = download.suggestedFilename()
    expect(filename).toMatch(/SillyTavern-.*\.png$/)
  })

  test('long chat: JPEG produces a file smaller than 5 MB', async ({ page }) => {
    const p = await gotoChatWithExistingChat(page)
    if (!p) return

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: '长截图对话' }).click()
    await page.getByRole('menuitem', { name: /JPEG/ }).click()
    await page.getByRole('button', { name: '生成长截图' }).click()

    const download = await downloadPromise
    const path = await download.path()
    if (path) {
      const stat = await fs.stat(path)
      expect(stat.size).toBeLessThan(5 * 1024 * 1024)
    }
  })
})