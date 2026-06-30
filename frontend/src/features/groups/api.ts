import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '../../api/client'
import type { Group } from './types'

export const groupKeys = {
  all: ['groups'] as const,
  detail: (id: string) => [...groupKeys.all, id] as const,
  chat: (id: string) => [...groupKeys.all, id, 'chat'] as const,
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

export async function fetchGroupChat(id: string): Promise<unknown[]> {
  try {
    const chat = await apiPost<unknown[]>('/api/chats/group/get', { id })
    return chat || []
  } catch {
    return []
  }
}

export async function saveGroupChat(id: string, chat: unknown[]): Promise<unknown> {
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
    mutationFn: deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
  })
}
