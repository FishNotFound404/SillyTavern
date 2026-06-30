export interface WorldInfoEntry {
  uid: number
  key: string[]
  keysecondary: string[]
  comment: string
  content: string
  constant: boolean
  vectorized: boolean
  selective: boolean
  selectiveLogic: number
  addMemo: boolean
  order: number
  position: number
  disable: boolean
  ignoreBudget: boolean
  excludeRecursion: boolean
  preventRecursion: boolean
  matchPersonaDescription: boolean
  matchCharacterDescription: boolean
  matchCharacterPersonality: boolean
  matchCharacterDepthPrompt: boolean
  matchScenario: boolean
  matchCreatorNotes: boolean
  delayUntilRecursion: number
  probability: number
  useProbability: boolean
  depth: number
  outletName: string
  group: string
  groupOverride: boolean
  groupWeight: number
  scanDepth: number | null
  caseSensitive: boolean | null
  matchWholeWords: boolean | null
  useGroupScoring: boolean | null
  automationId: string
  role: number
  sticky: number | null
  cooldown: number | null
  delay: number | null
  triggers: string[]
  characterFilter: {
    isExclude: boolean
    names: string[]
    tags: string[]
  }
  displayIndex: number
}

export interface WorldInfoFile {
  name?: string
  extensions?: Record<string, unknown>
  entries: Record<string, WorldInfoEntry>
}

export interface WorldInfoSummary {
  file_id: string
  name: string
  extensions?: Record<string, unknown>
}

export interface CharacterBookEntry {
  id: number
  keys: string[]
  secondary_keys?: string[]
  content: string
  constant?: boolean
  selective?: boolean
  enabled?: boolean
  insertion_order?: number
  position?: 'before_char' | 'after_char'
  comment?: string
}

export interface CharacterBook {
  name?: string
  entries: CharacterBookEntry[]
}
