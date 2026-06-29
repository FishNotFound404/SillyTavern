import { useNavigate } from 'react-router-dom'
import { LoadingState, ErrorState } from '../../../components/ui'
import { WorldInfoHeader } from '../components/WorldInfoHeader'
import { WorldInfoEntryHeader } from '../components/WorldInfoEntryHeader'
import { WorldInfoEntryForm } from '../components/WorldInfoEntryForm'
import { useWorldInfoEdit } from '../hooks/useWorldInfoEdit'

function WorldInfoEdit() {
  const navigate = useNavigate()
  const {
    fileData,
    entries,
    loading,
    saving,
    error,
    expandedUid,
    loadWorldInfo,
    updateEntry,
    handleAddEntry,
    handleDeleteEntry,
    handleToggleEntry,
    handleSave,
  } = useWorldInfoEdit()

  if (loading) return <LoadingState message="Loading world info..." />
  if (error) return <ErrorState title="Couldn’t load world info" message={error} onRetry={loadWorldInfo} />
  if (!fileData) return <ErrorState title="Not found" message="World info file could not be loaded." onRetry={loadWorldInfo} />

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <WorldInfoHeader
        title={fileData.name || ''}
        saving={saving}
        onBack={() => navigate('/world-info')}
        onAddEntry={handleAddEntry}
        onSave={handleSave}
      />

      {entries.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No entries yet.</p>
          <p className="text-sm mt-2">Click "Add Entry" to create your first lorebook entry.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => {
            const isExpanded = expandedUid === entry.uid
            return (
              <div
                key={entry.uid}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
              >
                <WorldInfoEntryHeader
                  entry={entry}
                  isExpanded={isExpanded}
                  onToggle={() => handleToggleEntry(entry.uid)}
                  onDelete={() => handleDeleteEntry(entry.uid)}
                />
                {isExpanded && (
                  <WorldInfoEntryForm
                    entry={entry}
                    onChange={(patch) => updateEntry(entry.uid, patch)}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default WorldInfoEdit
