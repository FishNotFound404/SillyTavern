import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useMatch } from 'react-router-dom'
import type { CharacterDraft } from '../types'
import { DEFAULT_CHARACTER_FORM } from '../types'
import { characterToDraft, createCharacter, fetchCharacterForEdit, updateCharacter } from '../utils/character'

export interface UseCharacterEditResult {
  draft: CharacterDraft
  currentAvatarUrl: string | null
  loading: boolean
  error: string | null
  saving: boolean
  isCreate: boolean
  avatarParam: string | undefined
  updateField: <K extends keyof CharacterDraft>(field: K, value: CharacterDraft[K]) => void
  handleFileSelect: (file: File | null) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
}

export function useCharacterEdit(): UseCharacterEditResult {
  const navigate = useNavigate()
  const { avatar } = useParams<{ avatar?: string }>()
  const isCreate = Boolean(useMatch('/character/new'))

  const [draft, setDraft] = useState<CharacterDraft>(DEFAULT_CHARACTER_FORM)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
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

  const updateField = useCallback(<K extends keyof CharacterDraft>(field: K, value: CharacterDraft[K]) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleFileSelect = useCallback(
    (file: File | null) => {
      updateField('avatarFile', file)

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      if (file) {
        setPreviewUrl(URL.createObjectURL(file))
      } else {
        setPreviewUrl(null)
      }
    },
    [previewUrl, updateField],
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
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
    },
    [draft, isCreate, avatarParam, navigate],
  )

  return {
    draft,
    currentAvatarUrl,
    loading,
    error,
    saving,
    isCreate,
    avatarParam,
    updateField,
    handleFileSelect,
    handleSubmit,
  }
}
