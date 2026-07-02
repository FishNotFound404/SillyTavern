import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CharacterEdit from './CharacterEdit'
import { useCharacterEdit } from '../hooks/useCharacterEdit'

vi.mock('../hooks/useCharacterEdit', () => ({
  useCharacterEdit: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../components/CharacterAvatarUpload', () => ({
  CharacterAvatarUpload: () => <div data-testid="character-avatar-upload" />,
}))

vi.mock('../components/CharacterFormFields', () => ({
  CharacterFormFields: () => <div data-testid="character-form-fields" />,
}))

vi.mock('../components/CharacterAdvancedFields', () => ({
  CharacterAdvancedFields: () => <div data-testid="character-advanced-fields" />,
}))

vi.mock('../components/CharacterEditActions', () => ({
  CharacterEditActions: ({ canSave }: { canSave: boolean }) => (
    <div data-testid="character-edit-actions" data-can-save={String(canSave)} />
  ),
}))

const mockedUseCharacterEdit = vi.mocked(useCharacterEdit)

const baseMock = {
  draft: {
    name: 'Alice',
    description: '',
    personality: '',
    scenario: '',
    firstMes: '',
    mesExample: '',
    creatorNotes: '',
    systemPrompt: '',
    postHistoryInstructions: '',
    creator: '',
    characterVersion: '',
    tags: [] as string[],
    talkativeness: 0.5,
    avatarFile: null as File | null,
  },
  currentAvatarUrl: null,
  loading: false,
  error: null,
  saving: false,
  isCreate: false,
  avatarParam: 'alice.png',
  updateField: vi.fn(),
  handleFileSelect: vi.fn(),
  handleSubmit: vi.fn(),
}

function setupMock(overrides: Partial<typeof baseMock> = {}) {
  mockedUseCharacterEdit.mockReturnValue({ ...baseMock, ...overrides })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CharacterEdit', () => {
  it('shows loading state', () => {
    setupMock({ loading: true })
    render(<CharacterEdit />)
    expect(screen.getByText('Loading character...')).toBeInTheDocument()
  })

  it('shows error message', () => {
    setupMock({ error: 'Failed to load character' })
    render(<CharacterEdit />)
    expect(screen.getByText('Failed to load character')).toBeInTheDocument()
  })

  it('shows Create Character title in create mode', () => {
    setupMock({ isCreate: true, draft: { ...baseMock.draft, name: '' } })
    render(<CharacterEdit />)
    expect(screen.getByRole('heading', { name: 'Create Character' })).toBeInTheDocument()
  })

  it('shows Edit {name} title in edit mode', () => {
    setupMock({ isCreate: false, draft: { ...baseMock.draft, name: 'Alice' } })
    render(<CharacterEdit />)
    expect(screen.getByRole('heading', { name: 'Edit Alice' })).toBeInTheDocument()
  })

  it('renders all child components', () => {
    setupMock()
    render(<CharacterEdit />)
    expect(screen.getByTestId('character-avatar-upload')).toBeInTheDocument()
    expect(screen.getByTestId('character-form-fields')).toBeInTheDocument()
    expect(screen.getByTestId('character-advanced-fields')).toBeInTheDocument()
    expect(screen.getByTestId('character-edit-actions')).toBeInTheDocument()
  })

  it('navigates to / on cancel in create mode', async () => {
    const user = userEvent.setup()
    setupMock({ isCreate: true })
    render(<CharacterEdit />)
    await user.click(screen.getByText('Cancel'))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('navigates to /character/{avatar} on cancel in edit mode', async () => {
    const user = userEvent.setup()
    setupMock({ isCreate: false, avatarParam: 'alice.png' })
    render(<CharacterEdit />)
    await user.click(screen.getByText('Cancel'))
    expect(mockNavigate).toHaveBeenCalledWith('/character/alice.png')
  })

  it('calls handleSubmit on form submit', () => {
    const handleSubmit = vi.fn()
    setupMock({ handleSubmit })
    const { container } = render(<CharacterEdit />)
    const form = container.querySelector('form')!
    form.requestSubmit()
    expect(handleSubmit).toHaveBeenCalled()
  })

  it('passes canSave true when name is non-empty', () => {
    setupMock({ draft: { ...baseMock.draft, name: 'Test' } })
    render(<CharacterEdit />)
    const actions = screen.getByTestId('character-edit-actions')
    expect(actions.getAttribute('data-can-save')).toBe('true')
  })

  it('passes canSave false when name is empty', () => {
    setupMock({ draft: { ...baseMock.draft, name: '' } })
    render(<CharacterEdit />)
    const actions = screen.getByTestId('character-edit-actions')
    expect(actions.getAttribute('data-can-save')).toBe('false')
  })
})
