import type { WorldInfoEntry } from '../types'

interface WorldInfoEntryHeaderProps {
  entry: WorldInfoEntry
  isExpanded: boolean
  onToggle: () => void
  onDelete: () => void
}

export function WorldInfoEntryHeader({
  entry,
  isExpanded,
  onToggle,
  onDelete,
}: WorldInfoEntryHeaderProps) {
  return (
    <div
      data-testid="entry-header"
      onClick={onToggle}
      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800/50"
    >
      <div className="flex items-center gap-3">
        <span className={`w-2.5 h-2.5 rounded-full ${entry.disable ? 'bg-gray-600' : 'bg-green-500'}`} />
        <div>
          <h3 className="font-medium text-white">
            {entry.comment || `Entry #${entry.uid}`}
          </h3>
          <p className="text-sm text-gray-500 truncate max-w-md">
            {entry.key.length > 0 ? entry.key.join(', ') : 'No keywords'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">order {entry.order}</span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          className="p-1.5 text-gray-500 hover:text-blue-400 rounded"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="p-1.5 text-gray-500 hover:text-red-400 rounded"
          title="Delete entry"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
