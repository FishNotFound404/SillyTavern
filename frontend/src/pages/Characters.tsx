import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../api/client'
import { Skeleton, EmptyState, ErrorState, CharacterCardSkeleton } from '../components/ui'
import type { Character } from '../types'

function Characters() {
  const navigate = useNavigate()
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCharacters = () => {
    setLoading(true)
    setError(null)
    apiPost<Character[]>('/api/characters/all', {})
      .then((data) => {
        setCharacters(data || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadCharacters()
  }, [])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Characters</h1>
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <CharacterCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load characters"
        message={error}
        onRetry={loadCharacters}
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Characters</h1>
        <span className="text-gray-400">{characters.length} total</span>
      </div>

      {characters.length === 0 ? (
        <EmptyState
          title="No characters yet"
          description="Add a character card to the characters folder, or use the legacy UI to create one."
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
          }
        />
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
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzNCODJGNiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjE4IiBmaWxsPSJ3aGl0ZSIvPjxwYXRoIGQ9Ik0yNSA4NSBRNTAgNjAgNzUgODUiIGZpbGw9IndoaXRlIi8+PC9zdmc+'
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
                  <span>{(character.chat_file_count ?? character.chat_size) || 0} chats</span>
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
