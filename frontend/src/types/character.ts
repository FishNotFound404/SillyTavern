export interface CharacterFormData {
  name: string
  description: string
  personality: string
  scenario: string
  firstMes: string
  mesExample: string
  creatorNotes: string
  systemPrompt: string
  postHistoryInstructions: string
  creator: string
  characterVersion: string
  tags: string[]
  talkativeness: number
  avatarFile: File | null
}

export interface CharacterDraft extends CharacterFormData {
  avatarUrl?: string
  jsonData?: string
  chat?: string
  createDate?: string
}

export const DEFAULT_CHARACTER_FORM: CharacterFormData = {
  name: '',
  description: '',
  personality: '',
  scenario: '',
  firstMes: '',
  mesExample: '',
  creatorNotes: '',
  systemPrompt: '',
  postHistoryInstructions: '',
  creator: '',
  characterVersion: '',
  tags: [],
  talkativeness: 0.5,
  avatarFile: null,
}
