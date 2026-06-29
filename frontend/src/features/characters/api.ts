import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiPost, apiPostForm, getCsrfToken, initCsrfToken } from '../../api/client'
import { isValidUrl } from '../../utils/url'
import type { Character } from './types'
import type { ChatFile } from '../../api/types'

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

export async function exportCharacter(avatar: string, format: 'png' | 'json'): Promise<Blob> {
  await initCsrfToken()
  const headers: Record<string, string> = {}
  const token = getCsrfToken()
  if (token) headers['X-CSRF-Token'] = token

  const res = await fetch('/api/characters/export', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ avatar_url: avatar, format }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${text}`)
  }

  return res.blob()
}

export async function importCharacterFromUrl(url: string, signal?: AbortSignal): Promise<string> {
  const endpoint = isValidUrl(url) ? '/api/content/importURL' : '/api/content/importUUID'

  await initCsrfToken()
  const token = getCsrfToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['X-CSRF-Token'] = token
  }

  const downloadRes = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ url }),
    signal,
  })

  if (!downloadRes.ok) {
    const text = await downloadRes.text().catch(() => '')
    throw new Error(`Download failed: HTTP ${downloadRes.status} ${text}`)
  }

  const contentType = downloadRes.headers.get('X-Custom-Content-Type')
  if (contentType !== 'character') {
    throw new Error(
      contentType === 'lorebook'
        ? 'URL points to a lorebook, not a character.'
        : 'Unknown content type returned.',
    )
  }

  const blob = await downloadRes.blob()
  const fileName = parseContentDispositionFilename(
    downloadRes.headers.get('Content-Disposition') || '',
  )
  const fileType = fileName.split('.').pop()?.toLowerCase() || 'png'
  const file = new File([blob], fileName, { type: blob.type || 'image/png' })

  const formData = new FormData()
  formData.append('avatar', file)
  formData.append('file_type', fileType)

  const result = await apiPostForm<{ file_name?: string; error?: boolean }>('/api/characters/import', formData, signal)
  if (result?.error || !result?.file_name) {
    throw new Error('Import failed. The downloaded file may be corrupted or unsupported.')
  }
  return result.file_name
}

function parseContentDispositionFilename(header: string): string {
  const encodedMatch = header.match(/filename\*=(?:UTF-8|utf-8)''([^;]+)/)
  if (encodedMatch) {
    try {
      return decodeURIComponent(encodedMatch[1])
    } catch {
      return encodedMatch[1]
    }
  }

  const quotedMatch = header.match(/filename="([^"]*)"/)
  if (quotedMatch) {
    return quotedMatch[1]
  }

  const unquotedMatch = header.match(/filename=([^;]+)/)
  if (unquotedMatch) {
    return unquotedMatch[1].trim()
  }

  return 'imported-character.png'
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
