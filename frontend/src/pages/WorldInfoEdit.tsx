import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiPost } from '../api/client'
import { LoadingState, ErrorState } from '../components/ui'
import type { WorldInfoEntry, WorldInfoFile } from '../types/worldInfo'

const POSITION_LABELS: Record<number, string> = {
  0: 'Before character defs',
  1: 'After character defs',
  2: "Author's Note top",
  3: "Author's Note bottom",
  4: 'At depth',
}

function createDefaultEntry(uid: number): WorldInfoEntry {
  return {
    uid,
    key: [],
    keysecondary: [],
    comment: '',
    content: '',
    constant: false,
    vectorized: false,
    selective: true,
    selectiveLogic: 0,
    addMemo: false,
    order: 100,
    position: 0,
    disable: false,
    ignoreBudget: false,
    excludeRecursion: false,
    preventRecursion: false,
    matchPersonaDescription: false,
    matchCharacterDescription: false,
    matchCharacterPersonality: false,
    matchCharacterDepthPrompt: false,
    matchScenario: false,
    matchCreatorNotes: false,
    delayUntilRecursion: 0,
    probability: 100,
    useProbability: true,
    depth: 4,
    outletName: '',
    group: '',
    groupOverride: false,
    groupWeight: 100,
    scanDepth: null,
    caseSensitive: null,
    matchWholeWords: null,
    useGroupScoring: null,
    automationId: '',
    role: 0,
    sticky: null,
    cooldown: null,
    delay: null,
    triggers: [],
    characterFilter: { isExclude: false, names: [], tags: [] },
    displayIndex: uid,
  }
}

function keysToText(keys: string[]) {
  return keys.join('\n')
}

function textToKeys(text: string) {
  return text
    .split('\n')
    .map((k) => k.trim())
    .filter(Boolean)
}

function WorldInfoEdit() {
  const { name } = useParams<{ name: string }>()
  const navigate = useNavigate()
  const decodedName = decodeURIComponent(name || '')

  const [fileData, setFileData] = useState<WorldInfoFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedUid, setExpandedUid] = useState<number | null>(null)

  const loadWorldInfo = async () => {
    if (!decodedName) return
    try {
      setLoading(true)
      const data = await apiPost<WorldInfoFile>('/api/worldinfo/get', { name: decodedName })
      setFileData(data && data.entries ? data : { name: decodedName, entries: {} })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load world info')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWorldInfo()
  }, [decodedName])

  const entries = useMemo(() => {
    if (!fileData) return []
    return Object.values(fileData.entries).sort((a, b) => a.order - b.order || a.uid - b.uid)
  }, [fileData])

  const updateEntry = (uid: number, patch: Partial<WorldInfoEntry>) => {
    setFileData((prev) => {
      if (!prev) return prev
      const entry = prev.entries[uid]
      if (!entry) return prev
      return {
        ...prev,
        entries: {
          ...prev.entries,
          [uid]: { ...entry, ...patch },
        },
      }
    })
  }

  const handleAddEntry = () => {
    setFileData((prev) => {
      if (!prev) return prev
      const uids = Object.keys(prev.entries).map(Number)
      const nextUid = uids.length > 0 ? Math.max(...uids) + 1 : 1
      const entry = createDefaultEntry(nextUid)
      return {
        ...prev,
        entries: { ...prev.entries, [nextUid]: entry },
      }
    })
    const uids = fileData ? Object.keys(fileData.entries).map(Number) : []
    const nextUid = uids.length > 0 ? Math.max(...uids) + 1 : 1
    setExpandedUid(nextUid)
  }

  const handleDeleteEntry = (uid: number) => {
    if (!window.confirm('Delete this entry?')) return
    setFileData((prev) => {
      if (!prev) return prev
      const next = { ...prev.entries }
      delete next[uid]
      return { ...prev, entries: next }
    })
    if (expandedUid === uid) setExpandedUid(null)
  }

  const handleSave = async () => {
    if (!decodedName || !fileData) return
    try {
      setSaving(true)
      await apiPost('/api/worldinfo/edit', {
        name: decodedName,
        data: fileData,
      })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save world info')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState message="Loading world info..." />
  if (error) return <ErrorState title="Couldn’t load world info" message={error} onRetry={loadWorldInfo} />
  if (!fileData) return <ErrorState title="Not found" message="World info file could not be loaded." onRetry={loadWorldInfo} />

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/world-info')}
            className="text-gray-400 hover:text-white"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-white">{fileData.name || decodedName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddEntry}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Add Entry
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No entries yet.</p>
          <p className="text-sm mt-2">Click "Add Entry" to create your first lorebook entry.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => {
            const isExpanded = expandedUid === entry.uid
            return (
              <div
                key={entry.uid}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
              >
                <div
                  data-testid="entry-header"
                  onClick={() => setExpandedUid(isExpanded ? null : entry.uid)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800/50"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${entry.disable ? 'bg-gray-600' : 'bg-green-500'}`} />
                    <div>
                      <h3 className="font-medium text-white">
                        {entry.comment || `Entry #${entry.uid}`}
                      </h3>
                      <p className="text-sm text-gray-500 truncate max-w-md">
                        {entry.key.length > 0 ? entry.key.join(', ') : 'No keywords'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">order {entry.order}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedUid(isExpanded ? null : entry.uid)
                      }}
                      className="p-1.5 text-gray-500 hover:text-blue-400 rounded"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteEntry(entry.uid)
                      }}
                      className="p-1.5 text-gray-500 hover:text-red-400 rounded"
                      title="Delete entry"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-gray-800 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Comment / Label</label>
                      <input
                        type="text"
                        aria-label="Comment / Label"
                        value={entry.comment}
                        onChange={(e) => updateEntry(entry.uid, { comment: e.target.value })}
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
                          onChange={(e) => updateEntry(entry.uid, { key: textToKeys(e.target.value) })}
                          rows={3}
                          className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
                          placeholder="One keyword per line"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Secondary Keywords</label>
                        <textarea
                          value={keysToText(entry.keysecondary)}
                          onChange={(e) => updateEntry(entry.uid, { keysecondary: textToKeys(e.target.value) })}
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
                        onChange={(e) => updateEntry(entry.uid, { content: e.target.value })}
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
                          onChange={(e) => updateEntry(entry.uid, { order: Number(e.target.value) })}
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
                          onChange={(e) => updateEntry(entry.uid, { probability: Number(e.target.value) })}
                          className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Position</label>
                        <select
                          value={entry.position}
                          onChange={(e) => updateEntry(entry.uid, { position: Number(e.target.value) })}
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
                          onChange={(e) => updateEntry(entry.uid, { depth: Number(e.target.value) })}
                          className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-2">
                      <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!entry.disable}
                          onChange={(e) => updateEntry(entry.uid, { disable: !e.target.checked })}
                          className="rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-blue-600"
                        />
                        Enabled
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={entry.constant}
                          onChange={(e) => updateEntry(entry.uid, { constant: e.target.checked })}
                          className="rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-blue-600"
                        />
                        Constant
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={entry.selective}
                          onChange={(e) => updateEntry(entry.uid, { selective: e.target.checked })}
                          className="rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-blue-600"
                        />
                        Selective
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default WorldInfoEdit
