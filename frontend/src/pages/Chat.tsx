import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
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

function Chat() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const avatarUrl = searchParams.get('avatar')

  const [character, setCharacter] = useState<Character | null>(null)
  const [chatFiles, setChatFiles] = useState<ChatFile[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch character details
  useEffect(() => {
    if (!avatarUrl) {
      setError('No character selected')
      setLoading(false)
      return
    }

    fetch('/api/characters/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: avatarUrl }),
    })
      .then((res) => res.json())
      .then((data) => {
        setCharacter(data)
      })
      .catch((err) => setError(err.message))
  }, [avatarUrl])

  // Fetch chat files for this character
  useEffect(() => {
    if (!avatarUrl) return

    fetch('/api/characters/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: avatarUrl }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setChatFiles(data)
          if (data.length > 0) {
            setSelectedFile(data[0].file_id)
          }
        }
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [avatarUrl])

  // Load selected chat
  useEffect(() => {
    if (!avatarUrl || !selectedFile) {
      setMessages([])
      return
    }

    fetch('/api/chats/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        avatar_url: avatarUrl,
        file_name: selectedFile,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Skip the first metadata object
          setMessages(data.slice(1).filter((m) => m && typeof m.mes === 'string'))
        } else {
          setMessages([])
        }
      })
      .catch((err) => setError(err.message))
  }, [avatarUrl, selectedFile])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || !character) return

    const newMessage: ChatMessage = {
      name: 'You',
      is_user: true,
      mes: input.trim(),
      send_date: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInput('')

    // TODO: Connect to LLM backend for actual replies
    setTimeout(() => {
      const reply: ChatMessage = {
        name: character.name,
        is_user: false,
        mes: `[This is a placeholder reply from ${character.name}. LLM integration is not yet implemented.]`,
        send_date: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, reply])
    }, 600)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Loading chat...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-red-400">Error: {error}</div>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Characters
        </button>
      </div>
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

        {chatFiles.length > 0 && (
          <select
            value={selectedFile || ''}
            onChange={(e) => setSelectedFile(e.target.value)}
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            {chatFiles.length === 0
              ? 'No existing chats. Start a new conversation below.'
              : 'No messages in this chat yet.'}
          </div>
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
                  {message.mes}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Note: Replies are currently placeholders. LLM integration is not implemented yet.
        </p>
      </div>
    </div>
  )
}

export default Chat
