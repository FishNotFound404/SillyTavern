import type { ChatProvider, ConnectionSettings } from '../types/connection'

export interface ApiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ProviderConfig {
  key: ChatProvider
  label: string
  secretKey: string
  defaultModel: string
}

export const PROVIDER_CONFIG: ProviderConfig[] = [
  { key: 'minimax', label: 'MiniMax', secretKey: 'api_key_minimax', defaultModel: 'MiniMax-M3' },
  { key: 'openai', label: 'OpenAI', secretKey: 'api_key_openai', defaultModel: 'gpt-4o-mini' },
  { key: 'claude', label: 'Anthropic Claude', secretKey: 'api_key_claude', defaultModel: 'claude-3-5-sonnet-latest' },
  { key: 'makersuite', label: 'Google (MakerSuite)', secretKey: 'api_key_makersuite', defaultModel: 'gemini-1.5-flash-latest' },
  { key: 'openrouter', label: 'OpenRouter', secretKey: 'api_key_openrouter', defaultModel: 'openai/gpt-4o-mini' },
  { key: 'deepseek', label: 'DeepSeek', secretKey: 'api_key_deepseek', defaultModel: 'deepseek-chat' },
]

export function getProviderConfig(provider: ChatProvider): ProviderConfig {
  return PROVIDER_CONFIG.find((p) => p.key === provider) || PROVIDER_CONFIG[0]
}

export function getDefaultModel(provider: ChatProvider): string {
  return getProviderConfig(provider).defaultModel
}

export const DEFAULT_CONNECTION: ConnectionSettings = {
  provider: 'minimax',
  model: getDefaultModel('minimax'),
  temperature: 0.7,
  maxTokens: 1024,
  stream: true,
}

export interface GenerationRequest {
  endpoint: string
  body: Record<string, unknown>
}

export interface GenerationOptions {
  systemPrompt: string
  historyMessages: Array<{ is_user: boolean; mes: string }>
  userMessage?: string
  userName?: string
  charName?: string
}

export function buildGenerationRequest(
  settings: ConnectionSettings,
  options: GenerationOptions,
): GenerationRequest {
  const messages: ApiMessage[] = [
    { role: 'system', content: options.systemPrompt },
    ...options.historyMessages.map((m) => ({
      role: m.is_user ? ('user' as const) : ('assistant' as const),
      content: m.mes,
    })),
  ]

  if (options.userMessage) {
    messages.push({ role: 'user', content: options.userMessage })
  }

  return {
    endpoint: '/api/backends/chat-completions/generate',
    body: {
      type: 'normal',
      messages,
      model: settings.model,
      chat_completion_source: settings.provider,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      stream: settings.stream,
      user_name: options.userName || 'User',
      char_name: options.charName || 'Character',
    },
  }
}

export function parseGenerationResponse(data: Record<string, unknown>): string {
  if (data.error && typeof data.error === 'object' && data.error !== null) {
    const message = (data.error as { message?: string }).message
    if (message) throw new Error(message)
  }

  if (data.error === true) {
    throw new Error('Generation failed')
  }

  const choices = (data as { choices?: Array<{ message?: { content?: string }; text?: string }> }).choices
  if (Array.isArray(choices) && choices.length > 0) {
    const first = choices[0]
    if (first.message?.content) return first.message.content
    if (first.text) return first.text
  }

  return '[No response]'
}

const SETTINGS_KEY = 'reactConnection'

export function readConnectionSettings(settings: Record<string, unknown>): ConnectionSettings {
  const raw = settings[SETTINGS_KEY]
  const partial = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
  const provider = (partial.provider as ChatProvider) || 'minimax'
  return {
    provider: PROVIDER_CONFIG.some((p) => p.key === provider) ? provider : 'minimax',
    model: (partial.model as string) || getDefaultModel(provider),
    temperature: typeof partial.temperature === 'number' ? partial.temperature : 0.7,
    maxTokens: typeof partial.maxTokens === 'number' ? partial.maxTokens : 1024,
    stream: typeof partial.stream === 'boolean' ? partial.stream : true,
  }
}

export function writeConnectionSettings(
  settings: Record<string, unknown>,
  connection: ConnectionSettings,
): Record<string, unknown> {
  return {
    ...settings,
    [SETTINGS_KEY]: connection,
  }
}

export function extractStreamDelta(data: Record<string, unknown>): string {
  if (data.error && typeof data.error === 'object' && data.error !== null) {
    const message = (data.error as { message?: string }).message
    if (message) throw new Error(message)
  }

  if (data.error === true) {
    throw new Error('Generation failed')
  }

  const choices = (data as { choices?: Array<{ delta?: { content?: string; text?: string } }> }).choices
  if (Array.isArray(choices) && choices.length > 0) {
    return choices[0].delta?.content || choices[0].delta?.text || ''
  }

  return ''
}
