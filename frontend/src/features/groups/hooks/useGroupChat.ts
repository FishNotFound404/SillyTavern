import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Character } from '../../characters/types'
import { useCharacters } from '../../characters/api'
import type { Group, ChatMessage } from '../types'
import type { GroupChatLine } from '../utils'
import type { PersonaState } from '../../personas/types'
import type { ConnectionSettings } from '../../settings/types'
import { useSettings } from '../../settings/api'
import { generateUUID, streamCompletion, stripThinkTags } from '../../chats/utils'
import { isChatMessage } from '../../../utils/chatMessageActions'
import {
  buildGenerationRequest,
  DEFAULT_CONNECTION,
  readConnectionSettings,
} from '../../settings/utils/connection'
import {
  buildGroupSystemPrompt,
  createGroupChatMetadata,
  getLastSpeakerName,
  pickNextSpeaker,
} from '../utils'
import { getDefaultPersona, getPersonaAvatarUrl, readPersonaState } from '../../personas/utils'
import { fetchGroupChat, groupKeys, saveGroupChat, useGroup, useUpdateGroup } from '../api'

export interface UseGroupChatResult {
  // Refs
  messagesEndRef: React.RefObject<HTMLDivElement | null>

  // State
  group: Group | null
  members: Character[]
  chatData: GroupChatLine[]
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

  const queryClient = useQueryClient()
  const { data: group, isLoading: groupLoading, error: groupError } = useGroup(groupId || undefined)
  const { data: characters = [] } = useCharacters()
  const { mutateAsync: updateGroupAsync } = useUpdateGroup()
  const { data: settingsResponse } = useSettings()

  const [chatData, setChatData] = useState<GroupChatLine[]>([])
  const [input, setInput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [currentSpeaker, setCurrentSpeaker] = useState<Character | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [personaState, setPersonaState] = useState<PersonaState>({ personas: [], defaultId: null })
  const [connection, setConnection] = useState<ConnectionSettings>(DEFAULT_CONNECTION)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentChatIdRef = useRef<string | null>(null)

  const activePersona = getDefaultPersona(personaState)
  const activePersonaName = activePersona?.name || 'User'
  const activePersonaAvatar = activePersona ? getPersonaAvatarUrl(activePersona.avatar) : undefined

  const members = useMemo(() => {
    if (!group) return []
    const memberSet = new Set(group.members)
    return characters.filter((c) => memberSet.has(c.avatar))
  }, [group, characters])

  const { data: fetchedChat = [], isLoading: chatLoading } = useQuery({
    queryKey: groupKeys.chat(group?.chat_id || ''),
    queryFn: () => fetchGroupChat(group!.chat_id),
    enabled: Boolean(group?.chat_id),
  })

  const { mutateAsync: saveGroupChatAsync } = useMutation({
    mutationFn: ({ id, chat }: { id: string; chat: GroupChatLine[] }) => saveGroupChat(id, chat),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.chat(id) })
    },
  })

  // Initialize local chat data when the active group chat changes.
  useEffect(() => {
    if (!group) return
    if (currentChatIdRef.current === group.chat_id) return
    currentChatIdRef.current = group.chat_id
    setChatData((fetchedChat as GroupChatLine[]) ?? [])
  }, [group, fetchedChat])

  // Load connection and persona settings when settings arrive.
  useEffect(() => {
    if (!settingsResponse) return
    try {
      const parsed = settingsResponse.settings
        ? (JSON.parse(settingsResponse.settings) as Record<string, unknown>)
        : {}
      setConnection(readConnectionSettings(parsed))
      setPersonaState(readPersonaState(parsed))
    } catch {
      setConnection(DEFAULT_CONNECTION)
      setPersonaState({ personas: [], defaultId: null })
    }
  }, [settingsResponse])

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

  // Surface group loading errors and missing group id.
  useEffect(() => {
    if (groupError) {
      setError(groupError instanceof Error ? groupError.message : 'Failed to load group')
    } else if (!groupId) {
      setError('No group selected')
    } else {
      setError(null)
    }
  }, [groupError, groupId])

  const saveMessages = useCallback(
    async (messages: GroupChatLine[]) => {
      if (!group) return
      try {
        await saveGroupChatAsync({ id: group.chat_id, chat: messages })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save chat')
      }
    },
    [group, saveGroupChatAsync],
  )

  const generateReply = useCallback(
    async (speaker: Character, workingChat: GroupChatLine[], signal?: AbortSignal) => {
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
    const updated: Group = { ...group, chat_id: newId, chats: [newId] }
    try {
      setError(null)
      await updateGroupAsync(updated)
      const initial: GroupChatLine[] = [createGroupChatMetadata()]
      await saveGroupChatAsync({ id: newId, chat: initial })
      currentChatIdRef.current = newId
      setChatData(initial)
      setSearchParams({ group: group.id, chat: newId })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create new chat')
    }
  }, [group, updateGroupAsync, saveGroupChatAsync, setSearchParams])

  const handlePreviousMatch = useCallback(() => {
    setCurrentMatchIndex((prev) => (prev - 1 + matchIndices.length) % matchIndices.length)
  }, [matchIndices.length])

  const handleNextMatch = useCallback(() => {
    setCurrentMatchIndex((prev) => (prev + 1) % matchIndices.length)
  }, [matchIndices.length])

  const loading = groupLoading || chatLoading

  return {
    messagesEndRef,
    group: group ?? null,
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
