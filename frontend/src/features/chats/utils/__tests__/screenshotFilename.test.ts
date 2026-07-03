import { describe, it, expect } from 'vitest'
import { buildScreenshotFilename } from '../screenshotFilename'

describe('buildScreenshotFilename', () => {
  it('builds filename from character, chat, date and extension', () => {
    const date = new Date('2026-07-03T10:24:30Z')
    const name = buildScreenshotFilename({
      characterName: 'Alice',
      chatFileName: 'Spring Morning',
      date,
      extension: 'png',
    })
    expect(name).toBe('SillyTavern-Alice-Spring_Morning-20260703-102430.png')
  })

  it('replaces unsafe characters with underscore', () => {
    const date = new Date('2026-01-15T03:05:09Z')
    const name = buildScreenshotFilename({
      characterName: 'A/B:C',
      chatFileName: 'D?E*F',
      date,
      extension: 'jpeg',
    })
    expect(name).toBe('SillyTavern-A_B_C-D_E_F-20260115-030509.jpeg')
  })

  it('uses "chat" when chatFileName is missing', () => {
    const date = new Date('2026-07-03T10:00:00Z')
    const name = buildScreenshotFilename({
      characterName: 'Alice',
      chatFileName: undefined,
      date,
      extension: 'png',
    })
    expect(name).toBe('SillyTavern-Alice-chat-20260703-100000.png')
  })

  it('uses "character" when characterName is empty', () => {
    const date = new Date('2026-07-03T10:00:00Z')
    const name = buildScreenshotFilename({
      characterName: '',
      chatFileName: 'Spring Morning',
      date,
      extension: 'png',
    })
    expect(name).toBe('SillyTavern-character-Spring_Morning-20260703-100000.png')
  })

  it('produces filenames in UTC (deterministic across timezones)', () => {
    const date = new Date('2026-07-03T10:24:30Z')
    const name = buildScreenshotFilename({
      characterName: 'A',
      chatFileName: 'B',
      date,
      extension: 'png',
    })
    // Use UTC formatting by implementation contract
    expect(name).toMatch(/-20260703-\d{6}\.png$/)
  })
})