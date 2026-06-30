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
  return apiPost<ChatFile[]>('/api/characters/chats', { avatar_url: avatar, simple: true })
}

export async function fetchChat(
  avatarUrl: string,
  fileName: string,
): Promise<ChatSession> {
  const lines = await apiPost<ChatLine[]>('/api/chats/get', {
    avatar_url: avatarUrl,
    file_name: fileName,
  })
  return { file_name: fileName, file_id: fileName, lines }
}

export async function saveChat(
  avatarUrl: string,
  fileName: string,
  chat: ChatLine[],
): Promise<unknown> {
  return apiPost('/api/chats/save', {
    avatar_url: avatarUrl,
    file_name: fileName,
    chat,
  })
}

export async function renameChat(
  avatarUrl: string,
  originalFile: string,
  renamedFile: string,
): Promise<{ ok: boolean; sanitizedFileName?: string }> {
  return apiPost<{ ok: boolean; sanitizedFileName?: string }>('/api/chats/rename', {
    avatar_url: avatarUrl,
    original_file: originalFile,
    renamed_file: renamedFile,
  })
}

export async function deleteChat(
  avatarUrl: string,
  chatfile: string,
): Promise<unknown> {
  return apiPost('/api/chats/delete', { avatar_url: avatarUrl, chatfile })
}

export async function exportChat(
  avatarUrl: string,
  file: string,
  format: string,
  exportfilename: string,
): Promise<{ result: string; message?: string }> {
  return apiPost<{ result: string; message?: string }>('/api/chats/export', {
    avatar_url: avatarUrl,
    file,
    format,
    exportfilename,
  })
}

export function useCharacterChats(avatar: string | undefined) {
  return useQuery({
    queryKey: chatKeys.character(avatar || ''),
    queryFn: () => fetchCharacterChats(avatar || ''),
    enabled: Boolean(avatar),
  })
}

export function useChat(avatarUrl: string | undefined, fileId: string | undefined) {
  return useQuery({
    queryKey: [...chatKeys.session(avatarUrl || ''), fileId || ''],
    queryFn: () => fetchChat(avatarUrl || '', fileId || ''),
    enabled: Boolean(avatarUrl) && Boolean(fileId),
  })
}

export function useSaveChat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      avatarUrl,
      fileName,
      chat,
    }: {
      avatarUrl: string
      fileName: string
      chat: ChatLine[]
    }) => saveChat(avatarUrl, fileName, chat),
    onSuccess: (_, { avatarUrl, fileName }) => {
      queryClient.invalidateQueries({
        queryKey: [...chatKeys.session(avatarUrl), fileName],
      })
    },
  })
}

export function useRenameChat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      avatarUrl,
      originalFile,
      renamedFile,
    }: {
      avatarUrl: string
      originalFile: string
      renamedFile: string
    }) => renameChat(avatarUrl, originalFile, renamedFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.all })
    },
  })
}

export function useDeleteChat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ avatarUrl, chatfile }: { avatarUrl: string; chatfile: string }) =>
      deleteChat(avatarUrl, chatfile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.all })
    },
  })
}

export function useExportChat() {
  return useMutation({
    mutationFn: ({
      avatarUrl,
      file,
      format,
      exportfilename,
    }: {
      avatarUrl: string
      file: string
      format: string
      exportfilename: string
    }) => exportChat(avatarUrl, file, format, exportfilename),
  })
}
