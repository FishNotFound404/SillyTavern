import { useNavigate } from 'react-router-dom'
import { LoadingState } from '../../../components/ui'
import { CharacterAvatarUpload } from '../components/CharacterAvatarUpload'
import { CharacterFormFields } from '../components/CharacterFormFields'
import { CharacterAdvancedFields } from '../components/CharacterAdvancedFields'
import { CharacterEditActions } from '../components/CharacterEditActions'
import { useCharacterEdit } from '../hooks/useCharacterEdit'

function CharacterEdit() {
  const navigate = useNavigate()
  const {
    draft,
    currentAvatarUrl,
    loading,
    error,
    saving,
    isCreate,
    avatarParam,
    updateField,
    handleFileSelect,
    handleSubmit,
  } = useCharacterEdit()

  const handleCancel = () => {
    navigate(isCreate ? '/' : `/character/${encodeURIComponent(avatarParam || '')}`)
  }

  if (loading) {
    return <LoadingState message="Loading character..." />
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">
          {isCreate ? 'Create Character' : `Edit ${draft.name || 'Character'}`}
        </h1>
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-8">
            <CharacterAvatarUpload
              currentAvatarUrl={currentAvatarUrl}
              hasNewFile={draft.avatarFile !== null}
              onFileSelect={handleFileSelect}
            />

            <CharacterFormFields draft={draft} onFieldChange={updateField} />
          </div>
        </div>

        <CharacterAdvancedFields draft={draft} onFieldChange={updateField} />

        <CharacterEditActions
          isCreate={isCreate}
          isSaving={saving}
          canSave={draft.name.trim().length > 0}
          onCancel={handleCancel}
          onSubmit={handleSubmit}
        />
      </form>
    </div>
  )
}

export default CharacterEdit
