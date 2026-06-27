export interface Character {
  name: string
  description?: string
  personality?: string
  scenario?: string
  first_mes?: string
  avatar: string
  chat_size: number
  chat_file_count?: number
  create_date?: string
  date_last_chat?: number
  tags?: string[]
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
