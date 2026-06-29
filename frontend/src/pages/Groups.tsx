import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../components/ui'
import type { Group } from '../types/group'
import { deleteGroup, fetchGroups } from '../utils/group'

function Groups() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadGroups = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchGroups()
      setGroups(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroups()
  }, [])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this group and all its chats?')) return
    try {
      setDeleting(id)
      await deleteGroup(id)
      setGroups((prev) => prev.filter((g) => g.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete group')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) return <LoadingState message="Loading groups..." />
  if (error) return <ErrorState title="Failed to load groups" message={error} onRetry={loadGroups} />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Groups</h1>
        <button
          onClick={() => navigate('/groups/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
        >
          + Create Group
        </button>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="No groups yet"
          description="Create a group to chat with multiple characters at once."
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500 transition-colors"
            >
              <div
                onClick={() => navigate(`/chat?group=${encodeURIComponent(group.id)}`)}
                className="cursor-pointer"
              >
                <div className="aspect-square bg-gray-700 flex items-center justify-center overflow-hidden">
                  {group.members.slice(0, 4).map((avatar, idx) => (
                    <img
                      key={avatar}
                      src={`/characters/${encodeURIComponent(avatar)}`}
                      alt=""
                      className="w-1/2 h-1/2 object-cover"
                      style={{ opacity: idx === 0 ? 1 : 0.7 }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ))}
                  {group.members.length === 0 && (
                    <span className="text-gray-400 text-sm">No members</span>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-white truncate">{group.name}</h2>
                  <div className="mt-2 text-sm text-gray-400">
                    {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {group.chats?.length || 0} chat{group.chats?.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div className="px-4 pb-4">
                <button
                  onClick={() => handleDelete(group.id)}
                  disabled={deleting === group.id}
                  className="w-full px-3 py-2 bg-red-600/80 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm font-medium transition-colors"
                >
                  {deleting === group.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Groups
