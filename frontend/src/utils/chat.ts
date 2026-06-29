import type { Character } from '../features/characters/types'
import type { ChatLine, ChatMessage, ChatMetadata } from '../types'

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
}

export function generateChatFileName(characterName: string): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const timePart = `${pad(now.getHours())}h${pad(now.getMinutes())}m${pad(now.getSeconds())}s${now.getMilliseconds()}ms`
  return `${characterName} - ${datePart}@${timePart}.jsonl`
}

export function createChatMetadata(characterName: string, userName: string): ChatMetadata {
  return {
    chat_metadata: {
      integrity: generateUUID(),
      note_prompt: '',
      note_interval: 1,
      note_position: 1,
      note_depth: 4,
      note_role: 0,
      tainted: true,
    },
    user_name: userName,
    character_name: characterName,
  }
}

export function createInitialMessage(character: Character): ChatMessage {
  return {
    name: character.name,
    is_user: false,
    mes: character.first_mes || '',
    send_date: new Date().toISOString(),
    swipes: [character.first_mes || ''],
    swipe_id: 0,
    swipe_info: [{}],
  }
}

export function buildInitialChatData(character: Character | null, userName: string): ChatLine[] {
  const data: ChatLine[] = [createChatMetadata(character?.name || 'Character', userName)]
  if (character?.first_mes) {
    data.push(createInitialMessage(character))
  }
  return data
}

export function buildSystemPrompt(character: Character | null, loreContents?: string[]): string {
  if (!character) return ''
  const parts: string[] = []
  if (character.description) parts.push(`Description: ${character.description}`)
  if (character.personality) parts.push(`Personality: ${character.personality}`)
  if (character.scenario) parts.push(`Scenario: ${character.scenario}`)
  parts.push(`You are ${character.name}. Stay in character and respond as ${character.name}.`)
  if (loreContents && loreContents.length > 0) {
    parts.push('[World Info]')
    parts.push(...loreContents)
  }
  return parts.join('\n\n')
}
