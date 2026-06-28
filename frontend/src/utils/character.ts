import { apiPost, apiPostForm } from '../api/client'
import type { Character, CharacterDraft } from '../types'

export async function fetchCharacterForEdit(avatar: string): Promise<Character> {
  return apiPost<Character>('/api/characters/get', { avatar_url: decodeURIComponent(avatar) })
}

function appendIfPresent(form: FormData, key: string, value: string | number | undefined) {
  if (value !== undefined && value !== '') {
    form.append(key, String(value))
  }
}

export function buildCharacterFormData(draft: CharacterDraft): FormData {
  const form = new FormData()

  form.append('ch_name', draft.name)
  form.append('description', draft.description)
  form.append('personality', draft.personality)
  form.append('scenario', draft.scenario)
  form.append('first_mes', draft.firstMes)
  form.append('mes_example', draft.mesExample)
  form.append('creator_notes', draft.creatorNotes)
  form.append('system_prompt', draft.systemPrompt)
  form.append('post_history_instructions', draft.postHistoryInstructions)
  appendIfPresent(form, 'creator', draft.creator)
  appendIfPresent(form, 'character_version', draft.characterVersion)
  form.append('tags', draft.tags.join(', '))
  form.append('talkativeness', String(draft.talkativeness))
  form.append('fav', 'false')

  if (draft.avatarFile) {
    form.append('avatar', draft.avatarFile)
  }

  if (draft.jsonData) {
    form.append('json_data', draft.jsonData)
  }

  if (draft.chat) {
    form.append('chat', draft.chat)
  }

  if (draft.createDate) {
    form.append('create_date', draft.createDate)
  }

  return form
}

export async function createCharacter(draft: CharacterDraft): Promise<string> {
  const form = buildCharacterFormData(draft)
  const result = await apiPostForm<string | { avatar?: string }>('/api/characters/create', form)

  if (typeof result === 'string') {
    return result
  }

  if (result && typeof result === 'object' && 'avatar' in result && typeof result.avatar === 'string') {
    return result.avatar
  }

  throw new Error('Unexpected response from character creation')
}

export async function updateCharacter(avatar: string, draft: CharacterDraft): Promise<void> {
  const form = buildCharacterFormData(draft)
  form.append('avatar_url', decodeURIComponent(avatar))
  await apiPostForm<unknown>('/api/characters/edit', form)
}
