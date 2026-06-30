import type { WorldInfoEntry } from '../types'
import { keysToText, POSITION_LABELS, textToKeys } from '../utils'

interface WorldInfoEntryFormProps {
  entry: WorldInfoEntry
  onChange: (patch: Partial<WorldInfoEntry>) => void
}

export function WorldInfoEntryForm({ entry, onChange }: WorldInfoEntryFormProps) {
  return (
    <div className="p-4 border-t border-gray-800 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Comment / Label</label>
        <input
          type="text"
          aria-label="Comment / Label"
          value={entry.comment}
          onChange={(e) => onChange({ comment: e.target.value })}
          className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
          placeholder="e.g. Magic system"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Primary Keywords</label>
          <textarea
            aria-label="Primary Keywords"
            value={keysToText(entry.key)}
            onChange={(e) => onChange({ key: textToKeys(e.target.value) })}
            rows={3}
            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
            placeholder="One keyword per line"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Secondary Keywords</label>
          <textarea
            value={keysToText(entry.keysecondary)}
            onChange={(e) => onChange({ keysecondary: textToKeys(e.target.value) })}
            rows={3}
            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
            placeholder="One keyword per line"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Content to Inject</label>
        <textarea
          aria-label="Content to Inject"
          value={entry.content}
          onChange={(e) => onChange({ content: e.target.value })}
          rows={5}
          className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
          placeholder="Text that will be injected into the prompt when keywords match..."
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Order</label>
          <input
            type="number"
            value={entry.order}
            onChange={(e) => onChange({ order: Number(e.target.value) })}
            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Probability (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={entry.probability}
            onChange={(e) => onChange({ probability: Number(e.target.value) })}
            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Position</label>
          <select
            value={entry.position}
            onChange={(e) => onChange({ position: Number(e.target.value) })}
            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
          >
            {Object.entries(POSITION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Depth</label>
          <input
            type="number"
            value={entry.depth}
            onChange={(e) => onChange({ depth: Number(e.target.value) })}
            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 pt-2">
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={!entry.disable}
            onChange={(e) => onChange({ disable: !e.target.checked })}
            className="rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-blue-600"
          />
          Enabled
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={entry.constant}
            onChange={(e) => onChange({ constant: e.target.checked })}
            className="rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-blue-600"
          />
          Constant
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={entry.selective}
            onChange={(e) => onChange({ selective: e.target.checked })}
            className="rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-blue-600"
          />
          Selective
        </label>
      </div>
    </div>
  )
}
