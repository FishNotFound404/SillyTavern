import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { ChatLine } from '../../api/types'
import { apiPost } from '../../api/client'
import {
  chatKeys,
  useDeleteChat,
  useExportChat,
  useRenameChat,
  useSaveChat,
} from './api'

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

describe('useRenameChat', () => {
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

  it('calls apiPost with /api/chats/rename and broadly invalidates chatKeys.all so chat lists refetch', async () => {
    const aliceKey = chatKeys.character('alice')
    const bobKey = chatKeys.character('bob')
    queryClient.setQueryData(aliceKey, [])
    queryClient.setQueryData(bobKey, [])

    const { result } = renderHook(() => useRenameChat(), {
      wrapper: createWrapper(queryClient),
    })

    await result.current.mutateAsync({
      avatarUrl: 'alice',
      originalFile: 'chat1.jsonl',
      renamedFile: 'chat2.jsonl',
    })

    expect(mockedApiPost).toHaveBeenCalledTimes(1)
    expect(mockedApiPost).toHaveBeenCalledWith('/api/chats/rename', {
      avatar_url: 'alice',
      original_file: 'chat1.jsonl',
      renamed_file: 'chat2.jsonl',
    })

    await waitFor(() => {
      expect(queryClient.getQueryState(aliceKey)?.isInvalidated).toBe(true)
      expect(queryClient.getQueryState(bobKey)?.isInvalidated).toBe(true)
    })
  })
})

describe('useDeleteChat', () => {
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

  it('calls apiPost with /api/chats/delete and broadly invalidates chatKeys.all so chat lists refetch', async () => {
    const aliceKey = chatKeys.character('alice')
    const bobKey = chatKeys.character('bob')
    queryClient.setQueryData(aliceKey, [])
    queryClient.setQueryData(bobKey, [])

    const { result } = renderHook(() => useDeleteChat(), {
      wrapper: createWrapper(queryClient),
    })

    await result.current.mutateAsync({
      avatarUrl: 'alice',
      chatfile: 'chat1.jsonl',
    })

    expect(mockedApiPost).toHaveBeenCalledTimes(1)
    expect(mockedApiPost).toHaveBeenCalledWith('/api/chats/delete', {
      avatar_url: 'alice',
      chatfile: 'chat1.jsonl',
    })

    await waitFor(() => {
      expect(queryClient.getQueryState(aliceKey)?.isInvalidated).toBe(true)
      expect(queryClient.getQueryState(bobKey)?.isInvalidated).toBe(true)
    })
  })
})

describe('useExportChat', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    mockedApiPost.mockReset()
    mockedApiPost.mockResolvedValue({ result: 'saved' })
  })

  it('calls apiPost with /api/chats/export and does not invalidate any chat query', async () => {
    const sessionKey = [...chatKeys.session('alice'), 'chat1']
    queryClient.setQueryData(sessionKey, {
      file_name: 'chat1',
      file_id: 'chat1',
      lines: [],
    })

    const { result } = renderHook(() => useExportChat(), {
      wrapper: createWrapper(queryClient),
    })

    await result.current.mutateAsync({
      avatarUrl: 'alice',
      file: 'chat1.jsonl',
      format: 'jsonl',
      exportfilename: 'exported.jsonl',
    })

    expect(mockedApiPost).toHaveBeenCalledTimes(1)
    expect(mockedApiPost).toHaveBeenCalledWith('/api/chats/export', {
      avatar_url: 'alice',
      file: 'chat1.jsonl',
      format: 'jsonl',
      exportfilename: 'exported.jsonl',
    })

    for (const q of queryClient.getQueryCache().getAll()) {
      expect(q.state.isInvalidated).toBe(false)
    }
  })
})


