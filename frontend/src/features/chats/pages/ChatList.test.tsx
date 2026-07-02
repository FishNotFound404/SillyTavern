import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatList from './ChatList'

const mockNavigate = vi.fn()

vi.mock('../../characters/api', () => ({
  useCharacters: vi.fn(),
  useAllCharacterChats: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import { useAllCharacterChats, useCharacters } from '../../characters/api'

const mockUseCharacters = vi.mocked(useCharacters)
const mockUseAllCharacterChats = vi.mocked(useAllCharacterChats)

function makeCharacter(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Alice',
    avatar: 'alice.png',
    chat_size: 0,
    ...overrides,
  }
}

function makeChatFile(overrides: Record<string, unknown> = {}) {
  return {
    file_id: 'chat1',
    file_name: '2026-01-15@14h30m22s500ms.jsonl',
    ...overrides,
  }
}

function setupCharactersQuery(overrides: Record<string, unknown> = {}) {
  mockUseCharacters.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    isSuccess: true,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useCharacters>)
}

function setupChatsQuery(overrides: Record<string, unknown> = {}) {
  mockUseAllCharacterChats.mockReturnValue({
    data: {},
    isLoading: false,
    isError: false,
    isSuccess: true,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useAllCharacterChats>)
}

describe('ChatList', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    vi.clearAllMocks()
    user = userEvent.setup()
  })

  it('shows loading state', () => {
    setupCharactersQuery({ isLoading: true })
    setupChatsQuery({ isLoading: true })

    render(<ChatList />)

    expect(screen.getByText('Loading chats...')).toBeInTheDocument()
  })

  it('shows error state with retry', async () => {
    const refetch = vi.fn()
    const error = new Error('Network error')
    setupCharactersQuery({
      isError: true,
      error,
      refetch,
    })
    setupChatsQuery({})

    render(<ChatList />)

    expect(screen.getByText(/Couldn.t load chats/)).toBeInTheDocument()
    expect(screen.getByText('Network error')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Try Again' }))
    expect(refetch).toHaveBeenCalled()
  })

  it('shows empty state when no characters exist', () => {
    setupCharactersQuery({ data: [] })
    setupChatsQuery({ data: {} })

    render(<ChatList />)

    expect(screen.getByText('No chats yet')).toBeInTheDocument()
    expect(
      screen.getByText('Start a conversation from the Characters page.'),
    ).toBeInTheDocument()
  })

  it('shows empty state when characters exist but have no chats', () => {
    setupCharactersQuery({
      data: [makeCharacter({ name: 'Alice' }), makeCharacter({ name: 'Bob', avatar: 'bob.png' })],
    })
    setupChatsQuery({ data: {} })

    render(<ChatList />)

    expect(screen.getByText('No chats yet')).toBeInTheDocument()
  })

  it('renders chat list items with character names, dates, and avatars', () => {
    setupCharactersQuery({
      data: [
        makeCharacter({ name: 'Alice', avatar: 'alice.png' }),
        makeCharacter({ name: 'Bob', avatar: 'bob.png' }),
      ],
    })
    setupChatsQuery({
      data: {
        'alice.png': [makeChatFile({ file_id: 'alice-chat1', file_name: '2026-01-15@14h30m22s500ms.jsonl' })],
        'bob.png': [makeChatFile({ file_id: 'bob-chat1', file_name: '2026-01-20@10h15m30s200ms.jsonl' })],
      },
    })

    render(<ChatList />)

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()

    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2)
    const srcs = images.map((img) => img.getAttribute('src'))
    expect(srcs).toContain('/characters/alice.png')
    expect(srcs).toContain('/characters/bob.png')

    expect(screen.getAllByText('Chat session')).toHaveLength(2)
  })

  it('sorts chat list by timestamp newest first', () => {
    setupCharactersQuery({
      data: [makeCharacter({ name: 'Alice', avatar: 'alice.png' })],
    })
    setupChatsQuery({
      data: {
        'alice.png': [
          makeChatFile({ file_id: 'old', file_name: '2026-01-01@10h00m00s000ms.jsonl' }),
          makeChatFile({ file_id: 'new', file_name: '2026-01-20@10h00m00s000ms.jsonl' }),
          makeChatFile({ file_id: 'mid', file_name: '2026-01-10@10h00m00s000ms.jsonl' }),
        ],
      },
    })

    render(<ChatList />)

    const chatItems = screen.getAllByText('Chat session')
    expect(chatItems).toHaveLength(3)

    const dateSpans = chatItems.map(
      (el) => el.closest('[class*="flex items-center"]')!.querySelector('span')!,
    )
    const dateTexts = dateSpans.map((s) => s.textContent)

    expect(dateTexts[0]).not.toBeNull()
    expect(dateTexts[1]).not.toBeNull()
    expect(dateTexts[2]).not.toBeNull()

    const formatTestDate = (fileName: string) => {
      const match = fileName.match(/(\d{4})-(\d{2})-(\d{2})@(\d{2})h(\d{2})m(\d{2})s(\d+)ms/)
      if (!match) return ''
      const [, year, month, day, hour, minute] = match
      const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`)
      return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    expect(dateTexts).toEqual([
      formatTestDate('2026-01-20@10h00m00s000ms.jsonl'),
      formatTestDate('2026-01-10@10h00m00s000ms.jsonl'),
      formatTestDate('2026-01-01@10h00m00s000ms.jsonl'),
    ])
  })

  it('navigates to chat view on chat item click', async () => {
    setupCharactersQuery({
      data: [makeCharacter({ name: 'Alice', avatar: 'alice.png' })],
    })
    setupChatsQuery({
      data: {
        'alice.png': [makeChatFile({ file_id: 'chat1', file_name: '2026-01-15@14h30m22s500ms.jsonl' })],
      },
    })

    render(<ChatList />)

    const chatItem = screen.getByText('Alice').closest('[class*="cursor-pointer"]')
    expect(chatItem).not.toBeNull()
    await user.click(chatItem!)

    expect(mockNavigate).toHaveBeenCalledWith('/chat?avatar=alice.png&chat=chat1')
  })

  it('navigates to home on New Chat button click', async () => {
    setupCharactersQuery({
      data: [makeCharacter({ name: 'Alice', avatar: 'alice.png' })],
    })
    setupChatsQuery({
      data: {
        'alice.png': [makeChatFile({ file_id: 'chat1', file_name: '2026-01-15@14h30m22s500ms.jsonl' })],
      },
    })

    render(<ChatList />)

    await user.click(screen.getByRole('button', { name: 'New Chat' }))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
