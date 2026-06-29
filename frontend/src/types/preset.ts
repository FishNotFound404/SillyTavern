import type { ChatProvider } from './connection'

export interface GenerationPreset {
  name: string
  provider: ChatProvider
  model: string
  minimaxEndpoint?: string
}
