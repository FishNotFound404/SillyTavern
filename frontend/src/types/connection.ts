export type ChatProvider =
  | 'openai'
  | 'claude'
  | 'makersuite'
  | 'openrouter'
  | 'deepseek'
  | 'minimax'

export interface ConnectionSettings {
  provider: ChatProvider
  model: string
  temperature: number
  maxTokens: number
}
