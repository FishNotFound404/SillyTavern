export interface CharacterBookEntry {
  id: number
  keys: string[]
  secondary_keys?: string[]
  content: string
  constant?: boolean
  selective?: boolean
  enabled?: boolean
  insertion_order?: number
  position?: 'before_char' | 'after_char'
  comment?: string
}

export interface CharacterBook {
  name?: string
  entries: CharacterBookEntry[]
}

/**
 * Gather lore entries from a character book that match the given context.
 *
 * - Constant entries are always included.
 * - Non-constant entries are included if any primary key appears in the context.
 * - Selective entries additionally require at least one secondary key to match.
 * - Results are sorted by insertion_order and returned as content strings.
 */
export function gatherMatchingLore(
  book: CharacterBook | null | undefined,
  context: string,
): string[] {
  if (!book || !Array.isArray(book.entries)) return []

  const contextLower = context.toLowerCase()

  return book.entries
    .filter((entry) => entry.enabled !== false)
    .filter((entry) => {
      if (entry.constant) return true

      const primaryKeys = entry.keys || []
      if (primaryKeys.length === 0) return false
      const primaryMatch = primaryKeys.some((key) => contextLower.includes(key.toLowerCase()))
      if (!primaryMatch) return false

      if (entry.selective && entry.secondary_keys && entry.secondary_keys.length > 0) {
        return entry.secondary_keys.some((key) => contextLower.includes(key.toLowerCase()))
      }

      return true
    })
    .sort((a, b) => (a.insertion_order ?? 100) - (b.insertion_order ?? 100))
    .map((entry) => entry.content)
}

/**
 * Build a system prompt with optional injected lore content.
 */
export function buildSystemPromptWithLore(
  baseSystemPrompt: string,
  loreContents: string[],
): string {
  if (loreContents.length === 0) return baseSystemPrompt

  const loreBlock = loreContents.join('\n\n')
  return [baseSystemPrompt, '[World Info]', loreBlock].filter(Boolean).join('\n\n')
}
