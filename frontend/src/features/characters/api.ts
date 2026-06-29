import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiPost, apiPostForm } from '../../api/client'
import type { ChatFile } from '../../api/types'
import type { Character } from './types'

export const characterKeys = {
  all: ['characters'] as const,
  detail: (avatar: string) => [...characterKeys.all, avatar] as const,
  chats: (avatar: string) => [...characterKeys.all, avatar, 'chats'] as const,
}

export async function fetchCharacters(): Promise<Character[]> {
  return apiPost<Character[]>('/api/characters/all', {})
}

export async function fetchCharacter(avatar: string): Promise<Character> {
  return apiPost<Character>('/api/characters/get', { avatar_url: avatar })
}

export async function fetchCharacterChats(avatar: string): Promise<ChatFile[]> {
  return apiPost<ChatFile[]>('/api/characters/chats', { avatar_url: avatar })
}

export async function createCharacter(formData: FormData): Promise<string> {
  const result = await apiPostForm<string | { avatar?: string }>('/api/characters/create', formData)
  if (typeof result === 'string') return result
  if (result && typeof result === 'object' && 'avatar' in result && typeof result.avatar === 'string') {
    return result.avatar
  }
  throw new Error('Unexpected response from character creation')
}

export async function updateCharacter(formData: FormData): Promise<unknown> {
  return apiPostForm<unknown>('/api/characters/edit', formData)
}

export async function associateWorld(avatar: string, world: string): Promise<unknown> {
  return apiPost('/api/characters/world', { avatar_url: avatar, world })
}

export function useCharacters() {
  return useQuery({
    queryKey: characterKeys.all,
    queryFn: fetchCharacters,
  })
}

export function useCharacter(avatar: string | undefined) {
  return useQuery({
    queryKey: characterKeys.detail(avatar || ''),
    queryFn: () => fetchCharacter(avatar || ''),
    enabled: Boolean(avatar),
  })
}

export function useCreateCharacter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCharacter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: characterKeys.all })
    },
  })
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateCharacter,
    onSuccess: (_, formData) => {
      const avatar = formData.get('avatar_url') as string | null
      if (avatar) {
        queryClient.invalidateQueries({ queryKey: characterKeys.detail(avatar) })
      }
      queryClient.invalidateQueries({ queryKey: characterKeys.all })
    },
  })
}

export function useAssociateWorld() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ avatar, world }: { avatar: string; world: string }) =>
      associateWorld(avatar, world),
    onSuccess: (_, { avatar }) => {
      queryClient.invalidateQueries({ queryKey: characterKeys.detail(avatar) })
    },
  })
}
