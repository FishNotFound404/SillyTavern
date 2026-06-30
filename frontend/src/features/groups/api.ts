import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '../../api/client'
import type { Character } from '../characters/types'
import type { ChatLine } from '../../api/types'
import type { Group } from './types'

export const groupKeys = {
  all: ['groups'] as const,
  detail: (id: string) => [...groupKeys.all, id] as const,
  members: (id: string) => [...groupKeys.all, id, 'members'] as const,
  chat: (chatId: string) => [...groupKeys.all, 'chat', chatId] as const,
}

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

export async function fetchGroupChat(id: string): Promise<ChatLine[]> {
  try {
    const chat = await apiPost<ChatLine[]>('/api/chats/group/get', { id })
    return Array.isArray(chat) ? chat : []
  } catch {
    return []
  }
}

export async function saveGroupChat(
  id: string,
  chat: ChatLine[],
): Promise<unknown> {
  return apiPost('/api/chats/group/save', { id, chat })
}

export function useGroups() {
  return useQuery({
    queryKey: groupKeys.all,
    queryFn: fetchGroups,
  })
}

export function useGroup(id: string | undefined) {
  return useQuery({
    queryKey: groupKeys.detail(id || ''),
    queryFn: () => fetchGroup(id || ''),
    enabled: Boolean(id),
  })
}

export function useGroupMembers(avatars: string[] | undefined) {
  return useQuery({
    queryKey: [...groupKeys.members('group'), ...(avatars || [])],
    queryFn: () => fetchGroupMembers(avatars || []),
    enabled: Boolean(avatars && avatars.length > 0),
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
  })
}

export function useUpdateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateGroup,
    onSuccess: (_, group) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(group.id) })
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
  })
}

export function useDeleteGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
  })
}

export function useGroupChat(chatId: string | undefined) {
  return useQuery({
    queryKey: groupKeys.chat(chatId || ''),
    queryFn: () => fetchGroupChat(chatId || ''),
    enabled: Boolean(chatId),
  })
}

export function useSaveGroupChat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, chat }: { id: string; chat: ChatLine[] }) =>
      saveGroupChat(id, chat),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.chat(id) })
    },
  })
}
