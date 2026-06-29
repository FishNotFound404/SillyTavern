import { TextField } from '../../../components/form/TextField'
import { TextAreaField } from '../../../components/form/TextAreaField'
import type { CharacterDraft } from '../types'

interface CharacterAdvancedFieldsProps {
  draft: CharacterDraft
  onFieldChange: <K extends keyof CharacterDraft>(field: K, value: CharacterDraft[K]) => void
}

export function CharacterAdvancedFields({ draft, onFieldChange }: CharacterAdvancedFieldsProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-5">
      <h2 className="text-lg font-semibold text-white">Advanced</h2>

      <TextAreaField
        label="Creator Notes"
        value={draft.creatorNotes}
        onChange={(value) => onFieldChange('creatorNotes', value)}
        rows={3}
        placeholder="Private notes about the character"
      />

      <TextAreaField
        label="System Prompt"
        value={draft.systemPrompt}
        onChange={(value) => onFieldChange('systemPrompt', value)}
        rows={3}
        placeholder="Custom system prompt for this character"
      />

      <TextAreaField
        label="Post-History Instructions"
        value={draft.postHistoryInstructions}
        onChange={(value) => onFieldChange('postHistoryInstructions', value)}
        rows={3}
        placeholder="Instructions injected after the chat history"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <TextField
          label="Creator"
          value={draft.creator}
          onChange={(value) => onFieldChange('creator', value)}
          placeholder="Your name"
        />
        <TextField
          label="Character Version"
          value={draft.characterVersion}
          onChange={(value) => onFieldChange('characterVersion', value)}
          placeholder="e.g. 1.0"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">Talkativeness</label>
          <span className="text-sm text-gray-400">{draft.talkativeness.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={draft.talkativeness}
          onChange={(e) => onFieldChange('talkativeness', Number(e.target.value))}
          className="w-full accent-blue-500"
        />
      </div>
    </div>
  )
}
