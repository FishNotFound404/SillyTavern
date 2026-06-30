import type { Persona, PersonaState } from './types'

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

export function generatePersonaId(): string {
  return `persona_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}
