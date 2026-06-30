import { useNavigate } from 'react-router-dom'
import { useGroupChat } from '../hooks/useGroupChat'
import { GroupMemberSidebar } from '../components/GroupMemberSidebar'
import { GroupChatHeader } from '../components/GroupChatHeader'
import { GroupChatInput } from '../components/GroupChatInput'
import { GroupMessageList } from '../components/GroupMessageList'
import { LoadingState, ErrorState } from '../../../components/ui'

export default function GroupChat() {
  const navigate = useNavigate()
  const {
    messagesEndRef,
    group,
    members,
    chatMessages,
    input,
    setInput,
    generating,
    currentSpeaker,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    currentMatchIndex,
    matchIndices,
    sidebarOpen,
    setSidebarOpen,
    activePersonaAvatar,
    handleSend,
    handleMemberReply,
    handleNewChat,
    handlePreviousMatch,
    handleNextMatch,
  } = useGroupChat()

  if (loading) return <LoadingState message="Loading group chat..." />
  if (error || !group) {
    return (
      <ErrorState
        title="Failed to load group chat"
        message={error || 'Group not found'}
        onRetry={() => window.location.reload()}
      />
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-gray-950 relative">
      <GroupMemberSidebar
        members={members}
        currentSpeaker={currentSpeaker}
        generating={generating}
        sidebarOpen={sidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
        onBack={() => navigate('/groups')}
        onMemberClick={handleMemberReply}
        onNewChat={handleNewChat}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <GroupChatHeader
          groupName={group.name}
          currentSpeaker={currentSpeaker?.name || null}
          searchQuery={searchQuery}
          matchCount={matchIndices.length}
          currentMatchIndex={currentMatchIndex}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onSearchChange={setSearchQuery}
          onPreviousMatch={handlePreviousMatch}
          onNextMatch={handleNextMatch}
          onClearSearch={() => setSearchQuery('')}
        />

        <GroupMessageList
          messages={chatMessages}
          members={members}
          activePersonaAvatar={activePersonaAvatar}
          searchQuery={searchQuery}
          generating={generating}
          messagesEndRef={messagesEndRef}
        />

        <div className="bg-gray-900 border-t border-gray-800 p-4">
          {error && (
            <div className="mb-3 px-4 py-2 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}
          <GroupChatInput
            input={input}
            setInput={setInput}
            generating={generating}
            onSend={handleSend}
          />
        </div>
      </main>
    </div>
  )
}
