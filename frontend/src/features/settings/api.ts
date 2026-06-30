import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '../../api/client'
import type { BackendStatus, ChatProvider, ConnectionSettings, GenerationPreset, ModelInfo, SecretState, SettingsResponse } from './types'

export const settingsKeys = {
  all: ['settings'] as const,
  backend: ['settings', 'backend'] as const,
  secrets: ['settings', 'secrets'] as const,
  presets: ['settings', 'presets'] as const,
  models: (source: string) => [...settingsKeys.all, 'models', source] as const,
}

export async function fetchSettings(): Promise<SettingsResponse> {
  return apiPost<SettingsResponse>('/api/settings/get', {})
}

export async function saveSettings(settings: Record<string, unknown>): Promise<unknown> {
  return apiPost('/api/settings/save', settings)
}

function buildBackendStatusPayload(connection: ConnectionSettings): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    chat_completion_source: connection.provider,
    model: connection.model,
  }

  if (connection.provider === 'minimax') {
    payload.minimax_endpoint = connection.minimaxEndpoint
  }

  return payload
}

export async function fetchBackendStatus(connection: ConnectionSettings): Promise<BackendStatus> {
  const data = await apiPost<{ error?: boolean; version?: string }>(
    '/api/backends/chat-completions/status',
    buildBackendStatusPayload(connection),
  )
  return { online: !data.error, version: data.version }
}

export async function fetchModels(source: ChatProvider): Promise<ModelInfo[]> {
  if (source === 'claude') {
    return CLAUDE_MODELS
  }

  if (source === 'minimax') {
    const data = await apiGet<{ configured?: boolean; default_model?: string; available_models?: string[] }>('/api/minimax/status')
    return (data.available_models || []).map((id) => ({ id }))
  }

  const data = await apiPost<{ error?: boolean; data?: Array<{ id?: string; name?: string }> }>('/api/backends/chat-completions/status', {
    chat_completion_source: source,
  })

  if (data.error) {
    throw new Error('Provider returned an error while fetching models')
  }

  return (data.data || [])
    .filter((item): item is { id: string; name?: string } => typeof item.id === 'string')
    .map((item) => ({ id: item.id, name: item.name }))
}

const CLAUDE_MODELS: ModelInfo[] = [
  { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet' },
  { id: 'claude-3-opus-latest', name: 'Claude 3 Opus' },
  { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku' },
  { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
]

export async function fetchSecrets(): Promise<SecretState> {
  return apiPost<SecretState>('/api/secrets/read', {})
}

export async function saveSecret(key: string, value: string): Promise<unknown> {
  return apiPost('/api/secrets/write', { key, value, label: 'React UI' })
}

export async function deleteSecret(key: string): Promise<void> {
  await apiPost('/api/secrets/delete', { key })
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

export async function savePreset(name: string, preset: Omit<GenerationPreset, 'name'>): Promise<string> {
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

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: fetchSettings,
  })
}

export function useSaveSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
    },
  })
}

export function useModels(source: string) {
  return useQuery({
    queryKey: settingsKeys.models(source),
    queryFn: () => fetchModels(source as ChatProvider),
    enabled: Boolean(source),
  })
}

export function useBackendStatus(connection: ConnectionSettings) {
  return useQuery({
    queryKey: [...settingsKeys.backend, connection.provider, connection.model, connection.minimaxEndpoint],
    queryFn: () => fetchBackendStatus(connection),
    enabled: Boolean(connection.provider),
  })
}

export function useSecrets() {
  return useQuery({
    queryKey: settingsKeys.secrets,
    queryFn: fetchSecrets,
  })
}

export function useSaveSecret() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => saveSecret(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.secrets })
    },
  })
}

export function useDeleteSecret() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteSecret,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.secrets })
    },
  })
}

export function usePresets() {
  return useQuery({
    queryKey: settingsKeys.presets,
    queryFn: fetchPresets,
  })
}

export function useSavePreset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ name, preset }: { name: string; preset: Omit<GenerationPreset, 'name'> }) => savePreset(name, preset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.presets })
    },
  })
}

export function useDeletePreset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deletePreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.presets })
    },
  })
}
