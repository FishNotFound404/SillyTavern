import {
  applyMessageEdit,
  buildApiMessages,
  deleteMessage,
  isChatMessage,
  prepareRegenerateContext,
  toChatDataIndex,
} from '../frontend/src/utils/chatMessageActions.js'

const makeMetadata = () => ({
  chat_metadata: {
    integrity: 'test',
    note_prompt: '',
    note_interval: 1,
    note_position: 0,
    note_depth: 4,
    note_role: 0,
  },
  user_name: 'User',
  character_name: 'Seraphina',
})

const makeUserMessage = (mes) => ({
  name: 'User',
  is_user: true,
  mes,
  send_date: '2026-01-01T00:00:00.000Z',
})

const makeAssistantMessage = (mes) => ({
  name: 'Seraphina',
  is_user: false,
  mes,
  send_date: '2026-01-01T00:00:01.000Z',
})

describe('chatMessageActions', () => {
  describe('toChatDataIndex', () => {
    it('maps visual message index to chatData index (metadata offset)', () => {
      expect(toChatDataIndex(0)).toBe(1)
      expect(toChatDataIndex(5)).toBe(6)
    })
  })

  describe('isChatMessage', () => {
    it('returns true for messages', () => {
      expect(isChatMessage(makeUserMessage('hi'))).toBe(true)
      expect(isChatMessage(makeAssistantMessage('hello'))).toBe(true)
    })

    it('returns false for metadata', () => {
      expect(isChatMessage(makeMetadata())).toBe(false)
    })
  })

  describe('applyMessageEdit', () => {
    it('updates the target message and refreshes send_date', () => {
      const chatData = [
        makeMetadata(),
        makeUserMessage('original'),
        makeAssistantMessage('reply'),
      ]

      const updated = applyMessageEdit(chatData, 0, 'edited')

      expect(updated).not.toBeNull()
      expect(updated[1].mes).toBe('edited')
      expect(updated[1].send_date).not.toBe('2026-01-01T00:00:00.000Z')
      expect(updated[0]).toEqual(chatData[0])
      expect(updated[2]).toEqual(chatData[2])
    })

    it('returns null for empty text', () => {
      const chatData = [makeMetadata(), makeUserMessage('original')]
      expect(applyMessageEdit(chatData, 0, '   ')).toBeNull()
    })

    it('returns null when target is metadata', () => {
      const chatData = [makeMetadata(), makeUserMessage('original')]
      // messageIndex -1 would point at metadata line 0
      expect(applyMessageEdit(chatData, -1, 'edited')).toBeNull()
    })

    it('does not mutate original chatData', () => {
      const chatData = [makeMetadata(), makeUserMessage('original')]
      const original = JSON.stringify(chatData)
      applyMessageEdit(chatData, 0, 'edited')
      expect(JSON.stringify(chatData)).toBe(original)
    })
  })

  describe('deleteMessage', () => {
    it('removes the message at the given index', () => {
      const chatData = [
        makeMetadata(),
        makeUserMessage('first'),
        makeAssistantMessage('second'),
        makeUserMessage('third'),
      ]

      const updated = deleteMessage(chatData, 1)

      expect(updated).toHaveLength(3)
      expect(updated[0]).toEqual(chatData[0])
      expect(updated[1]).toEqual(chatData[1])
      expect(updated[2]).toEqual(chatData[3])
    })

    it('preserves metadata', () => {
      const chatData = [makeMetadata(), makeUserMessage('only')]
      const updated = deleteMessage(chatData, 0)
      expect(updated).toHaveLength(1)
      expect(updated[0]).toEqual(chatData[0])
    })
  })

  describe('prepareRegenerateContext', () => {
    it('returns context for an assistant message', () => {
      const chatData = [
        makeMetadata(),
        makeUserMessage('prompt'),
        makeAssistantMessage('reply'),
      ]

      const context = prepareRegenerateContext(chatData, 1)

      expect(context).not.toBeNull()
      expect(context.target).toEqual(chatData[2])
      expect(context.truncated).toHaveLength(2)
      expect(context.historyMessages).toHaveLength(1)
      expect(context.historyMessages[0]).toEqual(chatData[1])
    })

    it('returns null for a user message', () => {
      const chatData = [makeMetadata(), makeUserMessage('prompt')]
      expect(prepareRegenerateContext(chatData, 0)).toBeNull()
    })

    it('returns null for metadata', () => {
      const chatData = [makeMetadata(), makeAssistantMessage('reply')]
      expect(prepareRegenerateContext(chatData, -1)).toBeNull()
    })
  })

  describe('buildApiMessages', () => {
    it('builds system + history payload', () => {
      const history = [makeUserMessage('hi'), makeAssistantMessage('hello')]
      const apiMessages = buildApiMessages('You are helpful.', history)

      expect(apiMessages).toEqual([
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: 'hello' },
      ])
    })

    it('works with empty history', () => {
      expect(buildApiMessages('System only.', [])).toEqual([
        { role: 'system', content: 'System only.' },
      ])
    })
  })
})
