import type { Character } from '../../characters/types'

interface GroupMemberSidebarProps {
  members: Character[]
  currentSpeaker: Character | null
  generating: boolean
  sidebarOpen: boolean
  onCloseSidebar: () => void
  onBack: () => void
  onMemberClick: (member: Character) => void
  onNewChat: () => void
}

export function GroupMemberSidebar({
  members,
  currentSpeaker,
  generating,
  sidebarOpen,
  onCloseSidebar,
  onBack,
  onMemberClick,
  onNewChat,
}: GroupMemberSidebarProps) {
  return (
    <aside
      className={`${
        sidebarOpen ? 'block' : 'hidden md:block'
      } w-full md:w-64 bg-gray-900 border-r border-gray-800 p-4 flex-shrink-0 overflow-y-auto md:static absolute inset-x-0 top-0 bottom-0 z-20`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Members</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onCloseSidebar}
            aria-label="Close members"
            className="md:hidden p-1 text-gray-300 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={onBack}
            className="text-xs text-gray-400 hover:text-white"
          >
            Back
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {members.map((member) => (
          <button
            key={member.avatar}
            onClick={() => onMemberClick(member)}
            disabled={generating}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
              currentSpeaker?.avatar === member.avatar
                ? 'bg-blue-600/30 border border-blue-500'
                : 'bg-gray-800 hover:bg-gray-700 border border-transparent'
            }`}
          >
            <img
              src={`/characters/${encodeURIComponent(member.avatar)}`}
              alt={member.name}
              className="w-8 h-8 rounded-full object-cover bg-gray-700"
            />
            <span className="text-sm text-white truncate">{member.name}</span>
          </button>
        ))}
      </div>
      <button
        onClick={onNewChat}
        disabled={generating}
        className="mt-4 w-full px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm font-medium"
      >
        New Group Chat
      </button>
    </aside>
  )
}
