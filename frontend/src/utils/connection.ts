/**
 * @deprecated Temporary shim for cross-feature consumers (useChat, useGroupChat).
 * Delete this file once those hooks migrate to features/settings/ (Tasks 8/9).
 */
export {
  buildGenerationRequest,
  CLAUDE_MODELS,
  DEFAULT_CONNECTION,
  extractStreamDelta,
  fetchModels,
  getDefaultModel,
  getProviderConfig,
  parseGenerationResponse,
  PROVIDER_CONFIG,
  readConnectionSettings,
  writeConnectionSettings,
  type ApiMessage,
  type GenerationOptions,
  type GenerationRequest,
  type ProviderConfig,
} from '../features/settings/utils'