import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Character } from '../types'

function Characters() {
  const navigate = useNavigate()
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/characters/all', { method: 'POST' })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        setCharacters(data || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Loading characters...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-red-400">Error loading characters: {error}</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Characters</h1>
        <span className="text-gray-400">{characters.length} total</span>
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          No characters found. Add one in the legacy UI first.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {characters.map((character) => (
            <div
              key={character.avatar}
              onClick={() => navigate(`/character/${encodeURIComponent(character.avatar)}`)}
              className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer group"
            >
              <div className="aspect-square bg-gray-700 flex items-center justify-center overflow-hidden">
                <img
                  src={`/characters/${encodeURIComponent(character.avatar)}`}
                  alt={character.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    e.currentTarget.src = '/img/default-user.png'
                  }}
                />
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold text-white truncate">
                  {character.name}
                </h2>
                {character.description && (
                  <p className="text-gray-400 text-sm mt-2 line-clamp-3">
                    {character.description}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <span>{character.chat_size} chats</span>
                  {character.create_date && (
                    <span>{new Date(character.create_date).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Characters
