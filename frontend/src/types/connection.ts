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
