import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Settings from './Settings'
import { useSettings } from '../hooks/useSettings'

vi.mock('../hooks/useSettings', () => ({
  useSettings: vi.fn(),
}))

const mockUseSettings = vi.mocked(useSettings)

const defaultSettingsState = {
  backend: { online: false },
  secrets: {},
  secretInputs: {},
  savingKeys: {},
  connection: {
    provider: 'minimax' as const,
    model: 'MiniMax-M3',
    temperature: 0.7,
    maxTokens: 1024,
    stream: true,
    minimaxEndpoint: 'cn' as const,
  },
  savingConnection: false,
  loading: false,
  error: null,
  saveMessage: null,
  models: [],
  loadingModels: false,
  modelError: null,
  customMode: false,
  activeSecretKey: 'api_key_minimax',
  isModelConfigurable: false,
  presetNames: [],
  presets: [],
  selectedPreset: '',
  presetNameInput: '',
  presetLoading: false,
  presetMessage: null,
  presetError: null,
  handleProviderChange: vi.fn(),
  handleMinimaxEndpointChange: vi.fn(),
  handleModelChange: vi.fn(),
  handleCustomModeChange: vi.fn(),
  handleSaveConnection: vi.fn(),
  handleSecretInputChange: vi.fn(),
  handleSaveKey: vi.fn(),
  handleDeleteKey: vi.fn(),
  setSelectedPreset: vi.fn(),
  setPresetNameInput: vi.fn(),
  handleApplyPreset: vi.fn(),
  handleSavePreset: vi.fn(),
  handleDeletePreset: vi.fn(),
}

function mockSettings(overrides: Record<string, unknown> = {}) {
  mockUseSettings.mockReturnValue({ ...defaultSettingsState, ...overrides })
}

describe('Settings page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state', () => {
    mockSettings({ loading: true })
    render(<Settings />)
    expect(screen.getByText('Loading settings...')).toBeInTheDocument()
  })

  it('shows error state', () => {
    mockSettings({ loading: false, error: 'Failed to load settings' })
    render(<Settings />)
    expect(screen.getAllByText('Failed to load settings')).toHaveLength(2)
  })

  it('renders all sections when loaded', () => {
    mockSettings()
    render(<Settings />)

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByText('Connection Status')).toBeInTheDocument()
    expect(screen.getByText('Connection')).toBeInTheDocument()
    expect(screen.getByText('Generation Presets')).toBeInTheDocument()
    expect(screen.getByText('API Keys')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
  })

  it('passes correct props to child components', () => {
    mockSettings({
      backend: { online: true, version: '1.2.3' },
      connection: {
        ...defaultSettingsState.connection,
        provider: 'openai' as const,
        model: 'gpt-4',
      },
      secrets: {
        api_key_openai: [{ id: 'k1', value: '***', label: 'test', active: true }],
      },
      models: [{ id: 'gpt-4', name: 'GPT-4' }],
      activeSecretKey: 'api_key_openai',
      isModelConfigurable: true,
    })
    render(<Settings />)

    expect(screen.getByText('Backend connected')).toBeInTheDocument()
    expect(screen.getByText('Version: 1.2.3')).toBeInTheDocument()

    const providerSelect = screen.getByLabelText('AI Provider') as HTMLSelectElement
    expect(providerSelect.value).toBe('openai')

    const modelSelect = screen.getByLabelText('Model') as HTMLSelectElement
    expect(modelSelect.value).toBe('gpt-4')
  })

  it('handles connection section save interaction', async () => {
    const handleSaveConnection = vi.fn()
    mockSettings({
      connection: {
        ...defaultSettingsState.connection,
        provider: 'openai' as const,
        model: 'gpt-4',
      },
      models: [{ id: 'gpt-4', name: 'GPT-4' }],
      handleSaveConnection,
    })

    const user = userEvent.setup()
    render(<Settings />)

    const saveButton = screen.getByRole('button', { name: /save connection/i })
    await user.click(saveButton)

    expect(handleSaveConnection).toHaveBeenCalledOnce()
  })

  it('handles API keys section delete interaction', async () => {
    const handleDeleteKey = vi.fn()
    mockSettings({
      secrets: {
        api_key_openai: [{ id: 'key1', value: '***', label: 'test', active: true }],
      },
      activeSecretKey: 'api_key_openai',
      isModelConfigurable: true,
      handleDeleteKey,
    })

    const user = userEvent.setup()
    render(<Settings />)

    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    const openaiRemove = removeButtons.find((btn) => {
      const section = btn.closest('.bg-gray-900')
      return section?.querySelector('.text-white.font-medium')?.textContent === 'OpenAI'
    })

    expect(openaiRemove).toBeDefined()
    await user.click(openaiRemove!)

    expect(handleDeleteKey).toHaveBeenCalledWith('api_key_openai')
  })
})
