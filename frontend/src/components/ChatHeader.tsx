import type { Character } from '../features/characters/types'
import type { ChatFile, ChatLine } from '../types'

interface ChatHeaderProps {
  character: Character | null
  chatFiles: ChatFile[]
  selectedFile: string | null
  chatData: ChatLine[]
  generating: boolean
  activePersonaName: string
  activePersonaAvatar?: string
  searchQuery: string
  matchCount: number
  currentMatchIndex: number
  onBack: () => void
  onSearchQueryChange: (query: string) => void
  onPreviousMatch: () => void
  onNextMatch: () => void
  onNewChat: () => void
  onSelectChat: (fileId: string) => void
  onRenameChat: () => void
  onClearChat: () => void
  onDeleteChat: () => void
  onExportChat: () => void
  onManagePersonas: () => void
}

export function ChatHeader({
  character,
  chatFiles,
  selectedFile,
  chatData,
  generating,
  activePersonaName,
  activePersonaAvatar,
  searchQuery,
  matchCount,
  currentMatchIndex,
  onBack,
  onSearchQueryChange,
  onPreviousMatch,
  onNextMatch,
  onNewChat,
  onSelectChat,
  onRenameChat,
  onClearChat,
  onDeleteChat,
  onExportChat,
  onManagePersonas,
}: ChatHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between mb-4 pb-4 border-b border-gray-800">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
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

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-2 py-1.5 border border-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search messages..."
            className="bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none w-full sm:w-40"
          />
          {matchCount > 0 && (
            <span className="text-xs text-gray-400">
              {currentMatchIndex + 1}/{matchCount}
            </span>
          )}
          <button
            onClick={onPreviousMatch}
            disabled={matchCount === 0}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
            title="Previous match"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={onNextMatch}
            disabled={matchCount === 0}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
            title="Next match"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange('')}
              className="p-1 text-gray-400 hover:text-white"
              title="Clear search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={onManagePersonas}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 border border-gray-700"
          title="Manage personas"
        >
          {activePersonaAvatar ? (
            <img
              src={activePersonaAvatar}
              alt={activePersonaName}
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-xs">
              {activePersonaName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="hidden sm:inline">{activePersonaName}</span>
        </button>
        <button
          onClick={onNewChat}
          disabled={!character || generating}
          className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          New Chat
        </button>
        {chatFiles.length > 0 && (
          <select
            value={selectedFile || ''}
            onChange={(e) => onSelectChat(e.target.value)}
            className="bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700"
          >
            {chatFiles.map((file) => (
              <option key={file.file_id} value={file.file_id}>
                {file.file_name}
              </option>
            ))}
          </select>
        )}
        {selectedFile && (
          <>
            <button
              onClick={onRenameChat}
              title="Rename chat"
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>
            <button
              onClick={onClearChat}
              disabled={chatData.length <= 1}
              title="Clear messages"
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg disabled:opacity-30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.67 0 00-7.5 0" />
              </svg>
            </button>
            <button
              onClick={onDeleteChat}
              title="Delete chat"
              className="p-2 text-gray-300 hover:text-red-400 hover:bg-gray-800 rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={onExportChat}
              title="Export chat"
              className="p-2 text-gray-300 hover:text-blue-400 hover:bg-gray-800 rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
