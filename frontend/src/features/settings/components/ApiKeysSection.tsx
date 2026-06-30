import type { SecretState } from '../types'
import { COMMON_API_KEYS, isSecretConfigured } from '../utils'

interface ApiKeysSectionProps {
  secrets: SecretState
  secretInputs: Record<string, string>
  savingKeys: Record<string, boolean>
  activeSecretKey: string
  onInputChange: (key: string, value: string) => void
  onSaveKey: (key: string) => void
  onDeleteKey: (key: string) => void
}

export function ApiKeysSection({
  secrets,
  secretInputs,
  savingKeys,
  activeSecretKey,
  onInputChange,
  onSaveKey,
  onDeleteKey,
}: ApiKeysSectionProps) {
  return (
    <section className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h2 className="text-lg font-semibold text-white mb-4">API Keys</h2>
      <div className="space-y-4">
        {COMMON_API_KEYS.map(({ key, label }) => {
          const configured = isSecretConfigured(secrets, key)
          const active = key === activeSecretKey
          return (
            <div
              key={key}
              className={`bg-gray-900 rounded-lg p-4 border ${
                active ? 'border-blue-500' : 'border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{label}</span>
                  {active && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-300">
                      Active provider
                    </span>
                  )}
                </div>
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
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  value={secretInputs[key] || ''}
                  onChange={(e) => onInputChange(key, e.target.value)}
                  placeholder={configured ? 'Enter new key to replace' : 'Enter API key'}
                  className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none text-sm min-w-0"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => onSaveKey(key)}
                    disabled={savingKeys[key] || !secretInputs[key]?.trim()}
                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm"
                  >
                    {savingKeys[key] ? 'Saving...' : 'Save'}
                  </button>
                  {configured && (
                    <button
                      onClick={() => onDeleteKey(key)}
                      disabled={savingKeys[key]}
                      className="flex-1 sm:flex-none px-4 py-2 bg-red-600/80 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 font-medium text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-gray-500 mt-4">
        Keys are stored server-side in your data directory. Only masked values are shown.
      </p>
    </section>
  )
}
