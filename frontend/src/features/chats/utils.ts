import { getCsrfToken, initCsrfToken } from '../../api/client'
import type { Character } from '../../features/characters/types'
import type { ChatLine, ChatMessage, ChatMetadata } from './types'
import { extractStreamDelta } from '../settings/utils/connection'

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

function splitSseEvents(text: string): { events: string[]; remainder: string } {
  const parts = text.split(/\r\n\r\n|\r\r|\n\n/g)
  const remainder = parts.pop() || ''
  return { events: parts, remainder }
}

function extractData(event: string): string {
  const lines = event.split(/\r\n|\r|\n/g)
  const dataLines = lines
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
  return dataLines.join('\n')
}

async function* parseSseStream(reader: ReadableStreamDefaultReader<Uint8Array>): AsyncGenerator<string> {
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (value) {
      buffer += decoder.decode(value, { stream: !done })
    }

    const { events, remainder } = splitSseEvents(buffer)
    buffer = remainder

    for (const event of events) {
      const data = extractData(event)
      if (data === '') continue
      if (data === '[DONE]') return
      yield data
    }

    if (done) {
      // Process any trailing data that never got a terminating blank line.
      if (buffer) {
        const data = extractData(buffer)
        if (data && data !== '[DONE]') {
          yield data
        }
      }
      break
    }
  }
}

export async function* streamCompletion(
  endpoint: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  await initCsrfToken()
  const csrfToken = getCsrfToken()

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown error')
    throw new Error(`HTTP ${response.status}: ${text}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Response body is not readable')
  }

  for await (const data of parseSseStream(reader)) {
    try {
      const parsed = JSON.parse(data) as Record<string, unknown>
      const delta = extractStreamDelta(parsed)
      if (delta) {
        yield delta
      }
    } catch {
      // Skip malformed chunks; some providers send comments or empty data lines.
      continue
    }
  }
}
