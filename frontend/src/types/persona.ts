export interface Persona {
  id: string
  name: string
  description: string
  avatar: string // filename in User Avatars/
}

export interface PersonaState {
  personas: Persona[]
  defaultId: string | null
}
