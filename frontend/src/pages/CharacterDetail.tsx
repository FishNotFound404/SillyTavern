import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiPost } from '../api/client'
import { CharacterDetailSkeleton, ErrorState } from '../components/ui'
import type { Character } from '../types'
import type { WorldInfoSummary } from '../types/worldInfo'

function CharacterDetail() {
  const { avatar } = useParams<{ avatar: string }>()
  const navigate = useNavigate()
  const [character, setCharacter] = useState<Character | null>(null)
  const [worlds, setWorlds] = useState<WorldInfoSummary[]>([])
  const [selectedWorld, setSelectedWorld] = useState('')
  const [savingWorld, setSavingWorld] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCharacter = () => {
    if (!avatar) {
      setError('No character selected')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    Promise.all([
      apiPost<Character>('/api/characters/get', { avatar_url: decodeURIComponent(avatar) }),
      apiPost<WorldInfoSummary[]>('/api/worldinfo/list', {}),
    ])
      .then(([charData, worldsData]) => {
        setCharacter(charData)
        setWorlds(Array.isArray(worldsData) ? worldsData : [])
        const currentWorld = charData.world || charData.data?.extensions?.world || ''
        setSelectedWorld(currentWorld)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadCharacter()
  }, [avatar])

  const handleSaveWorld = async () => {
    if (!character) return
    try {
      setSavingWorld(true)
      await apiPost('/api/characters/world', {
        avatar_url: character.avatar,
        world: selectedWorld,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update world info')
    } finally {
      setSavingWorld(false)
    }
  }

  if (loading) {
    return <CharacterDetailSkeleton />
  }

  if (error || !character) {
    return (
      <ErrorState
        title="Character not found"
        message={error || 'The requested character could not be loaded.'}
        onRetry={() => {
          if (error) loadCharacter()
          else navigate('/')
        }}
      />
    )
  }

  const avatarUrl = `/characters/${encodeURIComponent(character.avatar)}`
  const currentWorldName = worlds.find((w) => w.file_id === selectedWorld)?.name || selectedWorld

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('/')}
        className="mb-6 px-4 py-2 text-gray-300 hover:text-white transition-colors"
      >
        ← Back to Characters
      </button>

      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-80 lg:w-96 bg-gray-900 p-6 flex flex-col items-center">
            <img
              src={avatarUrl}
              alt={character.name}
              className="w-64 h-64 rounded-xl object-cover shadow-lg"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzNCODJGNiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjE4IiBmaWxsPSJ3aGl0ZSIvPjxwYXRoIGQ9Ik0yNSA4NSBRNTAgNjAgNzUgODUiIGZpbGw9IndoaXRlIi8+PC9zdmc+'
              }}
            />
            <h1 className="text-2xl font-bold text-white mt-6 text-center">
              {character.name}
            </h1>
            <div className="mt-2 text-gray-400 text-sm">
              {(character.chat_file_count ?? character.chat_size) || 0} chats
            </div>
            {character.create_date && (
              <div className="text-gray-500 text-xs mt-1">
                Created {new Date(character.create_date).toLocaleDateString()}
              </div>
            )}
            <button
              onClick={() => navigate(`/chat?avatar=${encodeURIComponent(character.avatar)}`)}
              className="mt-6 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
            >
              Start Chat
            </button>
          </div>

          <div className="flex-1 p-6 md:p-8 space-y-6">
            {character.description && (
              <section>
                <h2 className="text-lg font-semibold text-white mb-2">Description</h2>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {character.description}
                </p>
              </section>
            )}

            {character.personality && (
              <section>
                <h2 className="text-lg font-semibold text-white mb-2">Personality</h2>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {character.personality}
                </p>
              </section>
            )}

            {character.scenario && (
              <section>
                <h2 className="text-lg font-semibold text-white mb-2">Scenario</h2>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {character.scenario}
                </p>
              </section>
            )}

            {character.first_mes && (
              <section>
                <h2 className="text-lg font-semibold text-white mb-2">First Message</h2>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {character.first_mes}
                  </p>
                </div>
              </section>
            )}

            <section className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-3">World Info / Lorebook</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedWorld}
                  onChange={(e) => setSelectedWorld(e.target.value)}
                  className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">None</option>
                  {worlds.map((world) => (
                    <option key={world.file_id} value={world.file_id}>
                      {world.name || world.file_id}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSaveWorld}
                  disabled={savingWorld}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {savingWorld ? 'Saving...' : 'Save'}
                </button>
              </div>
              {selectedWorld && (
                <p className="text-sm text-gray-500 mt-2">
                  Associated with <span className="text-blue-400">{currentWorldName}</span>
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CharacterDetail
