import { useCallback, useEffect, useState } from 'react'
import {
  useBackendStatus,
  useDeletePreset,
  useDeleteSecret,
  useModels,
  usePresets,
  useSaveConnection,
  useSavePreset,
  useSecrets,
  useSettingsBundle,
  useWriteSecret,
} from '../api'
import {
  DEFAULT_CONNECTION,
  getApiKeyLabel,
  getDefaultModel,
  getProviderConfig,
  isSecretConfigured,
  readConnectionSettings,
  writeConnectionSettings,
} from '../utils'
import type {
  BackendStatus,
  ChatProvider,
  ConnectionSettings,
  GenerationPreset,
  MiniMaxEndpoint,
  ModelInfo,
  SecretState,
} from '../types'

const EMPTY_SECRETS: SecretState = {}
const EMPTY_PRESETS: GenerationPreset[] = []

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
  const backendQuery = useBackendStatus()
  const bundleQuery = useSettingsBundle()
  const secretsQuery = useSecrets()
  const presetsQuery = usePresets()

  const [secretInputs, setSecretInputs] = useState<Record<string, string>>({})
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({})
  const [connection, setConnection] = useState<ConnectionSettings>(DEFAULT_CONNECTION)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [customMode, setCustomMode] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState('')
  const [presetNameInput, setPresetNameInput] = useState('')
  const [presetLoading, setPresetLoading] = useState(false)
  const [presetMessage, setPresetMessage] = useState<string | null>(null)
  const [presetError, setPresetError] = useState<string | null>(null)
  const [models, setModels] = useState<ModelInfo[]>([])
  const [modelError, setModelError] = useState<string | null>(null)
  const [connectionInitialized, setConnectionInitialized] = useState(false)

  // Initialize connection from bundle when it first loads.
  useEffect(() => {
    if (bundleQuery.data && !connectionInitialized) {
      const parsed = bundleQuery.data.settings
        ? (JSON.parse(bundleQuery.data.settings) as Record<string, unknown>)
        : {}
      setConnection(readConnectionSettings(parsed))
      setConnectionInitialized(true)
    }
  }, [bundleQuery.data, connectionInitialized])

  const secrets: SecretState = secretsQuery.data ?? EMPTY_SECRETS
  const activeSecretKey = getProviderConfig(connection.provider).secretKey
  const isModelConfigurable = isSecretConfigured(secrets, activeSecretKey)

  // Models query 閳?only enabled when the active provider's key is configured.
  const modelsQuery = useModels(isModelConfigurable ? connection.provider : undefined)
  const loadingModels = modelsQuery.isFetching

  // Sync models query result into local state and auto-select first model when needed.
  useEffect(() => {
    if (!isModelConfigurable) {
      setModels([])
      setCustomMode(false)
      setModelError(null)
      return
    }
    if (modelsQuery.data) {
      setModels(modelsQuery.data)
      setModelError(null)
      setCustomMode(false)
      if (
        modelsQuery.data.length > 0 &&
        !modelsQuery.data.some((m) => m.id === connection.model)
      ) {
        const first = modelsQuery.data[0]
        setConnection((prev) => ({ ...prev, model: first.id }))
      }
    } else if (modelsQuery.error) {
      setModels([])
      setModelError(
        modelsQuery.error instanceof Error
          ? modelsQuery.error.message
          : 'Failed to load models',
      )
      setCustomMode(true)
    }
  }, [
    modelsQuery.data,
    modelsQuery.error,
    isModelConfigurable,
    connection.model,
  ])

  const presets: GenerationPreset[] = presetsQuery.data?.presets ?? EMPTY_PRESETS
  const presetNames: string[] = presetsQuery.data?.names || []

  const backend: BackendStatus = backendQuery.data || { online: false }

  const saveConnectionMutation = useSaveConnection()
  const writeSecretMutation = useWriteSecret()
  const deleteSecretMutation = useDeleteSecret()
  const savePresetMutation = useSavePreset()
  const deletePresetMutation = useDeletePreset()

  const savingConnection = saveConnectionMutation.isPending

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
    setSaveMessage(null)
    setError(null)
    try {
      await saveConnectionMutation.mutateAsync({
        currentBundle: bundleQuery.data ?? null,
        connection,
        merge: writeConnectionSettings,
      })
      setSaveMessage(
        `Connection saved: ${getProviderConfig(connection.provider).label} / ${connection.model}`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save connection')
    }
  }, [connection, saveConnectionMutation, bundleQuery.data])

  const handleSecretInputChange = useCallback((key: string, value: string) => {
    setSecretInputs((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSaveKey = useCallback(
    async (key: string) => {
      const value = secretInputs[key]?.trim()
      if (!value) return

      setSavingKeys((prev) => ({ ...prev, [key]: true }))
      setSaveMessage(null)
      try {
        await writeSecretMutation.mutateAsync({ key, value })
        setSecretInputs((prev) => ({ ...prev, [key]: '' }))
        setSaveMessage(`${getApiKeyLabel(key)} API key saved`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save API key')
      } finally {
        setSavingKeys((prev) => ({ ...prev, [key]: false }))
      }
    },
    [secretInputs, writeSecretMutation],
  )

  const handleDeleteKey = useCallback(
    async (key: string) => {
      const id = secrets[key]?.find((item) => item.active)?.id
      if (!id) return

      setSavingKeys((prev) => ({ ...prev, [key]: true }))
      setSaveMessage(null)
      try {
        await deleteSecretMutation.mutateAsync({ key, id })
        setSaveMessage(`${getApiKeyLabel(key)} API key removed`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete API key')
      } finally {
        setSavingKeys((prev) => ({ ...prev, [key]: false }))
      }
    },
    [secrets, deleteSecretMutation],
  )

  const handleApplyPreset = useCallback(() => {
    const preset = presets.find((p) => p.name === selectedPreset)
    if (!preset) {
      setPresetError('Select a preset to apply.')
      return
    }
    setConnection((prev) => ({
      ...prev,
      provider: preset.provider,
      model: preset.model,
      minimaxEndpoint:
        (preset.minimaxEndpoint as MiniMaxEndpoint | undefined) || prev.minimaxEndpoint,
    }))
    setPresetError(null)
    setPresetMessage('Preset applied. Save connection to persist.')
  }, [presets, selectedPreset])

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
      const savedName = await savePresetMutation.mutateAsync({
        name,
        preset: {
          provider: connection.provider,
          model: connection.model,
          minimaxEndpoint: connection.minimaxEndpoint,
        },
      })
      setSelectedPreset(savedName)
      setPresetNameInput('')
      setPresetMessage(`Preset "${savedName}" saved.`)
    } catch (err) {
      setPresetError(err instanceof Error ? err.message : 'Failed to save preset')
    } finally {
      setPresetLoading(false)
    }
  }, [connection, presetNameInput, savePresetMutation])

  const handleDeletePreset = useCallback(async () => {
    if (!selectedPreset) {
      setPresetError('Select a preset to delete.')
      return
    }
    if (!window.confirm(`Delete preset "${selectedPreset}"?`)) {
      return
    }

    setPresetLoading(true)
    setPresetError(null)
    setPresetMessage(null)
    try {
      await deletePresetMutation.mutateAsync(selectedPreset)
      setSelectedPreset('')
      setPresetMessage(`Preset "${selectedPreset}" deleted.`)
    } catch (err) {
      setPresetError(err instanceof Error ? err.message : 'Failed to delete preset')
    } finally {
      setPresetLoading(false)
    }
  }, [selectedPreset, deletePresetMutation])

  // Aggregate loading/error states.
  const loading =
    bundleQuery.isLoading || secretsQuery.isLoading || presetsQuery.isLoading
  const aggregatedError =
    bundleQuery.error?.message ||
    secretsQuery.error?.message ||
    presetsQuery.error?.message ||
    null

  return {
    backend,
    secrets,
    secretInputs,
    savingKeys,
    connection,
    savingConnection,
    loading,
    error: error ?? aggregatedError,
    saveMessage,
    models,
    loadingModels,
    modelError,
    customMode,
    activeSecretKey,
    isModelConfigurable,
    presetNames,
    presets,
    selectedPreset,
    presetNameInput,
    presetLoading,
    presetMessage,
    presetError,
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
