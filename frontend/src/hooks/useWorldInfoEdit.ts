import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiPost } from '../api/client'
import type { WorldInfoEntry, WorldInfoFile } from '../types/worldInfo'
import { createDefaultEntry, getNextEntryUid } from '../utils/worldInfo'

export interface UseWorldInfoEditResult {
  fileData: WorldInfoFile | null
  entries: WorldInfoEntry[]
  loading: boolean
  saving: boolean
  error: string | null
  expandedUid: number | null
  loadWorldInfo: () => void
  updateEntry: (uid: number, patch: Partial<WorldInfoEntry>) => void
  handleAddEntry: () => void
  handleDeleteEntry: (uid: number) => void
  handleToggleEntry: (uid: number) => void
  handleSave: () => Promise<void>
}

export function useWorldInfoEdit(): UseWorldInfoEditResult {
  const { name } = useParams<{ name: string }>()
  const decodedName = decodeURIComponent(name || '')

  const [fileData, setFileData] = useState<WorldInfoFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedUid, setExpandedUid] = useState<number | null>(null)

  const loadWorldInfo = useCallback(async () => {
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
  }, [decodedName])

  useEffect(() => {
    loadWorldInfo()
  }, [loadWorldInfo])

  const entries = useMemo(() => {
    if (!fileData) return []
    return Object.values(fileData.entries).sort((a, b) => a.order - b.order || a.uid - b.uid)
  }, [fileData])

  const updateEntry = useCallback((uid: number, patch: Partial<WorldInfoEntry>) => {
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
  }, [])

  const handleAddEntry = useCallback(() => {
    const nextUid = getNextEntryUid(fileData)
    setFileData((prev) => {
      if (!prev) return prev
      const entry = createDefaultEntry(nextUid)
      return {
        ...prev,
        entries: { ...prev.entries, [nextUid]: entry },
      }
    })
    setExpandedUid(nextUid)
  }, [fileData])

  const handleDeleteEntry = useCallback(
    (uid: number) => {
      if (!window.confirm('Delete this entry?')) return
      setFileData((prev) => {
        if (!prev) return prev
        const next = { ...prev.entries }
        delete next[uid]
        return { ...prev, entries: next }
      })
      if (expandedUid === uid) setExpandedUid(null)
    },
    [expandedUid],
  )

  const handleToggleEntry = useCallback((uid: number) => {
    setExpandedUid((prev) => (prev === uid ? null : uid))
  }, [])

  const handleSave = useCallback(async () => {
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
  }, [decodedName, fileData])

  return {
    fileData,
    entries,
    loading,
    saving,
    error,
    expandedUid,
    loadWorldInfo,
    updateEntry,
    handleAddEntry,
    handleDeleteEntry,
    handleToggleEntry,
    handleSave,
  }
}
