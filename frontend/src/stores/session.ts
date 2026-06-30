import { create } from 'zustand'
import type { Persona } from '../features/personas/types'

interface SessionState {
  userPersona: Persona | null
  activeChatId: string | null
  activeCharacterAvatar: string | null
  setUserPersona: (persona: Persona | null) => void
  setActiveChatId: (id: string | null) => void
  setActiveCharacterAvatar: (avatar: string | null) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  userPersona: null,
  activeChatId: null,
  activeCharacterAvatar: null,
  setUserPersona: (persona) => set({ userPersona: persona }),
  setActiveChatId: (id) => set({ activeChatId: id }),
  setActiveCharacterAvatar: (avatar) => set({ activeCharacterAvatar: avatar }),
}))