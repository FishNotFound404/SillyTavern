import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiPost } from '../api/client'
import type { BackendStatus, SecretState } from '../types/settings'
import type { ChatProvider, ConnectionSettings, MiniMaxEndpoint, ModelInfo } from '../types/connection'
import {
  DEFAULT_CONNECTION,
  fetchModels,
  getDefaultModel,
  getProviderConfig,
  readConnectionSettings,
  writeConnectionSettings,
} from '../utils/connection'
import { getApiKeyLabel, isSecretConfigured } from '../utils/settings'
import { deletePreset, fetchPresets, savePreset } from '../utils/presets'
import type { GenerationPreset } from '../types/preset'

interface SettingsResponse {
  settings: string
}

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
  const [backend, setBackend] = useState<BackendStatus>({ online: false })
  const [secrets, setSecrets] = useState<SecretState>({})
  const [secretInputs, setSecretInputs] = useState<Record<string, string>>({})
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({})
  const [connection, setConnection] = useState<ConnectionSettings>(DEFAULT_CONNECTION)
  const [savingConnection, setSavingConnection] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [models, setModels] = useState<ModelInfo[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)
  const [customMode, setCustomMode] = useState(false)
  const [presetNames, setPresetNames] = useState<string[]>([])
  const [presets, setPresets] = useState<GenerationPreset[]>([])
  const [selectedPreset, setSelectedPreset] = useState('')
  const [presetNameInput, setPresetNameInput] = useState('')
  const [presetLoading, setPresetLoading] = useState(false)
  const [presetMessage, setPresetMessage] = useState<string | null>(null)
  const [presetError, setPresetError] = useState<string | null>(null)

  // Initial load: backend status, connection settings, and secrets.
  useEffect(() => {
    async function load() {
      try {
        const [backendData, settingsData, secretsData] = await Promise.all([
          apiGet<BackendStatus>('/api/settings/status').catch(() => ({ online: false })),
          apiPost<SettingsResponse>('/api/settings/get', {}),
          apiPost<SecretState>('/api/secrets/read', {}),
        ])
        setBackend(backendData)
        setConnection(readConnectionSettings(settingsData?.settings ? JSON.parse(settingsData.settings) : {}))
        setSecrets(secretsData || {})
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Load generation presets.
  useEffect(() => {
    async function loadPresets() {
      try {
        const data = await fetchPresets()
        setPresetNames(data.names)
        setPresets(data.presets)
      } catch (err) {
        console.warn('Failed to load generation presets:', err)
      }
    }
    loadPresets()
  }, [])

  const activeSecretKey = getProviderConfig(connection.provider).secretKey
  const isModelConfigurable = isSecretConfigured(secrets, activeSecretKey)

  // Fetch available models when provider/key changes.
  useEffect(() => {
    let cancelled = false
    setModelError(null)

    if (!isModelConfigurable) {
      setModels([])
      setCustomMode(false)
      setLoadingModels(false)
      return
    }

    setLoadingModels(true)
    fetchModels(connection.provider)
      .then((list) => {
        if (cancelled) return
        setModels(list)
        if (list.length > 0 && !list.some((m) => m.id === connection.model)) {
          setConnection((prev) => ({ ...prev, model: list[0].id }))
        }
        setCustomMode(false)
      })
      .catch((err) => {
        if (cancelled) return
        setModelError(err instanceof Error ? err.message : 'Failed to load models')
        setModels([])
        setCustomMode(true)
      })
      .finally(() => {
        if (!cancelled) setLoadingModels(false)
      })

    return () => {
      cancelled = true
    }
  }, [connection.provider, connection.model, activeSecretKey, secrets, isModelConfigurable])

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
    setSavingConnection(true)
    setSaveMessage(null)
    setError(null)
    try {
      const data = await apiPost<SettingsResponse>('/api/settings/get', {})
      const parsed = data?.settings ? (JSON.parse(data.settings) as Record<string, unknown>) : {}
      const updated = writeConnectionSettings(parsed, connection)
      await apiPost('/api/settings/save', updated)
      setSaveMessage(`Connection saved: ${getProviderConfig(connection.provider).label} / ${connection.model}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save connection')
    } finally {
      setSavingConnection(false)
    }
  }, [connection])

  const refreshPresets = useCallback(async () => {
    const data = await fetchPresets()
    setPresetNames(data.names)
    setPresets(data.presets)
  }, [])

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
      minimaxEndpoint: (preset.minimaxEndpoint as MiniMaxEndpoint | undefined) || prev.minimaxEndpoint,
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
      await savePreset(name, {
        provider: connection.provider,
        model: connection.model,
        minimaxEndpoint: connection.minimaxEndpoint,
      })
      await refreshPresets()
      setSelectedPreset(name)
      setPresetNameInput('')
      setPresetMessage(`Preset "${name}" saved.`)
    } catch (err) {
      setPresetError(err instanceof Error ? err.message : 'Failed to save preset')
    } finally {
      setPresetLoading(false)
    }
  }, [connection, presetNameInput, refreshPresets])

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
      await deletePreset(selectedPreset)
      await refreshPresets()
      setSelectedPreset('')
      setPresetMessage(`Preset "${selectedPreset}" deleted.`)
    } catch (err) {
      setPresetError(err instanceof Error ? err.message : 'Failed to delete preset')
    } finally {
      setPresetLoading(false)
    }
  }, [selectedPreset, refreshPresets])

  const handleSecretInputChange = useCallback((key: string, value: string) => {
    setSecretInputs((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSaveKey = useCallback(async (key: string) => {
    const value = secretInputs[key]?.trim()
    if (!value) return

    try {
      setSavingKeys((prev) => ({ ...prev, [key]: true }))
      setSaveMessage(null)
      await apiPost('/api/secrets/write', { key, value, label: 'React UI' })
      const updated = await apiPost<SecretState>('/api/secrets/read', {})
      setSecrets(updated || {})
      setSecretInputs((prev) => ({ ...prev, [key]: '' }))
      setSaveMessage(`${getApiKeyLabel(key)} API key saved`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key')
    } finally {
      setSavingKeys((prev) => ({ ...prev, [key]: false }))
    }
  }, [secretInputs])

  const handleDeleteKey = useCallback(async (key: string) => {
    const id = secrets[key]?.find((item) => item.active)?.id
    if (!id) return

    try {
      setSavingKeys((prev) => ({ ...prev, [key]: true }))
      setSaveMessage(null)
      await apiPost('/api/secrets/delete', { key, id })
      const updated = await apiPost<SecretState>('/api/secrets/read', {})
      setSecrets(updated || {})
      setSaveMessage(`${getApiKeyLabel(key)} API key removed`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete API key')
    } finally {
      setSavingKeys((prev) => ({ ...prev, [key]: false }))
    }
  }, [secrets])

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
