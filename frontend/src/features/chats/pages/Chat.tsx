import { useState, useRef, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { useNavigate } from 'react-router-dom'
import type { ChatMessage } from '../../../api/types'
import { useChat } from '../hooks/useChat'
import { ChatHeader } from '../components/ChatHeader'
import { ChatInput } from '../components/ChatInput'
import { ChatMessageItem } from '../components/ChatMessageItem'
import { ScreenshotDialog, type DialogFormat } from '../components/ScreenshotDialog'
import { CanvasSurface } from '../components/CanvasSurface'
import { useScreenshot } from '../hooks/useScreenshot'
import { ChatSkeleton, EmptyState, ErrorState } from '../../../components/ui'

function Chat() {
  const navigate = useNavigate()
  const {
    messagesParentRef,
    character,
    chatFiles,
    selectedFile,
    chatData,
    input,
    setInput,
    loading,
    generating,
    error,
    editingIndex,
    editText,
    setEditText,
    searchQuery,
    setSearchQuery,
    currentMatchIndex,
    matchIndices,
    messages,
    activePersonaName,
    activePersonaAvatar,
    characterAvatar,
    virtualizer,
    selectChat,
    handleNewChat,
    handleRenameChat,
    handleDeleteChat,
    handleClearChat,
    handleExportChat,
    handleSend,
    handleStop,
    handleRegenerate,
    handleEditStart,
    handleEditCancel,
    handleEditSave,
    handleDelete,
    handleSwipeChange,
    handleSwipeSelect,
    handlePreviousMatch,
    handleNextMatch,
  } = useChat()

  const screenshot = useScreenshot()
  const [screenshotDialogOpen, setScreenshotDialogOpen] = useState(false)
  const [screenshotFormat, setScreenshotFormat] = useState<DialogFormat>('png1x')
  const autoCloseTimeoutRef = useRef<number | null>(null)

  const chatFileName = chatFiles.find((c) => c.file_id === selectedFile)?.file_name ?? null

  const handleScreenshotChat = (_format: DialogFormat) => {
    setScreenshotDialogOpen(true)
  }

  const handleScreenshotRun = async () => {
    const messageOnly = chatData.filter((l): l is ChatMessage => !('chat_metadata' in l))

    const host = document.createElement('div')
    host.style.position = 'fixed'
    host.style.left = '-99999px'
    host.style.top = '0'
    let root: ReturnType<typeof createRoot> | null = null

    try {
      document.body.appendChild(host)
      root = createRoot(host)
      root.render(
        <CanvasSurface
          character={character}
          characterAvatar={characterAvatar}
          personaName={activePersonaName}
          personaAvatar={activePersonaAvatar}
          chatFileName={chatFileName ?? undefined}
          messages={messageOnly}
          query={searchQuery}
        />,
      )

      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

      await screenshot.run({
        container: host,
        format: screenshotFormat,
        characterName: character?.name ?? null,
        chatFileName,
      })

      if (screenshot.state.kind === 'done') {
        if (autoCloseTimeoutRef.current !== null) {
          window.clearTimeout(autoCloseTimeoutRef.current)
        }
        autoCloseTimeoutRef.current = window.setTimeout(() => {
          autoCloseTimeoutRef.current = null
          setScreenshotDialogOpen(false)
          screenshot.reset()
        }, 2000)
      }
    } finally {
      if (root) root.unmount()
      if (host.parentNode === document.body) document.body.removeChild(host)
    }
  }

  useEffect(() => {
    return () => {
      if (autoCloseTimeoutRef.current !== null) {
        window.clearTimeout(autoCloseTimeoutRef.current)
        autoCloseTimeoutRef.current = null
      }
    }
  }, [])

  const isRunning =
    screenshot.state.kind === 'rendering' ||
    screenshot.state.kind === 'encoding' ||
    screenshot.state.kind === 'downloading'

  if (loading) {
    return <ChatSkeleton />
  }

  if (error) {
    return (
      <ErrorState
        title="Couldn鈥檛 load chat"
        message={error}
        onRetry={() => navigate('/')}
      />
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 h-[calc(100vh-4rem)] flex flex-col">
      <ChatHeader
        character={character}
        chatFiles={chatFiles}
        selectedFile={selectedFile}
        chatData={chatData}
        generating={generating}
        activePersonaName={activePersonaName}
        activePersonaAvatar={activePersonaAvatar}
        searchQuery={searchQuery}
        matchCount={matchIndices.length}
        currentMatchIndex={currentMatchIndex}
        onBack={() => navigate('/')}
        onSearchQueryChange={setSearchQuery}
        onPreviousMatch={handlePreviousMatch}
        onNextMatch={handleNextMatch}
        onNewChat={handleNewChat}
        onSelectChat={(fileId) => selectChat(fileId)}
        onRenameChat={handleRenameChat}
        onClearChat={handleClearChat}
        onDeleteChat={handleDeleteChat}
        onExportChat={handleExportChat}
        onScreenshotChat={handleScreenshotChat}
        onManagePersonas={() => navigate('/personas')}
      />

      {/* Messages */}
      <div
        ref={messagesParentRef}
        className={`flex-1 overflow-y-auto pr-2 ${messages.length === 0 ? 'flex items-center justify-center' : ''}`}
      >
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
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const index = virtualItem.index
              const message = messages[index]
              return (
                <div
                  key={virtualItem.key}
                  data-index={index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <ChatMessageItem
                    message={message}
                    index={index}
                    editingIndex={editingIndex}
                    editText={editText}
                    generating={generating}
                    userAvatar={activePersonaAvatar}
                    characterAvatar={characterAvatar}
                    query={searchQuery}
                    onEditStart={handleEditStart}
                    onEditSave={handleEditSave}
                    onEditCancel={handleEditCancel}
                    onEditTextChange={setEditText}
                    onDelete={handleDelete}
                    onRegenerate={handleRegenerate}
                    onSwipeChange={handleSwipeChange}
                    onSwipeSelect={handleSwipeSelect}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ChatInput
        input={input}
        setInput={setInput}
        generating={generating}
        onSend={handleSend}
        onStop={handleStop}
      />

      {screenshotDialogOpen && (
        <ScreenshotDialog
          format={screenshotFormat}
          setFormat={setScreenshotFormat}
          onConfirm={() => {
            void handleScreenshotRun()
          }}
          onClose={() => {
            if (isRunning) return
            if (autoCloseTimeoutRef.current !== null) {
              window.clearTimeout(autoCloseTimeoutRef.current)
              autoCloseTimeoutRef.current = null
            }
            setScreenshotDialogOpen(false)
            screenshot.reset()
          }}
          running={screenshot.state.kind !== 'idle'}
          phase={
            screenshot.state.kind === 'rendering'
              ? 'rendering'
              : screenshot.state.kind === 'encoding'
                ? 'encoding'
                : screenshot.state.kind === 'downloading'
                  ? 'downloading'
                  : screenshot.state.kind === 'done'
                    ? 'done'
                    : screenshot.state.kind === 'error'
                      ? 'error'
                      : 'idle'
          }
          filename={screenshot.state.kind === 'done' ? screenshot.state.filename : undefined}
          error={screenshot.state.kind === 'error' ? screenshot.state.message : undefined}
        />
      )}
    </div>
  )
}

export default Chat
