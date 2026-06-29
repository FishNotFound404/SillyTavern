import { create } from 'zustand'

export interface Persona {
  name: string
  avatar_url?: string
  description?: string
}

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
