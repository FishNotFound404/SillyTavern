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


// --- Swipe helpers ---

import {
  appendSwipe,
  deleteCurrentSwipe,
  ensureSwipes,
  setSwipeId,
  syncMesToSwipe,
  updateCurrentSwipe,
} from '../frontend/src/utils/chatMessageActions.js'

describe('swipe helpers', () => {
  const makeAssistantWithSwipes = (swipes, swipeId = 0) => ({
    name: 'Seraphina',
    is_user: false,
    mes: swipes[swipeId],
    send_date: '2026-01-01T00:00:00.000Z',
    swipes,
    swipe_id: swipeId,
    swipe_info: swipes.map(() => ({})),
  })

  describe('ensureSwipes', () => {
    it('initializes swipes for an assistant message without them', () => {
      const message = makeAssistantMessage('hello')
      const result = ensureSwipes(message)
      expect(result.swipes).toEqual(['hello'])
      expect(result.swipe_id).toBe(0)
      expect(result.swipe_info).toHaveLength(1)
      expect(result.mes).toBe('hello')
    })

    it('syncs mes to swipe_id when swipes already exist', () => {
      const message = makeAssistantWithSwipes(['a', 'b', 'c'], 2)
      const modified = { ...message, mes: 'wrong' }
      const result = ensureSwipes(modified)
      expect(result.mes).toBe('c')
      expect(result.swipe_id).toBe(2)
    })

    it('leaves user messages unchanged', () => {
      const message = makeUserMessage('hi')
      const result = ensureSwipes(message)
      expect(result).toEqual(message)
    })
  })

  describe('syncMesToSwipe', () => {
    it('sets mes to the active swipe text', () => {
      const message = makeAssistantWithSwipes(['first', 'second'], 1)
      const modified = { ...message, mes: 'first' }
      const result = syncMesToSwipe(modified)
      expect(result.mes).toBe('second')
    })
  })

  describe('appendSwipe', () => {
    it('adds an empty swipe and activates it', () => {
      const message = makeAssistantWithSwipes(['hello'], 0)
      const result = appendSwipe(message)
      expect(result.swipes).toEqual(['hello', ''])
      expect(result.swipe_id).toBe(1)
      expect(result.mes).toBe('')
      expect(result.swipe_info).toHaveLength(2)
    })

    it('initializes swipes before appending if missing', () => {
      const message = makeAssistantMessage('hello')
      const result = appendSwipe(message)
      expect(result.swipes).toEqual(['hello', ''])
      expect(result.swipe_id).toBe(1)
    })
  })

  describe('updateCurrentSwipe', () => {
    it('updates the active swipe and mes', () => {
      const message = makeAssistantWithSwipes(['a', 'b'], 1)
      const result = updateCurrentSwipe(message, 'edited')
      expect(result.mes).toBe('edited')
      expect(result.swipes).toEqual(['a', 'edited'])
      expect(result.send_date).not.toBe(message.send_date)
    })

    it('updates swipe_info send_date for the active swipe', () => {
      const message = makeAssistantWithSwipes(['a', 'b'], 1)
      const result = updateCurrentSwipe(message, 'edited')
      expect(result.swipe_info[1].send_date).toBeDefined()
      expect(result.swipe_info[0].send_date).toBeUndefined()
    })

    it('falls back to updating mes for messages without swipes', () => {
      const message = makeUserMessage('hi')
      const result = updateCurrentSwipe(message, 'hello')
      expect(result.mes).toBe('hello')
    })
  })

  describe('setSwipeId', () => {
    it('switches active swipe without branching when target is the last message', () => {
      const chatData = [
        makeMetadata(),
        makeUserMessage('prompt'),
        makeAssistantWithSwipes(['first', 'second'], 0),
      ]
      const result = setSwipeId(chatData, 1, 1, true)
      expect(result).toHaveLength(3)
      expect(result[2].swipe_id).toBe(1)
      expect(result[2].mes).toBe('second')
    })

    it('branches by truncating later messages when switching an earlier message', () => {
      const chatData = [
        makeMetadata(),
        makeAssistantWithSwipes(['a1', 'a2'], 0),
        makeUserMessage('follow up'),
        makeAssistantWithSwipes(['b1'], 0),
      ]
      const result = setSwipeId(chatData, 0, 1, true)
      expect(result).toHaveLength(2)
      expect(result[1].swipe_id).toBe(1)
      expect(result[1].mes).toBe('a2')
    })

    it('does not truncate when branch=false', () => {
      const chatData = [
        makeMetadata(),
        makeAssistantWithSwipes(['a1', 'a2'], 0),
        makeUserMessage('follow up'),
      ]
      const result = setSwipeId(chatData, 0, 1, false)
      expect(result).toHaveLength(3)
      expect(result[1].swipe_id).toBe(1)
    })
  })

  describe('deleteCurrentSwipe', () => {
    it('deletes the active swipe and moves to the previous one', () => {
      const chatData = [
        makeMetadata(),
        makeUserMessage('prompt'),
        makeAssistantWithSwipes(['first', 'second', 'third'], 2),
      ]
      const result = deleteCurrentSwipe(chatData, 1)
      expect(result).toHaveLength(3)
      expect(result[2].swipes).toEqual(['first', 'second'])
      expect(result[2].swipe_id).toBe(1)
      expect(result[2].mes).toBe('second')
    })

    it('deletes the whole message when only one swipe remains', () => {
      const chatData = [
        makeMetadata(),
        makeUserMessage('prompt'),
        makeAssistantWithSwipes(['only'], 0),
      ]
      const result = deleteCurrentSwipe(chatData, 1)
      expect(result).toHaveLength(2)
    })
  })
})
