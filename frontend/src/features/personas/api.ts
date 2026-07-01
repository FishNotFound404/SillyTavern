import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost, apiPostForm } from '../../api/client'
import type { SettingsBundleResponse } from '../../api/types'
import { settingsKeys, useSettingsBundle } from '../settings/api'
import { readPersonaState, writePersonaState } from './utils'
import type { PersonaState } from './types'

export { useSettingsBundle as usePersonaBundle }
export type { SettingsBundleResponse }

export interface PersonaUploadResponse {
  path: string
}

export function parsePersonaBundle(
  bundle: SettingsBundleResponse | null | undefined,
): PersonaState {
  const parsed = bundle?.settings
    ? (JSON.parse(bundle.settings) as Record<string, unknown>)
    : {}
  return readPersonaState(parsed)
}

export async function uploadPersonaAvatar(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('avatar', file)
  const data = await apiPostForm<PersonaUploadResponse>('/api/avatars/upload', formData)
  if (!data?.path) throw new Error('Upload response missing path')
  return data.path
}

export async function deletePersonaAvatar(avatar: string): Promise<void> {
  await apiPost('/api/avatars/delete', { avatar })
}

export interface SavePersonaStateInput {
  currentBundle: SettingsBundleResponse | null | undefined
  state: PersonaState
}

export async function savePersonaBundle(
  input: SavePersonaStateInput,
): Promise<SettingsBundleResponse> {
  const parsed = input.currentBundle?.settings
    ? (JSON.parse(input.currentBundle.settings) as Record<string, unknown>)
    : {}
  const updated = writePersonaState(parsed, input.state)
  return apiPost<SettingsBundleResponse>('/api/settings/save', updated)
}

export function useSavePersonaState() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: savePersonaBundle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.bundle })
    },
  })
}

export function useUploadPersonaAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: uploadPersonaAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.bundle })
    },
  })
}

export function useDeletePersonaAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deletePersonaAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.bundle })
    },
  })
}

