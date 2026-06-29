import type { CharacterDraft } from './types'

export function characterToDraft(character: Record<string, unknown>): CharacterDraft {
  const data = (character.data as Record<string, unknown> | undefined) || {}

  return {
    name: String(character.name || data.name || ''),
    description: String(character.description || data.description || ''),
    personality: String(character.personality || data.personality || ''),
    scenario: String(character.scenario || data.scenario || ''),
    firstMes: String(character.first_mes || data.first_mes || ''),
    mesExample: String(character.mes_example || data.mes_example || ''),
    creatorNotes: String(character.creator_notes || data.creator_notes || character.creatorcomment || ''),
    systemPrompt: String(character.system_prompt || data.system_prompt || ''),
    postHistoryInstructions: String(
      character.post_history_instructions || data.post_history_instructions || '',
    ),
    creator: String(character.creator || data.creator || ''),
    characterVersion: String(character.character_version || data.character_version || ''),
    tags: Array.isArray(character.tags)
      ? character.tags.map(String)
      : Array.isArray(data.tags)
        ? (data.tags as unknown[]).map(String)
        : [],
    talkativeness:
      typeof character.talkativeness === 'number'
        ? character.talkativeness
        : typeof data.talkativeness === 'number'
          ? data.talkativeness
          : 0.5,
    avatarFile: null,
    avatarUrl: typeof character.avatar === 'string' ? character.avatar : undefined,
    jsonData: typeof character.json_data === 'string' ? character.json_data : undefined,
    chat: typeof character.chat === 'string' ? character.chat : undefined,
    createDate: typeof character.create_date === 'string' ? character.create_date : undefined,
  }
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
