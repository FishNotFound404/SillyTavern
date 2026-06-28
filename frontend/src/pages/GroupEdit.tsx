import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../api/client'
import { EmptyState, ErrorState, LoadingState } from '../components/ui'
import type { Character } from '../types'
import { createGroup } from '../utils/group'

function GroupEdit() {
  const navigate = useNavigate()
  const [characters, setCharacters] = useState<Character[]>([])
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [allowSelfResponses, setAllowSelfResponses] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiPost<Character[]>('/api/characters/all', {})
      .then((data) => {
        if (cancelled) return
        setCharacters(data || [])
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load characters')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const toggleMember = (avatar: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(avatar)) next.delete(avatar)
      else next.add(avatar)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || selected.size === 0) {
      setError('Group name and at least one member are required')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const group = await createGroup({
        name: name.trim(),
        members: Array.from(selected),
        allow_self_responses: allowSelfResponses,
      })
      navigate(`/chat?group=${encodeURIComponent(group.id)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group')
      setSaving(false)
    }
  }

  if (loading) return <LoadingState message="Loading characters..." />
  if (error && characters.length === 0) return <ErrorState title="Failed to load characters" message={error} onRetry={() => window.location.reload()} />

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Create Group</h1>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <label htmlFor="group-name" className="block text-sm font-medium text-gray-300 mb-2">
            Group Name
          </label>
          <input
            id="group-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Tavern Regulars"
            className="w-full bg-gray-900 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Members</h2>
          {characters.length === 0 ? (
            <EmptyState
              title="No characters"
              description="Create or import a character before making a group."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {characters.map((character) => {
                const active = selected.has(character.avatar)
                return (
                  <button
                    key={character.avatar}
                    type="button"
                    onClick={() => toggleMember(character.avatar)}
                    className={`flex flex-col items-center p-4 rounded-xl border transition-colors ${
                      active
                        ? 'bg-blue-900/30 border-blue-500'
                        : 'bg-gray-900 border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <img
                      src={`/characters/${encodeURIComponent(character.avatar)}`}
                      alt={character.name}
                      className="w-16 h-16 rounded-full object-cover bg-gray-800"
                    />
                    <span className="mt-3 text-sm text-white text-center truncate w-full">
                      {character.name}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allowSelfResponses}
              onChange={(e) => setAllowSelfResponses(e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-white">Allow the same character to reply twice in a row</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/groups')}
            disabled={saving}
            className="px-5 py-2.5 text-gray-300 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim() || selected.size === 0}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default GroupEdit
