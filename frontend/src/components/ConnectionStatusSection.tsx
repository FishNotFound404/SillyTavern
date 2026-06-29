import type { BackendStatus } from '../types/settings'

interface ConnectionStatusSectionProps {
  backend: BackendStatus
}

export function ConnectionStatusSection({ backend }: ConnectionStatusSectionProps) {
  return (
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
  )
}
