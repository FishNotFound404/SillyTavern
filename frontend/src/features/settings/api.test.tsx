import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { apiGet, apiPost } from '../../api/client'
import {
  PRESET_API_ID,
  settingsKeys,
  useBackendStatus,
  useDeleteSecret,
  usePresets,
  useSaveConnection,
  useSecrets,
  useWriteSecret,
} from './api'
import { writeConnectionSettings } from './utils'
import type { ConnectionSettings } from './types'

vi.mock('../../api/client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedApiPost = vi.mocked(apiPost)

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useBackendStatus', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
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
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
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
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
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
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
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
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
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
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
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