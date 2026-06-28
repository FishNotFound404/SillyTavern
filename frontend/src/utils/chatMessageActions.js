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
  updated[chatDataIndex] = {
    ...target,
    mes: trimmed,
    send_date: new Date().toISOString(),
  }
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
