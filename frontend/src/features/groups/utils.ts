import type { Character } from '../characters/types'
import type { ChatLine, ChatMessage, ChatMetadata } from './types'
import { generateUUID } from '../chats/utils'

export type GroupChatLine = ChatLine

export function pickNextSpeaker(
  members: Character[],
  lastSpeakerName: string | null,
  allowSelfResponses: boolean,
): Character | null {
  if (members.length === 0) return null
  if (members.length === 1 || allowSelfResponses) return members[0]

  const enabledMembers = members
  const lastIndex = lastSpeakerName
    ? enabledMembers.findIndex((m) => m.name === lastSpeakerName)
    : -1

  const nextIndex = (lastIndex + 1) % enabledMembers.length
  return enabledMembers[nextIndex]
}

export function createGroupChatMetadata(): ChatMetadata {
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
    user_name: 'User',
    character_name: 'Group',
  }
}

export function buildGroupSystemPrompt(character: Character): string {
  const parts = [
    `Write ${character.name}'s next reply in a fictional group chat.`,
    character.description && `Description: ${character.description}`,
    character.personality && `Personality: ${character.personality}`,
    character.scenario && `Scenario: ${character.scenario}`,
    `You are ${character.name}. Stay in character and respond as ${character.name}.`,
  ].filter(Boolean)
  return parts.join('\n\n')
}

export function getLastSpeakerName(messages: ChatMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (!messages[i].is_user) return messages[i].name
  }
  return null
}
