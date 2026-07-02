# End-to-End Tests

Playwright-based E2E tests that verify the new React frontend (`http://localhost:5173`)
renders the same data as the legacy jQuery frontend (`http://localhost:8000`).
Both share the same Express backend (`/api/*`), so any divergence between frontends
shows up as a failing test.

## Prerequisites

Both servers must be running before you start the tests:

1. **Backend** (Express on port 8000, serves legacy frontend and `/api/*`):
   ```bash
   # at repo root
   npm start
   ```
2. **React dev server** (Vite on port 5173, proxies `/api/*` to backend):
   ```bash
   # in frontend/
   npm run dev
   ```

Install Playwright browsers once:

```bash
# in frontend/
npx playwright install --with-deps chromium
```

## Commands

```bash
npm run e2e        # headless run
npm run e2e:ui     # interactive Playwright UI
```

## Adding a new test

1. Create a new `.spec.ts` file under `frontend/e2e/`.
2. Use `import { test, expect } from '@playwright/test'`.
3. Reuse `REACT_URL` / `LEGACY_URL` from `playwright.config.ts` when you need to
   compare against the legacy frontend.
4. Treat empty/unreachable backends gracefully: skip with a clear note rather
   than failing the whole suite.

## Known limitations

- Chromium only.
- No CI hook — tests are run manually.
- Assumes both servers are started by the developer.
- Tests depend on a healthy backend; an empty character list skips rather than fails.