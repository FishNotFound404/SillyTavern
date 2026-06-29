import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMatch, useNavigate, useParams } from 'react-router-dom'
import { useCharacter, useCreateCharacter, useUpdateCharacter } from '../api'
import { DEFAULT_CHARACTER_FORM, type CharacterDraft } from '../types'
import { buildCharacterFormData, characterToDraft } from '../utils'

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
  const avatarParam = avatar ? decodeURIComponent(avatar) : undefined

  const [draft, setDraft] = useState<CharacterDraft>(DEFAULT_CHARACTER_FORM)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const { isLoading: loading, error: queryError, data: characterData } = useCharacter(avatarParam)
  const createMutation = useCreateCharacter()
  const updateMutation = useUpdateCharacter()

  const initializedForAvatar = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (isCreate) {
      setDraft(DEFAULT_CHARACTER_FORM)
      initializedForAvatar.current = undefined
    } else if (
      avatarParam &&
      avatarParam !== initializedForAvatar.current &&
      characterData
    ) {
      setDraft(characterToDraft(characterData as unknown as Record<string, unknown>))
      initializedForAvatar.current = avatarParam
    }
  }, [isCreate, avatarParam, characterData])

  const currentAvatarUrl = useMemo(() => {
    if (previewUrl) return previewUrl
    if (draft.avatarUrl) return `/characters/${encodeURIComponent(draft.avatarUrl)}`
    return null
  }, [previewUrl, draft.avatarUrl])

  const updateField = useCallback(
    <K extends keyof CharacterDraft>(field: K, value: CharacterDraft[K]) => {
      setDraft((prev) => ({ ...prev, [field]: value }))
    },
    [],
  )

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

  const saving = createMutation.isPending || updateMutation.isPending
  const error = localError || (queryError?.message ?? null)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!draft.name.trim()) {
        setLocalError('Character name is required')
        return
      }

      setLocalError(null)

      try {
        const form = buildCharacterFormData(draft)
        if (isCreate) {
          const newAvatar = await createMutation.mutateAsync(form)
          const avatarFile = newAvatar.endsWith('.png') ? newAvatar : `${newAvatar}.png`
          navigate(`/character/${encodeURIComponent(avatarFile)}`)
        } else if (avatarParam) {
          form.append('avatar_url', avatarParam)
          await updateMutation.mutateAsync(form)
          navigate(`/character/${encodeURIComponent(avatarParam)}`)
        }
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : 'Failed to save character')
      }
    },
    [draft, isCreate, avatarParam, createMutation, updateMutation, navigate],
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
