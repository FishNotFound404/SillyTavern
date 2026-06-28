import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../api/client'
import { LoadingState, ErrorState } from '../components/ui'

const MODEL_KEY = 'sillytavern:settings:model'

interface BackendStatus {
  online: boolean
  version?: string
}

interface MiniMaxStatus {
  configured: boolean
  default_model: string
  available_models: string[]
}

interface SecretItem {
  id: string
  value: string
  label: string
  active: boolean
}

type SecretState = Record<string, SecretItem[] | null>

interface ApiKeyConfig {
  key: string
  label: string
}

const COMMON_API_KEYS: ApiKeyConfig[] = [
  { key: 'api_key_openai', label: 'OpenAI' },
  { key: 'api_key_claude', label: 'Anthropic Claude' },
  { key: 'api_key_minimax', label: 'MiniMax' },
  { key: 'api_key_makersuite', label: 'Google (MakerSuite)' },
  { key: 'api_key_openrouter', label: 'OpenRouter' },
  { key: 'api_key_deepseek', label: 'DeepSeek' },
  { key: 'api_key_togetherai', label: 'Together AI' },
  { key: 'api_key_mistralai', label: 'Mistral AI' },
  { key: 'api_key_cohere', label: 'Cohere' },
  { key: 'api_key_groq', label: 'Groq' },
]

function Settings() {
  const [backend, setBackend] = useState<BackendStatus>({ online: false })
  const [minimax, setMiniMax] = useState<MiniMaxStatus | null>(null)
  const [secrets, setSecrets] = useState<SecretState>({})
  const [secretInputs, setSecretInputs] = useState<Record<string, string>>({})
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({})
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem(MODEL_KEY) || 'MiniMax-M3'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [backendData, minimaxData, secretsData] = await Promise.all([
          apiGet<BackendStatus>('/api/settings/status').catch(() => ({ online: false })),
          apiGet<MiniMaxStatus>('/api/minimax/status').catch(() => null),
          apiPost<SecretState>('/api/secrets/read', {}).catch(() => ({})),
        ])
        setBackend(backendData)
        setMiniMax(minimaxData)
        setSecrets(secretsData || {})
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleModelChange = (model: string) => {
    setSelectedModel(model)
    localStorage.setItem(MODEL_KEY, model)
  }

  const isConfigured = (key: string) => {
    const items = secrets[key]
    return Array.isArray(items) && items.some((item) => item.active)
  }

  const activeSecretId = (key: string) => {
    const items = secrets[key]
    return items?.find((item) => item.active)?.id
  }

  const handleSaveKey = async (key: string) => {
    const value = secretInputs[key]?.trim()
    if (!value) return

    try {
      setSavingKeys((prev) => ({ ...prev, [key]: true }))
      setSaveMessage(null)
      await apiPost('/api/secrets/write', { key, value, label: 'React UI' })
      const updated = await apiPost<SecretState>('/api/secrets/read', {})
      setSecrets(updated || {})
      setSecretInputs((prev) => ({ ...prev, [key]: '' }))
      setSaveMessage(`${COMMON_API_KEYS.find((k) => k.key === key)?.label || key} API key saved`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key')
    } finally {
      setSavingKeys((prev) => ({ ...prev, [key]: false }))
    }
  }

  const handleDeleteKey = async (key: string) => {
    const id = activeSecretId(key)
    if (!id) return

    try {
      setSavingKeys((prev) => ({ ...prev, [key]: true }))
      setSaveMessage(null)
      await apiPost('/api/secrets/delete', { key, id })
      const updated = await apiPost<SecretState>('/api/secrets/read', {})
      setSecrets(updated || {})
      setSaveMessage(`${COMMON_API_KEYS.find((k) => k.key === key)?.label || key} API key removed`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete API key')
    } finally {
      setSavingKeys((prev) => ({ ...prev, [key]: false }))
    }
  }

  if (loading) {
    return <LoadingState message="Loading settings..." />
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load settings"
        message={error}
      />
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Connection Status */}
        <section className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Connection Status</h2>
          <div className="flex items-center gap-3">
            <span
              className={`inline-block w-3 h-3 rounded-full ${
                backend.online ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-gray-200">
              {backend.online ? 'Backend connected' : 'Backend offline'}
            </span>
          </div>
          {backend.version && (
            <p className="text-sm text-gray-400 mt-2">Version: {backend.version}</p>
          )}
        </section>

        {/* API Keys */}
        <section className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">API Keys</h2>
          {saveMessage && (
            <div className="mb-4 px-4 py-2 bg-green-900/50 border border-green-700 rounded-lg text-green-200 text-sm">
              {saveMessage}
            </div>
          )}
          <div className="space-y-4">
            {COMMON_API_KEYS.map(({ key, label }) => {
              const configured = isConfigured(key)
              return (
                <div key={key} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{label}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        configured
                          ? 'bg-green-900/50 text-green-300'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {configured ? 'Configured' : 'Not configured'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={secretInputs[key] || ''}
                      onChange={(e) =>
                        setSecretInputs((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      placeholder={configured ? 'Enter new key to replace' : 'Enter API key'}
                      className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
                    />
                    <button
                      onClick={() => handleSaveKey(key)}
                      disabled={savingKeys[key] || !secretInputs[key]?.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm"
                    >
                      {savingKeys[key] ? 'Saving...' : 'Save'}
                    </button>
                    {configured && (
                      <button
                        onClick={() => handleDeleteKey(key)}
                        disabled={savingKeys[key]}
                        className="px-4 py-2 bg-red-600/80 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 font-medium text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Keys are stored server-side in your data directory. Only masked values are shown.
          </p>
        </section>

        {/* MiniMax Configuration */}
        <section className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">MiniMax Configuration</h2>
          {minimax ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    minimax.configured ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                />
                <span className="text-gray-200">
                  {minimax.configured
                    ? 'API key configured server-side'
                    : 'API key not configured. Add api_key_minimax to your backend secrets.'}
                </span>
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-2">
                  Default Chat Model
                </label>
                <select
                  id="model"
                  value={selectedModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full bg-gray-900 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
                >
                  {minimax.available_models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Saved locally in your browser.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">Unable to load MiniMax status.</p>
          )}
        </section>

        {/* About */}
        <section className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-2">About</h2>
          <p className="text-gray-400 text-sm">
            SillyTavern React frontend refactor. Full settings are available in the legacy UI.
          </p>
        </section>
      </div>
    </div>
  )
}

export default Settings
