import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { SettingsBundleResponse } from '../../api/types'
import { apiPost, apiPostForm } from '../../api/client'
import { settingsKeys, useSettingsBundle } from '../settings/api'
import {
  useDeletePersonaAvatar,
  usePersonaBundle,
  useSavePersonaState,
  useUploadPersonaAvatar,
} from './api'

vi.mock('../../api/client', () => ({
  apiPost: vi.fn(),
  apiPostForm: vi.fn(),
}))

const mockedApiPost = vi.mocked(apiPost)
const mockedApiPostForm = vi.mocked(apiPostForm)

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('usePersonaBundle shares cache with useSettingsBundle', () => {
  let queryClient: QueryClient
  const fixture: SettingsBundleResponse = { settings: '{"personas":[]}' }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    mockedApiPost.mockReset()
    mockedApiPost.mockResolvedValue(fixture)
  })

  it('returns the same data object and shares the queryKey across both hooks', async () => {
    const persona = renderHook(() => usePersonaBundle(), {
      wrapper: createWrapper(queryClient),
    })
    const settings = renderHook(() => useSettingsBundle(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(persona.result.current.isSuccess).toBe(true)
      expect(settings.result.current.isSuccess).toBe(true)
    })

    const cachedQueries = queryClient.getQueryCache().findAll({ queryKey: settingsKeys.bundle })
    expect(cachedQueries).toHaveLength(1)
    expect(cachedQueries[0]?.queryKey).toEqual(settingsKeys.bundle)

    expect(mockedApiPost).toHaveBeenCalledTimes(1)
  })
})

describe('useSavePersonaState', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    mockedApiPost.mockReset()
    mockedApiPost.mockResolvedValue({ settings: '{}' })
  })

  it('writes the persona state into the bundle via writePersonaState and invalidates settingsKeys.bundle', async () => {
    queryClient.setQueryData(settingsKeys.bundle, { settings: '{}' })

    const { result } = renderHook(() => useSavePersonaState(), {
      wrapper: createWrapper(queryClient),
    })

    await result.current.mutateAsync({
      currentBundle: { settings: '{}' },
      state: { personas: [], defaultId: null },
    })

    expect(mockedApiPost).toHaveBeenCalledTimes(1)
    expect(mockedApiPost).toHaveBeenCalledWith('/api/settings/save', {
      reactPersonas: { personas: [], defaultId: null },
    })

    await waitFor(() => {
      expect(queryClient.getQueryState(settingsKeys.bundle)?.isInvalidated).toBe(true)
    })
  })
})

describe('useUploadPersonaAvatar', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    mockedApiPostForm.mockReset()
    mockedApiPostForm.mockResolvedValue({ path: 'persona1.png' })
  })

  it('posts FormData with the avatar field to /api/avatars/upload and invalidates settingsKeys.bundle', async () => {
    queryClient.setQueryData(settingsKeys.bundle, { settings: '{}' })

    const { result } = renderHook(() => useUploadPersonaAvatar(), {
      wrapper: createWrapper(queryClient),
    })

    const file = new File(['content'], 'avatar.png', { type: 'image/png' })
    const returned = await result.current.mutateAsync(file)

    expect(returned).toBe('persona1.png')
    expect(mockedApiPostForm).toHaveBeenCalledTimes(1)

    const [endpoint, formData] = mockedApiPostForm.mock.calls[0]!
    expect(endpoint).toBe('/api/avatars/upload')
    expect(formData).toBeInstanceOf(FormData)
    const appended = formData.get('avatar')
    expect(appended).toBeInstanceOf(File)
    expect((appended as File).name).toBe('avatar.png')

    await waitFor(() => {
      expect(queryClient.getQueryState(settingsKeys.bundle)?.isInvalidated).toBe(true)
    })
  })
})

describe('useDeletePersonaAvatar', () => {
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

  it('calls apiPost with /api/avatars/delete and invalidates settingsKeys.bundle', async () => {
    queryClient.setQueryData(settingsKeys.bundle, { settings: '{}' })

    const { result } = renderHook(() => useDeletePersonaAvatar(), {
      wrapper: createWrapper(queryClient),
    })

    await result.current.mutateAsync('persona1.png')

    expect(mockedApiPost).toHaveBeenCalledTimes(1)
    expect(mockedApiPost).toHaveBeenCalledWith('/api/avatars/delete', { avatar: 'persona1.png' })

    await waitFor(() => {
      expect(queryClient.getQueryState(settingsKeys.bundle)?.isInvalidated).toBe(true)
    })
  })
})