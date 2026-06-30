export interface BackendStatus {
  online: boolean
  version?: string
}

export interface SecretItem {
  id: string
  value: string
  label: string
  active: boolean
}

export type SecretState = Record<string, SecretItem[] | null>

export interface ApiKeyConfig {
  key: string
  label: string
}

export type ChatProvider =
  | 'openai'
  | 'claude'
  | 'makersuite'
  | 'openrouter'
  | 'deepseek'
  | 'minimax'

export type MiniMaxEndpoint = 'cn' | 'global'

export interface ConnectionSettings {
  provider: ChatProvider
  model: string
  temperature: number
  maxTokens: number
  stream: boolean
  minimaxEndpoint: MiniMaxEndpoint
}

export interface ModelInfo {
  id: string
  name?: string
}

export interface GenerationPreset {
  name: string
  provider: ChatProvider
  model: string
  minimaxEndpoint?: string
}

export interface SettingsResponse {
  settings: string
}
