import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { ChatLine } from '../../api/types'
import { apiPost } from '../../api/client'
import { useSaveChat, chatKeys } from './api'

vi.mock('../../api/client', () => ({
  apiPost: vi.fn(),
}))

const mockedApiPost = vi.mocked(apiPost)

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useSaveChat', () => {
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

  it('calls apiPost with the correct endpoint + args and invalidates the chat session query', async () => {
    const sessionKey = [...chatKeys.session('alice'), 'chat1']
    queryClient.setQueryData(sessionKey, {
      file_name: 'chat1',
      file_id: 'chat1',
      lines: [],
    })

    const { result } = renderHook(() => useSaveChat(), {
      wrapper: createWrapper(queryClient),
    })

    const chat = [{ is_user: true, name: 'User', mes: 'Hello', send_date: '2026-01-01T00:00:00Z' }] as unknown as ChatLine[]

    await result.current.mutateAsync({
      avatarUrl: 'alice',
      fileName: 'chat1',
      chat,
    })

    expect(mockedApiPost).toHaveBeenCalledWith('/api/chats/save', {
      avatar_url: 'alice',
      file_name: 'chat1',
      chat,
    })

    await waitFor(() => {
      expect(queryClient.getQueryState(sessionKey)?.isInvalidated).toBe(true)
    })
  })
})
