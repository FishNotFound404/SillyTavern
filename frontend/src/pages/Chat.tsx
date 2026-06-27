import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { apiPost } from '../api/client'
import { ChatSkeleton, EmptyState, ErrorState } from '../components/ui'
import type { Character } from '../types'

interface ChatMessage {
  name: string
  is_user: boolean
  mes: string
  send_date: string
}

interface ChatFile {
  file_name: string
  file_id: string
}

interface ChatMetadata {
  chat_metadata: {
    integrity: string
    note_prompt: string
    note_interval: number
    note_position: number
    note_depth: number
    note_role: number
    tainted?: boolean
  }
  user_name: string
  character_name: string
}

type ChatLine = ChatMetadata | ChatMessage

function isChatMessage(line: ChatLine): line is ChatMessage {
  return 'mes' in line
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

function generateChatFileName(characterName: string) {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const timePart = `${pad(now.getHours())}h${pad(now.getMinutes())}m${pad(now.getSeconds())}s${now.getMilliseconds()}ms`
  return `${characterName} - ${datePart}@${timePart}.jsonl`
}

function createChatMetadata(characterName: string): ChatMetadata {
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
    character_name: characterName,
  }
}

function Chat() {
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const messages = chatData.filter(isChatMessage)

  // Fetch character details
  useEffect(() => {
    if (!avatarUrl) {
      setError('No character selected')
      setLoading(false)
      return
    }

    apiPost<Character>('/api/characters/get', { avatar_url: avatarUrl })
      .then((data) => {
        setCharacter(data)
      })
      .catch((err) => setError(err.message))
  }, [avatarUrl])

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

  const selectChat = useCallback((fileId: string | null) => {
    setSelectedFile(fileId)
    if (!avatarUrl) return
    const params: Record<string, string> = { avatar: avatarUrl }
    if (fileId) params.chat = fileId
    setSearchParams(params, { replace: true })
  }, [avatarUrl, setSearchParams])

  // Fetch chat files for this character
  useEffect(() => {
    if (!avatarUrl) return

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

  // Load selected chat
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
          setChatData(data)
        } else {
          setChatData([createChatMetadata(character?.name || 'Character')])
        }
      })
      .catch((err) => setError(err.message))
  }, [avatarUrl, selectedFile, character?.name])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`
    }
  }, [input])

  const buildSystemPrompt = () => {
    if (!character) return ''
    const parts: string[] = []
    if (character.description) parts.push(`Description: ${character.description}`)
    if (character.personality) parts.push(`Personality: ${character.personality}`)
    if (character.scenario) parts.push(`Scenario: ${character.scenario}`)
    parts.push(`You are ${character.name}. Stay in character and respond as ${character.name}.`)
    return parts.join('\n\n')
  }

  const handleNewChat = async () => {
    if (!avatarUrl || !character) return

    const fileName = generateChatFileName(character.name)
    const fileId = fileName.replace(/\.jsonl$/, '')
    const initialData: ChatLine[] = [createChatMetadata(character.name)]

    if (character.first_mes) {
      initialData.push({
        name: character.name,
        is_user: false,
        mes: character.first_mes,
        send_date: new Date().toISOString(),
      })
    }

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
  }

  const handleSend = async () => {
    if (!input.trim() || !character || generating) return

    // If this character has no chat file yet, create one on the fly.
    let currentFileId = selectedFile || ''
    let currentChatData = chatData
    if (!currentFileId) {
      const fileName = generateChatFileName(character.name)
      currentFileId = fileName.replace(/\.jsonl$/, '')
      const initialData: ChatLine[] = [createChatMetadata(character.name)]

      if (character.first_mes) {
        initialData.push({
          name: character.name,
          is_user: false,
          mes: character.first_mes,
          send_date: new Date().toISOString(),
        })
      }

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
      name: 'You',
      is_user: true,
      mes: userText,
      send_date: new Date().toISOString(),
    }

    const nextChatData = [...currentChatData, userMessage]
    setChatData(nextChatData)
    setInput('')
    setGenerating(true)
    abortControllerRef.current = new AbortController()

    try {
      const historyMessages = currentChatData.filter(isChatMessage)
      const apiMessages = [
        { role: 'system', content: buildSystemPrompt() },
        ...historyMessages.map((m) => ({
          role: m.is_user ? 'user' : 'assistant',
          content: m.mes,
        })),
        { role: 'user', content: userText },
      ]

      const model = localStorage.getItem('sillytavern:settings:model') || 'MiniMax-M3'
      const data = await apiPost<{ content?: string; error?: string }>('/api/minimax/chat/generate', {
        messages: apiMessages,
        model,
      }, abortControllerRef.current.signal)

      if (data.error) {
        throw new Error(data.error)
      }

      const replyText = data.content || '[No response]'

      const reply: ChatMessage = {
        name: character.name,
        is_user: false,
        mes: replyText,
        send_date: new Date().toISOString(),
      }

      const finalChatData = [...nextChatData, reply]
      setChatData(finalChatData)
      await apiPost('/api/chats/save', {
        avatar_url: avatarUrl,
        file_name: currentFileId,
        chat: finalChatData,
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        await apiPost('/api/chats/save', {
          avatar_url: avatarUrl,
          file_name: currentFileId,
          chat: nextChatData,
        })
        return
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      const errorReply: ChatMessage = {
        name: character.name,
        is_user: false,
        mes: `[Error generating reply: ${errorMessage}]`,
        send_date: new Date().toISOString(),
      }
      const finalChatData = [...nextChatData, errorReply]
      setChatData(finalChatData)
      await apiPost('/api/chats/save', {
        avatar_url: avatarUrl,
        file_name: currentFileId,
        chat: finalChatData,
      })
    } finally {
      setGenerating(false)
      abortControllerRef.current = null
    }
  }

  const handleStop = () => {
    abortControllerRef.current?.abort()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading) {
    return <ChatSkeleton />
  }

  if (error) {
    return (
      <ErrorState
        title="Couldn’t load chat"
        message={error}
        onRetry={() => navigate('/')}
      />
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white"
          >
            ← Back
          </button>
          {character && (
            <div className="flex items-center gap-3">
              <img
                src={`/characters/${encodeURIComponent(character.avatar)}`}
                alt={character.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <h1 className="text-xl font-bold text-white">{character.name}</h1>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNewChat}
            disabled={!character}
            className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            New Chat
          </button>
          {chatFiles.length > 0 && (
            <select
              value={selectedFile || ''}
              onChange={(e) => selectChat(e.target.value)}
              className="bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700"
            >
              {chatFiles.map((file) => (
                <option key={file.file_id} value={file.file_id}>
                  {file.file_name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.length === 0 ? (
          <EmptyState
            title={chatFiles.length === 0 ? 'No chats yet' : 'No messages yet'}
            description={
              chatFiles.length === 0
                ? 'Start a new conversation below to create your first chat with this character.'
                : 'This chat is empty. Say something below to get started.'
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            }
          />
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.is_user ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                  message.is_user
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-gray-800 text-gray-100 rounded-bl-md'
                }`}
              >
                <div className="text-xs opacity-75 mb-1">
                  {message.name}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">
                  {stripThinkTags(message.mes) || '[No visible content]'}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            disabled={generating}
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-blue-500 focus:outline-none resize-none overflow-y-auto max-h-[200px] disabled:opacity-50"
          />
          {generating ? (
            <button
              onClick={handleStop}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Send
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {generating ? 'Generating...' : 'Shift+Enter for a new line'}
        </p>
      </div>
    </div>
  )
}

export default Chat
