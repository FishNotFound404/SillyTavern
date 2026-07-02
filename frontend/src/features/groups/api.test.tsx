import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { apiPost } from '../../api/client'
import { useGroupMembers } from './api'

vi.mock('../../api/client', () => ({
  apiPost: vi.fn(),
}))

const mockedApiPost = vi.mocked(apiPost)

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

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

describe('useGroupMembers', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
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
