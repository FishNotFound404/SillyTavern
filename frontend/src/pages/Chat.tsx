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
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
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

  const saveChatData = async (data: ChatLine[]) => {
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

  // Message index in chatData is messageIndex + 1 because line 0 is metadata.
  const toChatDataIndex = (messageIndex: number) => messageIndex + 1

  const handleEditStart = (messageIndex: number, text: string) => {
    setEditingIndex(messageIndex)
    setEditText(text)
  }

  const handleEditCancel = () => {
    setEditingIndex(null)
    setEditText('')
  }

  const handleEditSave = async (messageIndex: number) => {
    if (!editText.trim()) return
    const chatDataIndex = toChatDataIndex(messageIndex)
    const updated = [...chatData]
    const target = updated[chatDataIndex]
    if (target && isChatMessage(target)) {
      target.mes = editText.trim()
      target.send_date = new Date().toISOString()
      setChatData(updated)
      await saveChatData(updated)
    }
    setEditingIndex(null)
    setEditText('')
  }

  const handleDelete = async (messageIndex: number) => {
    const chatDataIndex = toChatDataIndex(messageIndex)
    const updated = chatData.filter((_, i) => i !== chatDataIndex)
    setChatData(updated)
    await saveChatData(updated)
  }

  const handleRegenerate = async (messageIndex: number) => {
    if (!character || generating) return
    const chatDataIndex = toChatDataIndex(messageIndex)
    const target = chatData[chatDataIndex]
    if (!target || !isChatMessage(target) || target.is_user) return

    // Truncate to keep everything up to and including the user message that prompted this reply.
    const truncated = chatData.slice(0, chatDataIndex)
    setChatData(truncated)
    setGenerating(true)
    abortControllerRef.current = new AbortController()

    try {
      const historyMessages = truncated.filter(isChatMessage)
      const apiMessages = [
        { role: 'system', content: buildSystemPrompt() },
        ...historyMessages.map((m) => ({
          role: m.is_user ? 'user' : 'assistant',
          content: m.mes,
        })),
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

      const finalChatData = [...truncated, reply]
      setChatData(finalChatData)
      await saveChatData(finalChatData)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        await saveChatData(truncated)
        return
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      const errorReply: ChatMessage = {
        name: character.name,
        is_user: false,
        mes: `[Error generating reply: ${errorMessage}]`,
        send_date: new Date().toISOString(),
      }
      const finalChatData = [...truncated, errorReply]
      setChatData(finalChatData)
      await saveChatData(finalChatData)
    } finally {
      setGenerating(false)
      abortControllerRef.current = null
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
              className={`flex ${message.is_user ? 'justify-end' : 'justify-start'} group`}
            >
              <div
                className={`relative max-w-[80%] rounded-2xl px-5 py-3 ${
                  message.is_user
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-gray-800 text-gray-100 rounded-bl-md'
                }`}
              >
                {/* Message actions */}
                <div
                  className={`absolute top-0 ${
                    message.is_user ? 'left-0 -translate-x-full pl-2' : 'right-0 translate-x-full pr-2'
                  } opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}
                >
                  {message.is_user && (
                    <button
                      onClick={() => handleEditStart(index, message.mes)}
                      disabled={editingIndex !== null}
                      className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                  )}
                  {!message.is_user && (
                    <button
                      onClick={() => handleRegenerate(index)}
                      disabled={generating || editingIndex !== null}
                      className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded"
                      title="Regenerate"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(index)}
                    disabled={generating || editingIndex !== null}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>

                <div className="text-xs opacity-75 mb-1">
                  {message.name}
                </div>

                {editingIndex === index ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleEditSave(index)
                        }
                        if (e.key === 'Escape') {
                          handleEditCancel()
                        }
                      }}
                      rows={3}
                      className="w-full bg-black/20 text-white rounded-lg px-3 py-2 border border-white/30 focus:border-white focus:outline-none resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSave(index)}
                        disabled={!editText.trim()}
                        className="px-3 py-1 text-xs bg-white/20 hover:bg-white/30 rounded disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="px-3 py-1 text-xs hover:bg-white/10 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {stripThinkTags(message.mes) || '[No visible content]'}
                  </div>
                )}
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
