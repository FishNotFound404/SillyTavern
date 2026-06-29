import type { RefObject } from 'react'
import { ChatMessageBubble } from './ChatMessageBubble'
import { EmptyState } from './ui'
import type { Character, ChatMessage } from '../types'

interface GroupMessageListProps {
  messages: ChatMessage[]
  members: Character[]
  activePersonaAvatar?: string
  searchQuery: string
  generating: boolean
  messagesEndRef: RefObject<HTMLDivElement | null>
}

export function GroupMessageList({
  messages,
  members,
  activePersonaAvatar,
  searchQuery,
  generating,
  messagesEndRef,
}: GroupMessageListProps) {

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && !generating && (
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
      {messages.map((message, index) => {
        const member = members.find((m) => m.name === message.name)
        const avatarUrl = message.is_user
          ? activePersonaAvatar
          : member && `/characters/${encodeURIComponent(member.avatar)}`
        return (
          <div key={index} id={`msg-${index}`}>
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
  )
}
