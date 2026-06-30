import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiPost, apiPostForm } from '../../api/client'
import type { Persona, PersonaState } from './types'
import { generatePersonaId, readPersonaState, writePersonaState } from './utils'

export const personaKeys = {
  all: ['personas'] as const,
  lists: () => [...personaKeys.all, 'list'] as const,
}

interface SettingsResponse {
  settings: string
}

export async function fetchPersonas(): Promise<PersonaState> {
  const data = await apiPost<SettingsResponse>('/api/settings/get', {})
  const parsed = data?.settings ? (JSON.parse(data.settings) as Record<string, unknown>) : {}
  return readPersonaState(parsed)
}

export async function createPersona(formData: FormData): Promise<Persona> {
  const name = (formData.get('name') as string) || ''
  const description = (formData.get('description') as string) || ''
  const file = formData.get('avatar') as File | null

  if (!name.trim()) {
    throw new Error('Persona name is required')
  }
  if (!file) {
    throw new Error('Avatar file is required')
  }

  const uploadFormData = new FormData()
  uploadFormData.append('avatar', file)
  const result = await apiPostForm<{ path?: string }>('/api/avatars/upload', uploadFormData)

  if (!result.path) {
    throw new Error('Upload response missing path')
  }

  return {
    id: generatePersonaId(),
    name: name.trim(),
    description: description.trim(),
    avatar: result.path,
  }
}

export async function savePersonas(state: PersonaState): Promise<void> {
  const data = await apiPost<SettingsResponse>('/api/settings/get', {})
  const parsed = data?.settings ? (JSON.parse(data.settings) as Record<string, unknown>) : {}
  await apiPost('/api/settings/save', writePersonaState(parsed, state))
}

export async function deletePersonaAvatar(avatar: string): Promise<void> {
  await apiPost('/api/avatars/delete', { avatar })
}

export function usePersonas() {
  return useQuery({
    queryKey: personaKeys.lists(),
    queryFn: fetchPersonas,
  })
}

export function useCreatePersona() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPersona,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personaKeys.lists() })
    },
  })
}

export function useSavePersonas() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: savePersonas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personaKeys.lists() })
    },
  })
}

export function useDeletePersonaAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deletePersonaAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personaKeys.lists() })
    },
  })
}
