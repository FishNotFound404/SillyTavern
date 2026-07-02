import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Character } from '../../characters/types'

vi.mock('../../characters/api', () => ({
  useCharacters: vi.fn(),
}))

vi.mock('../api', () => ({
  useCreateGroup: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: vi.fn() }
})

import { useCharacters } from '../../characters/api'
import { useCreateGroup } from '../api'
import { useNavigate } from 'react-router-dom'
import GroupEdit from './GroupEdit'

const mockUseCharacters = vi.mocked(useCharacters)
const mockUseCreateGroup = vi.mocked(useCreateGroup)
const mockUseNavigate = vi.mocked(useNavigate)

function makeCharacter(name: string, avatar: string): Character {
  return { name, avatar, chat_size: 0 }
}

function mockCharactersLoading() {
  mockUseCharacters.mockReturnValue({
    isLoading: true,
    isError: false,
    isFetching: true,
    data: undefined,
    error: null,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useCharacters>)
}

function mockCharactersData(characters: Character[]) {
  mockUseCharacters.mockReturnValue({
    isLoading: false,
    isError: false,
    isFetching: false,
    data: characters,
    error: null,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useCharacters>)
}

function mockCreateGroupDefault() {
  mockUseCreateGroup.mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  } as unknown as ReturnType<typeof useCreateGroup>)
}

function mockCreateGroupPending() {
  mockUseCreateGroup.mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: true,
    isError: false,
    error: null,
  } as unknown as ReturnType<typeof useCreateGroup>)
}

function mockCreateGroupError(message: string) {
  mockUseCreateGroup.mockReturnValue({
    mutateAsync: vi.fn().mockRejectedValue(new Error(message)),
    isPending: false,
    isError: false,
    error: null,
  } as unknown as ReturnType<typeof useCreateGroup>)
}

describe('GroupEdit page', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    vi.clearAllMocks()
    user = userEvent.setup()
    mockUseNavigate.mockReturnValue(vi.fn())
  })

  function renderPage() {
    return render(<GroupEdit />)
  }

  it('shows loading state', () => {
    mockCharactersLoading()
    renderPage()
    expect(screen.getByText('Loading characters...')).toBeInTheDocument()
  })

  it('shows error state with retry button', async () => {
    const refetchFn = vi.fn()
    mockUseCharacters.mockReturnValue({
      isLoading: false,
      isError: true,
      isFetching: false,
      data: undefined,
      error: { message: 'Network error' },
      refetch: refetchFn,
    } as unknown as ReturnType<typeof useCharacters>)

    renderPage()

    expect(screen.getByText('Failed to load characters')).toBeInTheDocument()
    expect(screen.getByText('Network error')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(refetchFn).toHaveBeenCalledOnce()
  })

  it('shows empty characters state', () => {
    mockCharactersData([])
    mockCreateGroupDefault()
    renderPage()
    expect(screen.getByText('No characters')).toBeInTheDocument()
    expect(
      screen.getByText('Create or import a character before making a group.'),
    ).toBeInTheDocument()
  })

  it('renders form with characters', () => {
    mockCharactersData([
      makeCharacter('Alice', 'alice.png'),
      makeCharacter('Bob', 'bob.png'),
      makeCharacter('Charlie', 'charlie.png'),
    ])
    mockCreateGroupDefault()
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Create Group' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Group Name')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
    expect(
      screen.getByText('Allow the same character to reply twice in a row'),
    ).toBeInTheDocument()

    const submitBtn = screen.getByRole('button', { name: 'Create Group' })
    expect(submitBtn).toBeInTheDocument()
    expect(submitBtn).toBeDisabled()
  })

  it('toggles member selection', async () => {
    mockCharactersData([
      makeCharacter('Alice', 'alice.png'),
      makeCharacter('Bob', 'bob.png'),
    ])
    mockCreateGroupDefault()
    renderPage()

    await user.type(screen.getByLabelText('Group Name'), 'Test Group')
    const submitBtn = screen.getByRole('button', { name: 'Create Group' })

    expect(submitBtn).toBeDisabled()

    const aliceBtn = screen.getByText('Alice').closest('button')!
    const bobBtn = screen.getByText('Bob').closest('button')!

    await user.click(aliceBtn)
    expect(submitBtn).toBeEnabled()

    await user.click(bobBtn)
    expect(submitBtn).toBeEnabled()

    await user.click(aliceBtn)
    expect(submitBtn).toBeEnabled()

    await user.click(bobBtn)
    expect(submitBtn).toBeDisabled()
  })

  it('disables submit when name is empty but member selected', async () => {
    mockCharactersData([makeCharacter('Alice', 'alice.png')])
    mockCreateGroupDefault()
    renderPage()

    await user.click(screen.getByText('Alice').closest('button')!)
    const submitBtn = screen.getByRole('button', { name: 'Create Group' })
    expect(submitBtn).toBeDisabled()
  })

  it('disables submit when name is filled but no members selected', async () => {
    mockCharactersData([makeCharacter('Alice', 'alice.png')])
    mockCreateGroupDefault()
    renderPage()

    await user.type(screen.getByLabelText('Group Name'), 'My Group')
    const submitBtn = screen.getByRole('button', { name: 'Create Group' })
    expect(submitBtn).toBeDisabled()
  })

  it('creates group and navigates on success', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'group-123' })
    mockCharactersData([
      makeCharacter('Alice', 'alice.png'),
      makeCharacter('Bob', 'bob.png'),
    ])
    mockUseCreateGroup.mockReturnValue({
      mutateAsync,
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useCreateGroup>)

    const navigateFn = vi.fn()
    mockUseNavigate.mockReturnValue(navigateFn)

    renderPage()

    await user.type(screen.getByLabelText('Group Name'), 'Test Group')
    await user.click(screen.getByText('Alice').closest('button')!)
    await user.click(screen.getByText('Bob').closest('button')!)
    await user.click(screen.getByRole('button', { name: 'Create Group' }))

    expect(mutateAsync).toHaveBeenCalledWith({
      name: 'Test Group',
      members: ['alice.png', 'bob.png'],
      allow_self_responses: false,
    })
    expect(navigateFn).toHaveBeenCalledWith('/chat?group=group-123')
  })

  it('creates group with allow_self_responses enabled', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'group-456' })
    mockCharactersData([makeCharacter('Alice', 'alice.png')])
    mockUseCreateGroup.mockReturnValue({
      mutateAsync,
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useCreateGroup>)

    const navigateFn = vi.fn()
    mockUseNavigate.mockReturnValue(navigateFn)

    renderPage()

    await user.type(screen.getByLabelText('Group Name'), 'Solo Group')
    await user.click(screen.getByText('Alice').closest('button')!)
    await user.click(
      screen.getByLabelText('Allow the same character to reply twice in a row'),
    )
    await user.click(screen.getByRole('button', { name: 'Create Group' }))

    expect(mutateAsync).toHaveBeenCalledWith({
      name: 'Solo Group',
      members: ['alice.png'],
      allow_self_responses: true,
    })
    expect(navigateFn).toHaveBeenCalledWith('/chat?group=group-456')
  })

  it('shows error banner on group creation failure', async () => {
    mockCharactersData([makeCharacter('Alice', 'alice.png')])
    mockCreateGroupError('Failed to create group')
    renderPage()

    await user.type(screen.getByLabelText('Group Name'), 'Error Group')
    await user.click(screen.getByText('Alice').closest('button')!)
    await user.click(screen.getByRole('button', { name: 'Create Group' }))

    expect(
      await screen.findByText('Failed to create group'),
    ).toBeInTheDocument()
  })

  it('navigates to /groups when cancel is clicked', async () => {
    mockCharactersData([makeCharacter('Alice', 'alice.png')])
    mockCreateGroupDefault()

    const navigateFn = vi.fn()
    mockUseNavigate.mockReturnValue(navigateFn)

    renderPage()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(navigateFn).toHaveBeenCalledWith('/groups')
  })

  it('disables buttons and shows creating text during pending mutation', () => {
    mockCharactersData([makeCharacter('Alice', 'alice.png')])
    mockCreateGroupPending()
    renderPage()

    const submitBtn = screen.getByRole('button', { name: 'Creating...' })
    expect(submitBtn).toBeDisabled()

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' })
    expect(cancelBtn).toBeDisabled()
  })
})
