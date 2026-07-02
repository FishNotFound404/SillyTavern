import { QueryClient } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

export { http, HttpResponse }
