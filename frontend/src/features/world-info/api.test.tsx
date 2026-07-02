import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { QueryClient } from '@tanstack/react-query'
import { apiPost } from '../../api/client'
import { createTestQueryClient } from '../../test/utils'
import { createWrapper } from '../../test/test-wrapper'
import {
  useCreateWorldInfo,
  useDeleteWorldInfo,
  useSaveWorldInfo,
  useWorldInfo,
  useWorldInfos,
  worldInfoKeys,
} from './api'
import type { WorldInfoFile } from './types'

vi.mock('../../api/client', () => ({
  apiPost: vi.fn(),
}))

const mockedApiPost = vi.mocked(apiPost)

describe('useWorldInfos', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    mockedApiPost.mockReset()
    mockedApiPost.mockResolvedValue([])
  })

  it('calls apiPost with /api/worldinfo/list and an empty body', async () => {
    const { result } = renderHook(() => useWorldInfos(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockedApiPost).toHaveBeenCalledTimes(1)
    expect(mockedApiPost).toHaveBeenCalledWith('/api/worldinfo/list', {})
  })
})

describe('useWorldInfo', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    mockedApiPost.mockReset()
  })

  it('disables the query when name is undefined (queryFn should not be called)', () => {
    const { result } = renderHook(() => useWorldInfo(undefined), {
      wrapper: createWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(mockedApiPost).not.toHaveBeenCalled()
  })

  it('enables the query and calls apiPost with /api/worldinfo/get and the given name', async () => {
    const file: WorldInfoFile = { name: 'World1', entries: {} }
    mockedApiPost.mockResolvedValue(file)

    const { result } = renderHook(() => useWorldInfo('World1'), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockedApiPost).toHaveBeenCalledTimes(1)
    expect(mockedApiPost).toHaveBeenCalledWith('/api/worldinfo/get', { name: 'World1' })
    expect(result.current.data).toEqual(file)
  })
})

describe('useSaveWorldInfo', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    mockedApiPost.mockReset()
    mockedApiPost.mockResolvedValue({ ok: true })
  })

  it('calls apiPost with /api/worldinfo/edit and invalidates both worldInfoKeys.detail(name) and worldInfoKeys.all', async () => {
    const detailKey = worldInfoKeys.detail('World1')
    queryClient.setQueryData(detailKey, { name: 'World1', entries: {} })
    queryClient.setQueryData(worldInfoKeys.all, [])

    const { result } = renderHook(() => useSaveWorldInfo(), {
      wrapper: createWrapper(queryClient),
    })

    const data: WorldInfoFile = { name: 'World1', entries: {} }

    await result.current.mutateAsync({ name: 'World1', data })

    expect(mockedApiPost).toHaveBeenCalledTimes(1)
    expect(mockedApiPost).toHaveBeenCalledWith('/api/worldinfo/edit', {
      name: 'World1',
      data,
    })

    await waitFor(() => {
      expect(queryClient.getQueryState(detailKey)?.isInvalidated).toBe(true)
      expect(queryClient.getQueryState(worldInfoKeys.all)?.isInvalidated).toBe(true)
    })
  })
})

describe('useCreateWorldInfo', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    mockedApiPost.mockReset()
    mockedApiPost.mockResolvedValue({ ok: true })
  })

  it('calls apiPost with /api/worldinfo/edit and an empty entries object, invalidating worldInfoKeys.all', async () => {
    queryClient.setQueryData(worldInfoKeys.all, [])

    const { result } = renderHook(() => useCreateWorldInfo(), {
      wrapper: createWrapper(queryClient),
    })

    await result.current.mutateAsync('World1')

    expect(mockedApiPost).toHaveBeenCalledTimes(1)
    expect(mockedApiPost).toHaveBeenCalledWith('/api/worldinfo/edit', {
      name: 'World1',
      data: { name: 'World1', entries: {} },
    })

    await waitFor(() => {
      expect(queryClient.getQueryState(worldInfoKeys.all)?.isInvalidated).toBe(true)
    })
  })
})

describe('useDeleteWorldInfo', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    mockedApiPost.mockReset()
    mockedApiPost.mockResolvedValue({ ok: true })
  })

  it('calls apiPost with /api/worldinfo/delete and invalidates worldInfoKeys.all', async () => {
    queryClient.setQueryData(worldInfoKeys.all, [])

    const { result } = renderHook(() => useDeleteWorldInfo(), {
      wrapper: createWrapper(queryClient),
    })

    await result.current.mutateAsync('World1')

    expect(mockedApiPost).toHaveBeenCalledTimes(1)
    expect(mockedApiPost).toHaveBeenCalledWith('/api/worldinfo/delete', { name: 'World1' })

    await waitFor(() => {
      expect(queryClient.getQueryState(worldInfoKeys.all)?.isInvalidated).toBe(true)
    })
  })
})
