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

export type ChatLine = ChatMetadata | ChatMessage

export function toChatDataIndex(messageIndex: number): number

export function isChatMessage(line: ChatLine): line is ChatMessage

export function applyMessageEdit(
  chatData: ChatLine[],
  messageIndex: number,
  newText: string,
): ChatLine[] | null

export function deleteMessage(chatData: ChatLine[], messageIndex: number): ChatLine[]

export function prepareRegenerateContext(
  chatData: ChatLine[],
  messageIndex: number,
):
  | { target: ChatMessage; truncated: ChatLine[]; historyMessages: ChatMessage[] }
  | null

export function buildApiMessages(
  systemPrompt: string,
  historyMessages: ChatMessage[],
): { role: string; content: string }[]
