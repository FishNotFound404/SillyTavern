import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useMatch } from 'react-router-dom'
import { LoadingState } from '../components/ui'
import type { CharacterDraft } from '../types'
import { DEFAULT_CHARACTER_FORM } from '../types'
import { createCharacter, fetchCharacterForEdit, updateCharacter } from '../utils/character'

function classNames(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  required?: boolean
  placeholder?: string
}

function fieldId(label: string) {
  return label.toLowerCase().replace(/\s+/g, '-')
}

function TextField({ label, value, onChange, required, placeholder }: FieldProps) {
  const id = fieldId(label)
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-900 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
      />
    </div>
  )
}

function TextAreaField({ label, value, onChange, rows = 4, placeholder }: FieldProps) {
  const id = fieldId(label)
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full bg-gray-900 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none resize-y"
      />
    </div>
  )
}

function characterToDraft(character: Record<string, unknown>): CharacterDraft {
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
    postHistoryInstructions: String(character.post_history_instructions || data.post_history_instructions || ''),
    creator: String(character.creator || data.creator || ''),
    characterVersion: String(character.character_version || data.character_version || ''),
    tags: Array.isArray(character.tags)
      ? character.tags.map(String)
      : Array.isArray(data.tags)
        ? (data.tags as unknown[]).map(String)
        : [],
    talkativeness: typeof character.talkativeness === 'number'
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

function CharacterEdit() {
  const navigate = useNavigate()
  const { avatar } = useParams<{ avatar?: string }>()
  const isCreate = Boolean(useMatch('/character/new'))
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [draft, setDraft] = useState<CharacterDraft>(DEFAULT_CHARACTER_FORM)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(!isCreate)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const avatarParam = avatar ? decodeURIComponent(avatar) : undefined

  useEffect(() => {
    if (isCreate) {
      setDraft(DEFAULT_CHARACTER_FORM)
      setLoading(false)
      return
    }

    if (!avatarParam) {
      setError('No character selected')
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchCharacterForEdit(avatarParam)
      .then((character) => {
        if (cancelled) return
        setDraft(characterToDraft(character as unknown as Record<string, unknown>))
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load character')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isCreate, avatarParam])

  const currentAvatarUrl = useMemo(() => {
    if (previewUrl) return previewUrl
    if (draft.avatarUrl) return `/characters/${encodeURIComponent(draft.avatarUrl)}`
    return null
  }, [previewUrl, draft.avatarUrl])

  const updateField = <K extends keyof CharacterDraft>(field: K, value: CharacterDraft[K]) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    updateField('avatarFile', file)

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null)
    }
  }

  const addTag = (raw: string) => {
    const tag = raw.trim()
    if (!tag) return
    if (draft.tags.includes(tag)) return
    updateField('tags', [...draft.tags, tag])
  }

  const removeTag = (tag: string) => {
    updateField(
      'tags',
      draft.tags.filter((t) => t !== tag),
    )
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(tagInput)
      setTagInput('')
    } else if (e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
      setTagInput('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.name.trim()) {
      setError('Character name is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (isCreate) {
        const newAvatar = await createCharacter(draft)
        navigate(`/character/${encodeURIComponent(newAvatar)}`)
      } else if (avatarParam) {
        await updateCharacter(avatarParam, draft)
        navigate(`/character/${encodeURIComponent(avatarParam)}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save character')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingState message="Loading character..." />
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">
          {isCreate ? 'Create Character' : `Edit ${draft.name || 'Character'}`}
        </h1>
        <button
          onClick={() => navigate(isCreate ? '/' : `/character/${encodeURIComponent(avatarParam || '')}`)}
          className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <div className="md:w-64 flex flex-col items-center">
              <div className="w-64 h-64 rounded-xl bg-gray-700 overflow-hidden flex items-center justify-center border border-gray-600">
                {currentAvatarUrl ? (
                  <img
                    src={currentAvatarUrl}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-sm">No avatar selected</span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm font-medium"
              >
                {draft.avatarFile ? 'Change Avatar' : 'Upload Avatar'}
              </button>
              {draft.avatarFile && (
                <p className="mt-2 text-xs text-gray-400 truncate max-w-full">{draft.avatarFile.name}</p>
              )}
            </div>

            {/* Main fields */}
            <div className="flex-1 space-y-5">
              <TextField
                label="Name"
                value={draft.name}
                onChange={(value) => updateField('name', value)}
                required
                placeholder="e.g. Seraphina"
              />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                <div className="flex flex-wrap items-center gap-2 bg-gray-900 rounded-lg border border-gray-700 px-3 py-2 focus-within:border-blue-500">
                  {draft.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-900/50 text-blue-200 text-xs rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-300 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    id="character-tags"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={() => {
                      addTag(tagInput)
                      setTagInput('')
                    }}
                    placeholder={draft.tags.length ? '' : 'Add tags (press Enter)'}
                    aria-label="Tags"
                    className="flex-1 bg-transparent text-white text-sm focus:outline-none min-w-[120px]"
                  />
                </div>
              </div>

              <TextAreaField
                label="Description"
                value={draft.description}
                onChange={(value) => updateField('description', value)}
                rows={5}
                placeholder="What does the character look like? What is their background?"
              />

              <TextAreaField
                label="Personality"
                value={draft.personality}
                onChange={(value) => updateField('personality', value)}
                rows={4}
                placeholder="List personality traits, speech patterns, and behaviors"
              />

              <TextAreaField
                label="Scenario"
                value={draft.scenario}
                onChange={(value) => updateField('scenario', value)}
                rows={3}
                placeholder="The setting or situation the chat starts in"
              />

              <TextAreaField
                label="First Message"
                value={draft.firstMes}
                onChange={(value) => updateField('firstMes', value)}
                rows={4}
                placeholder="The character's opening message"
              />

              <TextAreaField
                label="Message Example"
                value={draft.mesExample}
                onChange={(value) => updateField('mesExample', value)}
                rows={5}
                placeholder="Example dialogue to guide the writing style"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-5">
          <h2 className="text-lg font-semibold text-white">Advanced</h2>

          <TextAreaField
            label="Creator Notes"
            value={draft.creatorNotes}
            onChange={(value) => updateField('creatorNotes', value)}
            rows={3}
            placeholder="Private notes about the character"
          />

          <TextAreaField
            label="System Prompt"
            value={draft.systemPrompt}
            onChange={(value) => updateField('systemPrompt', value)}
            rows={3}
            placeholder="Custom system prompt for this character"
          />

          <TextAreaField
            label="Post-History Instructions"
            value={draft.postHistoryInstructions}
            onChange={(value) => updateField('postHistoryInstructions', value)}
            rows={3}
            placeholder="Instructions injected after the chat history"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TextField
              label="Creator"
              value={draft.creator}
              onChange={(value) => updateField('creator', value)}
              placeholder="Your name"
            />
            <TextField
              label="Character Version"
              value={draft.characterVersion}
              onChange={(value) => updateField('characterVersion', value)}
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
              onChange={(e) => updateField('talkativeness', Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(isCreate ? '/' : `/character/${encodeURIComponent(avatarParam || '')}`)}
            className="px-5 py-2.5 text-gray-300 hover:text-white font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !draft.name.trim()}
            className={classNames(
              'px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold transition-colors',
              saving || !draft.name.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700',
            )}
          >
            {saving ? 'Saving...' : isCreate ? 'Create Character' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CharacterEdit
