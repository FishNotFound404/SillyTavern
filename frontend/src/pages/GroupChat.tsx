import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { apiPost } from '../api/client'
import { LoadingState, ErrorState, EmptyState } from '../components/ui'
import { ChatMessageBubble } from '../components/ChatMessageBubble'
import type { Character, ChatMessage, ChatMetadata, Group, PersonaState } from '../types'
import {
  buildGenerationRequest,
  readConnectionSettings,
  DEFAULT_CONNECTION,
} from '../utils/connection'
import { streamCompletion } from '../utils/stream'
import {
  fetchGroup,
  fetchGroupChat,
  fetchGroupMembers,
  pickNextSpeaker,
  saveGroupChat,
  updateGroup,
} from '../utils/group'
import {
  getDefaultPersona,
  getPersonaAvatarUrl,
  readPersonaState,
} from '../utils/persona'

type ChatLine = ChatMetadata | ChatMessage

function isChatMessage(line: ChatLine): line is ChatMessage {
  return 'is_user' in line
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
}

function createChatMetadata(): ChatMetadata {
  return {
    chat_metadata: {
      integrity: generateUUID(),
      note_prompt: '',
      note_interval: 1,
      note_position: 1,
      note_depth: 4,
      note_role: 0,
      tainted: true,
    },
    user_name: 'User',
    character_name: 'Group',
  }
}

function buildSystemPrompt(character: Character): string {
  const parts = [
    `Write ${character.name}'s next reply in a fictional group chat.`,
    character.description && `Description: ${character.description}`,
    character.personality && `Personality: ${character.personality}`,
    character.scenario && `Scenario: ${character.scenario}`,
    `You are ${character.name}. Stay in character and respond as ${character.name}.`,
  ].filter(Boolean)
  return parts.join('\n\n')
}

function getLastSpeakerName(messages: ChatMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (!messages[i].is_user) return messages[i].name
  }
  return null
}

export default function GroupChat() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const groupId = searchParams.get('group')

  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Character[]>([])
  const [chatData, setChatData] = useState<ChatLine[]>([])
  const [input, setInput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [currentSpeaker, setCurrentSpeaker] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [personaState, setPersonaState] = useState<PersonaState>({ personas: [], defaultId: null })
  const [connection, setConnection] = useState(DEFAULT_CONNECTION)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activePersona = getDefaultPersona(personaState)
  const activePersonaName = activePersona?.name || 'User'
  const activePersonaAvatar = activePersona ? getPersonaAvatarUrl(activePersona.avatar) : undefined

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!groupId) {
        setError('No group selected')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const [groupData, settings] = await Promise.all([
          fetchGroup(groupId),
          apiPost<{ settings: string }>('/api/settings/get', {}),
        ])

        if (cancelled) return
        setGroup(groupData)
        setConnection(readConnectionSettings(settings?.settings ? JSON.parse(settings.settings) : {}))
        setPersonaState(readPersonaState(settings?.settings ? JSON.parse(settings.settings) : {}))

        const memberData = await fetchGroupMembers(groupData.members)
        if (cancelled) return
        setMembers(memberData)

        const chat = await fetchGroupChat(groupData.chat_id)
        if (cancelled) return
        setChatData(Array.isArray(chat) ? (chat as ChatLine[]) : [])
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load group chat')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [groupId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatData, generating])

  const chatMessages = chatData.filter(isChatMessage)

  const matchIndices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return []
    return chatMessages
      .map((message, index) => ({ message, index }))
      .filter(({ message }) => stripThinkTags(message.mes).toLowerCase().includes(query))
      .map(({ index }) => index)
  }, [chatMessages, searchQuery])

  useEffect(() => {
    setCurrentMatchIndex(0)
  }, [matchIndices.length])

  useEffect(() => {
    if (matchIndices.length === 0) return
    const index = matchIndices[currentMatchIndex]
    if (index === undefined) return
    const element = document.getElementById(`msg-${index}`)
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [matchIndices, currentMatchIndex])

  const saveMessages = async (messages: ChatLine[]) => {
    if (!group) return
    try {
      await saveGroupChat(group.chat_id, messages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save chat')
    }
  }

  const generateReply = async (speaker: Character, workingChat: ChatLine[], signal?: AbortSignal) => {
    const historyMessages = workingChat.filter(isChatMessage)
    const lastMessage = historyMessages[historyMessages.length - 1]
    const needsContinuePrompt = lastMessage && !lastMessage.is_user
    const { endpoint, body } = buildGenerationRequest(connection, {
      systemPrompt: buildSystemPrompt(speaker),
      historyMessages,
      userMessage: needsContinuePrompt ? 'Continue the conversation.' : undefined,
      userName: activePersonaName,
      charName: speaker.name,
    })

    let streamedText = ''
    const reply: ChatMessage = {
      name: speaker.name,
      is_user: false,
      mes: '',
      send_date: new Date().toISOString(),
    }

    workingChat = [...workingChat, reply]
    setChatData(workingChat)

    for await (const delta of streamCompletion(endpoint, body, signal)) {
      streamedText += delta
      reply.mes = streamedText
      workingChat = [...workingChat.slice(0, -1), { ...reply }]
      setChatData(workingChat)
    }

    reply.mes = stripThinkTags(streamedText)
    const finalChat = [...workingChat.slice(0, -1), { ...reply }]
    setChatData(finalChat)
    await saveMessages(finalChat)
  }

  const handleSend = async () => {
    if (!input.trim() || !group || members.length === 0 || generating) return

    const userText = input.trim()
    setInput('')
    setGenerating(true)
    setError(null)

    let workingChat = chatData.length === 0 ? [createChatMetadata()] : chatData
    const userMessage: ChatMessage = {
      name: activePersonaName,
      is_user: true,
      mes: userText,
      send_date: new Date().toISOString(),
    }
    workingChat = [...workingChat, userMessage]
    setChatData(workingChat)
    await saveMessages(workingChat)

    const lastSpeaker = getLastSpeakerName(workingChat.filter(isChatMessage))
    const speaker = pickNextSpeaker(members, lastSpeaker, group.allow_self_responses)
    if (!speaker) {
      setGenerating(false)
      return
    }

    setCurrentSpeaker(speaker)
    try {
      await generateReply(speaker, workingChat)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
      setCurrentSpeaker(null)
    }
  }

  const handleMemberReply = async (member: Character) => {
    if (generating || !group) return
    setGenerating(true)
    setCurrentSpeaker(member)
    setError(null)

    let workingChat = chatData.length === 0 ? [createChatMetadata()] : chatData
    try {
      await generateReply(member, workingChat)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
      setCurrentSpeaker(null)
    }
  }

  const handleNewChat = async () => {
    if (!group) return
    const newId = generateUUID()
    const updated: Group = { ...group, chat_id: newId, chats: [newId] }
    try {
      await updateGroup(updated)
      const initial: ChatLine[] = [createChatMetadata()]
      await saveGroupChat(newId, initial)
      setGroup(updated)
      setChatData(initial)
      setSearchParams({ group: group.id, chat: newId })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create new chat')
    }
  }

  if (loading) return <LoadingState message="Loading group chat..." />
  if (error || !group) {
    return (
      <ErrorState
        title="Failed to load group chat"
        message={error || 'Group not found'}
        onRetry={() => window.location.reload()}
      />
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-gray-950">
      {/* Members sidebar */}
      <aside className="w-full md:w-64 bg-gray-900 border-r border-gray-800 p-4 flex-shrink-0 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Members</h2>
          <button
            onClick={() => navigate('/groups')}
            className="text-xs text-gray-400 hover:text-white"
          >
            Back
          </button>
        </div>
        <div className="space-y-2">
          {members.map((member) => (
            <button
              key={member.avatar}
              onClick={() => handleMemberReply(member)}
              disabled={generating}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                currentSpeaker?.avatar === member.avatar
                  ? 'bg-blue-600/30 border border-blue-500'
                  : 'bg-gray-800 hover:bg-gray-700 border border-transparent'
              }`}
            >
              <img
                src={`/characters/${encodeURIComponent(member.avatar)}`}
                alt={member.name}
                className="w-8 h-8 rounded-full object-cover bg-gray-700"
              />
              <span className="text-sm text-white truncate">{member.name}</span>
            </button>
          ))}
        </div>
        <button
          onClick={handleNewChat}
          disabled={generating}
          className="mt-4 w-full px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm font-medium"
        >
          New Group Chat
        </button>
      </aside>

      {/* Chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              G
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-semibold truncate">{group.name}</h1>
              {currentSpeaker && (
                <p className="text-xs text-blue-300 truncate">
                  {currentSpeaker.name} is speaking...
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-2 py-1.5 border border-gray-700 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none w-24"
            />
            {matchIndices.length > 0 && (
              <span className="text-xs text-gray-400">
                {currentMatchIndex + 1}/{matchIndices.length}
              </span>
            )}
            <button
              onClick={() => setCurrentMatchIndex((prev) => (prev - 1 + matchIndices.length) % matchIndices.length)}
              disabled={matchIndices.length === 0}
              className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
              title="Previous match"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentMatchIndex((prev) => (prev + 1) % matchIndices.length)}
              disabled={matchIndices.length === 0}
              className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
              title="Next match"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 text-gray-400 hover:text-white"
                title="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 && !generating && (
            <EmptyState
              title="Start the group chat"
              description="Send a message or click a member to make them speak."
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
            />
          )}
          {chatMessages.map((message, index) => {
            const member = members.find((m) => m.name === message.name)
            const avatarUrl = message.is_user
              ? activePersonaAvatar
              : member && `/characters/${encodeURIComponent(member.avatar)}`
            return (
              <div
                key={index}
                id={`msg-${index}`}
              >
                <ChatMessageBubble
                  message={message}
                  avatarUrl={avatarUrl}
                  isUser={message.is_user}
                  query={searchQuery}
                />
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-gray-900 border-t border-gray-800 p-4">
          {error && (
            <div className="mb-3 px-4 py-2 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Type a message to the group..."
              rows={2}
              className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
            />
            <button
              onClick={handleSend}
              disabled={generating || !input.trim()}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
            >
              {generating ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
