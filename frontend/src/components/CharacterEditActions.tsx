function classNames(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

interface CharacterEditActionsProps {
  isCreate: boolean
  isSaving: boolean
  canSave: boolean
  onCancel: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function CharacterEditActions({
  isCreate,
  isSaving,
  canSave,
  onCancel,
  onSubmit,
}: CharacterEditActionsProps) {
  return (
    <div className="flex items-center justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="px-5 py-2.5 text-gray-300 hover:text-white font-medium"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isSaving || !canSave}
        onClick={onSubmit}
        className={classNames(
          'px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold transition-colors',
          isSaving || !canSave ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700',
        )}
      >
        {isSaving ? 'Saving...' : isCreate ? 'Create Character' : 'Save Changes'}
      </button>
    </div>
  )
}
