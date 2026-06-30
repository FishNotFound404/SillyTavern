/**
 * @deprecated Temporary shim for cross-feature consumers (useChat, useGroupChat).
 * Delete this file once those hooks migrate to features/settings/ (Tasks 8/9).
 */
export type {
  ChatProvider,
  ConnectionSettings,
  MiniMaxEndpoint,
  ModelInfo,
} from '../features/settings/types'