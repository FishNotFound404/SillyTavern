import { useEffect, useState } from 'react'
import { apiGet } from '../api/client'
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

function Settings() {
  const [backend, setBackend] = useState<BackendStatus>({ online: false })
  const [minimax, setMinimax] = useState<MiniMaxStatus | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem(MODEL_KEY) || 'MiniMax-M3'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [backendData, minimaxData] = await Promise.all([
          apiGet<BackendStatus>('/api/settings/status').catch(() => ({ online: false })),
          apiGet<MiniMaxStatus>('/api/minimax/status').catch(() => null),
        ])
        setBackend(backendData)
        setMinimax(minimaxData)
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
