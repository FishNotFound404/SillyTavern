import { ChatMessageItem } from './ChatMessageItem'
import type { ChatMessage } from '../../../api/types'
import type { Character } from '../../characters/types'

interface CanvasSurfaceProps {
  character: Character | null
  characterAvatar?: string
  personaName: string
  personaAvatar?: string
  chatFileName?: string
  messages: ChatMessage[]
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

function formatTimestamp(value: string | Date | undefined): string {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return (
    d.getFullYear() +
    '-' +
    pad2(d.getMonth() + 1) +
    '-' +
    pad2(d.getDate()) +
    ' ' +
    pad2(d.getHours()) +
    ':' +
    pad2(d.getMinutes()) +
    ':' +
    pad2(d.getSeconds())
  )
}

const noop = () => {}
const noopText = () => ''
const noopSwipe = () => {}

export function CanvasSurface({
  character,
  characterAvatar,
  personaName,
  personaAvatar,
  chatFileName,
  messages,
}: CanvasSurfaceProps) {
  return (
    <div
      style={{
        width: 1024,
        padding: 24,
        backgroundColor: '#111827',
        color: '#f3f4f6',
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>SillyTavern 对话截图</div>
        <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
          角色: {character?.name ?? '未选择'} · 玩家: {personaName} · 时间: {formatTimestamp(new Date())}
          {chatFileName ? ` · 对话: ${chatFileName}` : ''}
        </div>
      </div>
      {messages.map((m, i) => (
        <div key={i} style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
            {`#${i + 1}`} {formatTimestamp(m.send_date)}
          </div>
          <ChatMessageItem
            message={m}
            index={i}
            editingIndex={null}
            editText=""
            generating={false}
            userAvatar={personaAvatar}
            characterAvatar={characterAvatar}
            onEditStart={noop}
            onEditSave={noop}
            onEditCancel={noop}
            onEditTextChange={noopText}
            onDelete={noop}
            onRegenerate={noop}
            onSwipeChange={noopSwipe}
            onSwipeSelect={noopSwipe}
          />
        </div>
      ))}
    </div>
  )
}