import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDeleteWorldInfo, useSaveWorldInfo, useWorldInfo } from '../api'
import type { WorldInfoEntry, WorldInfoFile } from '../types'
import { createDefaultEntry, getNextEntryUid } from '../utils'

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

  const {
    data: queryData,
    isLoading,
    error: queryError,
    refetch,
  } = useWorldInfo(decodedName || undefined)

  const saveMutation = useSaveWorldInfo()
  const deleteMutation = useDeleteWorldInfo()

  const [fileData, setFileData] = useState<WorldInfoFile | null>(null)
  const [expandedUid, setExpandedUid] = useState<number | null>(null)

  useEffect(() => {
    if (queryData) {
      setFileData(
        queryData && queryData.entries ? queryData : { name: decodedName, entries: {} },
      )
    }
  }, [queryData, decodedName])

  const loadWorldInfo = useCallback(() => {
    void refetch()
  }, [refetch])

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
      await saveMutation.mutateAsync({ name: decodedName, data: fileData })
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to save world info')
    }
  }, [decodedName, fileData, saveMutation])

  const saving = saveMutation.isPending || deleteMutation.isPending
  const error =
    queryError?.message ||
    saveMutation.error?.message ||
    deleteMutation.error?.message ||
    null

  return {
    fileData,
    entries,
    loading: isLoading,
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
