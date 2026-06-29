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
