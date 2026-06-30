import type { ChatMessage } from '../../../api/types'

interface ChatMessageBubbleProps {
  message: ChatMessage
  avatarUrl?: string
  isUser?: boolean
  query?: string
  children?: React.ReactNode
  footer?: React.ReactNode
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
}

function HighlightedText({ text, query }: { text: string; query?: string }) {
  if (!query) {
    return <>{text}</>
  }

  const normalizedQuery = query.toLowerCase()
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'))

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === normalizedQuery ? (
          <mark
            key={index}
            className="bg-yellow-300/60 text-inherit rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  )
}

export function ChatMessageBubble({
  message,
  avatarUrl,
  isUser,
  query,
  children,
  footer,
}: ChatMessageBubbleProps) {
  const displayText = stripThinkTags(message.mes)

  return (
    <div className={`flex gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt={message.name}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover self-end mb-1"
        />
      )}
      <div
        className={`relative max-w-[92%] sm:max-w-[85%] md:max-w-[80%] rounded-2xl px-3 py-2 sm:px-5 sm:py-3 ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-gray-800 text-gray-100 rounded-bl-md'
        }`}
      >
        <div className="text-xs opacity-75 mb-1">{message.name}</div>
        {children}
        <div className="whitespace-pre-wrap leading-relaxed break-words">
          {displayText ? (
            <HighlightedText text={displayText} query={query} />
          ) : (
            '[No visible content]'
          )}
        </div>
        {footer}
      </div>
    </div>
  )
}
