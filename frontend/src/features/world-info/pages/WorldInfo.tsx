import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoadingState, EmptyState, ErrorState } from '../../../components/ui'
import { useWorldInfos, useDeleteWorldInfo, useSaveWorldInfo } from '../api'

function WorldInfo() {
  const navigate = useNavigate()
  const { data: worlds = [], isLoading: loading, error, refetch } = useWorldInfos()
  const deleteMutation = useDeleteWorldInfo()
  const createMutation = useSaveWorldInfo()
  const [filter, setFilter] = useState('')

  const filteredWorlds = filter.trim()
    ? worlds.filter((world) =>
        (world.name || world.file_id).toLowerCase().includes(filter.toLowerCase()),
      )
    : worlds

  const handleCreate = async () => {
    const name = window.prompt('New world info name:')?.trim()
    if (!name) return

    try {
      await createMutation.mutateAsync({ name, data: { name, entries: {} } })
      navigate(`/world-info/${encodeURIComponent(name)}`)
    } catch {
      // mutation error is surfaced below
    }
  }

  const handleDelete = async (fileId: string) => {
    if (!window.confirm(`Delete "${fileId}"? This cannot be undone.`)) return
    try {
      await deleteMutation.mutateAsync(fileId)
    } catch {
      // mutation error is surfaced below
    }
  }

  if (loading) return <LoadingState message="Loading world info..." />
  if (error) return <ErrorState title="Couldn’t load world info" message={error.message} onRetry={() => refetch()} />

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">World Info / Lorebooks</h1>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search world info..."
            className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            New World Info
          </button>
        </div>
      </div>

      {(createMutation.error?.message || deleteMutation.error?.message) && (
        <div className="mb-4 px-4 py-2 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
          {createMutation.error?.message || deleteMutation.error?.message}
        </div>
      )}

      {filteredWorlds.length === 0 ? (
        <EmptyState
          title="No world info yet"
          description="World Info (also called Lorebooks) lets you inject text into the prompt when certain keywords appear. Create one to get started."
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredWorlds.map((world) => (
            <div
              key={world.file_id}
              onClick={() => navigate(`/world-info/${encodeURIComponent(world.file_id)}`)}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-blue-500 cursor-pointer transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {world.name || world.file_id}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">{world.file_id}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(world.file_id)
                  }}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-lg"
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default WorldInfo
