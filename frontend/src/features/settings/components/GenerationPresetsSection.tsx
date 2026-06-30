import { TextField } from '../../../components/form/TextField'

interface GenerationPresetsSectionProps {
  presetNames: string[]
  selectedPreset: string
  presetNameInput: string
  presetLoading: boolean
  presetMessage: string | null
  presetError: string | null
  onSelectedPresetChange: (name: string) => void
  onPresetNameInputChange: (name: string) => void
  onApply: () => void
  onSave: () => void
  onDelete: () => void
}

export function GenerationPresetsSection({
  presetNames,
  selectedPreset,
  presetNameInput,
  presetLoading,
  presetMessage,
  presetError,
  onSelectedPresetChange,
  onPresetNameInputChange,
  onApply,
  onSave,
  onDelete,
}: GenerationPresetsSectionProps) {
  return (
    <section className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h2 className="text-lg font-semibold text-white mb-4">Generation Presets</h2>

      {presetMessage && (
        <div className="mb-4 px-4 py-2 bg-green-900/50 border border-green-700 rounded-lg text-green-200 text-sm">
          {presetMessage}
        </div>
      )}
      {presetError && (
        <div className="mb-4 px-4 py-2 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
          {presetError}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="preset-select" className="block text-sm font-medium text-gray-300 mb-2">
            Saved Preset
          </label>
          <select
            id="preset-select"
            value={selectedPreset}
            onChange={(e) => onSelectedPresetChange(e.target.value)}
            className="w-full bg-gray-900 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select a preset...</option>
            {presetNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onApply}
            disabled={presetLoading || !selectedPreset}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm transition-colors"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={presetLoading || !selectedPreset}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium text-sm transition-colors"
          >
            Delete
          </button>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <TextField
            label="Preset name"
            value={presetNameInput}
            onChange={onPresetNameInputChange}
            placeholder="e.g. GPT-4o creative"
          />
          <button
            type="button"
            onClick={onSave}
            disabled={presetLoading || !presetNameInput.trim()}
            className="mt-3 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 font-medium text-sm transition-colors"
          >
            {presetLoading ? 'Saving...' : 'Save current as preset'}
          </button>
        </div>
      </div>
    </section>
  )
}
