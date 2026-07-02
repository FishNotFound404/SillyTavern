import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { QueryClient } from '@tanstack/react-query'
import { apiPost } from '../../api/client'
import { createTestQueryClient } from '../../test/utils'
import { createWrapper } from '../../test/test-wrapper'
import {
  groupKeys,
  useCreateGroup,
  useDeleteGroup,
  useGroupMembers,
  useUpdateGroup,
} from './api'
import type { Group } from './types'

vi.mock('../../api/client', () => ({
  apiPost: vi.fn(),
}))

const mockedApiPost = vi.mocked(apiPost)

function createAliceCharacter() {
  return {
    name: 'Alice',
    description: 'A test character',
    personality: '',
    scenario: '',
    first_mes: '',
    mes_example: '',
    creator_notes: '',
    system_prompt: '',
    post_history_instructions: '',
    tags: [],
    creator: '',
    avatar: 'alice',
    chat_size: 0,
    chat: '',
    create_date: '',
    date_last_chat: 0,
    data: {},
  }
}

function createGroupFixture(overrides: Partial<Group> = {}): Group {
  return {
    id: 'grp-1',
    name: 'Test Group',
    members: ['alice', 'bob'],
    allow_self_responses: false,
    activation_strategy: 0,
    generation_mode: 0,
    disabled_members: [],
    chat_id: 'chat-1',
    chats: ['chat-1'],
    auto_mode_delay: 0,
    generation_mode_join_prefix: '',
    generation_mode_join_suffix: '',
    ...overrides,
  }
}

describe('useGroupMembers', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    mockedApiPost.mockReset()
  })

  it('disables the query when avatars is an empty array (queryFn should not be called)', () => {
    const { result } = renderHook(() => useGroupMembers([]), {
      wrapper: createWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(mockedApiPost).not.toHaveBeenCalled()
  })

  it('disables the query when avatars is undefined', () => {
    const { result } = renderHook(() => useGroupMembers(undefined), {
      wrapper: createWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(mockedApiPost).not.toHaveBeenCalled()
  })

  it('enables the query and calls the queryFn for each avatar when avatars is non-empty', async () => {
    mockedApiPost.mockResolvedValue(createAliceCharacter())

    const { result } = renderHook(() => useGroupMembers(['alice', 'bob']), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockedApiPost).toHaveBeenCalledTimes(2)
    expect(mockedApiPost).toHaveBeenCalledWith('/api/characters/get', { avatar_url: 'alice' })
    expect(mockedApiPost).toHaveBeenCalledWith('/api/characters/get', { avatar_url: 'bob' })
  })
})

describe('useCreateGroup', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    mockedApiPost.mockReset()
    mockedApiPost.mockResolvedValue(createGroupFixture())
  })

  it('calls apiPost with /api/groups/create and invalidates groupKeys.all', async () => {
    queryClient.setQueryData(groupKeys.all, [])

    const { result } = renderHook(() => useCreateGroup(), {
      wrapper: createWrapper(queryClient),
    })

    const data: Partial<Group> = {
      name: 'New Group',
      members: ['alice'],
      allow_self_responses: false,
    }

    await result.current.mutateAsync(data)

    expect(mockedApiPost).toHaveBeenCalledTimes(1)
    expect(mockedApiPost).toHaveBeenCalledWith('/api/groups/create', data)

    await waitFor(() => {
      expect(queryClient.getQueryState(groupKeys.all)?.isInvalidated).toBe(true)
    })
  })
})

describe('useUpdateGroup', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    mockedApiPost.mockReset()
    mockedApiPost.mockResolvedValue({ ok: true })
  })

  it('calls apiPost with /api/groups/edit and invalidates both the group detail and the group list', async () => {
    const detailKey = groupKeys.detail('grp-1')
    queryClient.setQueryData(detailKey, createGroupFixture())
    queryClient.setQueryData(groupKeys.all, [])

    const { result } = renderHook(() => useUpdateGroup(), {
      wrapper: createWrapper(queryClient),
    })

    const group = createGroupFixture({ name: 'Renamed Group' })
    await result.current.mutateAsync(group)

    expect(mockedApiPost).toHaveBeenCalledTimes(1)
    expect(mockedApiPost).toHaveBeenCalledWith('/api/groups/edit', group)

    await waitFor(() => {
      expect(queryClient.getQueryState(detailKey)?.isInvalidated).toBe(true)
      expect(queryClient.getQueryState(groupKeys.all)?.isInvalidated).toBe(true)
    })
  })
})

describe('useDeleteGroup', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    mockedApiPost.mockReset()
    mockedApiPost.mockResolvedValue({ ok: true })
  })

  it('calls apiPost with /api/groups/delete and invalidates groupKeys.all', async () => {
    queryClient.setQueryData(groupKeys.all, [])

    const { result } = renderHook(() => useDeleteGroup(), {
      wrapper: createWrapper(queryClient),
    })

    await result.current.mutateAsync('grp-1')

    expect(mockedApiPost).toHaveBeenCalledTimes(1)
    expect(mockedApiPost).toHaveBeenCalledWith('/api/groups/delete', { id: 'grp-1' })

    await waitFor(() => {
      expect(queryClient.getQueryState(groupKeys.all)?.isInvalidated).toBe(true)
    })
  })
})
