import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { QueryClient } from '@tanstack/react-query'
import { apiPost, apiPostForm } from '../../api/client'
import { createTestQueryClient } from '../../test/utils'
import { createWrapper } from '../../test/test-wrapper'
import {
  characterKeys,
  useAssociateWorld,
  useCreateCharacter,
  useUpdateCharacter,
} from './api'

vi.mock('../../api/client', () => ({
  apiPost: vi.fn(),
  apiPostForm: vi.fn(),
}))

const mockedApiPost = vi.mocked(apiPost)
const mockedApiPostForm = vi.mocked(apiPostForm)

describe('useCreateCharacter', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    mockedApiPostForm.mockReset()
    mockedApiPostForm.mockResolvedValue('alice')
  })

  it('posts FormData to /api/characters/create and invalidates characterKeys.all', async () => {
    queryClient.setQueryData(characterKeys.all, [])

    const { result } = renderHook(() => useCreateCharacter(), {
      wrapper: createWrapper(queryClient),
    })

    const formData = new FormData()
    formData.append('ch_name', 'Alice')
    formData.append('description', 'A test character')

    const returned = await result.current.mutateAsync(formData)

    expect(returned).toBe('alice')
    expect(mockedApiPostForm).toHaveBeenCalledTimes(1)
    expect(mockedApiPostForm).toHaveBeenCalledWith('/api/characters/create', formData)

    await waitFor(() => {
      expect(queryClient.getQueryState(characterKeys.all)?.isInvalidated).toBe(true)
    })
  })
})

describe('useUpdateCharacter', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    mockedApiPostForm.mockReset()
    mockedApiPostForm.mockResolvedValue({ ok: true })
  })

  it('posts FormData to /api/characters/edit and invalidates both characterKeys.detail(avatar) and characterKeys.all', async () => {
    const detailKey = characterKeys.detail('alice')
    queryClient.setQueryData(detailKey, { name: 'Alice', avatar: 'alice' })
    queryClient.setQueryData(characterKeys.all, [])

    const { result } = renderHook(() => useUpdateCharacter(), {
      wrapper: createWrapper(queryClient),
    })

    const formData = new FormData()
    formData.append('avatar_url', 'alice')
    formData.append('ch_name', 'Alice Updated')
    formData.append('description', 'Updated description')

    await result.current.mutateAsync(formData)

    expect(mockedApiPostForm).toHaveBeenCalledTimes(1)
    expect(mockedApiPostForm).toHaveBeenCalledWith('/api/characters/edit', formData)

    await waitFor(() => {
      expect(queryClient.getQueryState(detailKey)?.isInvalidated).toBe(true)
      expect(queryClient.getQueryState(characterKeys.all)?.isInvalidated).toBe(true)
    })
  })
})

describe('useAssociateWorld', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    mockedApiPost.mockReset()
    mockedApiPost.mockResolvedValue({ ok: true })
  })

  it('calls apiPost with /api/characters/world and invalidates characterKeys.detail(avatar)', async () => {
    const detailKey = characterKeys.detail('alice')
    queryClient.setQueryData(detailKey, { name: 'Alice', avatar: 'alice' })

    const { result } = renderHook(() => useAssociateWorld(), {
      wrapper: createWrapper(queryClient),
    })

    await result.current.mutateAsync({ avatar: 'alice', world: 'World1' })

    expect(mockedApiPost).toHaveBeenCalledTimes(1)
    expect(mockedApiPost).toHaveBeenCalledWith('/api/characters/world', {
      avatar_url: 'alice',
      world: 'World1',
    })

    await waitFor(() => {
      expect(queryClient.getQueryState(detailKey)?.isInvalidated).toBe(true)
    })
  })
})
