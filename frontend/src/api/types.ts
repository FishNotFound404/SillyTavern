export interface ChatMessage {
  name: string
  is_user: boolean
  mes: string
  send_date: string
  swipe_id?: number
  swipes?: string[]
  swipe_info?: Array<{
    send_date?: string
    gen_started?: string
    gen_finished?: string
    extra?: Record<string, unknown>
  }>
  extra?: Record<string, unknown>
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

export type ChatLine = ChatMetadata | ChatMessage

export interface ChatFile {
  file_name: string
  file_id: string
}

export interface CsrfTokenResponse {
  token: string
}
