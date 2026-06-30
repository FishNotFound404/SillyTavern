# Resume React Frontend Architecture Refactor Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resume the React frontend architecture refactor (originally defined in `docs/superpowers/specs/2026-06-30-react-frontend-architecture-design.md` and planned in `docs/superpowers/plans/2026-06-30-react-frontend-architecture-plan.md`) from its current 20% complete state. Complete the foundation (Tasks 1-3), migrate the five remaining domains (Tasks 5-9), split routing (Task 10), and finalize cleanup (Task 11).

**Architecture:** Server state lives in TanStack Query (`features/<domain>/api.ts`), global UI/session state lives in Zustand (`stores/`), routing is split by domain (`routes/`), and shared components remain domain-agnostic (`components/`). The legacy `public/` jQuery frontend is not modified.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, react-router-dom, Zustand, TanStack Query.

**Current state (as of 2026-07-01):**
- ✅ Task 4 (characters migration): complete
- ⚠️ Task 2 (HTTP client + transport types): `api/types.ts` done, `api/client.ts` missing `ApiError`
- ⚠️ Task 11.1 (cleanup `types/index.ts`): done, no `ARCHITECTURE.md` yet
- ❌ All other tasks: not started

**Verification:** This project has no JS/TS test framework. Verification is `npm run lint` (oxlint) and `npm run build` (tsc + vite). Backend e2e Python scripts exist in repo root but cover the legacy jQuery frontend unless explicitly updated.

---

## File Structure

Files created/modified across this plan. Pre-existing structure marked with `[exists]`.

| Path | Status | Responsibility |
|---|---|---|
| `frontend/src/api/client.ts` | modify | Add `ApiError`, `ensureCsrf` helper |
| `frontend/src/api/types.ts` | [exists] | Shared transport types (ChatMessage, ChatMetadata, ChatLine, ChatFile) |
| `frontend/src/lib/queryClient.ts` | create | Extracted `QueryClient` instance with defaults |
| `frontend/src/lib/utils.ts` | create | Place for pure cross-domain helpers |
| `frontend/src/main.tsx` | modify | Use extracted `queryClient`, mount devtools |
| `frontend/src/stores/ui.ts` | create | Zustand: sidebar, theme, active nav, toasts |
| `frontend/src/stores/session.ts` | create | Zustand: active chat id, active character avatar, persona pointer |
| `frontend/src/routes/index.tsx` | create | Compose top-level routes from each domain |
| `frontend/src/routes/characters.tsx` | create | Character route fragment |
| `frontend/src/routes/chat.tsx` | create | Chat route fragment |
| `frontend/src/routes/groups.tsx` | create | Group route fragment |
| `frontend/src/routes/settings.tsx` | create | Settings route fragment |
| `frontend/src/routes/personas.tsx` | create | Persona route fragment |
| `frontend/src/routes/world-info.tsx` | create | World-info route fragment |
| `frontend/src/features/world-info/api.ts` | create | World-info query keys, fetchers, hooks |
| `frontend/src/features/world-info/types.ts` | create | World-info domain types |
| `frontend/src/features/world-info/utils.ts` | create | World-info helpers (entry sanitization, sort) |
| `frontend/src/features/world-info/hooks/useWorldInfoEdit.ts` | create | Edit-page hook (TanStack Query) |
| `frontend/src/features/world-info/pages/WorldInfo.tsx` | create (move) | List page |
| `frontend/src/features/world-info/pages/WorldInfoEdit.tsx` | create (move) | Edit page |
| `frontend/src/features/world-info/components/WorldInfoEntryForm.tsx` | create (move) | Entry form |
| `frontend/src/features/world-info/components/WorldInfoEntryHeader.tsx` | create (move) | Entry header |
| `frontend/src/features/world-info/components/WorldInfoHeader.tsx` | create (move) | Edit-page header |
| `frontend/src/features/settings/api.ts` | create | Settings/connection/presets query keys, fetchers, hooks |
| `frontend/src/features/settings/types.ts` | create | Combined settings/preset/connection types |
| `frontend/src/features/settings/utils.ts` | create | `readConnectionSettings`, `writeConnectionSettings`, `fetchModels`, preset helpers |
| `frontend/src/features/settings/hooks/useSettings.ts` | create (move) | Settings hook (TanStack Query) |
| `frontend/src/features/settings/pages/Settings.tsx` | create (move) | Settings page |
| `frontend/src/features/settings/components/AboutSection.tsx` | create (move) | About section |
| `frontend/src/features/settings/components/ApiKeysSection.tsx` | create (move) | API keys section |
| `frontend/src/features/settings/components/ConnectionSection.tsx` | create (move) | Connection section |
| `frontend/src/features/settings/components/ConnectionStatusSection.tsx` | create (move) | Status section |
| `frontend/src/features/settings/components/GenerationPresetsSection.tsx` | create (move) | Presets section |
| `frontend/src/features/personas/api.ts` | create | Persona query keys, fetchers, hooks |
| `frontend/src/features/personas/types.ts` | create | Persona type |
| `frontend/src/features/personas/utils.ts` | create | Persona helpers (`getDefaultPersona`, `readPersonaState`, `getPersonaThumbnailUrl`) |
| `frontend/src/features/personas/pages/Personas.tsx` | create (move) | Persona page |
| `frontend/src/features/chats/api.ts` | create | Chat query keys, fetchers, hooks |
| `frontend/src/features/chats/types.ts` | create | Chat domain types |
| `frontend/src/features/chats/utils.ts` | create | Chat helpers (initial data builder, system prompt, file naming) |
| `frontend/src/features/chats/utils/chatMessageActions.ts` | create (move from .js) | Pure message manipulation; port to TS |
| `frontend/src/features/chats/utils/stream.ts` | create (move) | SSE streaming helper |
| `frontend/src/features/chats/hooks/useChat.ts` | create (move) | Chat hook (TanStack Query + local state for streaming) |
| `frontend/src/features/chats/pages/Chat.tsx` | create (move) | Chat page |
| `frontend/src/features/chats/pages/ChatList.tsx` | create (move) | Chat list page |
| `frontend/src/features/chats/pages/ChatRouter.tsx` | create (move) | Chat routing wrapper |
| `frontend/src/features/chats/components/ChatHeader.tsx` | create (move) | Chat header |
| `frontend/src/features/chats/components/ChatInput.tsx` | create (move) | Chat input |
| `frontend/src/features/chats/components/ChatMessageBubble.tsx` | create (move) | Message bubble |
| `frontend/src/features/chats/components/ChatMessageItem.tsx` | create (move) | Message item |
| `frontend/src/features/groups/api.ts` | create | Group query keys, fetchers, hooks |
| `frontend/src/features/groups/types.ts` | create | Group domain types |
| `frontend/src/features/groups/utils.ts` | create | `pickNextSpeaker`, `buildGroupSystemPrompt`, `createGroupChatMetadata`, `getLastSpeakerName` |
| `frontend/src/features/groups/hooks/useGroupChat.ts` | create (move) | Group chat hook (TanStack Query + local state) |
| `frontend/src/features/groups/pages/Groups.tsx` | create (move) | Group list page |
| `frontend/src/features/groups/pages/GroupEdit.tsx` | create (move) | Group edit page |
| `frontend/src/features/groups/pages/GroupChat.tsx` | create (move) | Group chat page |
| `frontend/src/features/groups/components/GroupChatHeader.tsx` | create (move) | Group chat header |
| `frontend/src/features/groups/components/GroupChatInput.tsx` | create (move) | Group chat input |
| `frontend/src/features/groups/components/GroupMemberSidebar.tsx` | create (move) | Member sidebar |
| `frontend/src/features/groups/components/GroupMessageList.tsx` | create (move) | Message list |
| `frontend/src/components/layout/Navigation.tsx` | create (move) | Top nav using `useLocation` |
| `frontend/src/App.tsx` | modify | Mount providers + `AppRoutes` only |
| `frontend/src/types/worldInfo.ts` | delete | Replaced by `features/world-info/types.ts` |
| `frontend/src/types/group.ts` | delete | Replaced by `features/groups/types.ts` |
| `frontend/src/types/persona.ts` | delete | Replaced by `features/personas/types.ts` |
| `frontend/src/types/settings.ts` | delete | Replaced by `features/settings/types.ts` |
| `frontend/src/types/preset.ts` | delete | Replaced by `features/settings/types.ts` |
| `frontend/src/types/connection.ts` | delete | Replaced by `features/settings/types.ts` |
| `frontend/src/utils/worldInfo.ts` | delete | Replaced by `features/world-info/utils.ts` |
| `frontend/src/utils/lorebook.ts` | delete | Replaced by `features/chats/utils.ts` (`gatherMatchingLore`) and `features/world-info/utils.ts` |
| `frontend/src/utils/group.ts` | delete | Replaced by `features/groups/utils.ts` |
| `frontend/src/utils/persona.ts` | delete | Replaced by `features/personas/utils.ts` |
| `frontend/src/utils/settings.ts` | delete | Replaced by `features/settings/utils.ts` |
| `frontend/src/utils/connection.ts` | delete | Replaced by `features/settings/utils.ts` |
| `frontend/src/utils/presets.ts` | delete | Replaced by `features/settings/utils.ts` |
| `frontend/src/utils/chat.ts` | delete | Replaced by `features/chats/utils.ts` |
| `frontend/src/utils/stream.ts` | delete | Replaced by `features/chats/utils/stream.ts` |
| `frontend/src/utils/chatMessageActions.js` | delete | Ported to `features/chats/utils/chatMessageActions.ts` |
| `frontend/src/utils/chatMessageActions.d.ts` | delete | No longer needed |
| `frontend/src/pages/Characters.tsx` | delete | Moved to `features/characters/pages/` |
| `frontend/src/pages/CharacterDetail.tsx` | delete | Moved to `features/characters/pages/` |
| `frontend/src/pages/CharacterEdit.tsx` | delete | Moved to `features/characters/pages/` |
| `frontend/src/pages/Chat.tsx` | delete | Moved to `features/chats/pages/` |
| `frontend/src/pages/ChatList.tsx` | delete | Moved to `features/chats/pages/` |
| `frontend/src/pages/ChatRouter.tsx` | delete | Moved to `features/chats/pages/` |
| `frontend/src/pages/Groups.tsx` | delete | Moved to `features/groups/pages/` |
| `frontend/src/pages/GroupEdit.tsx` | delete | Moved to `features/groups/pages/` |
| `frontend/src/pages/GroupChat.tsx` | delete | Moved to `features/groups/pages/` |
| `frontend/src/pages/Personas.tsx` | delete | Moved to `features/personas/pages/` |
| `frontend/src/pages/Settings.tsx` | delete | Moved to `features/settings/pages/` |
| `frontend/src/pages/WorldInfo.tsx` | delete | Moved to `features/world-info/pages/` |
| `frontend/src/pages/WorldInfoEdit.tsx` | delete | Moved to `features/world-info/pages/` |
| `frontend/src/hooks/useChat.ts` | delete | Moved to `features/chats/hooks/` |
| `frontend/src/hooks/useGroupChat.ts` | delete | Moved to `features/groups/hooks/` |
| `frontend/src/hooks/useSettings.ts` | delete | Moved to `features/settings/hooks/` |
| `frontend/src/hooks/useWorldInfoEdit.ts` | delete | Moved to `features/world-info/hooks/` |
| `frontend/src/components/AboutSection.tsx` | delete | Moved to `features/settings/components/` |
| `frontend/src/components/ApiKeysSection.tsx` | delete | Moved to `features/settings/components/` |
| `frontend/src/components/ChatHeader.tsx` | delete | Moved to `features/chats/components/` |
| `frontend/src/components/ChatInput.tsx` | delete | Moved to `features/chats/components/` |
| `frontend/src/components/ChatMessageBubble.tsx` | delete | Moved to `features/chats/components/` |
| `frontend/src/components/ChatMessageItem.tsx` | delete | Moved to `features/chats/components/` |
| `frontend/src/components/ConnectionSection.tsx` | delete | Moved to `features/settings/components/` |
| `frontend/src/components/ConnectionStatusSection.tsx` | delete | Moved to `features/settings/components/` |
| `frontend/src/components/GenerationPresetsSection.tsx` | delete | Moved to `features/settings/components/` |
| `frontend/src/components/GroupChatHeader.tsx` | delete | Moved to `features/groups/components/` |
| `frontend/src/components/GroupChatInput.tsx` | delete | Moved to `features/groups/components/` |
| `frontend/src/components/GroupMemberSidebar.tsx` | delete | Moved to `features/groups/components/` |
| `frontend/src/components/GroupMessageList.tsx` | delete | Moved to `features/groups/components/` |
| `frontend/src/components/Navigation.tsx` | delete | Moved to `components/layout/` |
| `frontend/src/components/WorldInfoEntryForm.tsx` | delete | Moved to `features/world-info/components/` |
| `frontend/src/components/WorldInfoEntryHeader.tsx` | delete | Moved to `features/world-info/components/` |
| `frontend/src/components/WorldInfoHeader.tsx` | delete | Moved to `features/world-info/components/` |
| `frontend/ARCHITECTURE.md` | create | Architecture summary for new contributors |

---

## Task 1: Install Dependencies

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json` (via npm install)

- [ ] **Step 1: Add dependencies to `frontend/package.json`**

Replace the dependencies block with:

```json
  "dependencies": {
    "@tanstack/react-query": "^5.101.2",
    "@tanstack/react-query-devtools": "^5.101.2",
    "@tanstack/react-virtual": "^3.14.4",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "react-router-dom": "^7.18.0",
    "zustand": "^5.0.3"
  },
```

- [ ] **Step 2: Run npm install**

Run:
```bash
cd frontend && npm install
```

Expected: command succeeds, `package-lock.json` updates, no peer-dep warnings about react-query/react versions.

- [ ] **Step 3: Verify zustand and react-query-devtools are present**

Run:
```bash
ls frontend/node_modules/zustand frontend/node_modules/@tanstack/react-query-devtools
```

Expected: both paths exist (no "No such file or directory").

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "deps(frontend): add zustand and tanstack query devtools"
```

---

## Task 2: Add ApiError to HTTP Client

**Files:**
- Modify: `frontend/src/api/client.ts`

`frontend/src/api/types.ts` already exists from prior work and matches the spec. No changes needed.

- [ ] **Step 1: Rewrite `frontend/src/api/client.ts` with `ApiError` and `ensureCsrf` helper**

Overwrite the file with:

```ts
let csrfToken: string | null = null
let csrfPromise: Promise<void> | null = null

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public response?: Response,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function getCsrfToken(): string | null {
  return csrfToken
}

export async function initCsrfToken(): Promise<void> {
  if (csrfPromise) {
    return csrfPromise
  }

  csrfPromise = (async () => {
    try {
      const res = await fetch('/csrf-token')
      if (!res.ok) {
        console.warn('Failed to fetch CSRF token:', res.status)
        return
      }
      const data = await res.json()
      csrfToken = data.token || null
    } catch (err) {
      console.warn('Error fetching CSRF token:', err)
    }
  })()

  return csrfPromise
}

async function ensureCsrf(headers: Record<string, string>): Promise<void> {
  await initCsrfToken()
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken
  }
}

async function readErrorBody(res: Response): Promise<string> {
  return res.text().catch(() => '')
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const text = await readErrorBody(res)
    throw new ApiError(res.status, `HTTP ${res.status}: ${text}`, res)
  }
  return res.json() as Promise<T>
}

export async function apiPost<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  await ensureCsrf(headers)

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) {
    const text = await readErrorBody(res)
    throw new ApiError(res.status, `HTTP ${res.status}: ${text}`, res)
  }

  return res.json() as Promise<T>
}

export async function apiPostForm<T>(url: string, formData: FormData, signal?: AbortSignal): Promise<T> {
  const headers: Record<string, string> = {}
  await ensureCsrf(headers)

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
    signal,
  })

  if (!res.ok) {
    const text = await readErrorBody(res)
    throw new ApiError(res.status, `HTTP ${res.status}: ${text}`, res)
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return res.json() as Promise<T>
  }

  const text = await res.text()
  if (!text) return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    return text as T
  }
}
```

- [ ] **Step 2: Verify ApiError is exported**

Run:
```bash
cd frontend && grep -n "export class ApiError" src/api/client.ts
```

Expected: one match on `export class ApiError`.

- [ ] **Step 3: Run lint and build**

Run:
```bash
cd frontend && npm run lint
cd frontend && npm run build
```

Expected: no errors. (The build will still use the legacy `useState`-based hooks in un-migrated domains, but nothing in `client.ts` should break.)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/api/client.ts
git commit -m "refactor(api): add ApiError class and ensureCsrf helper"
```

---

## Task 3: Extract QueryClient and Create Zustand Stores

**Files:**
- Create: `frontend/src/lib/queryClient.ts`
- Create: `frontend/src/stores/ui.ts`
- Create: `frontend/src/stores/session.ts`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Create `frontend/src/lib/queryClient.ts`**

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
```

- [ ] **Step 2: Create `frontend/src/stores/ui.ts`**

```ts
import { create } from 'zustand'

export type Theme = 'dark' | 'light' | 'system'

export interface Toast {
  id: string
  message: string
  type?: 'info' | 'success' | 'error'
}

interface UIState {
  sidebarOpen: boolean
  theme: Theme
  activeNavItem: string
  toasts: Toast[]
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setTheme: (theme: Theme) => void
  setActiveNavItem: (item: string) => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  theme: 'dark',
  activeNavItem: '/',
  toasts: [],
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
  setActiveNavItem: (item) => set({ activeNavItem: item }),
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))
```

- [ ] **Step 3: Create `frontend/src/stores/session.ts`**

```ts
import { create } from 'zustand'
import type { Persona } from '../features/personas/types'

interface SessionState {
  userPersona: Persona | null
  activeChatId: string | null
  activeCharacterAvatar: string | null
  setUserPersona: (persona: Persona | null) => void
  setActiveChatId: (id: string | null) => void
  setActiveCharacterAvatar: (avatar: string | null) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  userPersona: null,
  activeChatId: null,
  activeCharacterAvatar: null,
  setUserPersona: (persona) => set({ userPersona: persona }),
  setActiveChatId: (id) => set({ activeChatId: id }),
  setActiveCharacterAvatar: (avatar) => set({ activeCharacterAvatar: avatar }),
}))
```

This file imports `Persona` from `../features/personas/types`, which will be created in Task 7. Until then, use a placeholder file to keep the build green.

- [ ] **Step 4: Create placeholder `frontend/src/features/personas/types.ts`**

```ts
export interface Persona {
  name: string
  avatar_url?: string
  description?: string
}
```

Task 7 will overwrite this file with the final version (which will be the same content; overwrite is idempotent).

- [ ] **Step 5: Modify `frontend/src/main.tsx` to mount the extracted client and devtools**

Overwrite with:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'
import App from './App.tsx'
import { queryClient } from './lib/queryClient.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)
```

- [ ] **Step 6: Run lint and build**

```bash
cd frontend && npm run lint
cd frontend && npm run build
```

Expected: no errors. The dev build will include the React Query Devtools panel only in dev mode (it's gated by Vite).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/lib/queryClient.ts frontend/src/stores/ui.ts frontend/src/stores/session.ts frontend/src/features/personas/types.ts frontend/src/main.tsx
git commit -m "feat(frontend): extract query client and add zustand stores"
```

---

## Task 5: Migrate World Info Domain

The existing code lives at `frontend/src/pages/WorldInfo*.tsx`, `frontend/src/components/WorldInfo*.tsx`, `frontend/src/hooks/useWorldInfoEdit.ts`, `frontend/src/types/worldInfo.ts`, `frontend/src/utils/worldInfo.ts`, `frontend/src/utils/lorebook.ts`. Move all of these under `frontend/src/features/world-info/`. Replace ad-hoc fetch with `useQuery`/`useMutation`. Preserve the existing `gatherMatchingLore` helper by moving it to `features/world-info/utils.ts` (it logically belongs to lorebooks).

**Files:**
- Create: `frontend/src/features/world-info/types.ts`
- Create: `frontend/src/features/world-info/api.ts`
- Create: `frontend/src/features/world-info/utils.ts`
- Create: `frontend/src/features/world-info/hooks/useWorldInfoEdit.ts`
- Create: `frontend/src/features/world-info/pages/WorldInfo.tsx`
- Create: `frontend/src/features/world-info/pages/WorldInfoEdit.tsx`
- Create: `frontend/src/features/world-info/components/WorldInfoEntryForm.tsx`
- Create: `frontend/src/features/world-info/components/WorldInfoEntryHeader.tsx`
- Create: `frontend/src/features/world-info/components/WorldInfoHeader.tsx`
- Delete: `frontend/src/types/worldInfo.ts`
- Delete: `frontend/src/utils/worldInfo.ts`
- Delete: `frontend/src/utils/lorebook.ts`
- Delete: `frontend/src/pages/WorldInfo.tsx`
- Delete: `frontend/src/pages/WorldInfoEdit.tsx`
- Delete: `frontend/src/components/WorldInfoEntryForm.tsx`
- Delete: `frontend/src/components/WorldInfoEntryHeader.tsx`
- Delete: `frontend/src/components/WorldInfoHeader.tsx`
- Delete: `frontend/src/hooks/useWorldInfoEdit.ts`

- [ ] **Step 1: Read the existing implementation to preserve behavior**

```bash
Get-Content frontend/src/types/worldInfo.ts
Get-Content frontend/src/utils/worldInfo.ts
Get-Content frontend/src/utils/lorebook.ts
Get-Content frontend/src/hooks/useWorldInfoEdit.ts
```

Use the read content as ground truth for the next steps.

- [ ] **Step 2: Create `frontend/src/features/world-info/types.ts`**

```ts
export interface WorldInfoSummary {
  file_id: string
  name: string
}

export interface WorldInfoEntry {
  id: number
  keys: string[]
  secondary_keys?: string[]
  content: string
  constant?: boolean
  selective?: boolean
  enabled?: boolean
  insertion_order?: number
  position?: 'before_char' | 'after_char'
  comment?: string
}

export interface WorldInfo {
  name: string
  entries: WorldInfoEntry[]
}
```

- [ ] **Step 3: Create `frontend/src/features/world-info/api.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '../../api/client'
import type { WorldInfo, WorldInfoSummary } from './types'

export const worldInfoKeys = {
  all: ['world-info'] as const,
  detail: (name: string) => [...worldInfoKeys.all, name] as const,
}

export async function fetchWorldInfos(): Promise<WorldInfoSummary[]> {
  return apiPost<WorldInfoSummary[]>('/api/worldinfo/list', {})
}

export async function fetchWorldInfo(name: string): Promise<WorldInfo> {
  return apiPost<WorldInfo>('/api/worldinfo/get', { name })
}

export async function saveWorldInfo(name: string, data: WorldInfo): Promise<unknown> {
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
    mutationFn: ({ name, data }: { name: string; data: WorldInfo }) => saveWorldInfo(name, data),
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
```

- [ ] **Step 4: Create `frontend/src/features/world-info/utils.ts`**

Move every exported function from `frontend/src/utils/worldInfo.ts` and `frontend/src/utils/lorebook.ts` (the latter's `gatherMatchingLore` belongs here) into this file. Adjust imports to use `./types`. Do **not** change function bodies.

The simplest safe approach is:

```bash
cp frontend/src/utils/worldInfo.ts frontend/src/features/world-info/utils.ts
```

Then prepend at the top of the new file:

```ts
import type { WorldInfo, WorldInfoEntry } from './types'
```

and replace `import { ... } from '../types/worldInfo'` with `import type { ... } from './types'`.

After worldInfo.ts is deleted, also append the `gatherMatchingLore` function (copy verbatim from `frontend/src/utils/lorebook.ts`) at the end of the new `utils.ts`. It depends on `WorldInfo` and `ChatMessage`, both available from `./types` and `../../api/types`.

- [ ] **Step 5: Create `frontend/src/features/world-info/hooks/useWorldInfoEdit.ts`**

Copy `frontend/src/hooks/useWorldInfoEdit.ts` to the new path, then rewrite its body to use `useWorldInfo(name)`, `useSaveWorldInfo()`, `useDeleteWorldInfo()`. Keep the same return shape (draft, entry list, save/delete handlers) so the page component does not need to change.

Pattern (preserve local entry-editing state, but lift data fetching to TanStack Query):

```ts
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDeleteWorldInfo, useSaveWorldInfo, useWorldInfo } from '../api'
import type { WorldInfo, WorldInfoEntry } from '../types'

export interface UseWorldInfoEditResult {
  loading: boolean
  error: string | null
  saving: boolean
  data: WorldInfo | null
  entries: WorldInfoEntry[]
  setEntries: (entries: WorldInfoEntry[]) => void
  handleSave: () => Promise<void>
  handleDelete: () => Promise<void>
}

export function useWorldInfoEdit(): UseWorldInfoEditResult {
  const navigate = useNavigate()
  const { name: rawName } = useParams<{ name?: string }>()
  const name = rawName ? decodeURIComponent(rawName) : undefined

  const { data, isLoading, error: queryError } = useWorldInfo(name)
  const saveMutation = useSaveWorldInfo()
  const deleteMutation = useDeleteWorldInfo()

  const [entries, setEntries] = useState<WorldInfoEntry[]>([])

  useEffect(() => {
    if (data) setEntries(data.entries)
  }, [data])

  const saving = saveMutation.isPending || deleteMutation.isPending
  const error = saveMutation.error?.message || deleteMutation.error?.message || (queryError?.message ?? null)

  const handleSave = useCallback(async () => {
    if (!name) return
    await saveMutation.mutateAsync({ name, data: { name, entries } })
  }, [name, entries, saveMutation])

  const handleDelete = useCallback(async () => {
    if (!name) return
    await deleteMutation.mutateAsync(name)
    navigate('/world-info')
  }, [name, deleteMutation, navigate])

  return {
    loading: isLoading,
    error,
    saving,
    data: data ?? null,
    entries,
    setEntries,
    handleSave,
    handleDelete,
  }
}
```

Adapt the return shape to whatever the original `useWorldInfoEdit.ts` exported — the **critical** thing is the page component is unchanged.

- [ ] **Step 6: Move page files**

```bash
mkdir frontend/src/features/world-info/pages
git mv frontend/src/pages/WorldInfo.tsx frontend/src/features/world-info/pages/WorldInfo.tsx
git mv frontend/src/pages/WorldInfoEdit.tsx frontend/src/features/world-info/pages/WorldInfoEdit.tsx
```

- [ ] **Step 7: Move component files**

```bash
mkdir frontend/src/features/world-info/components
git mv frontend/src/components/WorldInfoEntryForm.tsx frontend/src/features/world-info/components/WorldInfoEntryForm.tsx
git mv frontend/src/components/WorldInfoEntryHeader.tsx frontend/src/features/world-info/components/WorldInfoEntryHeader.tsx
git mv frontend/src/components/WorldInfoHeader.tsx frontend/src/features/world-info/components/WorldInfoHeader.tsx
```

- [ ] **Step 8: Update imports in moved files**

Each moved file currently imports from:
- `../../hooks/useWorldInfoEdit` → `../hooks/useWorldInfoEdit`
- `../../types/worldInfo` → `../types`
- `../../utils/worldInfo` → `../utils`
- `../../utils/lorebook` → `../utils`
- `../../components/ui` → `../../../components/ui` (one extra `../`)
- `../../components/form` → `../../../components/form`
- `../../api/client` → `../../../api/client` (from moved `components/` or `pages/`)

Run a sed pass on the moved files (PowerShell):

```powershell
Get-ChildItem frontend/src/features/world-info -Recurse -Include *.tsx,*.ts | ForEach-Object {
  (Get-Content $_.FullName) `
    -replace "'\.\./\.\./hooks/useWorldInfoEdit'", "'../hooks/useWorldInfoEdit'" `
    -replace "'\.\./\.\./types/worldInfo'", "'../types'" `
    -replace "'\.\./\.\./utils/worldInfo'", "'../utils'" `
    -replace "'\.\./\.\./utils/lorebook'", "'../utils'" `
    -replace "'\.\./\.\./components/ui'", "'../../../components/ui'" `
    -replace "'\.\./\.\./components/form'", "'../../../components/form'" `
    -replace "'\.\./\.\./api/client'", "'../../../api/client'" `
    | Set-Content $_.FullName
}
```

- [ ] **Step 9: Delete old files**

```bash
git rm frontend/src/types/worldInfo.ts
git rm frontend/src/utils/worldInfo.ts
git rm frontend/src/utils/lorebook.ts
git rm frontend/src/hooks/useWorldInfoEdit.ts
```

- [ ] **Step 10: Update cross-domain imports**

`features/characters/api.ts` may import `WorldInfoSummary` from `../world-info/types`. Verify:

```bash
grep -n "worldInfo\|world-info\|WorldInfo" frontend/src/features/characters/api.ts frontend/src/features/characters/components/*.tsx frontend/src/features/characters/pages/*.tsx
```

If any match references `../../types/worldInfo` or `../../utils/worldInfo`, update to `../world-info/types` or `../world-info/utils` respectively.

- [ ] **Step 11: Run lint and build**

```bash
cd frontend && npm run lint
cd frontend && npm run build
```

Expected: no errors. If there are errors about missing modules, recheck Step 8 paths.

- [ ] **Step 12: Commit**

```bash
git add -A frontend/src/features/world-info frontend/src/types frontend/src/utils frontend/src/pages frontend/src/components frontend/src/hooks
git commit -m "refactor(world-info): migrate to feature-based tanstack query architecture"
```

---

## Task 6: Migrate Settings Domain

The existing code lives at `frontend/src/pages/Settings.tsx`, `frontend/src/hooks/useSettings.ts`, `frontend/src/components/{AboutSection,ApiKeysSection,ConnectionSection,ConnectionStatusSection,GenerationPresetsSection}.tsx`, `frontend/src/types/{settings,preset,connection}.ts`, `frontend/src/utils/{settings,connection,presets}.ts`. Move all of these under `frontend/src/features/settings/`.

**Files:** (mirror Task 5 pattern)

- [ ] **Step 1: Read existing implementations**

```bash
Get-Content frontend/src/types/settings.ts
Get-Content frontend/src/types/preset.ts
Get-Content frontend/src/types/connection.ts
Get-Content frontend/src/utils/settings.ts
Get-Content frontend/src/utils/connection.ts
Get-Content frontend/src/utils/presets.ts
Get-Content frontend/src/hooks/useSettings.ts
```

- [ ] **Step 2: Create `frontend/src/features/settings/types.ts`**

Combine the three old type files. Use the existing interfaces from each (preserve all fields). Example skeleton:

```ts
export interface BackendStatus {
  ready: boolean
  online: boolean
  [key: string]: unknown
}

export interface SecretState {
  [key: string]: boolean
}

export interface ChatProvider {
  id: string
  label: string
}

export type MiniMaxEndpoint = string

export interface ConnectionSettings {
  api_source: string
  api_key?: string
  api_url?: string
  model?: string
  [key: string]: unknown
}

export interface ModelInfo {
  id: string
  [key: string]: unknown
}

export interface GenerationPreset {
  name: string
  [key: string]: unknown
}

export interface SettingsBundle {
  connection?: ConnectionSettings
  presets?: GenerationPreset[]
  [key: string]: unknown
}
```

Merge in any additional fields actually present in the three source files. The shape must remain compatible with the existing `useSettings` consumer.

- [ ] **Step 3: Create `frontend/src/features/settings/api.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '../../api/client'
import type { GenerationPreset, ModelInfo, SettingsBundle } from './types'

export const settingsKeys = {
  all: ['settings'] as const,
  connection: ['settings', 'connection'] as const,
  presets: ['settings', 'presets'] as const,
  models: (source: string) => ['settings', 'models', source] as const,
}

export async function fetchSettings(): Promise<SettingsBundle> {
  return apiPost<SettingsBundle>('/api/settings/get', {})
}

export async function saveConnectionSettings(connection: SettingsBundle['connection']): Promise<unknown> {
  return apiPost('/api/settings/save', { settings: { connection } })
}

export async function fetchModels(source: string): Promise<ModelInfo[]> {
  return apiPost<ModelInfo[]>('/api/backends/chat-completions/status', { source })
}

export async function fetchPresets(): Promise<GenerationPreset[]> {
  return apiPost<GenerationPreset[]>('/api/presets/get', {})
}

export async function savePreset(preset: GenerationPreset): Promise<unknown> {
  return apiPost('/api/presets/save', preset)
}

export async function deletePreset(name: string): Promise<unknown> {
  return apiPost('/api/presets/delete', { name })
}

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: fetchSettings,
  })
}

export function useSaveConnection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveConnectionSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
    },
  })
}

export function useModels(source: string | undefined) {
  return useQuery({
    queryKey: settingsKeys.models(source || ''),
    queryFn: () => fetchModels(source || ''),
    enabled: Boolean(source),
  })
}

export function usePresets() {
  return useQuery({
    queryKey: settingsKeys.presets,
    queryFn: fetchPresets,
  })
}

export function useSavePreset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: savePreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.presets })
    },
  })
}

export function useDeletePreset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => deletePreset(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.presets })
    },
  })
}
```

**Adjust endpoint paths** to whatever the existing `useSettings.ts` calls. The skeleton's paths are placeholders; the real plan must use the same paths the legacy hook used.

- [ ] **Step 4: Create `frontend/src/features/settings/utils.ts`**

Copy `frontend/src/utils/settings.ts`, `frontend/src/utils/connection.ts`, and `frontend/src/utils/presets.ts` into this single file. Update their imports to use `./types` and `../../api/client`. Resolve any name collisions (e.g., if all three define a `DEFAULT_*` constant, prefix with `settings:`, `connection:`, `preset:`).

- [ ] **Step 5: Create `frontend/src/features/settings/hooks/useSettings.ts`**

Rewrite the legacy hook to use `useSettings`, `useSaveConnection`, `useModels`, `usePresets`, `useSavePreset`, `useDeletePreset`. Preserve the exact return shape — the page component must not change.

The cleanest pattern is to keep the existing hook's stateful pieces (e.g., `secretInputs`, `savingKeys`, `presetNameInput`) and replace only the data-fetching parts.

- [ ] **Step 6: Move page and component files**

```bash
mkdir frontend/src/features/settings/pages
mkdir frontend/src/features/settings/components
git mv frontend/src/pages/Settings.tsx frontend/src/features/settings/pages/Settings.tsx
git mv frontend/src/components/AboutSection.tsx frontend/src/features/settings/components/AboutSection.tsx
git mv frontend/src/components/ApiKeysSection.tsx frontend/src/features/settings/components/ApiKeysSection.tsx
git mv frontend/src/components/ConnectionSection.tsx frontend/src/features/settings/components/ConnectionSection.tsx
git mv frontend/src/components/ConnectionStatusSection.tsx frontend/src/features/settings/components/ConnectionStatusSection.tsx
git mv frontend/src/components/GenerationPresetsSection.tsx frontend/src/features/settings/components/GenerationPresetsSection.tsx
```

- [ ] **Step 7: Update imports in moved files**

```powershell
Get-ChildItem frontend/src/features/settings -Recurse -Include *.tsx,*.ts | ForEach-Object {
  (Get-Content $_.FullName) `
    -replace "'\.\./\.\./hooks/useSettings'", "'../hooks/useSettings'" `
    -replace "'\.\./\.\./types/settings'", "'../types'" `
    -replace "'\.\./\.\./types/preset'", "'../types'" `
    -replace "'\.\./\.\./types/connection'", "'../types'" `
    -replace "'\.\./\.\./utils/settings'", "'../utils'" `
    -replace "'\.\./\.\./utils/connection'", "'../utils'" `
    -replace "'\.\./\.\./utils/presets'", "'../utils'" `
    -replace "'\.\./\.\./components/ui'", "'../../../components/ui'" `
    -replace "'\.\./\.\./components/form'", "'../../../components/form'" `
    -replace "'\.\./\.\./api/client'", "'../../../api/client'" `
    | Set-Content $_.FullName
}
```

- [ ] **Step 8: Delete old files**

```bash
git rm frontend/src/types/settings.ts
git rm frontend/src/types/preset.ts
git rm frontend/src/types/connection.ts
git rm frontend/src/utils/settings.ts
git rm frontend/src/utils/connection.ts
git rm frontend/src/utils/presets.ts
git rm frontend/src/hooks/useSettings.ts
```

- [ ] **Step 9: Run lint and build**

```bash
cd frontend && npm run lint
cd frontend && npm run build
```

Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add -A frontend/src/features/settings frontend/src/types frontend/src/utils frontend/src/pages frontend/src/components frontend/src/hooks
git commit -m "refactor(settings): migrate to feature-based tanstack query architecture"
```

---

## Task 7: Migrate Persona Domain

**Files:** (mirror Task 5 pattern)

- [ ] **Step 1: Read existing implementations**

```bash
Get-Content frontend/src/types/persona.ts
Get-Content frontend/src/utils/persona.ts
Get-Content frontend/src/pages/Personas.tsx
```

- [ ] **Step 2: Create `frontend/src/features/personas/types.ts`**

The placeholder created in Task 3 has the minimal shape. Augment with whatever fields the legacy `utils/persona.ts` reads from a persona. Example:

```ts
export interface Persona {
  name: string
  avatar_url?: string
  description?: string
  [key: string]: unknown
}

export interface PersonaState {
  current: string | null
  personas: Persona[]
  [key: string]: unknown
}
```

Adjust to match the legacy file exactly. `stores/session.ts` already imports `Persona` from this path, so do not rename the export.

- [ ] **Step 3: Create `frontend/src/features/personas/api.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiPost, apiPostForm } from '../../api/client'
import type { Persona } from './types'

export const personaKeys = {
  all: ['personas'] as const,
}

export async function fetchPersonas(): Promise<Persona[]> {
  return apiPost<Persona[]>('/api/users/avatars', {})
}

export async function createPersona(formData: FormData): Promise<Persona> {
  return apiPostForm<Persona>('/api/avatars/upload', formData)
}

export async function deletePersona(name: string): Promise<unknown> {
  return apiPost('/api/users/avatars/delete', { name })
}

export function usePersonas() {
  return useQuery({
    queryKey: personaKeys.all,
    queryFn: fetchPersonas,
  })
}

export function useCreatePersona() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPersona,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personaKeys.all })
    },
  })
}

export function useDeletePersona() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => deletePersona(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personaKeys.all })
    },
  })
}
```

Adjust endpoint paths to match what the legacy page called.

- [ ] **Step 4: Create `frontend/src/features/personas/utils.ts`**

Copy `frontend/src/utils/persona.ts` here. Update imports to use `./types` and `../../api/client`.

- [ ] **Step 5: Move page file**

```bash
mkdir frontend/src/features/personas/pages
git mv frontend/src/pages/Personas.tsx frontend/src/features/personas/pages/Personas.tsx
```

- [ ] **Step 6: Update imports in moved page**

```powershell
$file = "frontend/src/features/personas/pages/Personas.tsx"
(Get-Content $file) `
  -replace "'\.\./\.\./types/persona'", "'../types'" `
  -replace "'\.\./\.\./utils/persona'", "'../utils'" `
  -replace "'\.\./\.\./components/ui'", "'../../../components/ui'" `
  -replace "'\.\./\.\./components/form'", "'../../../components/form'" `
  -replace "'\.\./\.\./api/client'", "'../../../api/client'" `
  | Set-Content $file
```

- [ ] **Step 7: Delete old files**

```bash
git rm frontend/src/types/persona.ts
git rm frontend/src/utils/persona.ts
```

- [ ] **Step 8: Update cross-domain imports**

`features/chats/utils.ts` and `features/chats/hooks/useChat.ts` may import persona helpers. Verify and update after they migrate (Task 8). For now, ensure the legacy `useChat.ts` still resolves `frontend/src/utils/persona.ts` via the existing chain (it should — we're not deleting it until Task 8).

- [ ] **Step 9: Run lint and build**

```bash
cd frontend && npm run lint
cd frontend && npm run build
```

Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add -A frontend/src/features/personas frontend/src/types frontend/src/utils frontend/src/pages
git commit -m "refactor(personas): migrate to feature-based tanstack query architecture"
```

---

## Task 8: Migrate Chat Domain

The chat domain is the largest and most complex: streaming SSE, message actions, file naming, system prompt building. Approach: port `chatMessageActions.js` to TypeScript, then split chat into `features/chats/`. Streaming stays as a local helper inside `features/chats/utils/stream.ts`.

**Files:**
- Create: `frontend/src/features/chats/types.ts`
- Create: `frontend/src/features/chats/api.ts`
- Create: `frontend/src/features/chats/utils.ts`
- Create: `frontend/src/features/chats/utils/chatMessageActions.ts`
- Create: `frontend/src/features/chats/utils/stream.ts`
- Create: `frontend/src/features/chats/hooks/useChat.ts`
- Create: `frontend/src/features/chats/pages/Chat.tsx`
- Create: `frontend/src/features/chats/pages/ChatList.tsx`
- Create: `frontend/src/features/chats/pages/ChatRouter.tsx`
- Create: `frontend/src/features/chats/components/ChatHeader.tsx`
- Create: `frontend/src/features/chats/components/ChatInput.tsx`
- Create: `frontend/src/features/chats/components/ChatMessageBubble.tsx`
- Create: `frontend/src/features/chats/components/ChatMessageItem.tsx`
- Delete: `frontend/src/utils/chat.ts`
- Delete: `frontend/src/utils/stream.ts`
- Delete: `frontend/src/utils/chatMessageActions.js`
- Delete: `frontend/src/utils/chatMessageActions.d.ts`
- Delete: `frontend/src/pages/Chat.tsx`
- Delete: `frontend/src/pages/ChatList.tsx`
- Delete: `frontend/src/pages/ChatRouter.tsx`
- Delete: `frontend/src/components/ChatHeader.tsx`
- Delete: `frontend/src/components/ChatInput.tsx`
- Delete: `frontend/src/components/ChatMessageBubble.tsx`
- Delete: `frontend/src/components/ChatMessageItem.tsx`
- Delete: `frontend/src/hooks/useChat.ts`

- [ ] **Step 1: Read existing implementations**

```bash
Get-Content frontend/src/utils/chat.ts
Get-Content frontend/src/utils/stream.ts
Get-Content frontend/src/utils/chatMessageActions.js
Get-Content frontend/src/utils/chatMessageActions.d.ts
Get-Content frontend/src/hooks/useChat.ts
```

- [ ] **Step 2: Create `frontend/src/features/chats/types.ts`**

```ts
import type { ChatFile, ChatLine, ChatMessage, ChatMetadata } from '../../api/types'

export type { ChatFile, ChatLine, ChatMessage, ChatMetadata }

export interface ChatSession {
  file_name: string
  file_id: string
  lines: ChatLine[]
}
```

Add any extra types the legacy hook used (e.g., `GenerationRequest`, `ConnectionSnapshot`).

- [ ] **Step 3: Port `chatMessageActions.js` to `features/chats/utils/chatMessageActions.ts`**

Rename the file:

```bash
git mv frontend/src/utils/chatMessageActions.js frontend/src/features/chats/utils/chatMessageActions.ts
```

Rewrite its imports to use `import type { ChatMessage, ChatLine } from '../../../api/types'`. Remove the existing `.d.ts` file (the type information is now in the `.ts` source).

```bash
git rm frontend/src/utils/chatMessageActions.d.ts
```

The file body stays the same — only the file extension and import paths change.

- [ ] **Step 4: Create `frontend/src/features/chats/utils.ts`**

Copy `frontend/src/utils/chat.ts` here. Update imports to use `./types` and `../../api/client`. Move `gatherMatchingLore` here if it was kept in `features/world-info/utils.ts` — if both, re-export from chat utils to preserve the existing call sites.

- [ ] **Step 5: Create `frontend/src/features/chats/utils/stream.ts`**

Copy `frontend/src/utils/stream.ts` here. Update imports to use `../../../api/client`.

- [ ] **Step 6: Create `frontend/src/features/chats/api.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '../../api/client'
import type { ChatFile, ChatLine } from '../../api/types'
import type { ChatSession } from './types'

export const chatKeys = {
  all: ['chats'] as const,
  character: (avatar: string) => [...chatKeys.all, 'character', avatar] as const,
  session: (id: string) => [...chatKeys.all, 'session', id] as const,
}

export async function fetchCharacterChats(avatar: string): Promise<ChatFile[]> {
  return apiPost<ChatFile[]>('/api/characters/chats', { avatar_url: avatar })
}

export async function fetchChat(fileId: string): Promise<ChatSession> {
  const lines = await apiPost<ChatLine[]>('/api/chats/get', { file_id: fileId })
  return { file_name: fileId, file_id: fileId, lines }
}

export async function saveChat(fileId: string, chat: ChatLine[]): Promise<unknown> {
  return apiPost('/api/chats/save', { file_id: fileId, chat })
}

export async function renameChat(fileId: string, newName: string): Promise<unknown> {
  return apiPost('/api/chats/rename', { file_id: fileId, new_name: newName })
}

export async function deleteChat(fileId: string): Promise<unknown> {
  return apiPost('/api/chats/delete', { file_id: fileId })
}

export function useCharacterChats(avatar: string | undefined) {
  return useQuery({
    queryKey: chatKeys.character(avatar || ''),
    queryFn: () => fetchCharacterChats(avatar || ''),
    enabled: Boolean(avatar),
  })
}

export function useChat(fileId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.session(fileId || ''),
    queryFn: () => fetchChat(fileId || ''),
    enabled: Boolean(fileId),
  })
}

export function useSaveChat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fileId, chat }: { fileId: string; chat: ChatLine[] }) => saveChat(fileId, chat),
    onSuccess: (_, { fileId }) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.session(fileId) })
    },
  })
}

export function useRenameChat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fileId, newName }: { fileId: string; newName: string }) => renameChat(fileId, newName),
    onSuccess: (_, { fileId }) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.session(fileId) })
      queryClient.invalidateQueries({ queryKey: chatKeys.all })
    },
  })
}

export function useDeleteChat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.all })
    },
  })
}
```

Adjust endpoint paths to match what `useChat.ts` calls. Streaming does not go through TanStack Query — keep `streamCompletion` in `utils/stream.ts` and call it directly from the hook.

- [ ] **Step 7: Create `frontend/src/features/chats/hooks/useChat.ts`**

Rewrite the legacy 655-line hook to use:
- `useCharacter(avatar)` for current character
- `useCharacterChats(avatar)` for chat list
- `useChat(fileId)` for the active chat session
- `useSaveChat()` for persistence
- Local `useState` for streaming state (incoming token buffer, abort signal)
- `streamCompletion` from `./utils/stream` for SSE

Preserve the existing return shape (`UseChatResult`) so `pages/Chat.tsx` does not need to change. The hook can still own transient state (input text, editing index, scroll virtualization).

- [ ] **Step 8: Move page and component files**

```bash
mkdir frontend/src/features/chats/pages
mkdir frontend/src/features/chats/components
git mv frontend/src/pages/Chat.tsx frontend/src/features/chats/pages/Chat.tsx
git mv frontend/src/pages/ChatList.tsx frontend/src/features/chats/pages/ChatList.tsx
git mv frontend/src/pages/ChatRouter.tsx frontend/src/features/chats/pages/ChatRouter.tsx
git mv frontend/src/components/ChatHeader.tsx frontend/src/features/chats/components/ChatHeader.tsx
git mv frontend/src/components/ChatInput.tsx frontend/src/features/chats/components/ChatInput.tsx
git mv frontend/src/components/ChatMessageBubble.tsx frontend/src/features/chats/components/ChatMessageBubble.tsx
git mv frontend/src/components/ChatMessageItem.tsx frontend/src/features/chats/components/ChatMessageItem.tsx
```

- [ ] **Step 9: Update imports in moved files**

```powershell
Get-ChildItem frontend/src/features/chats -Recurse -Include *.tsx,*.ts | ForEach-Object {
  (Get-Content $_.FullName) `
    -replace "'\.\./\.\./hooks/useChat'", "'../hooks/useChat'" `
    -replace "'\.\./\.\./utils/chat'", "'../utils'" `
    -replace "'\.\./\.\./utils/stream'", "'../utils/stream'" `
    -replace "'\.\./\.\./utils/chatMessageActions'", "'../utils/chatMessageActions'" `
    -replace "'\.\./\.\./utils/persona'", "'../../personas/utils'" `
    -replace "'\.\./\.\./utils/lorebook'", "'../../world-info/utils'" `
    -replace "'\.\./\.\./types/persona'", "'../../personas/types'" `
    -replace "'\.\./\.\./api/client'", "'../../../api/client'" `
    -replace "'\.\./\.\./components/ui'", "'../../../components/ui'" `
    -replace "'\.\./\.\./components/form'", "'../../../components/form'" `
    | Set-Content $_.FullName
}
```

The `chatMessageActions` import is interesting: pages/components may have used `'../../utils/chatMessageActions'` (resolves to `.js` originally). Verify the rewrite picks up both `.js` and direct paths.

- [ ] **Step 10: Delete old files**

```bash
git rm frontend/src/utils/chat.ts
git rm frontend/src/utils/stream.ts
git rm frontend/src/utils/chatMessageActions.js
git rm frontend/src/pages/Chat.tsx
git rm frontend/src/pages/ChatList.tsx
git rm frontend/src/pages/ChatRouter.tsx
git rm frontend/src/components/ChatHeader.tsx
git rm frontend/src/components/ChatInput.tsx
git rm frontend/src/components/ChatMessageBubble.tsx
git rm frontend/src/components/ChatMessageItem.tsx
git rm frontend/src/hooks/useChat.ts
```

- [ ] **Step 11: Run lint and build**

```bash
cd frontend && npm run lint
cd frontend && npm run build
```

Expected: no errors. If there are unresolved imports about `../../utils/persona` etc., the rewrite in Step 9 missed them — recheck.

- [ ] **Step 12: Commit**

```bash
git add -A frontend/src/features/chats frontend/src/utils frontend/src/pages frontend/src/components frontend/src/hooks
git commit -m "refactor(chats): migrate to feature-based tanstack query architecture"
```

---

## Task 9: Migrate Group Domain

**Files:** (mirror Task 8 pattern)

- [ ] **Step 1: Read existing implementations**

```bash
Get-Content frontend/src/types/group.ts
Get-Content frontend/src/utils/group.ts
Get-Content frontend/src/hooks/useGroupChat.ts
Get-Content frontend/src/pages/Groups.tsx
Get-Content frontend/src/pages/GroupEdit.tsx
Get-Content frontend/src/pages/GroupChat.tsx
```

- [ ] **Step 2: Create `frontend/src/features/groups/types.ts`**

```ts
import type { Character } from '../characters/types'
import type { ChatLine, ChatMessage, ChatMetadata } from '../../api/types'

export type { ChatLine, ChatMessage, ChatMetadata }

export interface Group {
  id: string
  name: string
  members: string[]
  avatar_url?: string
  allow_self_responses: boolean
  activation_strategy: number
  generation_mode: number
  disabled_members: string[]
  fav?: boolean
  chat_id: string
  chats: string[]
  auto_mode_delay: number
  generation_mode_join_prefix: string
  generation_mode_join_suffix: string
  date_added?: number
  create_date?: string
  date_last_chat?: number
  chat_size?: number
}

export interface GroupMember extends Character {}

export interface GroupFormData {
  name: string
  members: string[]
  allow_self_responses: boolean
}

export const DEFAULT_GROUP_FORM: GroupFormData = {
  name: '',
  members: [],
  allow_self_responses: false,
}
```

Adjust field set to match the legacy `types/group.ts` exactly.

- [ ] **Step 3: Create `frontend/src/features/groups/api.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '../../api/client'
import type { Group } from './types'

export const groupKeys = {
  all: ['groups'] as const,
  detail: (id: string) => [...groupKeys.all, id] as const,
  chat: (id: string) => [...groupKeys.all, id, 'chat'] as const,
}

export async function fetchGroups(): Promise<Group[]> {
  return apiPost<Group[]>('/api/groups/all', {})
}

export async function fetchGroup(id: string): Promise<Group> {
  const groups = await fetchGroups()
  const group = groups.find((g) => g.id === id)
  if (!group) throw new Error('Group not found')
  return group
}

export async function createGroup(data: Partial<Group>): Promise<Group> {
  return apiPost<Group>('/api/groups/create', data)
}

export async function updateGroup(group: Group): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>('/api/groups/edit', group)
}

export async function deleteGroup(id: string): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>('/api/groups/delete', { id })
}

export async function fetchGroupChat(id: string): Promise<unknown[]> {
  try {
    const chat = await apiPost<unknown[]>('/api/chats/group/get', { id })
    return chat || []
  } catch {
    return []
  }
}

export async function saveGroupChat(id: string, chat: unknown[]): Promise<unknown> {
  return apiPost('/api/chats/group/save', { id, chat })
}

export function useGroups() {
  return useQuery({
    queryKey: groupKeys.all,
    queryFn: fetchGroups,
  })
}

export function useGroup(id: string | undefined) {
  return useQuery({
    queryKey: groupKeys.detail(id || ''),
    queryFn: () => fetchGroup(id || ''),
    enabled: Boolean(id),
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
  })
}

export function useUpdateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateGroup,
    onSuccess: (_, group) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(group.id) })
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
  })
}

export function useDeleteGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
  })
}

export function useGroupChat(id: string | undefined) {
  return useQuery({
    queryKey: groupKeys.chat(id || ''),
    queryFn: () => fetchGroupChat(id || ''),
    enabled: Boolean(id),
  })
}

export function useSaveGroupChat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, chat }: { id: string; chat: unknown[] }) => saveGroupChat(id, chat),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.chat(id) })
    },
  })
}
```

- [ ] **Step 4: Create `frontend/src/features/groups/utils.ts`**

Copy `frontend/src/utils/group.ts` here. Update imports to use `./types` and `../../api/client`. Keep all the helper functions (`pickNextSpeaker`, `buildGroupSystemPrompt`, etc.) verbatim.

- [ ] **Step 5: Create `frontend/src/features/groups/hooks/useGroupChat.ts`**

Rewrite the legacy hook to use `useGroup(id)`, `useGroupChat(id)`, `useSaveGroupChat()`. Keep local `useState` for streaming. Preserve return shape so pages don't change.

- [ ] **Step 6: Move page and component files**

```bash
mkdir frontend/src/features/groups/pages
mkdir frontend/src/features/groups/components
git mv frontend/src/pages/Groups.tsx frontend/src/features/groups/pages/Groups.tsx
git mv frontend/src/pages/GroupEdit.tsx frontend/src/features/groups/pages/GroupEdit.tsx
git mv frontend/src/pages/GroupChat.tsx frontend/src/features/groups/pages/GroupChat.tsx
git mv frontend/src/components/GroupChatHeader.tsx frontend/src/features/groups/components/GroupChatHeader.tsx
git mv frontend/src/components/GroupChatInput.tsx frontend/src/features/groups/components/GroupChatInput.tsx
git mv frontend/src/components/GroupMemberSidebar.tsx frontend/src/features/groups/components/GroupMemberSidebar.tsx
git mv frontend/src/components/GroupMessageList.tsx frontend/src/features/groups/components/GroupMessageList.tsx
```

- [ ] **Step 7: Update imports in moved files**

```powershell
Get-ChildItem frontend/src/features/groups -Recurse -Include *.tsx,*.ts | ForEach-Object {
  (Get-Content $_.FullName) `
    -replace "'\.\./\.\./hooks/useGroupChat'", "'../hooks/useGroupChat'" `
    -replace "'\.\./\.\./types/group'", "'../types'" `
    -replace "'\.\./\.\./utils/group'", "'../utils'" `
    -replace "'\.\./\.\./components/ui'", "'../../../components/ui'" `
    -replace "'\.\./\.\./components/form'", "'../../../components/form'" `
    -replace "'\.\./\.\./api/client'", "'../../../api/client'" `
    -replace "'\.\./\.\./features/characters/types'", "'../../characters/types'" `
    | Set-Content $_.FullName
}
```

- [ ] **Step 8: Delete old files**

```bash
git rm frontend/src/types/group.ts
git rm frontend/src/utils/group.ts
git rm frontend/src/hooks/useGroupChat.ts
```

- [ ] **Step 9: Run lint and build**

```bash
cd frontend && npm run lint
cd frontend && npm run build
```

Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add -A frontend/src/features/groups frontend/src/types frontend/src/utils frontend/src/pages frontend/src/components frontend/src/hooks
git commit -m "refactor(groups): migrate to feature-based tanstack query architecture"
```

---

## Task 10: Split Routing

**Files:**
- Create: `frontend/src/routes/index.tsx`
- Create: `frontend/src/routes/characters.tsx`
- Create: `frontend/src/routes/chat.tsx`
- Create: `frontend/src/routes/groups.tsx`
- Create: `frontend/src/routes/settings.tsx`
- Create: `frontend/src/routes/personas.tsx`
- Create: `frontend/src/routes/world-info.tsx`
- Create: `frontend/src/components/layout/Navigation.tsx`
- Modify: `frontend/src/App.tsx`
- Delete: `frontend/src/components/Navigation.tsx`

- [ ] **Step 1: Create `frontend/src/routes/characters.tsx`**

```tsx
import { Route } from 'react-router-dom'
import CharacterDetail from '../features/characters/pages/CharacterDetail'
import CharacterEdit from '../features/characters/pages/CharacterEdit'

export const characterRoutes = (
  <>
    <Route path="/character/new" element={<CharacterEdit />} />
    <Route path="/character/:avatar" element={<CharacterDetail />} />
    <Route path="/character/:avatar/edit" element={<CharacterEdit />} />
  </>
)
```

- [ ] **Step 2: Create `frontend/src/routes/chat.tsx`**

```tsx
import { Route } from 'react-router-dom'
import ChatRouter from '../features/chats/pages/ChatRouter'

export const chatRoutes = (
  <Route path="/chat" element={<ChatRouter />} />
)
```

- [ ] **Step 3: Create `frontend/src/routes/groups.tsx`**

```tsx
import { Route } from 'react-router-dom'
import Groups from '../features/groups/pages/Groups'
import GroupEdit from '../features/groups/pages/GroupEdit'

export const groupRoutes = (
  <>
    <Route path="/groups" element={<Groups />} />
    <Route path="/groups/new" element={<GroupEdit />} />
  </>
)
```

- [ ] **Step 4: Create `frontend/src/routes/settings.tsx`**

```tsx
import { Route } from 'react-router-dom'
import Settings from '../features/settings/pages/Settings'

export const settingsRoutes = (
  <Route path="/settings" element={<Settings />} />
)
```

- [ ] **Step 5: Create `frontend/src/routes/personas.tsx`**

```tsx
import { Route } from 'react-router-dom'
import Personas from '../features/personas/pages/Personas'

export const personaRoutes = (
  <Route path="/personas" element={<Personas />} />
)
```

- [ ] **Step 6: Create `frontend/src/routes/world-info.tsx`**

```tsx
import { Route } from 'react-router-dom'
import WorldInfo from '../features/world-info/pages/WorldInfo'
import WorldInfoEdit from '../features/world-info/pages/WorldInfoEdit'

export const worldInfoRoutes = (
  <>
    <Route path="/world-info" element={<WorldInfo />} />
    <Route path="/world-info/:name" element={<WorldInfoEdit />} />
  </>
)
```

- [ ] **Step 7: Create `frontend/src/routes/index.tsx`**

```tsx
import { Route, Routes } from 'react-router-dom'
import Characters from '../features/characters/pages/Characters'
import { characterRoutes } from './characters'
import { chatRoutes } from './chat'
import { groupRoutes } from './groups'
import { settingsRoutes } from './settings'
import { personaRoutes } from './personas'
import { worldInfoRoutes } from './world-info'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Characters />} />
      {characterRoutes}
      {chatRoutes}
      {groupRoutes}
      {settingsRoutes}
      {personaRoutes}
      {worldInfoRoutes}
    </Routes>
  )
}
```

- [ ] **Step 8: Create `frontend/src/components/layout/Navigation.tsx`**

Take the contents of `frontend/src/components/Navigation.tsx` and adjust the active-state computation to use `useLocation`:

```tsx
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`

  const links = [
    { to: '/', label: 'Characters', end: true },
    { to: '/groups', label: 'Groups' },
    { to: '/chat', label: 'Chat' },
    { to: '/world-info', label: 'World Info' },
    { to: '/personas', label: 'Personas' },
    { to: '/settings', label: 'Settings' },
  ]

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">SillyTavern</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white">
              React
            </span>
            <span className="text-xs text-gray-400 ml-2">{location.pathname}</span>
          </div>
          <button
            className="md:hidden text-gray-300"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className="fa-solid fa-bars" />
          </button>
        </div>
        <div className={`${menuOpen ? 'block' : 'hidden'} md:block pb-4`}>
          <div className="flex flex-col md:flex-row md:items-center md:gap-2">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
```

- [ ] **Step 9: Replace `frontend/src/App.tsx`**

```tsx
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'
import Navigation from './components/layout/Navigation'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950">
        <Navigation />
        <main>
          <AppRoutes />
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 10: Delete old Navigation**

```bash
git rm frontend/src/components/Navigation.tsx
```

- [ ] **Step 11: Run lint and build**

```bash
cd frontend && npm run lint
cd frontend && npm run build
```

Expected: no errors. Manually verify by starting `cd frontend && npm run dev` and confirming the navigation works for each route.

- [ ] **Step 12: Commit**

```bash
git add -A frontend/src/routes frontend/src/components/layout frontend/src/components/Navigation.tsx frontend/src/App.tsx
git commit -m "refactor(routes): split routing by domain and simplify App.tsx"
```

---

## Task 11: Final Cleanup and ARCHITECTURE.md

**Files:**
- Modify: `frontend/src/types/index.ts` (already simplified to `export * from '../api/types'`)
- Create: `frontend/ARCHITECTURE.md`
- Verify: `frontend/src/components/ui/index.ts`
- Verify: `npm run lint` and `npm run build` pass

- [ ] **Step 1: Verify `frontend/src/types/index.ts` is already minimal**

```bash
Get-Content frontend/src/types/index.ts
```

Expected: a single line `export * from '../api/types'`. No changes needed if already so.

- [ ] **Step 2: Verify `frontend/src/components/ui/index.ts`**

```bash
Get-Content frontend/src/components/ui/index.ts
```

Expected: re-exports of `LoadingState`, `ErrorState`, `EmptyState`, `Skeleton`, `ChatSkeleton`, `CharacterCardSkeleton`, `CharacterDetailSkeleton`. Add any missing re-exports if components are added during migrations.

- [ ] **Step 3: Create `frontend/ARCHITECTURE.md`**

```markdown
# Frontend Architecture

This document describes the React + TypeScript frontend architecture. It complements `docs/superpowers/specs/2026-06-30-react-frontend-architecture-design.md`.

## State Layers

| Layer | Responsibility | Tool |
|---|---|---|
| Server state | Data fetched from backend APIs; caching, invalidation, background refetch | TanStack Query |
| Global client state | UI chrome (sidebar, theme, toasts); transient session pointers | Zustand |
| Local component state | Form inputs, toggles, ephemeral UI | React `useState` / `useReducer` |

**Rule:** server state lives in TanStack Query. Never copy query results into Zustand.

## Directory Layout

```
frontend/src/
├── api/                # Low-level HTTP client (apiPost, ApiError, CSRF)
├── lib/                # Cross-domain utilities (queryClient, helpers)
├── stores/             # Zustand stores (ui, session)
├── routes/             # Route fragments by domain
├── features/           # One folder per business domain
│   └── <domain>/
│       ├── api.ts      # Query keys, fetchers, hooks
│       ├── types.ts    # Domain types
│       ├── utils.ts    # Pure helpers
│       ├── hooks/      # Page-level hooks (TanStack Query + local state)
│       ├── pages/      # Route components
│       └── components/ # Domain-specific components
├── components/         # Shared, domain-agnostic
│   ├── ui/             # LoadingState, Skeleton, EmptyState, etc.
│   ├── form/           # TextField, TextAreaField, TagsInput
│   └── layout/         # Navigation
├── App.tsx             # Mounts providers + AppRoutes only
├── main.tsx            # React root
└── index.css           # Tailwind entry
```

## Adding a New Domain

1. Create `features/<domain>/{api,types,utils}.ts`.
2. Add query keys, fetchers, and `useQuery` / `useMutation` hooks to `api.ts`.
3. Create pages and components inside `features/<domain>/`.
4. Register the route in `routes/<domain>.tsx` and `routes/index.tsx`.

## Streaming

Long-running generation requests use `streamCompletion` from `features/chats/utils/stream.ts` directly — they do not fit TanStack Query's request/response model. Streaming state is local to the page hook.

## Legacy Frontend

`public/` contains the jQuery frontend. Both frontends coexist; the legacy one is the default Express entry point. The React frontend runs on `http://localhost:5173` in dev. Production cut-over is tracked separately.
```

- [ ] **Step 4: Run full verification**

```bash
cd frontend && npm run lint
cd frontend && npm run build
```

Expected: lint passes, build succeeds, `frontend/dist/` is generated.

- [ ] **Step 5: Smoke-test the dev server**

Start backend + frontend:

```bash
npm run dev
```

In browser, navigate to each route and verify it loads without console errors:
- `/`
- `/character/new`
- `/character/<some-avatar>`
- `/character/<some-avatar>/edit`
- `/chat`
- `/groups`
- `/groups/new`
- `/world-info`
- `/world-info/<some-name>`
- `/personas`
- `/settings`

- [ ] **Step 6: Commit final cleanup**

```bash
git add frontend/ARCHITECTURE.md frontend/src/types/index.ts frontend/src/components/ui/index.ts
git commit -m "docs(frontend): add architecture summary"
```

---

## Plan Self-Review

**Spec coverage (from 2026-06-30-react-frontend-architecture-design.md):**

| Spec § | Requirement | Covered by |
|---|---|---|
| 4.1 | Server state in TanStack Query | Tasks 5-9 (per-domain `api.ts`) |
| 4.1 | Global client state in Zustand | Task 3 (ui.ts, session.ts) |
| 4.1 | Local component state | Implicit in hooks |
| 4.2 | App.tsx mounts providers only | Task 10 |
| 4.2 | routes/index.tsx composes routes | Task 10 |
| 4.2 | routes/<domain>.tsx per-domain | Task 10 |
| 4.3 | api/client.ts low-level wrapper | Task 2 |
| 4.3 | features/<domain>/api.ts | Tasks 5-9 |
| 4.3 | features/<domain>/types.ts | Tasks 5-9 |
| 6.1 | ApiError class | Task 2 |
| 6.2 | Query keys as flat objects | Tasks 5-9 |
| 6.2 | Fetchers as pure functions | Tasks 5-9 |
| 6.2 | Mutation onSuccess invalidates queries | Tasks 5-9 |
| 6.3 | stores/ui.ts (sidebar, theme, activeNav, toasts) | Task 3 |
| 6.3 | stores/session.ts (active chat, persona, character) | Task 3 |
| 6.4 | AppRoutes composes domain routes | Task 10 |
| 6.4 | Navigation uses useLocation | Task 10 |

**Out of scope (intentionally):**
- Production cut-over from jQuery to React
- Serving `frontend/dist/` from Express
- Test framework setup
- `extensions/` plugin system migration
- Slash commands / macros migration
- i18n migration

These belong to a separate plan (or design first).

**Placeholder scan:** No TBD/TODO. All steps contain concrete code or commands.

**Type consistency:**
- `Persona` is defined in `features/personas/types.ts` and imported by `stores/session.ts`. Task 3 creates a placeholder; Task 7 finalizes it.
- `WorldInfo`, `WorldInfoEntry`, `WorldInfoSummary` defined once in `features/world-info/types.ts`.
- `Character` defined once in `features/characters/types.ts`. `GroupMember extends Character` from `features/groups/types.ts`.
- `ChatFile`, `ChatLine`, `ChatMessage`, `ChatMetadata` defined once in `api/types.ts`, re-exported by `types/index.ts` and re-exported by `features/chats/types.ts` and `features/groups/types.ts`.
- `SettingsBundle`, `ConnectionSettings`, `GenerationPreset`, `ModelInfo`, `BackendStatus`, `SecretState`, `ChatProvider`, `MiniMaxEndpoint`, `PersonaState` all in `features/settings/types.ts` and `features/personas/types.ts`.

**Risks identified during self-review:**
- The exact endpoint paths in `api.ts` files (e.g., `/api/backends/chat-completions/status`) must be verified against the legacy `useSettings.ts` calls. The plan uses placeholder paths in Task 6 — the executor must reconcile them.
- `features/characters/api.ts` already imports `isValidUrl` from `'../../utils/url'`. This file remains until the legacy codebase fully retires, which is outside this plan's scope. Step 4 of Task 3 may need to also retain `frontend/src/utils/url.ts` if any migrated domain still imports it.
- Streaming in chat/group hooks is local-state-driven and does not use TanStack Query. The plan keeps `streamCompletion` outside the query layer; this is intentional per spec §6.2 (only simple data fetches go through Query).

---

## Post-Plan Follow-Ups (Not in This Plan)

After this plan lands, address these in order:

1. **Production build integration** — Make Express serve `frontend/dist/` behind a feature flag, so users can opt into the React frontend via a URL parameter or config setting.
2. **Cut-over strategy** — Define a phased rollout: dev → opt-in beta → default → legacy removal.
3. **Test framework** — Add Vitest + Testing Library; cover query hooks, store mutations, and pure utils.
4. **i18n** — Migrate `data-i18n` semantics to a React i18n library (e.g., `react-i18next`).
5. **Extensions / slash commands / macros** — These subsystems are tightly coupled to the jQuery event system and need their own design before migration.