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

## Outstanding Cleanup

- `frontend/src/types/connection.ts` and `frontend/src/utils/connection.ts` were deprecated re-export shims introduced in Task 6 for cross-feature consumers (`useChat`, `useGroupChat`). Both consumers were migrated in Tasks 8/9 to import directly from `features/settings/`, so the shims have been deleted (Task 11).
- `frontend/src/pages/` (the pre-refactor top-level pages directory) was emptied as part of the feature-folder migration (Tasks 5-9) and has been removed (Task 11).
- Six pre-existing `react-hooks/exhaustive-deps` lint warnings in `features/{chats,groups,settings}/hooks/` (`useChat.ts`, `useGroupChat.ts`, `useSettings.ts`) stem from `useQuery.data ?? []` and `useQuery.data ?? {}` falling back to a fresh array/object reference each render. Future cleanup should memoize the fallback (e.g., `useMemo(() => data ?? EMPTY_ARRAY, [data])`) or hoist the empty value to module scope.