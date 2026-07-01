import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '../../api/client'
import type { SettingsBundleResponse } from '../../api/types'
import type {
  BackendStatus,
  ConnectionSettings,
  GenerationPreset,
  SecretState,
} from './types'
import { fetchModels } from './utils'

export const settingsKeys = {
  all: ['settings'] as const,
  bundle: ['settings', 'bundle'] as const,
  secrets: ['settings', 'secrets'] as const,
  presets: ['settings', 'presets'] as const,
  models: (provider: string) => ['settings', 'models', provider] as const,
  backend: ['settings', 'backend'] as const,
}

export async function fetchBackendStatus(): Promise<BackendStatus> {
  return apiGet<BackendStatus>('/api/settings/status')
}

export async function fetchSettingsBundle(): Promise<SettingsBundleResponse> {
  return apiPost<SettingsBundleResponse>('/api/settings/get', {})
}

export async function saveSettingsBundle(bundle: Record<string, unknown>): Promise<unknown> {
  return apiPost('/api/settings/save', bundle)
}

export async function fetchSecrets(): Promise<SecretState> {
  return apiPost<SecretState>('/api/secrets/read', {})
}

export async function writeSecret(key: string, value: string): Promise<unknown> {
  return apiPost('/api/secrets/write', { key, value, label: 'React UI' })
}

export async function deleteSecret(key: string, id: string): Promise<unknown> {
  return apiPost('/api/secrets/delete', { key, id })
}

export interface PresetListResponse {
  names: string[]
  presets: GenerationPreset[]
}

export const PRESET_API_ID = 'generation'

export async function fetchPresets(): Promise<PresetListResponse> {
  const result = await apiPost<PresetListResponse>('/api/presets/list', { apiId: PRESET_API_ID })
  return { names: result.names || [], presets: result.presets || [] }
}

export async function savePreset(
  name: string,
  preset: Omit<GenerationPreset, 'name'>,
): Promise<string> {
  const result = await apiPost<{ name?: string }>('/api/presets/save', {
    apiId: PRESET_API_ID,
    name,
    preset: { ...preset, name },
  })
  if (!result.name) {
    throw new Error('Preset was not saved.')
  }
  return result.name
}

export async function deletePreset(name: string): Promise<void> {
  await apiPost('/api/presets/delete', { apiId: PRESET_API_ID, name })
}

export function useBackendStatus() {
  return useQuery({
    queryKey: settingsKeys.backend,
    queryFn: async () => {
      try {
        return await fetchBackendStatus()
      } catch {
        return { online: false } satisfies BackendStatus
      }
    },
  })
}

export function useSettingsBundle() {
  return useQuery({
    queryKey: settingsKeys.bundle,
    queryFn: fetchSettingsBundle,
  })
}

export function useSecrets() {
  return useQuery({
    queryKey: settingsKeys.secrets,
    queryFn: fetchSecrets,
  })
}

export function useModels(provider: string | undefined) {
  return useQuery({
    queryKey: settingsKeys.models(provider || ''),
    queryFn: () => fetchModels(provider as Parameters<typeof fetchModels>[0]),
    enabled: Boolean(provider),
  })
}

export function usePresets() {
  return useQuery({
    queryKey: settingsKeys.presets,
    queryFn: fetchPresets,
  })
}

export interface SaveConnectionInput {
  currentBundle: SettingsBundleResponse | null
  connection: ConnectionSettings
  merge: (bundle: Record<string, unknown>, connection: ConnectionSettings) => Record<string, unknown>
}

export function useSaveConnection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ currentBundle, connection, merge }: SaveConnectionInput) => {
      const parsed = currentBundle?.settings
        ? (JSON.parse(currentBundle.settings) as Record<string, unknown>)
        : {}
      const updated = merge(parsed, connection)
      return saveSettingsBundle(updated)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.bundle })
    },
  })
}

export function useWriteSecret() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => writeSecret(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.secrets })
    },
  })
}

export function useDeleteSecret() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ key, id }: { key: string; id: string }) => deleteSecret(key, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.secrets })
    },
  })
}

export function useSavePreset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ name, preset }: { name: string; preset: Omit<GenerationPreset, 'name'> }) =>
      savePreset(name, preset),
    onSuccess: (savedName) => savedName,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.presets })
    },
  })
}

export function useDeletePreset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => deletePreset(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.presets })
    },
  })
}
