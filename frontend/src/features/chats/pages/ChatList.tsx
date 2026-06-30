import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../../../api/client'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui'
import type { Character } from '../../characters/types'

interface ChatFile {
  file_id: string
  file_name: string
}

interface ChatListItem {
  character: Character
  file: ChatFile
}

function ChatList() {
  const navigate = useNavigate()
  const [characters, setCharacters] = useState<Character[]>([])
  const [chatFilesByCharacter, setChatFilesByCharacter] = useState<Record<string, ChatFile[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const chars = await apiPost<Character[]>('/api/characters/all', {})
        if (cancelled) return
        setCharacters(chars || [])

        const filesByCharacter: Record<string, ChatFile[]> = {}
        await Promise.all(
          (chars || []).map(async (character) => {
            try {
              const files = await apiPost<ChatFile[]>('/api/characters/chats', {
                avatar_url: character.avatar,
                simple: true,
              })
              if (cancelled) return
              if (Array.isArray(files) && files.length > 0) {
                filesByCharacter[character.avatar] = files
              }
            } catch {
              // Ignore per-character chat fetch errors
            }
          }),
        )

        if (cancelled) return
        setChatFilesByCharacter(filesByCharacter)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load chats')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const parseChatTimestamp = (fileName: string): number => {
    const match = fileName.match(/(\d{4})-(\d{2})-(\d{2})@(\d{2})h(\d{2})m(\d{2})s(\d+)ms/)
    if (!match) return 0
    const [, year, month, day, hour, minute, second, ms] = match
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}.${ms}`).getTime()
  }

  const items = useMemo<ChatListItem[]>(() => {
    const list: ChatListItem[] = []
    for (const character of characters) {
      const files = chatFilesByCharacter[character.avatar] || []
      for (const file of files) {
        list.push({ character, file })
      }
    }
    // Newest first based on the actual timestamp embedded in the filename
    return list.sort((a, b) => parseChatTimestamp(b.file.file_name) - parseChatTimestamp(a.file.file_name))
  }, [characters, chatFilesByCharacter])

  const formatChatDate = (fileName: string) => {
    const match = fileName.match(/(\d{4})-(\d{2})-(\d{2})@(\d{2})h(\d{2})m(\d{2})s(\d+)ms/)
    if (!match) return fileName.replace(/\.jsonl$/i, '')
    const [, year, month, day, hour, minute] = match
    const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`)
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) return <LoadingState message="Loading chats..." />
  if (error) return <ErrorState title="Couldn’t load chats" message={error} onRetry={() => window.location.reload()} />

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Chats</h1>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          New Chat
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No chats yet"
          description="Start a conversation from the Characters page."
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map(({ character, file }) => (
            <div
              key={`${character.avatar}-${file.file_id}`}
              onClick={() =>
                navigate(`/chat?avatar=${encodeURIComponent(character.avatar)}&chat=${encodeURIComponent(file.file_id)}`)
              }
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4 hover:border-blue-500 cursor-pointer transition-colors group"
            >
              <img
                src={`/characters/${encodeURIComponent(character.avatar)}`}
                alt={character.name}
                className="w-12 h-12 rounded-full object-cover bg-gray-800"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                    {character.name}
                  </h2>
                  <span className="text-xs text-gray-500 shrink-0 ml-2">
                    {formatChatDate(file.file_name)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  Chat session
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ChatList
