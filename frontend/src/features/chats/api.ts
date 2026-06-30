import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '../../api/client'
import type { ChatFile, ChatLine } from '../../api/types'
import type { ChatSession } from './types'

export const chatKeys = {
  all: ['chats'] as const,
  character: (avatar: string) => [...chatKeys.all, 'character', avatar] as const,
  session: (id: string) => [...chatKeys.all, 'session', id] as const,
}

export async function fetchCharacterChats(avatar: string): Promise<ChatFile[]> {
  return apiPost<ChatFile[]>('/api/characters/chats', { avatar_url: avatar })
}

export async function fetchChat(fileId: string): Promise<ChatSession> {
  const lines = await apiPost<ChatLine[]>('/api/chats/get', { file_id: fileId })
  return { file_name: fileId, file_id: fileId, lines }
}

export async function saveChat(fileId: string, chat: ChatLine[]): Promise<unknown> {
  return apiPost('/api/chats/save', { file_id: fileId, chat })
}

export async function renameChat(fileId: string, newName: string): Promise<unknown> {
  return apiPost('/api/chats/rename', { file_id: fileId, new_name: newName })
}

export async function deleteChat(fileId: string): Promise<unknown> {
  return apiPost('/api/chats/delete', { file_id: fileId })
}

export function useCharacterChats(avatar: string | undefined) {
  return useQuery({
    queryKey: chatKeys.character(avatar || ''),
    queryFn: () => fetchCharacterChats(avatar || ''),
    enabled: Boolean(avatar),
  })
}

export function useChat(fileId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.session(fileId || ''),
    queryFn: () => fetchChat(fileId || ''),
    enabled: Boolean(fileId),
  })
}

export function useSaveChat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fileId, chat }: { fileId: string; chat: ChatLine[] }) => saveChat(fileId, chat),
    onSuccess: (_, { fileId }) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.session(fileId) })
    },
  })
}

export function useRenameChat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fileId, newName }: { fileId: string; newName: string }) => renameChat(fileId, newName),
    onSuccess: (_, { fileId }) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.session(fileId) })
      queryClient.invalidateQueries({ queryKey: chatKeys.all })
    },
  })
}

export function useDeleteChat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.all })
    },
  })
}
