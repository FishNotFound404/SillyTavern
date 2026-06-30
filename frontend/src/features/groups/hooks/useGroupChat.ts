import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import type { ChatLine, ChatMessage } from '../../../api/types'
import type { Character } from '../../characters/types'
import type { ConnectionSettings } from '../../settings/types'
import type { PersonaState } from '../../personas/types'
import { generateUUID, stripThinkTags } from '../../chats/utils'
import { isChatMessage } from '../../chats/utils/chatMessageActions'
import {
  buildGenerationRequest,
  DEFAULT_CONNECTION,
  readConnectionSettings,
} from '../../settings/utils'
import {
  buildGroupSystemPrompt,
  createGroupChatMetadata,
  getLastSpeakerName,
  pickNextSpeaker,
} from '../utils'
import type { Group } from '../types'
import {
  getDefaultPersona,
  getPersonaAvatarUrl,
  readPersonaState,
} from '../../personas/utils'
import { streamCompletion } from '../../chats/utils/stream'
import { useSettingsBundle } from '../../settings/api'
import {
  useGroup,
  useGroupChat as useGroupChatQuery,
  useGroupMembers,
  useSaveGroupChat,
  useUpdateGroup,
} from '../api'

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
  const queryClient = useQueryClient()
  const groupId = searchParams.get('group')

  const [chatData, setChatData] = useState<ChatLine[]>([])
  const [chatDataSyncedFrom, setChatDataSyncedFrom] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [currentSpeaker, setCurrentSpeaker] = useState<Character | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Queries
  const groupQuery = useGroup(groupId || undefined)
  const settingsBundleQuery = useSettingsBundle()
  const membersQuery = useGroupMembers(groupQuery.data?.members)
  const chatSessionQuery = useGroupChatQuery(groupQuery.data?.chat_id)
  const saveChatMutation = useSaveGroupChat()
  const updateGroupMutation = useUpdateGroup()

  // Derived
  const group = groupQuery.data ?? null
  const members = membersQuery.data ?? []
  const connection = useMemo<ConnectionSettings>(() => {
    const raw = settingsBundleQuery.data?.settings
    if (!raw) return DEFAULT_CONNECTION
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      return readConnectionSettings(parsed)
    } catch {
      return DEFAULT_CONNECTION
    }
  }, [settingsBundleQuery.data])
  const personaState = useMemo<PersonaState>(() => {
    const raw = settingsBundleQuery.data?.settings
    if (!raw) return { personas: [], defaultId: null }
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      return readPersonaState(parsed)
    } catch {
      return { personas: [], defaultId: null }
    }
  }, [settingsBundleQuery.data])

  const loading =
    groupQuery.isLoading ||
    membersQuery.isLoading ||
    chatSessionQuery.isLoading ||
    settingsBundleQuery.isLoading

  const activePersona = getDefaultPersona(personaState)
  const activePersonaName = activePersona?.name || 'User'
  const activePersonaAvatar = activePersona ? getPersonaAvatarUrl(activePersona.avatar) : undefined

  // Sync chat data from the chat query whenever the session changes.
  useEffect(() => {
    const chatId = group?.chat_id
    if (!chatId) return
    if (chatId === chatDataSyncedFrom) return
    if (chatSessionQuery.isLoading) return
    const lines = chatSessionQuery.data
    if (Array.isArray(lines)) {
      setChatData(lines)
    } else {
      setChatData([])
    }
    setChatDataSyncedFrom(chatId)
  }, [group?.chat_id, chatDataSyncedFrom, chatSessionQuery.isLoading, chatSessionQuery.data])

  // Surface query errors.
  useEffect(() => {
    const queryError =
      groupQuery.error?.message ||
      membersQuery.error?.message ||
      chatSessionQuery.error?.message ||
      settingsBundleQuery.error?.message
    if (queryError) {
      setError(queryError)
    }
  }, [
    groupQuery.error,
    membersQuery.error,
    chatSessionQuery.error,
    settingsBundleQuery.error,
  ])

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
        await saveChatMutation.mutateAsync({
          id: group.chat_id,
          chat: messages,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save chat')
      }
    },
    [group, saveChatMutation],
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
    const newId = generateUUID()
    const updated = { ...group, chat_id: newId, chats: [newId] }
    try {
      await updateGroupMutation.mutateAsync(updated)
      const initial: ChatLine[] = [createGroupChatMetadata()]
      await saveChatMutation.mutateAsync({ id: newId, chat: initial })
      setChatData(initial)
      setChatDataSyncedFrom(newId)
      setSearchParams({ group: group.id, chat: newId })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create new chat')
    }
  }, [group, setSearchParams, saveChatMutation, updateGroupMutation, queryClient])

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
