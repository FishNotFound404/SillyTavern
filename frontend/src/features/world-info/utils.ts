import type { WorldInfoEntry, WorldInfoFile } from './types'

export const POSITION_LABELS: Record<number, string> = {
  0: 'Before character defs',
  1: 'After character defs',
  2: "Author's Note top",
  3: "Author's Note bottom",
  4: 'At depth',
}

export function createDefaultEntry(uid: number): WorldInfoEntry {
  return {
    uid,
    key: [],
    keysecondary: [],
    comment: '',
    content: '',
    constant: false,
    vectorized: false,
    selective: true,
    selectiveLogic: 0,
    addMemo: false,
    order: 100,
    position: 0,
    disable: false,
    ignoreBudget: false,
    excludeRecursion: false,
    preventRecursion: false,
    matchPersonaDescription: false,
    matchCharacterDescription: false,
    matchCharacterPersonality: false,
    matchCharacterDepthPrompt: false,
    matchScenario: false,
    matchCreatorNotes: false,
    delayUntilRecursion: 0,
    probability: 100,
    useProbability: true,
    depth: 4,
    outletName: '',
    group: '',
    groupOverride: false,
    groupWeight: 100,
    scanDepth: null,
    caseSensitive: null,
    matchWholeWords: null,
    useGroupScoring: null,
    automationId: '',
    role: 0,
    sticky: null,
    cooldown: null,
    delay: null,
    triggers: [],
    characterFilter: { isExclude: false, names: [], tags: [] },
    displayIndex: uid,
  }
}

export function keysToText(keys: string[]): string {
  return keys.join('\n')
}

export function textToKeys(text: string): string[] {
  return text
    .split('\n')
    .map((k) => k.trim())
    .filter(Boolean)
}

export function getNextEntryUid(fileData: WorldInfoFile | null): number {
  if (!fileData) return 1
  const uids = Object.keys(fileData.entries).map(Number)
  return uids.length > 0 ? Math.max(...uids) + 1 : 1
}

import type { CharacterBook } from './types'

/**
 * Gather lore entries from a character book that match the given context.
 *
 * - Constant entries are always included.
 * - Non-constant entries are included if any primary key appears in the context.
 * - Selective entries additionally require at least one secondary key to match.
 * - Results are sorted by insertion_order and returned as content strings.
 */
export function gatherMatchingLore(
  book: CharacterBook | null | undefined,
  context: string,
): string[] {
  if (!book || !Array.isArray(book.entries)) return []

  const contextLower = context.toLowerCase()

  return book.entries
    .filter((entry) => entry.enabled !== false)
    .filter((entry) => {
      if (entry.constant) return true

      const primaryKeys = entry.keys || []
      if (primaryKeys.length === 0) return false
      const primaryMatch = primaryKeys.some((key) => contextLower.includes(key.toLowerCase()))
      if (!primaryMatch) return false

      if (entry.selective && entry.secondary_keys && entry.secondary_keys.length > 0) {
        return entry.secondary_keys.some((key) => contextLower.includes(key.toLowerCase()))
      }

      return true
    })
    .sort((a, b) => (a.insertion_order ?? 100) - (b.insertion_order ?? 100))
    .map((entry) => entry.content)
}

/**
 * Build a system prompt with optional injected lore content.
 */
export function buildSystemPromptWithLore(
  baseSystemPrompt: string,
  loreContents: string[],
): string {
  if (loreContents.length === 0) return baseSystemPrompt

  const loreBlock = loreContents.join('\n\n')
  return [baseSystemPrompt, '[World Info]', loreBlock].filter(Boolean).join('\n\n')
}
