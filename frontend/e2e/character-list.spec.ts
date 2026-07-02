import { test, expect, type Page } from '@playwright/test'
import { REACT_URL, LEGACY_URL } from '../playwright.config'

async function readReactCharacterNamesFromDom(page: Page): Promise<string[]> {
  await page.goto('/')
  const heading = page.locator('h1', { hasText: 'Characters' })
  await expect(heading).toBeVisible({ timeout: 15_000 })
  await page.waitForLoadState('networkidle')
  const emptyState = page.getByText('No characters yet', { exact: false })
  if (await emptyState.isVisible().catch(() => false)) {
    return []
  }
  const cardSelector = page.locator('div.bg-gray-800:has(h2)')
  await expect(cardSelector.first()).toBeVisible({ timeout: 15_000 })
  const names = await page.locator('div.bg-gray-800 h2').allTextContents()
  return names.map((n) => n.trim()).filter((n) => n.length > 0).sort()
}

async function readLegacyCharacterNamesFromDom(page: Page): Promise<string[]> {
  await page.goto(LEGACY_URL)
  const list = page.locator('#rm_print_characters_block')
  await expect(list).toBeVisible({ timeout: 15_000 })
  await page.waitForLoadState('networkidle')
  const emptyBlock = page.locator('.empty_block')
  if (await emptyBlock.isVisible().catch(() => false)) {
    return []
  }
  const card = list.locator('.character_select')
  await expect(card.first()).toBeVisible({ timeout: 15_000 })
  const names = await card.locator('.ch_name').allTextContents()
  return names.map((n) => n.trim()).filter((n) => n.length > 0).sort()
}

test.describe('Cross-frontend equivalence', () => {
  test('character list shows the same characters in both frontends', async ({ browser }) => {
    test.skip(
      !['development', 'test'].includes(process.env.NODE_ENV ?? 'development'),
      'Run only when both servers are available locally.',
    )

    const reactApiNames: string[] = []
    const legacyApiNames: string[] = []

    try {
      // Use browser context to establish session and get CSRF token
      const context = await browser.newContext()

      // Get CSRF token and fetch from React frontend
      const reactPage = await context.newPage()
      await reactPage.goto(REACT_URL)
      const reactCsrfResponse = await reactPage.evaluate(async () => {
        const res = await fetch('/csrf-token')
        return await res.json()
      })
      const reactCsrfToken = reactCsrfResponse.token

      const reactApiResponse = await reactPage.evaluate(async (csrfToken: string) => {
        const res = await fetch('/api/characters/all', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify({}),
        })
        return await res.json()
      }, reactCsrfToken)

      reactApiNames.push(
        ...(reactApiResponse as Array<{ name?: string; avatar?: string }>)
          .map((c) => (c.name ?? '').trim())
          .filter((name) => name.length > 0)
          .sort()
      )

      // Get CSRF token and fetch from Legacy frontend
      const legacyPage = await context.newPage()
      await legacyPage.goto(LEGACY_URL)
      const legacyCsrfResponse = await legacyPage.evaluate(async () => {
        const res = await fetch('/csrf-token')
        return await res.json()
      })
      const legacyCsrfToken = legacyCsrfResponse.token

      const legacyApiResponse = await legacyPage.evaluate(async (csrfToken: string) => {
        const res = await fetch('/api/characters/all', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify({}),
        })
        return await res.json()
      }, legacyCsrfToken)

      legacyApiNames.push(
        ...(legacyApiResponse as Array<{ name?: string; avatar?: string }>)
          .map((c) => (c.name ?? '').trim())
          .filter((name) => name.length > 0)
          .sort()
      )

      await context.close()
    } catch (error) {
      throw new Error(
        `Backend unreachable. Start the backend ('npm start' at repo root) and both dev servers (React: 'npm run dev' in frontend/, legacy served by backend on port 8000) before running E2E tests.\nUnderlying error: ${(error as Error).message}`,
      )
    }

    expect(reactApiNames).toEqual(legacyApiNames)

    if (reactApiNames.length === 0) {
      test.skip(true, 'No characters in backend; nothing to compare.')
    }

    const context = await browser.newContext()
    try {
      const reactPage = await context.newPage()
      const legacyPage = await context.newPage()
      const reactDomNames = await readReactCharacterNamesFromDom(reactPage)
      const legacyDomNames = await readLegacyCharacterNamesFromDom(legacyPage)
      expect(reactDomNames).toEqual(reactApiNames)
      expect(legacyDomNames).toEqual(legacyApiNames)
      expect(reactDomNames).toEqual(legacyDomNames)
    } finally {
      await context.close()
    }
  })
})
