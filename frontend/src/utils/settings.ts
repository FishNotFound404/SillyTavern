import type { ApiKeyConfig, SecretState } from '../types/settings'

export const COMMON_API_KEYS: ApiKeyConfig[] = [
  { key: 'api_key_openai', label: 'OpenAI' },
  { key: 'api_key_claude', label: 'Anthropic Claude' },
  { key: 'api_key_minimax', label: 'MiniMax' },
  { key: 'api_key_makersuite', label: 'Google (MakerSuite)' },
  { key: 'api_key_openrouter', label: 'OpenRouter' },
  { key: 'api_key_deepseek', label: 'DeepSeek' },
  { key: 'api_key_togetherai', label: 'Together AI' },
  { key: 'api_key_mistralai', label: 'Mistral AI' },
  { key: 'api_key_cohere', label: 'Cohere' },
  { key: 'api_key_groq', label: 'Groq' },
]

export function isSecretConfigured(secrets: SecretState, key: string): boolean {
  const items = secrets[key]
  return Array.isArray(items) && items.some((item) => item.active)
}

export function getActiveSecretId(secrets: SecretState, key: string): string | undefined {
  const items = secrets[key]
  return items?.find((item) => item.active)?.id
}

export function getApiKeyLabel(key: string): string {
  return COMMON_API_KEYS.find((k) => k.key === key)?.label || key
}
