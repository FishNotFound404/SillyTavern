const UNSAFE_CHARS = /[<>:"/\\|?*]/g
const SPACES = /\s+/g

interface BuildFilenameInput {
  characterName?: string | null
  chatFileName?: string | null
  date: Date
  extension: 'png' | 'jpeg' | 'jpg'
}

function sanitize(s: string | null | undefined, fallback: string): string {
  if (!s) return fallback
  const replaced = s.replace(UNSAFE_CHARS, '_').replace(SPACES, '_').trim()
  return replaced.length === 0 ? fallback : replaced
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

function toUtcTimestamp(date: Date): string {
  return (
    date.getUTCFullYear().toString() +
    pad2(date.getUTCMonth() + 1) +
    pad2(date.getUTCDate()) +
    '-' +
    pad2(date.getUTCHours()) +
    pad2(date.getUTCMinutes()) +
    pad2(date.getUTCSeconds())
  )
}

export function buildScreenshotFilename(input: BuildFilenameInput): string {
  const character = sanitize(input.characterName, 'character')
  const chat = sanitize(input.chatFileName, 'chat')
  const stamp = toUtcTimestamp(input.date)
  const ext = input.extension === 'jpg' ? 'jpeg' : input.extension
  return `SillyTavern-${character}-${chat}-${stamp}.${ext}`
}