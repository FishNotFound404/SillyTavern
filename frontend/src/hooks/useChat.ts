import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import { apiPost } from '../api/client'
import type { ChatFile, ChatLine, ChatMessage } from '../api/types'
import type { Character } from '../features/characters/types'
import type { ConnectionSettings } from '../types/connection'
import type { PersonaState } from '../types/persona'
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
} from '../utils/connection'
import { getDefaultPersona, getPersonaThumbnailUrl, readPersonaState } from '../utils/persona'
import { gatherMatchingLore } from '../features/world-info/utils'
import { streamCompletion } from '../utils/stream'
import {
  buildInitialChatData,
  buildSystemPrompt,
  generateChatFileName,
  stripThinkTags,
} from '../utils/chat'

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

  const [character, setCharacter] = useState<Character | null>(null)
  const [chatFiles, setChatFiles] = useState<ChatFile[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(requestedChat)
  const [chatData, setChatData] = useState<ChatLine[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [connection, setConnection] = useState<ConnectionSettings>(DEFAULT_CONNECTION)
  const [personaState, setPersonaState] = useState<PersonaState>({ personas: [], defaultId: null })

  const messagesParentRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)

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

  // Redirect to chat list if no character is selected and fetch character details.
  useEffect(() => {
    if (!avatarUrl) {
      navigate('/chat')
      return
    }

    apiPost<Character>('/api/characters/get', { avatar_url: avatarUrl })
      .then((data) => {
        setCharacter(data)
      })
      .catch((err) => setError(err.message))
  }, [avatarUrl, navigate])

  // Fetch available chat files for this character.
  useEffect(() => {
    if (!avatarUrl) return

    setLoading(true)
    apiPost<ChatFile[]>('/api/characters/chats', { avatar_url: avatarUrl, simple: true })
      .then((data) => {
        if (Array.isArray(data)) {
          setChatFiles(data)
          if (data.length > 0) {
            const match = requestedChat ? data.find((f) => f.file_id === requestedChat) : null
            setSelectedFile(match ? match.file_id : data[0].file_id)
          }
        }
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [avatarUrl, requestedChat])

  // Load the selected chat file.
  useEffect(() => {
    if (!avatarUrl || !selectedFile) {
      setChatData([])
      return
    }

    apiPost<ChatLine[]>('/api/chats/get', {
      avatar_url: avatarUrl,
      file_name: selectedFile,
    })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setChatData(data.map((line) => (isChatMessage(line) ? ensureSwipes(line) : line)))
        } else {
          setChatData([buildInitialChatData(character, activePersonaName)[0]])
        }
      })
      .catch((err) => setError(err.message))
  }, [avatarUrl, selectedFile, character, activePersonaName])

  // Load connection and persona settings once.
  useEffect(() => {
    apiPost<{ settings: string }>('/api/settings/get', {})
      .then((data) => {
        const parsed = data?.settings
          ? (JSON.parse(data.settings) as Record<string, unknown>)
          : {}
        setConnection(readConnectionSettings(parsed))
        setPersonaState(readPersonaState(parsed))
      })
      .catch(() => {
        setConnection(DEFAULT_CONNECTION)
        setPersonaState({ personas: [], defaultId: null })
      })
  }, [])

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

  const loadChatFiles = useCallback(() => {
    if (!avatarUrl) return

    apiPost<ChatFile[]>('/api/characters/chats', { avatar_url: avatarUrl, simple: true })
      .then((data) => {
        if (Array.isArray(data)) {
          setChatFiles(data)
        }
      })
      .catch((err) => setError(err.message))
  }, [avatarUrl])

  const saveChatData = useCallback(
    async (data: ChatLine[]) => {
      if (!avatarUrl || !selectedFile) return
      try {
        await apiPost('/api/chats/save', {
          avatar_url: avatarUrl,
          file_name: selectedFile,
          chat: data,
        })
      } catch (err) {
        console.error('Failed to save chat:', err)
        setError(err instanceof Error ? err.message : 'Failed to save chat')
      }
    },
    [avatarUrl, selectedFile],
  )

  const handleRenameChat = useCallback(async () => {
    if (!avatarUrl || !selectedFile) return
    const currentFile = chatFiles.find((f) => f.file_id === selectedFile)
    const currentName = currentFile?.file_name.replace(/\.jsonl$/i, '') || selectedFile
    const newName = window.prompt('Rename chat:', currentName)?.trim()
    if (!newName || newName === currentName) return

    try {
      const data = await apiPost<{ ok: boolean; sanitizedFileName?: string }>('/api/chats/rename', {
        avatar_url: avatarUrl,
        original_file: `${selectedFile}.jsonl`,
        renamed_file: `${newName}.jsonl`,
      })
      await loadChatFiles()
      if (data.ok && data.sanitizedFileName) {
        selectChat(data.sanitizedFileName)
      } else {
        selectChat(newName)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename chat')
    }
  }, [avatarUrl, selectedFile, chatFiles, loadChatFiles, selectChat])

  const handleDeleteChat = useCallback(async () => {
    if (!avatarUrl || !selectedFile) return
    if (!window.confirm('Delete this chat? This cannot be undone.')) return

    try {
      await apiPost('/api/chats/delete', {
        avatar_url: avatarUrl,
        chatfile: `${selectedFile}.jsonl`,
      })
      const remaining = chatFiles.filter((f) => f.file_id !== selectedFile)
      if (remaining.length > 0) {
        selectChat(remaining[0].file_id)
      } else {
        selectChat(null)
        setChatData([])
      }
      await loadChatFiles()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete chat')
    }
  }, [avatarUrl, selectedFile, chatFiles, loadChatFiles, selectChat])

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
      const data = await apiPost<{ result: string; message?: string }>('/api/chats/export', {
        avatar_url: avatarUrl,
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
  }, [avatarUrl, selectedFile])

  const handleNewChat = useCallback(async () => {
    if (!avatarUrl || !character) return

    const fileName = generateChatFileName(character.name)
    const fileId = fileName.replace(/\.jsonl$/, '')
    const initialData = buildInitialChatData(character, activePersonaName)

    try {
      await apiPost('/api/chats/save', {
        avatar_url: avatarUrl,
        file_name: fileId,
        chat: initialData,
      })
      await loadChatFiles()
      selectChat(fileId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create new chat')
    }
  }, [avatarUrl, character, activePersonaName, loadChatFiles, selectChat])

  const handleSend = useCallback(async () => {
    if (!input.trim() || !character || generating) return

    let currentFileId = selectedFile || ''
    let currentChatData = chatData

    if (!currentFileId) {
      const fileName = generateChatFileName(character.name)
      currentFileId = fileName.replace(/\.jsonl$/, '')
      const initialData = buildInitialChatData(character, activePersonaName)

      try {
        await apiPost('/api/chats/save', {
          avatar_url: avatarUrl,
          file_name: currentFileId,
          chat: initialData,
        })
        selectChat(currentFileId)
        setChatFiles((prev) => [...prev, { file_name: fileName, file_id: currentFileId }])
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

      await apiPost('/api/chats/save', {
        avatar_url: avatarUrl,
        file_name: currentFileId,
        chat: workingChat,
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        await apiPost('/api/chats/save', {
          avatar_url: avatarUrl,
          file_name: currentFileId,
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
      await apiPost('/api/chats/save', {
        avatar_url: avatarUrl,
        file_name: currentFileId,
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
