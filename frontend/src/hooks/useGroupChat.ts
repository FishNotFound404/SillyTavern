import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiPost } from '../api/client'
import type { ChatLine, ChatMessage } from '../api/types'
import type { Character } from '../features/characters/types'
import type { ConnectionSettings } from '../types/connection'
import type { Group } from '../types/group'
import type { PersonaState } from '../features/personas/types'
import { generateUUID, stripThinkTags } from '../features/chats/utils'
import { isChatMessage } from '../features/chats/utils/chatMessageActions'
import {
  buildGenerationRequest,
  DEFAULT_CONNECTION,
  readConnectionSettings,
} from '../features/settings/utils'
import {
  buildGroupSystemPrompt,
  createGroupChatMetadata,
  fetchGroup,
  fetchGroupChat,
  fetchGroupMembers,
  getLastSpeakerName,
  pickNextSpeaker,
  saveGroupChat,
  updateGroup,
} from '../utils/group'
import { getDefaultPersona, getPersonaAvatarUrl, readPersonaState } from '../features/personas/utils'
import { streamCompletion } from '../features/chats/utils/stream'

export interface UseGroupChatResult {
  // Refs
  messagesEndRef: React.RefObject<HTMLDivElement | null>

  // State
  group: Group | null
  members: Character[]
  chatData: ChatLine[]
  input: string
  setInput: (value: string) => void
  generating: boolean
  currentSpeaker: Character | null
  loading: boolean
  error: string | null
  personaState: PersonaState
  connection: ConnectionSettings
  searchQuery: string
  setSearchQuery: (value: string) => void
  currentMatchIndex: number
  sidebarOpen: boolean
  setSidebarOpen: (value: boolean) => void

  // Derived
  chatMessages: ChatMessage[]
  matchIndices: number[]
  activePersonaName: string
  activePersonaAvatar: string | undefined

  // Handlers
  handleSend: () => Promise<void>
  handleMemberReply: (member: Character) => Promise<void>
  handleNewChat: () => Promise<void>
  handlePreviousMatch: () => void
  handleNextMatch: () => void
}

export function useGroupChat(): UseGroupChatResult {
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
  const [connection, setConnection] = useState<ConnectionSettings>(DEFAULT_CONNECTION)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activePersona = getDefaultPersona(personaState)
  const activePersonaName = activePersona?.name || 'User'
  const activePersonaAvatar = activePersona ? getPersonaAvatarUrl(activePersona.avatar) : undefined

  // Load group, members, chat, and settings when groupId changes.
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

  // Scroll to the latest message when chat data or generation state changes.
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

  const saveMessages = useCallback(
    async (messages: ChatLine[]) => {
      if (!group) return
      try {
        await saveGroupChat(group.chat_id, messages)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save chat')
      }
    },
    [group],
  )

  const generateReply = useCallback(
    async (speaker: Character, workingChat: ChatLine[], signal?: AbortSignal) => {
      const historyMessages = workingChat.filter(isChatMessage)
      const lastMessage = historyMessages[historyMessages.length - 1]
      const needsContinuePrompt = lastMessage && !lastMessage.is_user
      const { endpoint, body } = buildGenerationRequest(connection, {
        systemPrompt: buildGroupSystemPrompt(speaker),
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
    },
    [connection, activePersonaName, saveMessages],
  )

  const handleSend = useCallback(async () => {
    if (!input.trim() || !group || members.length === 0 || generating) return

    const userText = input.trim()
    setInput('')
    setGenerating(true)
    setError(null)

    let workingChat = chatData.length === 0 ? [createGroupChatMetadata()] : chatData
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
  }, [input, group, members, generating, chatData, activePersonaName, saveMessages, generateReply])

  const handleMemberReply = useCallback(
    async (member: Character) => {
      if (generating || !group) return
      setGenerating(true)
      setCurrentSpeaker(member)
      setError(null)

      const workingChat = chatData.length === 0 ? [createGroupChatMetadata()] : chatData
      try {
        await generateReply(member, workingChat)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Generation failed')
      } finally {
        setGenerating(false)
        setCurrentSpeaker(null)
      }
    },
    [generating, group, chatData, generateReply],
  )

  const handleNewChat = useCallback(async () => {
    if (!group) return
    const newId = generateUUID() // need import from utils/chat
    const updated: Group = { ...group, chat_id: newId, chats: [newId] }
    try {
      await updateGroup(updated)
      const initial: ChatLine[] = [createGroupChatMetadata()]
      await saveGroupChat(newId, initial)
      setGroup(updated)
      setChatData(initial)
      setSearchParams({ group: group.id, chat: newId })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create new chat')
    }
  }, [group, setSearchParams])

  const handlePreviousMatch = useCallback(() => {
    setCurrentMatchIndex((prev) => (prev - 1 + matchIndices.length) % matchIndices.length)
  }, [matchIndices.length])

  const handleNextMatch = useCallback(() => {
    setCurrentMatchIndex((prev) => (prev + 1) % matchIndices.length)
  }, [matchIndices.length])

  return {
    messagesEndRef,
    group,
    members,
    chatData,
    input,
    setInput,
    generating,
    currentSpeaker,
    loading,
    error,
    personaState,
    connection,
    searchQuery,
    setSearchQuery,
    currentMatchIndex,
    sidebarOpen,
    setSidebarOpen,
    chatMessages,
    matchIndices,
    activePersonaName,
    activePersonaAvatar,
    handleSend,
    handleMemberReply,
    handleNewChat,
    handlePreviousMatch,
    handleNextMatch,
  }
}
