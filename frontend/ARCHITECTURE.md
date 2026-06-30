# SillyTavern React Frontend Architecture

## Overview

The React frontend is organized as a feature-based architecture using:

- **React 19** with TypeScript
- **Vite** for builds
- **Tailwind CSS** for styling
- **react-router-dom** for routing
- **TanStack Query** for server state
- **Zustand** for global client state

## Directory Structure

```
frontend/src/
├── api/              # Low-level HTTP client and shared transport types
├── components/       # Shared, domain-agnostic UI components
│   ├── ui/           # Primitives (Button, Card, Skeleton, etc.)
│   ├── form/         # Form primitives (TextField, TextAreaField, TagsInput)
│   └── layout/       # Layout components (Navigation)
├── features/         # Feature-based modules
│   ├── characters/
│   ├── chats/
│   ├── groups/
│   ├── personas/
│   ├── settings/
│   └── world-info/
├── lib/              # Pure utilities and framework setup
│   └── queryClient.ts
├── routes/           # Domain-split route configurations
├── stores/           # Zustand global stores
│   ├── session.ts
│   └── ui.ts
├── App.tsx           # Global providers only
└── main.tsx          # React root
```

## State Management

| Layer | Technology | Use Case |
|---|---|---|
| Server state | TanStack Query | Data fetched from backend APIs |
| Global client state | Zustand | Theme, navigation, session pointers |
| Local component state | React hooks | Forms, toggles, ephemeral UI |

**Rule:** Server state must live in TanStack Query, not in Zustand.

## Feature Module Convention

Each feature module contains:

- `api.ts` — TanStack Query keys, fetchers, and hooks
- `types.ts` — Domain-specific TypeScript types
- `utils.ts` — Domain-specific helpers
- `hooks/` — Non-query hooks
- `components/` — Feature-specific components
- `pages/` — Route-level page components

## Routing

- `App.tsx` mounts global providers only.
- `routes/index.tsx` composes top-level routes from each domain.
- Each domain exports its route fragment from `routes/<domain>.tsx`.

## API Client

`api/client.ts` provides typed fetch helpers (`apiGet`, `apiPost`, `apiPostForm`) and an `ApiError` class. CSRF tokens are initialized once and attached automatically to mutating requests.

## Adding a New Feature

1. Create `features/<feature>/{api,types,utils}.ts` and `{components,hooks,pages}/` directories.
2. Define query keys and hooks in `api.ts`.
3. Add route(s) in `routes/<feature>.tsx` and compose them in `routes/index.tsx`.
4. Keep components and hooks in the feature module unless they are shared.
