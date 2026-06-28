import { apiPost } from '../api/client'
import type { Character, Group } from '../types'

export async function fetchGroups(): Promise<Group[]> {
  return apiPost<Group[]>('/api/groups/all', {})
}

export async function fetchGroup(id: string): Promise<Group> {
  const groups = await fetchGroups()
  const group = groups.find((g) => g.id === id)
  if (!group) throw new Error('Group not found')
  return group
}

export async function createGroup(data: Partial<Group>): Promise<Group> {
  return apiPost<Group>('/api/groups/create', data)
}

export async function updateGroup(group: Group): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>('/api/groups/edit', group)
}

export async function deleteGroup(id: string): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>('/api/groups/delete', { id })
}

export async function fetchGroupMembers(avatars: string[]): Promise<Character[]> {
  if (avatars.length === 0) return []
  const members = await Promise.all(
    avatars.map(async (avatar) => {
      try {
        const character = await apiPost<Character>('/api/characters/get', { avatar_url: avatar })
        return character
      } catch {
        return null
      }
    }),
  )
  return members.filter(Boolean) as Character[]
}

export async function fetchGroupChat(id: string): Promise<unknown[]> {
  try {
    const chat = await apiPost<unknown[]>('/api/chats/group/get', { id })
    return chat || []
  } catch {
    return []
  }
}

export async function saveGroupChat(id: string, chat: unknown[]): Promise<void> {
  await apiPost('/api/chats/group/save', { id, chat })
}

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
