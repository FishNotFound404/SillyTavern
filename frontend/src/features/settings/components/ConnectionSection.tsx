import type { ChatProvider, ConnectionSettings, MiniMaxEndpoint, ModelInfo } from '../types'
import { PROVIDER_CONFIG } from '../utils'

interface ConnectionSectionProps {
  connection: ConnectionSettings
  models: ModelInfo[]
  loadingModels: boolean
  modelError: string | null
  customMode: boolean
  saveMessage: string | null
  savingConnection: boolean
  isModelConfigurable: boolean
  onProviderChange: (provider: ChatProvider) => void
  onMinimaxEndpointChange: (endpoint: MiniMaxEndpoint) => void
  onModelChange: (model: string) => void
  onCustomModeChange: (custom: boolean) => void
  onSaveConnection: () => void
}

export function ConnectionSection({
  connection,
  models,
  loadingModels,
  modelError,
  customMode,
  saveMessage,
  savingConnection,
  isModelConfigurable,
  onProviderChange,
  onMinimaxEndpointChange,
  onModelChange,
  onCustomModeChange,
  onSaveConnection,
}: ConnectionSectionProps) {
  return (
    <section className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h2 className="text-lg font-semibold text-white mb-4">Connection</h2>
      {saveMessage && (
        <div className="mb-4 px-4 py-2 bg-green-900/50 border border-green-700 rounded-lg text-green-200 text-sm">
          {saveMessage}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label htmlFor="provider" className="block text-sm font-medium text-gray-300 mb-2">
            AI Provider
          </label>
          <select
            id="provider"
            value={connection.provider}
            onChange={(e) => onProviderChange(e.target.value as ChatProvider)}
            className="w-full bg-gray-900 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
          >
            {PROVIDER_CONFIG.map((provider) => (
              <option key={provider.key} value={provider.key}>
                {provider.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            Select the provider matching the API key you configure below.
          </p>
        </div>

        {connection.provider === 'minimax' && (
          <div>
            <label htmlFor="minimaxEndpoint" className="block text-sm font-medium text-gray-300 mb-2">
              MiniMax Endpoint
            </label>
            <select
              id="minimaxEndpoint"
              value={connection.minimaxEndpoint}
              onChange={(e) => onMinimaxEndpointChange(e.target.value as MiniMaxEndpoint)}
              className="w-full bg-gray-900 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="cn">China (api.minimaxi.com)</option>
              <option value="global">Global (api.minimax.io)</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Match this to the region your API key was issued for.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-2">
            Model
            {loadingModels && (
              <span className="ml-2 text-xs text-gray-400">Loading...</span>
            )}
          </label>
          {customMode || models.length === 0 || modelError ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="model"
                type="text"
                value={connection.model}
                onChange={(e) => onModelChange(e.target.value)}
                placeholder="e.g. gpt-4o-mini"
                className="flex-1 bg-gray-900 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
              {models.length > 0 && !modelError && (
                <button
                  type="button"
                  onClick={() => onCustomModeChange(false)}
                  className="px-3 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600"
                >
                  List
                </button>
              )}
            </div>
          ) : (
            <select
              id="model"
              value={connection.model}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  onCustomModeChange(true)
                  return
                }
                onModelChange(e.target.value)
              }}
              className="w-full bg-gray-900 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name || model.id}
                </option>
              ))}
              {connection.model && !models.some((m) => m.id === connection.model) && (
                <option value={connection.model}>{connection.model}</option>
              )}
              <option value="__custom__">Custom...</option>
            </select>
          )}
          {modelError && (
            <p className="mt-2 text-xs text-red-400">{modelError}</p>
          )}
          {!isModelConfigurable && (
            <p className="mt-2 text-xs text-gray-500">
              Save the API key above to load available models.
            </p>
          )}
        </div>

        <button
          onClick={onSaveConnection}
          disabled={savingConnection || !connection.model.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm"
        >
          {savingConnection ? 'Saving...' : 'Save Connection'}
        </button>
      </div>
    </section>
  )
}
