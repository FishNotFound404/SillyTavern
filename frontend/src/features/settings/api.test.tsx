import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { QueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '../../api/client'
import { createTestQueryClient } from '../../test/utils'
import { createWrapper } from '../../test/test-wrapper'
import {
  PRESET_API_ID,
  settingsKeys,
  useBackendStatus,
  useDeletePreset,
  useDeleteSecret,
  useModels,
  usePresets,
  useSaveConnection,
  useSavePreset,
  useSecrets,
  useWriteSecret,
} from './api'
import { writeConnectionSettings } from './utils'
import type { ConnectionSettings, GenerationPreset } from './types'

vi.mock('../../api/client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedApiPost = vi.mocked(apiPost)

describe('useBackendStatus', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    mockedApiGet.mockReset()
  })

  it('returns the resolved backend status on success', async () => {
    mockedApiGet.mockResolvedValue({ online: true, version: '1.2.3' })

    const { result } = renderHook(() => useBackendStatus(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockedApiGet).toHaveBeenCalledTimes(1)
    expect(mockedApiGet).toHaveBeenCalledWith('/api/settings/status')
    expect(result.current.data).toEqual({ online: true, version: '1.2.3' })
  })

  it('falls back to { online: false } when apiGet rejects', async () => {
    mockedApiGet.mockRejectedValue(new Error('network down'))

    const { result } = renderHook(() => useBackendStatus(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual({ online: false })
  })
})

describe('useSecrets', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    mockedApiPost.mockReset()
    mockedApiPost.mockResolvedValue({})
  })

  it('calls apiPost with /api/secrets/read', async () => {
    const { result } = renderHook(() => useSecrets(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockedApiPost).toHaveBeenCalledTimes(1)
    expect(mockedApiPost).toHaveBeenCalledWith('/api/secrets/read', {})
  })
})

describe('usePresets', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    mockedApiPost.mockReset()
    mockedApiPost.mockResolvedValue({ names: [], presets: [] })
  })

  it('calls apiPost with /api/presets/list and PRESET_API_ID', async () => {
    const { result } = renderHook(() => usePresets(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockedApiPost).toHaveBeenCalledTimes(1)
    expect(mockedApiPost).toHaveBeenCalledWith('/api/presets/list', { apiId: PRESET_API_ID })
  })
})

describe('useSaveConnection', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    mockedApiPost.mockReset()
    mockedApiPost.mockResolvedValue({ ok: true })
  })

  it('merges connection into the bundle via writeConnectionSettings and invalidates settingsKeys.bundle', async () => {
    queryClient.setQueryData(settingsKeys.bundle, { settings: '{}' })

    const { result } = renderHook(() => useSaveConnection(), {
      wrapper: createWrapper(queryClient),
    })

    const currentBundle = { settings: '{}' }
    const connection: ConnectionSettings = {
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.5,
      maxTokens: 512,
      stream: false,
      minimaxEndpoint: 'cn',
    }

    await result.current.mutateAsync({ currentBundle, connection, merge: writeConnectionSettings })

    expect(mockedApiPost).toHaveBeenCalledTimes(1)
    expect(mockedApiPost).toHaveBeenCalledWith('/api/settings/save', {
      reactConnection: connection,
    })

    await waitFor(() => {
      expect(queryClient.getQueryState(settingsKeys.bundle)?.isInvalidated).toBe(true)
    })
  })
})

describe('useWriteSecret', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    mockedApiPost.mockReset()
    mockedApiPost.mockResolvedValue({ ok: true })
  })

  it('calls apiPost with /api/secrets/write and invalidates settingsKeys.secrets', async () => {
    queryClient.setQueryData(settingsKeys.secrets, {})

    const { result } = renderHook(() => useWriteSecret(), {
      wrapper: createWrapper(queryClient),
    })

    await result.current.mutateAsync({ key: 'openai', value: 'sk-123' })

    expect(mockedApiPost).toHaveBeenCalledTimes(1)
    expect(mockedApiPost).toHaveBeenCalledWith('/api/secrets/write', {
      key: 'openai',
      value: 'sk-123',
      label: 'React UI',
    })

    await waitFor(() => {
      expect(queryClient.getQueryState(settingsKeys.secrets)?.isInvalidated).toBe(true)
    })
  })
})

describe('useDeleteSecret', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    mockedApiPost.mockReset()
    mockedApiPost.mockResolvedValue({ ok: true })
  })

  it('calls apiPost with /api/secrets/delete and invalidates settingsKeys.secrets', async () => {
    queryClient.setQueryData(settingsKeys.secrets, {})

    const { result } = renderHook(() => useDeleteSecret(), {
      wrapper: createWrapper(queryClient),
    })

    await result.current.mutateAsync({ key: 'openai', id: 'sec-1' })

    expect(mockedApiPost).toHaveBeenCalledTimes(1)
    expect(mockedApiPost).toHaveBeenCalledWith('/api/secrets/delete', {
      key: 'openai',
      id: 'sec-1',
    })

    await waitFor(() => {
      expect(queryClient.getQueryState(settingsKeys.secrets)?.isInvalidated).toBe(true)
    })
  })
})

describe('useSavePreset', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    mockedApiPost.mockReset()
    mockedApiPost.mockResolvedValue({ name: 'preset-1' })
  })

  it('calls apiPost with /api/presets/save, embeds name inside preset, and invalidates settingsKeys.presets on settle', async () => {
    queryClient.setQueryData(settingsKeys.presets, { names: [], presets: [] })

    const { result } = renderHook(() => useSavePreset(), {
      wrapper: createWrapper(queryClient),
    })

    const preset: Omit<GenerationPreset, 'name'> = {
      provider: 'openai',
      model: 'gpt-4o',
    }

    const returned = await result.current.mutateAsync({ name: 'preset-1', preset })

    expect(returned).toBe('preset-1')
    expect(mockedApiPost).toHaveBeenCalledTimes(1)
    expect(mockedApiPost).toHaveBeenCalledWith('/api/presets/save', {
      apiId: PRESET_API_ID,
      name: 'preset-1',
      preset: { provider: 'openai', model: 'gpt-4o', name: 'preset-1' },
    })

    await waitFor(() => {
      expect(queryClient.getQueryState(settingsKeys.presets)?.isInvalidated).toBe(true)
    })
  })
})

describe('useDeletePreset', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    mockedApiPost.mockReset()
    mockedApiPost.mockResolvedValue({ ok: true })
  })

  it('calls apiPost with /api/presets/delete and invalidates settingsKeys.presets', async () => {
    queryClient.setQueryData(settingsKeys.presets, { names: [], presets: [] })

    const { result } = renderHook(() => useDeletePreset(), {
      wrapper: createWrapper(queryClient),
    })

    await result.current.mutateAsync('preset-1')

    expect(mockedApiPost).toHaveBeenCalledTimes(1)
    expect(mockedApiPost).toHaveBeenCalledWith('/api/presets/delete', {
      apiId: PRESET_API_ID,
      name: 'preset-1',
    })

    await waitFor(() => {
      expect(queryClient.getQueryState(settingsKeys.presets)?.isInvalidated).toBe(true)
    })
  })
})

describe('useModels', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    mockedApiPost.mockReset()
  })

  it('disables the query when provider is undefined (queryFn should not be called)', () => {
    const { result } = renderHook(() => useModels(undefined), {
      wrapper: createWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(mockedApiPost).not.toHaveBeenCalled()
  })

  it('enables the query and calls apiPost with the chat-completions status endpoint for openai', async () => {
    mockedApiPost.mockResolvedValue({ data: [{ id: 'gpt-4o', name: 'GPT-4o' }] })

    const { result } = renderHook(() => useModels('openai'), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockedApiPost).toHaveBeenCalledTimes(1)
    expect(mockedApiPost).toHaveBeenCalledWith('/api/backends/chat-completions/status', {
      chat_completion_source: 'openai',
    })
    expect(result.current.data).toEqual([{ id: 'gpt-4o', name: 'GPT-4o' }])
  })
})

