# Frontend Architecture

This document describes the React + TypeScript frontend architecture. It complements `docs/superpowers/specs/2026-06-30-react-frontend-architecture-design.md`.

## State Layers

| Layer | Responsibility | Tool |
|---|---|---|
| Server state | Data fetched from backend APIs; caching, invalidation, background refetch | TanStack Query |
| Global client state | (reserved for future use) | — |
| Local component state | Form inputs, toggles, ephemeral UI | React `useState` / `useReducer` |

**Rule:** server state lives in TanStack Query. Never copy query results into Zustand.

## Directory Layout

```
frontend/src/
├── api/                # Low-level HTTP client (apiPost, ApiError, CSRF)
├── lib/                # Cross-domain utilities (queryClient, helpers)
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

`public/` contains the jQuery frontend. The React frontend is now the default and is served from `frontend/dist/`. The legacy frontend can be accessed by visiting `/?legacy=1` to set the `st_use_legacy` cookie.

## 测试覆盖

### 单元测试 (Vitest + RTL)
- **85个测试**覆盖所有domain hooks
- 测试关键功能：API调用、错误处理、缓存失效
- 使用MSW (Mock Service Worker)拦截API请求

### E2E测试 (Playwright)
- **16个测试**覆盖核心页面
- 跨前端等价性验证：character-list测试证明React前端完全替代Legacy前端
- 页面测试：ChatList、GroupEdit、Settings、WorldInfo
- 测试用户交互和导航流程

### 运行测试
```bash
# 单元测试
npm test

# E2E测试 (需要后端服务器运行)
npm run e2e
```

## Production Deployment

### Build

```bash
cd frontend && npm run build
```

Produces `frontend/dist/` with `index.html`, `favicon.svg`, `icons.svg`, and `r-assets/` (hashed JS/CSS bundles).

### Express integration

- React assets are served at `/r-assets/*` (hashed, immutable, 7-day cache)
- `favicon.svg` and `icons.svg` are served from the dist root via fallthrough static middleware
- The legacy `public/` static mount is unchanged

### Opt-out mechanism

- Visit `/?legacy=1` to set the `st_use_legacy` cookie (30-day expiry, HttpOnly, SameSite=Lax) and switch to the legacy frontend
- Visit `/?legacy=0` to clear the cookie and return to the React frontend
- Default: React frontend (no cookie = React)
- The query parameter is consumed by `legacyOptOutMiddleware` which redirects to the clean URL after setting/clearing the cookie

### Removing legacy (future)

Once the legacy frontend is no longer needed:
1. Remove the `public/` static mount and the `shouldRedirectToLogin` / `loginPageMiddleware` references
2. Drop `legacyOptOutMiddleware` and the `?legacy=` query param handling
3. Delete `public/` and the webpack build pipeline