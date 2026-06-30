import type { ChatFile, ChatLine, ChatMessage, ChatMetadata } from '../../api/types'

export type { ChatFile, ChatLine, ChatMessage, ChatMetadata }

export interface ChatSession {
  file_name: string
  file_id: string
  lines: ChatLine[]
}
