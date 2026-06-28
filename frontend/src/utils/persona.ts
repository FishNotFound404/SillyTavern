import type { Persona, PersonaState } from '../types/persona'

const SETTINGS_KEY = 'reactPersonas'

export function readPersonaState(settings: Record<string, unknown>): PersonaState {
  const raw = settings[SETTINGS_KEY]
  const partial = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
  const personas = Array.isArray(partial.personas) ? (partial.personas as Persona[]) : []
  return {
    personas,
    defaultId: (partial.defaultId as string | null) || (personas[0]?.id ?? null),
  }
}

export function writePersonaState(
  settings: Record<string, unknown>,
  state: PersonaState,
): Record<string, unknown> {
  return {
    ...settings,
    [SETTINGS_KEY]: state,
  }
}

export function getPersonaById(state: PersonaState, id: string | null): Persona | null {
  if (!id) return null
  return state.personas.find((p) => p.id === id) || null
}

export function getDefaultPersona(state: PersonaState): Persona | null {
  return getPersonaById(state, state.defaultId) || state.personas[0] || null
}

export function getPersonaAvatarUrl(avatar: string): string {
  return `/User%20Avatars/${encodeURIComponent(avatar)}`
}

export function getPersonaThumbnailUrl(avatar: string): string {
  return `/thumbnail?type=persona&file=${encodeURIComponent(avatar)}`
}

async function fetchCsrfToken(): Promise<string | undefined> {
  try {
    const res = await fetch('/csrf-token')
    if (!res.ok) return undefined
    const data = (await res.json()) as { token?: string }
    return data.token
  } catch {
    return undefined
  }
}

export async function uploadPersonaAvatar(file: File): Promise<string> {
  const token = await fetchCsrfToken()
  const formData = new FormData()
  formData.append('avatar', file)

  const res = await fetch('/api/avatars/upload', {
    method: 'POST',
    headers: token ? { 'X-CSRF-Token': token } : undefined,
    body: formData,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => 'Upload failed')
    throw new Error(`HTTP ${res.status}: ${text}`)
  }

  const data = (await res.json()) as { path?: string }
  if (!data.path) throw new Error('Upload response missing path')
  return data.path
}

export async function deletePersonaAvatar(avatar: string): Promise<void> {
  const token = await fetchCsrfToken()
  const res = await fetch('/api/avatars/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-CSRF-Token': token } : {}),
    },
    body: JSON.stringify({ avatar }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => 'Delete failed')
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
}

export function generatePersonaId(): string {
  return `persona_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}
