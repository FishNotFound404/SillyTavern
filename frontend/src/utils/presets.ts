import { apiPost } from '../api/client'
import type { GenerationPreset } from '../types/preset'

export const PRESET_API_ID = 'generation'

export interface PresetListResponse {
  names: string[]
  presets: GenerationPreset[]
}

export async function fetchPresets(): Promise<{ names: string[]; presets: GenerationPreset[] }> {
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
