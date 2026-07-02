import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { SettingsBundleResponse } from '../../api/types'
import { apiPost } from '../../api/client'
import { settingsKeys, useSettingsBundle } from '../settings/api'
import { usePersonaBundle } from './api'

vi.mock('../../api/client', () => ({
  apiPost: vi.fn(),
}))

const mockedApiPost = vi.mocked(apiPost)

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

    expect(persona.result.current.data).toBe(settings.result.current.data)

    const cachedQueries = queryClient.getQueryCache().findAll({ queryKey: settingsKeys.bundle })
    expect(cachedQueries).toHaveLength(1)
    expect(cachedQueries[0]?.queryKey).toEqual(settingsKeys.bundle)

    expect(mockedApiPost).toHaveBeenCalledTimes(1)
  })
})
