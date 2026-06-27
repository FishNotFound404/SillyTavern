import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiPost } from '../api/client'
import type { Character } from '../types'

function CharacterDetail() {
  const { avatar } = useParams<{ avatar: string }>()
  const navigate = useNavigate()
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!avatar) {
      setError('No character selected')
      setLoading(false)
      return
    }

    apiPost<Character>('/api/characters/get', { avatar_url: decodeURIComponent(avatar) })
      .then((data) => {
        setCharacter(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [avatar])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Loading character...</div>
      </div>
    )
  }

  if (error || !character) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-red-400">Error: {error || 'Character not found'}</div>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Characters
        </button>
      </div>
    )
  }

  const avatarUrl = `/characters/${encodeURIComponent(character.avatar)}`

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
              {character.chat_size} chats
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default CharacterDetail
