interface GroupChatHeaderProps {
  groupName: string
  currentSpeaker: string | null
  searchQuery: string
  matchCount: number
  currentMatchIndex: number
  onToggleSidebar: () => void
  onSearchChange: (query: string) => void
  onPreviousMatch: () => void
  onNextMatch: () => void
  onClearSearch: () => void
}

export function GroupChatHeader({
  groupName,
  currentSpeaker,
  searchQuery,
  matchCount,
  currentMatchIndex,
  onToggleSidebar,
  onSearchChange,
  onPreviousMatch,
  onNextMatch,
  onClearSearch,
}: GroupChatHeaderProps) {
  return (
    <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg shrink-0"
          aria-label="Toggle members"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 13.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 1.694 3 6s4.03 8.25 9 8.25zm0 0c-2.916 0-5.646.586-8.004 1.582a.75.75 0 00-.496.741v1.69c0 .966.784 1.75 1.75 1.75h13.5a1.75 1.75 0 001.75-1.75v-1.69a.75.75 0 00-.496-.741A18.088 18.088 0 0112 14.25z" />
          </svg>
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          G
        </div>
        <div className="min-w-0">
          <h1 className="text-white font-semibold truncate">{groupName}</h1>
          {currentSpeaker && (
            <p className="text-xs text-blue-300 truncate">{currentSpeaker} is speaking...</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-2 py-1.5 border border-gray-700 shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
          className="bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none w-full sm:w-24"
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
            onClick={onClearSearch}
            className="p-1 text-gray-400 hover:text-white"
            title="Clear search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </header>
  )
}
