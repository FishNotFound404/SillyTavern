import { useMemo, useRef, useState } from 'react'
import { LoadingState, ErrorState } from '../../../components/ui'
import type { Persona, PersonaState } from '../types'
import {
  useDeletePersonaAvatar,
  usePersonaBundle,
  useSavePersonaState,
  useUploadPersonaAvatar,
  parsePersonaBundle,
} from '../api'
import type { SettingsBundleResponse } from '../../../api/types'
import {
  generatePersonaId,
  getPersonaAvatarUrl,
} from '../utils'

function Personas() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const bundleQuery = usePersonaBundle()
  const savePersonaMutation = useSavePersonaState()
  const uploadAvatarMutation = useUploadPersonaAvatar()
  const deleteAvatarMutation = useDeletePersonaAvatar()

  const bundle: SettingsBundleResponse | null = bundleQuery.data ?? null
  const state = useMemo(() => parsePersonaBundle(bundle), [bundle])
  const loading = bundleQuery.isLoading
  const saving =
    savePersonaMutation.isPending ||
    uploadAvatarMutation.isPending ||
    deleteAvatarMutation.isPending

  const persistState = async (nextState: PersonaState) => {
    setError(null)
    setSaveMessage(null)
    try {
      await savePersonaMutation.mutateAsync({ currentBundle: bundle, state: nextState })
      setSaveMessage('Personas saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save personas')
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !file) return

    try {
      setError(null)
      setSaveMessage(null)
      const avatar = await uploadAvatarMutation.mutateAsync(file)
      const newPersona: Persona = {
        id: generatePersonaId(),
        name: name.trim(),
        description: description.trim(),
        avatar,
      }
      const nextState: PersonaState = {
        personas: [...state.personas, newPersona],
        defaultId: state.defaultId || newPersona.id,
      }
      await savePersonaMutation.mutateAsync({ currentBundle: bundle, state: nextState })
      setName('')
      setDescription('')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create persona')
    }
  }

  const handleSetDefault = (id: string) => {
    persistState({ ...state, defaultId: id })
  }

  const handleDelete = async (persona: Persona) => {
    if (!window.confirm(`Delete persona "${persona.name}"?`)) return
    try {
      await deleteAvatarMutation.mutateAsync(persona.avatar)
      const nextPersonas = state.personas.filter((p) => p.id !== persona.id)
      const nextDefaultId = state.defaultId === persona.id
        ? (nextPersonas[0]?.id || null)
        : state.defaultId
      await savePersonaMutation.mutateAsync({
        currentBundle: bundle,
        state: { personas: nextPersonas, defaultId: nextDefaultId },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete persona')
    }
  }

  if (loading) return <LoadingState message="Loading personas..." />
  if (error && state.personas.length === 0) {
    return <ErrorState title="Failed to load personas" message={error} />
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Personas</h1>

      {saveMessage && (
        <div className="mb-4 px-4 py-2 bg-green-900/50 border border-green-700 rounded-lg text-green-200 text-sm">
          {saveMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-2 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      <section className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Create Persona</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Persona name"
              className="bg-gray-900 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
              required
            />
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              ref={fileInputRef}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-700 file:text-white hover:file:bg-gray-600"
              required
            />
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={3}
            className="w-full bg-gray-900 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
          />
          <button
            type="submit"
            disabled={saving || !name.trim() || !file}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm"
          >
            {saving ? 'Saving...' : 'Create Persona'}
          </button>
        </form>
      </section>

      <section className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Your Personas</h2>
        {state.personas.length === 0 ? (
          <p className="text-gray-400">No personas yet. Create one above.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.personas.map((persona) => {
              const isDefault = state.defaultId === persona.id
              return (
                <div
                  key={persona.id}
                  className={`bg-gray-900 rounded-lg p-4 border ${
                    isDefault ? 'border-blue-500' : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={getPersonaAvatarUrl(persona.avatar)}
                      alt={persona.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-white font-medium">{persona.name}</h3>
                      {isDefault && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-300">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                  {persona.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-3">{persona.description}</p>
                  )}
                  <div className="flex gap-2">
                    {!isDefault && (
                      <button
                        onClick={() => handleSetDefault(persona.id)}
                        disabled={saving}
                        className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(persona)}
                      disabled={saving}
                      className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default Personas