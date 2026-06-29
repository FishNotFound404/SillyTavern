/**
 * Pure helper functions for chat message actions (edit, delete, regenerate).
 *
 * These are intentionally framework-free so they can be unit-tested with the
 * existing Jest setup in the `tests/` directory.
 */

/**
 * @typedef {object} ChatMessage
 * @property {string} name
 * @property {boolean} is_user
 * @property {string} mes
 * @property {string} send_date
 */

/**
 * @typedef {object} ChatMetadata
 * @property {object} chat_metadata
 */

/**
 * @typedef {ChatMetadata | ChatMessage} ChatLine
 */

/**
 * Chat file line 0 is metadata, so the message at visual index N
 * is stored at chatData[N + 1].
 * @param {number} messageIndex
 * @returns {number}
 */
export function toChatDataIndex(messageIndex) {
  return messageIndex + 1
}

/**
 * @param {ChatLine} line
 * @returns {line is ChatMessage}
 */
export function isChatMessage(line) {
  return (
    typeof line === 'object' &&
    line !== null &&
    'is_user' in line &&
    typeof line.is_user === 'boolean'
  )
}

/**
 * Return a shallow copy of chatData with the message at `messageIndex`
 * updated to `newText` and its send_date refreshed.
 * Returns null if the target is not a chat message.
 * @param {ChatLine[]} chatData
 * @param {number} messageIndex
 * @param {string} newText
 * @returns {ChatLine[] | null}
 */
export function applyMessageEdit(chatData, messageIndex, newText) {
  const trimmed = newText.trim()
  if (!trimmed) return null

  const chatDataIndex = toChatDataIndex(messageIndex)
  const target = chatData[chatDataIndex]
  if (!target || !isChatMessage(target)) return null

  const updated = [...chatData]
  updated[chatDataIndex] = updateCurrentSwipe(target, trimmed)
  return updated
}

/**
 * Return a shallow copy of chatData with the message at `messageIndex` removed.
 * @param {ChatLine[]} chatData
 * @param {number} messageIndex
 * @returns {ChatLine[]}
 */
export function deleteMessage(chatData, messageIndex) {
  const chatDataIndex = toChatDataIndex(messageIndex)
  return chatData.filter((_, i) => i !== chatDataIndex)
}

/**
 * Build the context needed to regenerate an assistant reply.
 * Returns null if the target is missing or not an assistant message.
 * @param {ChatLine[]} chatData
 * @param {number} messageIndex
 * @returns {{ target: ChatMessage, truncated: ChatLine[], historyMessages: ChatMessage[] } | null}
 */
export function prepareRegenerateContext(chatData, messageIndex) {
  const chatDataIndex = toChatDataIndex(messageIndex)
  const target = chatData[chatDataIndex]
  if (!target || !isChatMessage(target) || target.is_user) return null

  const truncated = chatData.slice(0, chatDataIndex)
  const historyMessages = truncated.filter(isChatMessage)
  return { target, truncated, historyMessages }
}

/**
 * Build the message payload sent to the MiniMax chat completion endpoint.
 * @param {string} systemPrompt
 * @param {ChatMessage[]} historyMessages
 * @returns {{ role: string, content: string }[]}
 */
export function buildApiMessages(systemPrompt, historyMessages) {
  return [
    { role: 'system', content: systemPrompt },
    ...historyMessages.map((m) => ({
      role: m.is_user ? 'user' : 'assistant',
      content: m.mes,
    })),
  ]
}


/**
 * Ensure an assistant message has a swipes array and a valid swipe_id.
 * If the message already has swipes, sync mes to the current swipe_id.
 * Returns a shallow copy; does not mutate input.
 * @param {ChatLine} message
 * @returns {ChatLine}
 */
export function ensureSwipes(message) {
  if (!isChatMessage(message) || message.is_user) return message

  if (Array.isArray(message.swipes) && message.swipes.length > 0) {
    const swipeId = Math.max(0, Math.min(message.swipe_id ?? 0, message.swipes.length - 1))
    return { ...message, swipe_id: swipeId, mes: message.swipes[swipeId] }
  }

  return {
    ...message,
    swipes: [message.mes],
    swipe_id: 0,
    swipe_info: [{}],
  }
}

/**
 * Sync message.mes to swipes[swipe_id].
 * @param {ChatLine} message
 * @returns {ChatLine}
 */
export function syncMesToSwipe(message) {
  if (!isChatMessage(message) || message.is_user || !Array.isArray(message.swipes)) return message
  const swipeId = Math.max(0, Math.min(message.swipe_id ?? 0, message.swipes.length - 1))
  return { ...message, swipe_id: swipeId, mes: message.swipes[swipeId] }
}

/**
 * Append a new empty swipe to an assistant message and activate it.
 * @param {ChatLine} message
 * @returns {ChatLine}
 */
export function appendSwipe(message) {
  if (!isChatMessage(message) || message.is_user) return message
  const ensured = ensureSwipes(message)
  const newSwipes = [...ensured.swipes, '']
  const newSwipeInfo = [...(ensured.swipe_info || []), {}]
  return {
    ...ensured,
    swipes: newSwipes,
    swipe_info: newSwipeInfo,
    swipe_id: newSwipes.length - 1,
    mes: '',
  }
}

/**
 * Update the currently active swipe (and mes) with new text and refresh send_date.
 * @param {ChatLine} message
 * @param {string} text
 * @returns {ChatLine}
 */
export function updateCurrentSwipe(message, text) {
  const now = new Date().toISOString()
  if (!isChatMessage(message) || message.is_user || !Array.isArray(message.swipes)) {
    return isChatMessage(message) ? { ...message, mes: text, send_date: now } : message
  }
  const swipeId = message.swipe_id ?? 0
  const newSwipes = message.swipes.map((s, i) => (i === swipeId ? text : s))
  const newSwipeInfo = (message.swipe_info || []).map((info, i) =>
    i === swipeId ? { ...info, send_date: now } : info,
  )
  return { ...message, mes: text, swipes: newSwipes, swipe_info: newSwipeInfo, send_date: now }
}

/**
 * Switch the active swipe of an assistant message.
 * If branch=true and the target is not the last message, truncate everything after it.
 * @param {ChatLine[]} chatData
 * @param {number} messageIndex
 * @param {number} newSwipeId
 * @param {boolean} [branch=true]
 * @returns {ChatLine[]}
 */
export function setSwipeId(chatData, messageIndex, newSwipeId, branch = true) {
  const chatDataIndex = toChatDataIndex(messageIndex)
  const target = chatData[chatDataIndex]
  if (!target || !isChatMessage(target) || target.is_user || !Array.isArray(target.swipes)) {
    return chatData
  }

  const clampedId = Math.max(0, Math.min(newSwipeId, target.swipes.length - 1))
  let working = chatData
  if (branch && chatDataIndex < chatData.length - 1) {
    working = chatData.slice(0, chatDataIndex + 1)
  }

  const updated = {
    ...working[chatDataIndex],
    swipe_id: clampedId,
    mes: target.swipes[clampedId],
  }
  return [
    ...working.slice(0, chatDataIndex),
    updated,
    ...working.slice(chatDataIndex + 1),
  ]
}

/**
 * Delete the currently active swipe of an assistant message.
 * If only one swipe remains, delete the whole message instead.
 * @param {ChatLine[]} chatData
 * @param {number} messageIndex
 * @returns {ChatLine[]}
 */
export function deleteCurrentSwipe(chatData, messageIndex) {
  const chatDataIndex = toChatDataIndex(messageIndex)
  const target = chatData[chatDataIndex]
  if (!target || !isChatMessage(target) || target.is_user || !Array.isArray(target.swipes)) {
    return chatData
  }
  if (target.swipes.length <= 1) {
    return deleteMessage(chatData, messageIndex)
  }

  const swipeId = target.swipe_id ?? 0
  const newSwipes = target.swipes.filter((_, i) => i !== swipeId)
  const newSwipeInfo = (target.swipe_info || []).filter((_, i) => i !== swipeId)
  const newSwipeId = Math.max(0, Math.min(swipeId, newSwipes.length - 1))
  const updated = {
    ...target,
    swipes: newSwipes,
    swipe_info: newSwipeInfo,
    swipe_id: newSwipeId,
    mes: newSwipes[newSwipeId],
  }
  return [
    ...chatData.slice(0, chatDataIndex),
    updated,
    ...chatData.slice(chatDataIndex + 1),
  ]
}
