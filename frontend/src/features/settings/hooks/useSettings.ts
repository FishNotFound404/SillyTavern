import { useCallback, useEffect, useState } from 'react'
import {
  useBackendStatus,
  useDeletePreset,
  useDeleteSecret,
  useModels,
  usePresets,
  useSavePreset,
  useSaveSecret,
  useSaveSettings,
  useSecrets,
  useSettings as useSettingsQuery,
} from '../api'
import type { BackendStatus, ChatProvider, ConnectionSettings, GenerationPreset, MiniMaxEndpoint, ModelInfo, SecretState } from '../types'
import {
  DEFAULT_CONNECTION,
  getApiKeyLabel,
  getDefaultModel,
  getProviderConfig,
  isSecretConfigured,
  readConnectionSettings,
  writeConnectionSettings,
} from '../utils'

export interface UseSettingsResult {
  // State
  backend: BackendStatus
  secrets: SecretState
  secretInputs: Record<string, string>
  savingKeys: Record<string, boolean>
  connection: ConnectionSettings
  savingConnection: boolean
  loading: boolean
  error: string | null
  saveMessage: string | null
  models: ModelInfo[]
  loadingModels: boolean
  modelError: string | null
  customMode: boolean

  // Derived
  activeSecretKey: string
  isModelConfigurable: boolean

  // Presets
  presetNames: string[]
  presets: GenerationPreset[]
  selectedPreset: string
  presetNameInput: string
  presetLoading: boolean
  presetMessage: string | null
  presetError: string | null

  // Handlers
  handleProviderChange: (provider: ChatProvider) => void
  handleMinimaxEndpointChange: (endpoint: MiniMaxEndpoint) => void
  handleModelChange: (model: string) => void
  handleCustomModeChange: (custom: boolean) => void
  handleSaveConnection: () => Promise<void>
  handleSecretInputChange: (key: string, value: string) => void
  handleSaveKey: (key: string) => Promise<void>
  handleDeleteKey: (key: string) => Promise<void>
  setSelectedPreset: (name: string) => void
  setPresetNameInput: (name: string) => void
  handleApplyPreset: () => void
  handleSavePreset: () => Promise<void>
  handleDeletePreset: () => Promise<void>
}

export function useSettings(): UseSettingsResult {
  const { data: settingsResponse, isLoading: settingsLoading, error: settingsError } = useSettingsQuery()
  const { mutateAsync: saveSettingsAsync, isPending: savingConnection } = useSaveSettings()

  const [connection, setConnection] = useState<ConnectionSettings>(DEFAULT_CONNECTION)
  const [secretInputs, setSecretInputs] = useState<Record<string, string>>({})
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({})
  const [operationError, setOperationError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [manualError, setManualError] = useState<string | null>(null)

  const [customMode, setCustomMode] = useState(false)

  const [selectedPreset, setSelectedPreset] = useState('')
  const [presetNameInput, setPresetNameInput] = useState('')
  const [presetLoading, setPresetLoading] = useState(false)
  const [presetMessage, setPresetMessage] = useState<string | null>(null)
  const [presetError, setPresetError] = useState<string | null>(null)

  const { data: backend = { online: false }, isLoading: backendLoading, error: backendError } = useBackendStatus(connection)
  const { data: secrets = {}, isLoading: secretsLoading, error: secretsError } = useSecrets()
  const { mutateAsync: saveSecretAsync } = useSaveSecret()
  const { mutateAsync: deleteSecretAsync } = useDeleteSecret()

  const { data: presetsData = { names: [], presets: [] }, error: presetsErrorData } = usePresets()
  const { mutateAsync: savePresetAsync } = useSavePreset()
  const { mutateAsync: deletePresetAsync } = useDeletePreset()

  const activeSecretKey = getProviderConfig(connection.provider).secretKey
  const isModelConfigurable = isSecretConfigured(secrets, activeSecretKey)

  const { data: models = [], isLoading: loadingModels, error: modelErrorData } = useModels(
    isModelConfigurable ? connection.provider : '',
  )
  const modelError = modelErrorData instanceof Error ? modelErrorData.message : null

  const loading = settingsLoading || backendLoading || secretsLoading
  const error =
    operationError ||
    manualError ||
    settingsError?.message ||
    backendError?.message ||
    secretsError?.message ||
    null

  // Parse connection settings when query data arrives.
  useEffect(() => {
    if (settingsResponse?.settings) {
      try {
        setConnection(readConnectionSettings(JSON.parse(settingsResponse.settings)))
      } catch {
        setManualError('Failed to parse settings')
      }
    }
  }, [settingsResponse])

  // Keep model selection in sync with fetched models.
  useEffect(() => {
    if (!isModelConfigurable) {
      setCustomMode(false)
      return
    }
    if (modelErrorData) {
      setCustomMode(true)
      return
    }
    if (models.length > 0) {
      setCustomMode(false)
      if (!models.some((m) => m.id === connection.model)) {
        setConnection((prev) => ({ ...prev, model: models[0].id }))
      }
    }
  }, [isModelConfigurable, modelErrorData, models]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleProviderChange = useCallback((provider: ChatProvider) => {
    setConnection((prev) => ({
      ...prev,
      provider,
      model: getDefaultModel(provider),
      minimaxEndpoint: prev.minimaxEndpoint || 'cn',
    }))
  }, [])

  const handleMinimaxEndpointChange = useCallback((minimaxEndpoint: MiniMaxEndpoint) => {
    setConnection((prev) => ({ ...prev, minimaxEndpoint }))
  }, [])

  const handleModelChange = useCallback((model: string) => {
    setConnection((prev) => ({ ...prev, model }))
  }, [])

  const handleCustomModeChange = useCallback((custom: boolean) => {
    setCustomMode(custom)
  }, [])

  const handleSaveConnection = useCallback(async () => {
    setOperationError(null)
    setSaveMessage(null)
    try {
      const parsed = settingsResponse?.settings ? JSON.parse(settingsResponse.settings) : {}
      const updated = writeConnectionSettings(parsed, connection)
      await saveSettingsAsync(updated)
      setSaveMessage(`Connection saved: ${getProviderConfig(connection.provider).label} / ${connection.model}`)
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'Failed to save connection')
    }
  }, [connection, saveSettingsAsync, settingsResponse])

  const handleApplyPreset = useCallback(() => {
    const preset = presetsData.presets.find((p) => p.name === selectedPreset)
    if (!preset) {
      setPresetError('Select a preset to apply.')
      return
    }
    setConnection((prev) => ({
      ...prev,
      provider: preset.provider,
      model: preset.model,
      minimaxEndpoint: (preset.minimaxEndpoint as MiniMaxEndpoint | undefined) || prev.minimaxEndpoint,
    }))
    setPresetError(null)
    setPresetMessage('Preset applied. Save connection to persist.')
  }, [presetsData.presets, selectedPreset])

  const handleSavePreset = useCallback(async () => {
    const name = presetNameInput.trim()
    if (!name) {
      setPresetError('Enter a name for the preset.')
      return
    }

    setPresetLoading(true)
    setPresetError(null)
    setPresetMessage(null)
    try {
      await savePresetAsync({
        name,
        preset: {
          provider: connection.provider,
          model: connection.model,
          minimaxEndpoint: connection.minimaxEndpoint,
        },
      })
      setSelectedPreset(name)
      setPresetNameInput('')
      setPresetMessage(`Preset "${name}" saved.`)
    } catch (err) {
      setPresetError(err instanceof Error ? err.message : 'Failed to save preset')
    } finally {
      setPresetLoading(false)
    }
  }, [connection, presetNameInput, savePresetAsync])

  const handleDeletePreset = useCallback(async () => {
    const name = selectedPreset
    if (!name) {
      setPresetError('Select a preset to delete.')
      return
    }
    if (!window.confirm(`Delete preset "${name}"?`)) {
      return
    }

    setPresetLoading(true)
    setPresetError(null)
    setPresetMessage(null)
    try {
      await deletePresetAsync(name)
      setSelectedPreset('')
      setPresetMessage(`Preset "${name}" deleted.`)
    } catch (err) {
      setPresetError(err instanceof Error ? err.message : 'Failed to delete preset')
    } finally {
      setPresetLoading(false)
    }
  }, [selectedPreset, deletePresetAsync])

  const handleSecretInputChange = useCallback((key: string, value: string) => {
    setSecretInputs((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSaveKey = useCallback(async (key: string) => {
    const value = secretInputs[key]?.trim()
    if (!value) return

    try {
      setSavingKeys((prev) => ({ ...prev, [key]: true }))
      setSaveMessage(null)
      await saveSecretAsync({ key, value })
      setSecretInputs((prev) => ({ ...prev, [key]: '' }))
      setSaveMessage(`${getApiKeyLabel(key)} API key saved`)
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'Failed to save API key')
    } finally {
      setSavingKeys((prev) => ({ ...prev, [key]: false }))
    }
  }, [secretInputs, saveSecretAsync])

  const handleDeleteKey = useCallback(async (key: string) => {
    if (!isSecretConfigured(secrets, key)) return

    try {
      setSavingKeys((prev) => ({ ...prev, [key]: true }))
      setSaveMessage(null)
      await deleteSecretAsync(key)
      setSaveMessage(`${getApiKeyLabel(key)} API key removed`)
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'Failed to delete API key')
    } finally {
      setSavingKeys((prev) => ({ ...prev, [key]: false }))
    }
  }, [secrets, deleteSecretAsync])

  const presetsQueryError = presetsErrorData instanceof Error ? presetsErrorData.message : null

  return {
    backend,
    secrets,
    secretInputs,
    savingKeys,
    connection,
    savingConnection,
    loading,
    error,
    saveMessage,
    models,
    loadingModels,
    modelError,
    customMode,
    activeSecretKey,
    isModelConfigurable,
    presetNames: presetsData.names,
    presets: presetsData.presets,
    selectedPreset,
    presetNameInput,
    presetLoading,
    presetMessage,
    presetError: presetError ?? presetsQueryError,
    handleProviderChange,
    handleMinimaxEndpointChange,
    handleModelChange,
    handleCustomModeChange,
    handleSaveConnection,
    handleSecretInputChange,
    handleSaveKey,
    handleDeleteKey,
    setSelectedPreset,
    setPresetNameInput,
    handleApplyPreset,
    handleSavePreset,
    handleDeletePreset,
  }
}
