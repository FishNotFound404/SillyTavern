interface WorldInfoHeaderProps {
  title: string
  saving: boolean
  onBack: () => void
  onAddEntry: () => void
  onSave: () => void
}

export function WorldInfoHeader({ title, saving, onBack, onAddEntry, onSave }: WorldInfoHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onAddEntry}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          Add Entry
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}