import { test, expect } from '@playwright/test'

test.describe('WorldInfo Page', () => {
  test('should load world info list', async ({ page }) => {
    await page.goto('/world-info')

    const heading = page.locator('h1', { hasText: 'World Info / Lorebooks' })
    await expect(heading).toBeVisible({ timeout: 15_000 })

    await page.waitForLoadState('networkidle')

    const createButton = page.locator('button', { hasText: 'New World Info' })
    await expect(createButton).toBeVisible()

    const emptyState = page.getByText('No world info yet', { exact: false })
    const cards = page.locator('div.bg-gray-900:has(h2)')
    const isEmpty = (await emptyState.isVisible().catch(() => false)) || (await cards.count()) === 0

    if (!isEmpty) {
      await expect(cards.first()).toBeVisible({ timeout: 15_000 })

      const firstCard = cards.first()
      await firstCard.click()

      await expect(page).toHaveURL(/\/world-info\/.+/)
      await page.waitForLoadState('networkidle')

      const editHeading = page.locator('h1')
      await expect(editHeading).toBeVisible({ timeout: 15_000 })
    }
  })
})
