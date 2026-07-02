import { test, expect, type Page } from '@playwright/test'
import { REACT_URL, LEGACY_URL } from '../playwright.config'

async function fetchReactCharacterNames(): Promise<string[]> {
  const response = await fetch(`${REACT_URL}/api/characters/all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  if (!response.ok) {
    throw new Error(`React API returned ${response.status}`)
  }
  const data = (await response.json()) as Array<{ name?: string; avatar?: string }>
  return data
    .map((c) => (c.name ?? '').trim())
    .filter((name) => name.length > 0)
    .sort()
}

async function fetchLegacyCharacterNames(): Promise<string[]> {
  const response = await fetch(`${LEGACY_URL}/api/characters/all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  if (!response.ok) {
    throw new Error(`Legacy API returned ${response.status}`)
  }
  const data = (await response.json()) as Array<{ name?: string; avatar?: string }>
  return data
    .map((c) => (c.name ?? '').trim())
    .filter((name) => name.length > 0)
    .sort()
}

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
  await page.goto('/')
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

    let reactApiNames: string[]
    let legacyApiNames: string[]
    try {
      ;[reactApiNames, legacyApiNames] = await Promise.all([
        fetchReactCharacterNames(),
        fetchLegacyCharacterNames(),
      ])
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