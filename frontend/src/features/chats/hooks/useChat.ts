import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { ChatFile, ChatLine, ChatMessage } from '../../../api/types'
import type { Character } from '../../characters/types'
import type { ConnectionSettings } from '../../settings/types'
import type { PersonaState } from '../../personas/types'
import {
  appendSwipe,
  applyMessageEdit,
  deleteMessage,
  ensureSwipes,
  isChatMessage,
  prepareRegenerateContext,
  setSwipeId,
  updateCurrentSwipe,
} from '../utils/chatMessageActions'
import {
  buildGenerationRequest,
  DEFAULT_CONNECTION,
  readConnectionSettings,
} from '../../settings/utils'
import {
  getDefaultPersona,
  getPersonaThumbnailUrl,
  readPersonaState,
} from '../../personas/utils'
import { gatherMatchingLore } from '../../world-info/utils'
import { streamCompletion } from '../utils/stream'
import {
  buildInitialChatData,
  buildSystemPrompt,
  generateChatFileName,
  stripThinkTags,
} from '../utils'
import { useCharacter } from '../../characters/api'
import {
  useCharacterChats,
  useChat as useChatSession,
  useDeleteChat as useDeleteChatMutation,
  useExportChat,
  useRenameChat as useRenameChatMutation,
  useSaveChat,
} from '../api'
import { useSettingsBundle } from '../../settings/api'

export interface UseChatResult {
  // Refs
  messagesParentRef: React.RefObject<HTMLDivElement | null>

  // Core state
  character: Character | null
  chatFiles: ChatFile[]
  selectedFile: string | null
  chatData: ChatLine[]
  input: string
  setInput: (value: string) => void
  loading: boolean
  generating: boolean
  error: string | null
  editingIndex: number | null
  editText: string
  setEditText: (value: string) => void
  connection: ConnectionSettings
  personaState: PersonaState

  // Search state
  searchQuery: string
  setSearchQuery: (value: string) => void
  currentMatchIndex: number
  matchIndices: number[]

  // Derived
  messages: ChatMessage[]
  activePersonaName: string
  activePersonaAvatar: string | undefined
  characterAvatar: string | undefined
  virtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>

  // Chat management
  selectChat: (fileId: string | null) => void
  handleNewChat: () => Promise<void>
  handleRenameChat: () => Promise<void>
  handleDeleteChat: () => Promise<void>
  handleClearChat: () => Promise<void>
  handleExportChat: () => Promise<void>

  // Generation
  handleSend: () => Promise<void>
  handleStop: () => void
  handleRegenerate: (messageIndex: number) => Promise<void>

  // Message actions
  handleEditStart: (index: number, text: string) => void
  handleEditCancel: () => void
  handleEditSave: (index: number) => Promise<void>
  handleDelete: (index: number) => Promise<void>
  handleSwipeChange: (index: number, direction: -1 | 1) => Promise<void>
  handleSwipeSelect: (index: number, swipeId: number) => Promise<void>

  // Search navigation
  handlePreviousMatch: () => void
  handleNextMatch: () => void
}

export function useChat(): UseChatResult {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const avatarUrl = searchParams.get('avatar')
  const requestedChat = searchParams.get('chat')

  // Local state for UI / streaming
  const [selectedFile, setSelectedFile] = useState<string | null>(requestedChat)
  const [chatData, setChatData] = useState<ChatLine[]>([])
  const [chatDataSyncedFrom, setChatDataSyncedFrom] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)

  const messagesParentRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Queries
  const characterQuery = useCharacter(avatarUrl || undefined)
  const chatsQuery = useCharacterChats(avatarUrl || undefined)
  const chatSessionQuery = useChatSession(avatarUrl || undefined, selectedFile || undefined)
  const saveChatMutation = useSaveChat()
  const renameChatMutation = useRenameChatMutation()
  const deleteChatMutation = useDeleteChatMutation()
  const exportChatMutation = useExportChat()
  const settingsBundleQuery = useSettingsBundle()

  // Derived
  const character = characterQuery.data ?? null
  const chatFiles = chatsQuery.data ?? []
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

  const loading = characterQuery.isLoading || chatsQuery.isLoading
  const messages = chatData.filter(isChatMessage)

  const activePersona = getDefaultPersona(personaState)
  const activePersonaName = activePersona?.name || 'User'
  const activePersonaAvatar = activePersona
    ? getPersonaThumbnailUrl(activePersona.avatar)
    : undefined
  const characterAvatar = character
    ? `/characters/${encodeURIComponent(character.avatar)}`
    : undefined

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => messagesParentRef.current,
    estimateSize: () => 80,
    measureElement: (el) => el.getBoundingClientRect().height,
    overscan: 5,
  })

  // Redirect to chat list if no character is selected.
  useEffect(() => {
    if (!avatarUrl) {
      navigate('/chat')
    }
  }, [avatarUrl, navigate])

  // Surface query errors.
  useEffect(() => {
    const queryError =
      characterQuery.error?.message ||
      chatsQuery.error?.message ||
      chatSessionQuery.error?.message ||
      settingsBundleQuery.error?.message
    if (queryError) {
      setError(queryError)
    }
  }, [
    characterQuery.error,
    chatsQuery.error,
    chatSessionQuery.error,
    settingsBundleQuery.error,
  ])

  // Resolve initial selection: requested chat from URL, otherwise first file.
  useEffect(() => {
    if (!avatarUrl) return
    if (chatsQuery.isLoading) return
    if (chatFiles.length === 0) return
    if (selectedFile) {
      const match = chatFiles.find((f) => f.file_id === selectedFile)
      if (!match && !requestedChat) {
        setSelectedFile(chatFiles[0].file_id)
      }
      return
    }
    const match = requestedChat ? chatFiles.find((f) => f.file_id === requestedChat) : null
    setSelectedFile(match ? match.file_id : chatFiles[0].file_id)
  }, [avatarUrl, chatsQuery.isLoading, chatFiles, requestedChat, selectedFile])

  // Sync chatData from the session query when the selected file changes.
  useEffect(() => {
    if (selectedFile === chatDataSyncedFrom) return
    if (chatSessionQuery.isLoading) return
    if (selectedFile && chatSessionQuery.data) {
      const lines = chatSessionQuery.data.lines
      if (Array.isArray(lines) && lines.length > 0) {
        setChatData(
          lines.map((line) => (isChatMessage(line) ? ensureSwipes(line) : line)),
        )
      } else if (character) {
        setChatData([buildInitialChatData(character, activePersonaName)[0]])
      } else {
        setChatData([])
      }
    } else if (!selectedFile) {
      setChatData([])
    }
    setChatDataSyncedFrom(selectedFile)
  }, [
    selectedFile,
    chatDataSyncedFrom,
    chatSessionQuery.isLoading,
    chatSessionQuery.data,
    character,
    activePersonaName,
  ])

  // Keep the virtual list scrolled to the latest message.
  useEffect(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: 'end' })
    }
  }, [messages.length, virtualizer])

  // Search matching message indices.
  const matchIndices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return []
    return messages
      .map((message, index) => ({ message, index }))
      .filter(({ message }) => stripThinkTags(message.mes).toLowerCase().includes(query))
      .map(({ index }) => index)
  }, [messages, searchQuery])

  useEffect(() => {
    setCurrentMatchIndex(0)
  }, [matchIndices.length])

  useEffect(() => {
    if (matchIndices.length === 0) return
    const index = matchIndices[currentMatchIndex]
    if (index === undefined) return
    virtualizer.scrollToIndex(index, { align: 'center' })
  }, [matchIndices, currentMatchIndex, virtualizer])

  const selectChat = useCallback(
    (fileId: string | null) => {
      setSelectedFile(fileId)
      if (!avatarUrl) return
      const params: Record<string, string> = { avatar: avatarUrl }
      if (fileId) params.chat = fileId
      setSearchParams(params, { replace: true })
    },
    [avatarUrl, setSearchParams],
  )

  const saveChatData = useCallback(
    async (data: ChatLine[]) => {
      if (!avatarUrl || !selectedFile) return
      try {
        await saveChatMutation.mutateAsync({
          avatarUrl,
          fileName: selectedFile,
          chat: data,
        })
      } catch (err) {
        console.error('Failed to save chat:', err)
        setError(err instanceof Error ? err.message : 'Failed to save chat')
      }
    },
    [avatarUrl, selectedFile, saveChatMutation],
  )

  const handleRenameChat = useCallback(async () => {
    if (!avatarUrl || !selectedFile) return
    const currentFile = chatFiles.find((f) => f.file_id === selectedFile)
    const currentName = currentFile?.file_name.replace(/\.jsonl$/i, '') || selectedFile
    const newName = window.prompt('Rename chat:', currentName)?.trim()
    if (!newName || newName === currentName) return

    try {
      const data = await renameChatMutation.mutateAsync({
        avatarUrl,
        originalFile: `${selectedFile}.jsonl`,
        renamedFile: `${newName}.jsonl`,
      })
      if (data.ok && data.sanitizedFileName) {
        selectChat(data.sanitizedFileName)
      } else {
        selectChat(newName)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename chat')
    }
  }, [avatarUrl, selectedFile, chatFiles, renameChatMutation, selectChat])

  const handleDeleteChat = useCallback(async () => {
    if (!avatarUrl || !selectedFile) return
    if (!window.confirm('Delete this chat? This cannot be undone.')) return

    try {
      await deleteChatMutation.mutateAsync({
        avatarUrl,
        chatfile: `${selectedFile}.jsonl`,
      })
      const remaining = chatFiles.filter((f) => f.file_id !== selectedFile)
      if (remaining.length > 0) {
        selectChat(remaining[0].file_id)
      } else {
        selectChat(null)
        setChatData([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete chat')
    }
  }, [avatarUrl, selectedFile, chatFiles, deleteChatMutation, selectChat])

  const handleClearChat = useCallback(async () => {
    if (chatData.length <= 1) return
    if (!window.confirm('Clear all messages in this chat? This cannot be undone.')) return

    const cleared = chatData.slice(0, 1)
    setChatData(cleared)
    await saveChatData(cleared)
  }, [chatData, saveChatData])

  const handleExportChat = useCallback(async () => {
    if (!avatarUrl || !selectedFile) return
    try {
      const data = await exportChatMutation.mutateAsync({
        avatarUrl,
        file: `${selectedFile}.jsonl`,
        format: 'jsonl',
        exportfilename: `${selectedFile}.jsonl`,
      })
      const blob = new Blob([data.result], { type: 'application/jsonl' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedFile}.jsonl`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export chat')
    }
  }, [avatarUrl, selectedFile, exportChatMutation])

  const handleNewChat = useCallback(async () => {
    if (!avatarUrl || !character) return

    const fileName = generateChatFileName(character.name)
    const fileId = fileName.replace(/\.jsonl$/, '')
    const initialData = buildInitialChatData(character, activePersonaName)

    try {
      await saveChatMutation.mutateAsync({
        avatarUrl,
        fileName: fileId,
        chat: initialData,
      })
      selectChat(fileId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create new chat')
    }
  }, [avatarUrl, character, activePersonaName, selectChat, saveChatMutation])

  const handleSend = useCallback(async () => {
    if (!input.trim() || !character || !avatarUrl || generating) return

    let currentFileId = selectedFile || ''
    let currentChatData = chatData

    if (!currentFileId) {
      const fileName = generateChatFileName(character.name)
      currentFileId = fileName.replace(/\.jsonl$/, '')
      const initialData = buildInitialChatData(character, activePersonaName)

      try {
        await saveChatMutation.mutateAsync({
          avatarUrl,
          fileName: currentFileId,
          chat: initialData,
        })
        selectChat(currentFileId)
        currentChatData = initialData
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create chat file')
        return
      }
    }

    const userText = input.trim()
    const userMessage: ChatMessage = {
      name: activePersonaName,
      is_user: true,
      mes: userText,
      send_date: new Date().toISOString(),
    }

    const nextChatData = [...currentChatData, userMessage]
    const historyMessages = currentChatData.filter(isChatMessage)
    const contextText = [...historyMessages.map((m) => m.mes), userText].join('\n')
    const loreContents = gatherMatchingLore(character.data?.character_book, contextText)

    const reply: ChatMessage = {
      name: character.name,
      is_user: false,
      mes: '',
      send_date: new Date().toISOString(),
      swipes: [''],
      swipe_id: 0,
      swipe_info: [{}],
    }
    const replyIndex = nextChatData.length
    let workingChat: ChatLine[] = [...nextChatData, reply]
    setChatData(workingChat)
    setInput('')
    setGenerating(true)
    abortControllerRef.current = new AbortController()

    try {
      const { endpoint, body } = buildGenerationRequest(connection, {
        systemPrompt: buildSystemPrompt(character, loreContents),
        historyMessages,
        userMessage: userText,
        userName: activePersonaName,
        charName: character.name,
      })

      let streamedText = ''
      for await (const delta of streamCompletion(endpoint, body, abortControllerRef.current.signal)) {
        streamedText += delta
        const updatedReply = updateCurrentSwipe(workingChat[replyIndex], streamedText)
        workingChat = [...workingChat.slice(0, replyIndex), updatedReply, ...workingChat.slice(replyIndex + 1)]
        setChatData(workingChat)
      }

      await saveChatMutation.mutateAsync({
        avatarUrl,
        fileName: currentFileId,
        chat: workingChat,
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        await saveChatMutation.mutateAsync({
          avatarUrl,
          fileName: currentFileId,
          chat: workingChat,
        })
        return
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      const updatedReply = updateCurrentSwipe(
        workingChat[replyIndex],
        `[Error generating reply: ${errorMessage}]`,
      )
      workingChat = [...workingChat.slice(0, replyIndex), updatedReply, ...workingChat.slice(replyIndex + 1)]
      setChatData(workingChat)
      await saveChatMutation.mutateAsync({
        avatarUrl,
        fileName: currentFileId,
        chat: workingChat,
      })
    } finally {
      setGenerating(false)
      abortControllerRef.current = null
    }
  }, [
    input,
    character,
    generating,
    selectedFile,
    chatData,
    activePersonaName,
    connection,
    avatarUrl,
    selectChat,
    saveChatMutation,
  ])

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const handleEditStart = useCallback((index: number, text: string) => {
    setEditingIndex(index)
    setEditText(text)
  }, [])

  const handleEditCancel = useCallback(() => {
    setEditingIndex(null)
    setEditText('')
  }, [])

  const handleEditSave = useCallback(
    async (index: number) => {
      const updated = applyMessageEdit(chatData, index, editText)
      if (updated) {
        setChatData(updated)
        await saveChatData(updated)
      }
      setEditingIndex(null)
      setEditText('')
    },
    [chatData, editText, saveChatData],
  )

  const handleDelete = useCallback(
    async (index: number) => {
      const updated = deleteMessage(chatData, index)
      setChatData(updated)
      await saveChatData(updated)
    },
    [chatData, saveChatData],
  )

  const handleSwipeChange = useCallback(
    async (index: number, direction: -1 | 1) => {
      const target = messages[index]
      if (!target || target.is_user) return
      const newSwipeId = (target.swipe_id ?? 0) + direction
      const updated = setSwipeId(chatData, index, newSwipeId, true)
      setChatData(updated)
      await saveChatData(updated)
    },
    [messages, chatData, saveChatData],
  )

  const handleSwipeSelect = useCallback(
    async (index: number, swipeId: number) => {
      const updated = setSwipeId(chatData, index, swipeId, true)
      setChatData(updated)
      await saveChatData(updated)
    },
    [chatData, saveChatData],
  )

  const handleRegenerate = useCallback(
    async (messageIndex: number) => {
      if (!character || generating) return
      const context = prepareRegenerateContext(chatData, messageIndex)
      if (!context) return

      const { target, truncated, historyMessages } = context
      const contextText = historyMessages.map((m) => m.mes).join('\n')
      const loreContents = gatherMatchingLore(character.data?.character_book, contextText)

      const targetWithSwipe = appendSwipe(target)
      const chatDataIndex = truncated.length
      let workingChat: ChatLine[] = [...truncated, targetWithSwipe]
      setChatData(workingChat)
      setGenerating(true)
      abortControllerRef.current = new AbortController()

      try {
        const { endpoint, body } = buildGenerationRequest(connection, {
          systemPrompt: buildSystemPrompt(character, loreContents),
          historyMessages,
          userName: activePersonaName,
          charName: character.name,
        })

        let streamedText = ''
        for await (const delta of streamCompletion(endpoint, body, abortControllerRef.current.signal)) {
          streamedText += delta
          const updatedTarget = updateCurrentSwipe(workingChat[chatDataIndex], streamedText)
          workingChat = [...workingChat.slice(0, chatDataIndex), updatedTarget, ...workingChat.slice(chatDataIndex + 1)]
          setChatData(workingChat)
        }

        await saveChatData(workingChat)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          await saveChatData(workingChat)
          return
        }

        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        const updatedTarget = updateCurrentSwipe(
          workingChat[chatDataIndex],
          `[Error generating reply: ${errorMessage}]`,
        )
        workingChat = [...workingChat.slice(0, chatDataIndex), updatedTarget, ...workingChat.slice(chatDataIndex + 1)]
        setChatData(workingChat)
        await saveChatData(workingChat)
      } finally {
        setGenerating(false)
        abortControllerRef.current = null
      }
    },
    [character, generating, chatData, connection, activePersonaName, saveChatData],
  )

  const handlePreviousMatch = useCallback(() => {
    setCurrentMatchIndex((prev) => (prev - 1 + matchIndices.length) % matchIndices.length)
  }, [matchIndices.length])

  const handleNextMatch = useCallback(() => {
    setCurrentMatchIndex((prev) => (prev + 1) % matchIndices.length)
  }, [matchIndices.length])

  return {
    messagesParentRef,
    character,
    chatFiles,
    selectedFile,
    chatData,
    input,
    setInput,
    loading,
    generating,
    error,
    editingIndex,
    editText,
    setEditText,
    connection,
    personaState,
    searchQuery,
    setSearchQuery,
    currentMatchIndex,
    matchIndices,
    messages,
    activePersonaName,
    activePersonaAvatar,
    characterAvatar,
    virtualizer,
    selectChat,
    handleNewChat,
    handleRenameChat,
    handleDeleteChat,
    handleClearChat,
    handleExportChat,
    handleSend,
    handleStop,
    handleRegenerate,
    handleEditStart,
    handleEditCancel,
    handleEditSave,
    handleDelete,
    handleSwipeChange,
    handleSwipeSelect,
    handlePreviousMatch,
    handleNextMatch,
  }
}
