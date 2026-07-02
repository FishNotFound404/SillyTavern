import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WorldInfo from './WorldInfo'
import { useCreateWorldInfo, useDeleteWorldInfo, useWorldInfos } from '../api'

const mockNavigate = vi.fn()

vi.mock('../api', () => ({
  useWorldInfos: vi.fn(),
  useCreateWorldInfo: vi.fn(),
  useDeleteWorldInfo: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockUseWorldInfos = vi.mocked(useWorldInfos)
const mockUseCreateWorldInfo = vi.mocked(useCreateWorldInfo)
const mockUseDeleteWorldInfo = vi.mocked(useDeleteWorldInfo)

function defaultWorldInfos() {
  return {
    data: [{ file_id: 'test.json', name: 'Test' }],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  } as any
}

function defaultCreateMutation(overrides: Record<string, unknown> = {}) {
  return {
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
    error: null,
    ...overrides,
  } as any
}

function defaultDeleteMutation(overrides: Record<string, unknown> = {}) {
  return {
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    error: null,
    ...overrides,
  } as any
}

describe('WorldInfo page', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    vi.clearAllMocks()
    user = userEvent.setup()
    if (typeof window.prompt !== 'function') {
      Object.defineProperty(window, 'prompt', {
        value: vi.fn(),
        writable: true,
        configurable: true,
      })
    }
    if (typeof window.confirm !== 'function') {
      Object.defineProperty(window, 'confirm', {
        value: vi.fn(),
        writable: true,
        configurable: true,
      })
    }
    mockUseWorldInfos.mockReturnValue(defaultWorldInfos())
    mockUseCreateWorldInfo.mockReturnValue(defaultCreateMutation())
    mockUseDeleteWorldInfo.mockReturnValue(defaultDeleteMutation())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function renderPage() {
    return render(<WorldInfo />)
  }

  it('shows loading state', () => {
    mockUseWorldInfos.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any)

    renderPage()
    expect(screen.getByText('Loading world info...')).toBeInTheDocument()
  })

  it('shows query error state', () => {
    mockUseWorldInfos.mockReturnValue({
      data: [],
      isLoading: false,
      error: { message: 'Network error' } as any,
      refetch: vi.fn(),
    } as any)

    renderPage()
    expect(screen.getByText(/Couldn.t load world info/)).toBeInTheDocument()
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('shows delete mutation error state', () => {
    mockUseDeleteWorldInfo.mockReturnValue(
      defaultDeleteMutation({ error: { message: 'Failed to delete' } as any }),
    )

    renderPage()
    expect(screen.getByText(/Couldn.t load world info/)).toBeInTheDocument()
    expect(screen.getByText('Failed to delete')).toBeInTheDocument()
  })

  it('shows empty state when no worlds exist', () => {
    mockUseWorldInfos.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    renderPage()
    expect(screen.getByText('No world info yet')).toBeInTheDocument()
    expect(
      screen.getByText(/World Info \(also called Lorebooks\) lets you inject text/),
    ).toBeInTheDocument()
  })

  it('renders world info list', () => {
    mockUseWorldInfos.mockReturnValue({
      data: [
        { file_id: 'world1.json', name: 'My World' },
        { file_id: 'world2.json', name: '' },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    renderPage()
    expect(screen.getByText('My World')).toBeInTheDocument()
    expect(screen.getAllByText('world2.json')).toHaveLength(2)
    expect(screen.getByText('world1.json')).toBeInTheDocument()
  })

  it('navigates when clicking a world info item', async () => {
    mockUseWorldInfos.mockReturnValue({
      data: [{ file_id: 'test.json', name: 'Test' }],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    renderPage()
    await user.click(screen.getByText('Test'))
    expect(mockNavigate).toHaveBeenCalledWith('/world-info/test.json')
  })

  it('creates a new world info successfully', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('New World')

    renderPage()
    await user.click(screen.getByRole('button', { name: /new world info/i }))

    const createMutation = mockUseCreateWorldInfo.mock.results[0]?.value
    expect(createMutation.mutateAsync).toHaveBeenCalledWith('New World')
    expect(mockNavigate).toHaveBeenCalledWith('/world-info/New%20World')
  })

  it('does not create when prompt is cancelled', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue(null)

    renderPage()
    await user.click(screen.getByRole('button', { name: /new world info/i }))

    const createMutation = mockUseCreateWorldInfo.mock.results[0]?.value
    expect(createMutation.mutateAsync).not.toHaveBeenCalled()
  })

  it('deletes a world info successfully', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderPage()
    await user.click(screen.getByTitle('Delete'))

    const deleteMutation = mockUseDeleteWorldInfo.mock.results[0]?.value
    expect(deleteMutation.mutateAsync).toHaveBeenCalledWith('test.json')
  })

  it('does not delete when confirm is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    renderPage()
    await user.click(screen.getByTitle('Delete'))

    const deleteMutation = mockUseDeleteWorldInfo.mock.results[0]?.value
    expect(deleteMutation.mutateAsync).not.toHaveBeenCalled()
  })

  it('disables create button when mutation is pending', () => {
    mockUseCreateWorldInfo.mockReturnValue(
      defaultCreateMutation({ isPending: true }),
    )

    renderPage()
    const button = screen.getByRole('button', { name: /creating/i })
    expect(button).toBeDisabled()
    expect(screen.getByText('Creating...')).toBeInTheDocument()
  })

  it('calls refetch when retry button is clicked', async () => {
    const refetch = vi.fn()
    mockUseWorldInfos.mockReturnValue({
      data: [],
      isLoading: false,
      error: { message: 'Network error' } as any,
      refetch,
    } as any)

    renderPage()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(refetch).toHaveBeenCalled()
  })
})
