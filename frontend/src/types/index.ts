export * from './character'

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

export interface ChatMessage {
  name: string
  is_user: boolean
  mes: string
  send_date: string
}

export interface ChatMetadata {
  chat_metadata: {
    integrity: string
    note_prompt: string
    note_interval: number
    note_position: number
    note_depth: number
    note_role: number
    tainted?: boolean
  }
  user_name: string
  character_name: string
}
