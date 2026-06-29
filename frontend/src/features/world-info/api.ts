import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '../../api/client'
import type { WorldInfoFile, WorldInfoSummary } from './types'

export const worldInfoKeys = {
  all: ['world-info'] as const,
  detail: (name: string) => [...worldInfoKeys.all, name] as const,
}

export async function fetchWorldInfos(): Promise<WorldInfoSummary[]> {
  return apiPost<WorldInfoSummary[]>('/api/worldinfo/list', {})
}

export async function fetchWorldInfo(name: string): Promise<WorldInfoFile> {
  return apiPost<WorldInfoFile>('/api/worldinfo/get', { name })
}

export async function saveWorldInfo(name: string, data: WorldInfoFile): Promise<unknown> {
  return apiPost('/api/worldinfo/edit', { name, data })
}

export async function deleteWorldInfo(name: string): Promise<unknown> {
  return apiPost('/api/worldinfo/delete', { name })
}

export function useWorldInfos() {
  return useQuery({
    queryKey: worldInfoKeys.all,
    queryFn: fetchWorldInfos,
  })
}

export function useWorldInfo(name: string | undefined) {
  return useQuery({
    queryKey: worldInfoKeys.detail(name || ''),
    queryFn: () => fetchWorldInfo(name || ''),
    enabled: Boolean(name),
  })
}

export function useSaveWorldInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: WorldInfoFile }) => saveWorldInfo(name, data),
    onSuccess: (_, { name }) => {
      queryClient.invalidateQueries({ queryKey: worldInfoKeys.detail(name) })
      queryClient.invalidateQueries({ queryKey: worldInfoKeys.all })
    },
  })
}

export function useDeleteWorldInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteWorldInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: worldInfoKeys.all })
    },
  })
}
