import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useCharacters, characterKeys } from '../api'
import CharacterImportModal from '../components/CharacterImportModal'
import { Skeleton, EmptyState, ErrorState, CharacterCardSkeleton } from '../../../components/ui'

function Characters() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: characters = [], isLoading: loading, error } = useCharacters()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [importOpen, setImportOpen] = useState(false)

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const character of characters) {
      for (const tag of character.tags || []) {
        tagSet.add(tag)
      }
    }
    return Array.from(tagSet).sort()
  }, [characters])

  const filteredCharacters = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return characters.filter((character) => {
      const matchesQuery =
        !query ||
        character.name.toLowerCase().includes(query) ||
        (character.description?.toLowerCase() || '').includes(query) ||
        (character.personality?.toLowerCase() || '').includes(query)

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => (character.tags || []).includes(tag))

      return matchesQuery && matchesTags
    })
  }, [characters, searchQuery, selectedTags])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedTags([])
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
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
        message={error.message}
        onRetry={() => queryClient.invalidateQueries({ queryKey: characterKeys.all })}
      />
    )
  }

  const hasFilters = searchQuery.trim() || selectedTags.length > 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">Characters</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <button
            onClick={() => setImportOpen(true)}
            aria-label="Import Character"
            className="px-3 sm:px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 font-medium text-sm transition-colors"
          >
            Import
          </button>
          <button
            onClick={() => navigate('/character/new')}
            aria-label="Create Character"
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
          >
            + Create
          </button>
          <span className="text-gray-400 text-sm">
            {hasFilters ? `${filteredCharacters.length} of ${characters.length}` : `${characters.length} total`}
          </span>
        </div>
      </div>

      <CharacterImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(avatar) => {
          queryClient.invalidateQueries({ queryKey: characterKeys.all })
          const avatarFile = avatar.endsWith('.png') ? avatar : `${avatar}.png`
          navigate(`/character/${encodeURIComponent(avatarFile)}`)
        }}
      />

      {/* Search */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, description, or personality..."
          className="w-full bg-gray-800 text-white rounded-lg pl-10 pr-4 py-3 border border-gray-700 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {allTags.map((tag) => {
            const selected = selectedTags.includes(tag)
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  selected
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                {tag}
              </button>
            )
          })}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-400 hover:text-white underline ml-2"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {filteredCharacters.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No matching characters' : 'No characters yet'}
          description={
            hasFilters
              ? 'Try adjusting your search or tags.'
              : 'Create your first character with the button above, or import a character card into the characters folder.'
          }
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
          {filteredCharacters.map((character) => (
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
