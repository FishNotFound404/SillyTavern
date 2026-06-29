import type { ChatFile, ChatLine } from '../../api/types'

export interface WorldInfoSummary {
  file_id: string
  name: string
}

export interface Character {
  name: string
  description?: string
  personality?: string
  scenario?: string
  first_mes?: string
  mes_example?: string
  avatar: string
  chat_size: number
  chat_file_count?: number
  create_date?: string
  date_last_chat?: number
  tags?: string[]
  world?: string
  json_data?: string
  chat?: string
  talkativeness?: number
  creator_notes?: string
  system_prompt?: string
  post_history_instructions?: string
  creator?: string
  character_version?: string
  data?: {
    name?: string
    description?: string
    personality?: string
    scenario?: string
    first_mes?: string
    mes_example?: string
    creator_notes?: string
    system_prompt?: string
    post_history_instructions?: string
    creator?: string
    character_version?: string
    tags?: string[]
    extensions?: {
      world?: string
      talkativeness?: number
    }
    character_book?: {
      name?: string
      entries: Array<{
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
      }>
    }
  }
}

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

export type CharacterChatFile = ChatFile
export type CharacterChatLine = ChatLine
