import { ChatMessageBubble } from './ChatMessageBubble'
import type { ChatMessage } from '../../../api/types'

interface ChatMessageItemProps {
  message: ChatMessage
  index: number
  editingIndex: number | null
  editText: string
  generating: boolean
  userAvatar?: string
  characterAvatar?: string
  query?: string
  onEditStart: (index: number, text: string) => void
  onEditSave: (index: number) => void
  onEditCancel: () => void
  onEditTextChange: (text: string) => void
  onDelete: (index: number) => void
  onRegenerate: (index: number) => void
  onSwipeChange: (index: number, direction: -1 | 1) => void
  onSwipeSelect: (index: number, swipeId: number) => void
}

export function ChatMessageItem({
  message,
  index,
  editingIndex,
  editText,
  generating,
  userAvatar,
  characterAvatar,
  query,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditTextChange,
  onDelete,
  onRegenerate,
  onSwipeChange,
  onSwipeSelect,
}: ChatMessageItemProps) {
  const avatarUrl = message.is_user ? userAvatar : characterAvatar

  if (editingIndex === index) {
    return (
      <div className={`flex ${message.is_user ? 'justify-end' : 'justify-start'} group gap-3`}>
        {!message.is_user && characterAvatar && (
          <img
            src={characterAvatar}
            alt={message.name}
            className="w-8 h-8 rounded-full object-cover self-end mb-1"
          />
        )}
        <div
          className={`relative max-w-[92%] sm:max-w-[85%] md:max-w-[80%] rounded-2xl px-3 py-2 sm:px-5 sm:py-3 ${
            message.is_user
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-gray-800 text-gray-100 rounded-bl-md'
          }`}
        >
          <div className="text-xs opacity-75 mb-1">{message.name}</div>
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => onEditTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onEditSave(index)
                }
                if (e.key === 'Escape') {
                  onEditCancel()
                }
              }}
              rows={3}
              className="w-full bg-black/20 text-white rounded-lg px-3 py-2 border border-white/30 focus:border-white focus:outline-none resize-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => onEditSave(index)}
                disabled={!editText.trim()}
                className="px-3 py-1 text-xs bg-white/20 hover:bg-white/30 rounded disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={onEditCancel}
                className="px-3 py-1 text-xs hover:bg-white/10 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        {message.is_user && userAvatar && (
          <img
            src={userAvatar}
            alt={message.name}
            className="w-8 h-8 rounded-full object-cover self-end mb-1"
          />
        )}
      </div>
    )
  }

  const swipeCount = message.swipes?.length ?? 1
  const swipeId = message.swipe_id ?? 0
  const swipeFooter = !message.is_user && swipeCount > 1 ? (
    <div className="flex items-center gap-1 mt-1 select-none">
      <button
        onClick={() => onSwipeChange(index, -1)}
        disabled={swipeId === 0}
        aria-label="Previous swipe"
        className="p-1 text-gray-400 hover:text-white disabled:opacity-30 rounded"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
      <select
        value={swipeId}
        onChange={(e) => onSwipeSelect(index, Number(e.target.value))}
        aria-label="Select swipe"
        className="text-xs bg-transparent text-gray-300 focus:outline-none cursor-pointer"
      >
        {message.swipes?.map((_, i) => (
          <option key={i} value={i} className="bg-gray-800 text-white">
            {i + 1}/{swipeCount}
          </option>
        ))}
      </select>
      <button
        onClick={() => onSwipeChange(index, 1)}
        disabled={swipeId === swipeCount - 1}
        aria-label="Next swipe"
        className="p-1 text-gray-400 hover:text-white disabled:opacity-30 rounded"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  ) : null

  return (
    <div className="group">
      <ChatMessageBubble
        message={message}
        avatarUrl={avatarUrl}
        isUser={message.is_user}
        query={query}
        footer={swipeFooter}
      >
        <div
          className={`absolute top-1 ${
            message.is_user
              ? 'left-1 md:left-0 md:-translate-x-full md:pl-2'
              : 'right-1 md:right-0 md:translate-x-full md:pr-2'
          } flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-gray-900/80 md:bg-transparent rounded p-1 md:p-0`}
        >
          {message.is_user && (
            <button
              onClick={() => onEditStart(index, message.mes)}
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
              onClick={() => onRegenerate(index)}
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
            onClick={() => onDelete(index)}
            disabled={generating || editingIndex !== null}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded"
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.67 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </ChatMessageBubble>
    </div>
  )
}
