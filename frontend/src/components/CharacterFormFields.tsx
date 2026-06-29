import { TextField } from './form/TextField'
import { TextAreaField } from './form/TextAreaField'
import { TagsInput } from './form/TagsInput'
import type { CharacterDraft } from '../types'

interface CharacterFormFieldsProps {
  draft: CharacterDraft
  onFieldChange: <K extends keyof CharacterDraft>(field: K, value: CharacterDraft[K]) => void
}

export function CharacterFormFields({ draft, onFieldChange }: CharacterFormFieldsProps) {
  return (
    <div className="flex-1 space-y-5">
      <TextField
        label="Name"
        value={draft.name}
        onChange={(value) => onFieldChange('name', value)}
        required
        placeholder="e.g. Seraphina"
      />

      <TagsInput
        tags={draft.tags}
        onChange={(tags) => onFieldChange('tags', tags)}
      />

      <TextAreaField
        label="Description"
        value={draft.description}
        onChange={(value) => onFieldChange('description', value)}
        rows={5}
        placeholder="What does the character look like? What is their background?"
      />

      <TextAreaField
        label="Personality"
        value={draft.personality}
        onChange={(value) => onFieldChange('personality', value)}
        rows={4}
        placeholder="List personality traits, speech patterns, and behaviors"
      />

      <TextAreaField
        label="Scenario"
        value={draft.scenario}
        onChange={(value) => onFieldChange('scenario', value)}
        rows={3}
        placeholder="The setting or situation the chat starts in"
      />

      <TextAreaField
        label="First Message"
        value={draft.firstMes}
        onChange={(value) => onFieldChange('firstMes', value)}
        rows={4}
        placeholder="The character's opening message"
      />

      <TextAreaField
        label="Message Example"
        value={draft.mesExample}
        onChange={(value) => onFieldChange('mesExample', value)}
        rows={5}
        placeholder="Example dialogue to guide the writing style"
      />
    </div>
  )
}
