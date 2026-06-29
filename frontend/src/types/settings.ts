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
