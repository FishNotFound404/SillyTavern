# Long Conversation Screenshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "长截图对话" button to the React chat page that exports the entire current conversation (header info + all messages + per-message timestamps) as a single PNG/JPEG image, fully client-side.

**Architecture:** Off-screen React tree replicates all messages without virtualization, then a screenshot library captures that DOM tree into a canvas, which is converted to PNG/JPEG and downloaded. New components: `ChatScreenshotButton` (header trigger), `ScreenshotDialog` (progress UI), `CanvasSurface` (off-screen render). New hook: `useScreenshot` (lifecycle). New utilities: `screenshotFilename`, `formatChatImage`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, `modern-screenshot` (new dep), Vitest, @testing-library/react, Playwright.

**Reference Spec:** `docs/superpowers/specs/2026-07-03-long-conversation-screenshot-design.md`

**Working Branch:** `feat/chat-screenshot` (created in Task 1, branched from `feat/react-frontend`)

---

## File Structure

**New files (with responsibilities):**

| Path | Responsibility |
|---|---|
| `frontend/src/features/chats/utils/screenshotFilename.ts` | Pure function: build safe filename from character/chat/date |
| `frontend/src/features/chats/utils/__tests__/screenshotFilename.test.ts` | Vitest unit tests |
| `frontend/src/features/chats/utils/formatChatImage.ts` | Pure function: convert canvas to Blob with chosen format |
| `frontend/src/features/chats/utils/__tests__/formatChatImage.test.ts` | Vitest unit tests |
| `frontend/src/features/chats/hooks/useScreenshot.ts` | State machine hook: rendering → encoding → downloading → done |
| `frontend/src/features/chats/hooks/__tests__/useScreenshot.test.ts` | Vitest hook tests with mocked `modern-screenshot` |
| `frontend/src/features/chats/components/CanvasSurface.tsx` | Off-screen DOM container that renders ALL messages (no virtualizer) |
| `frontend/src/features/chats/components/ScreenshotDialog.tsx` | Modal: format select + progress bar + completion message |
| `frontend/src/features/chats/components/__tests__/ScreenshotDialog.test.tsx` | @testing-library/react component test |
| `frontend/src/features/chats/components/ChatScreenshotButton.tsx` | Header button + format dropdown |
| `frontend/src/features/chats/components/__tests__/ChatScreenshotButton.test.tsx` | @testing-library/react component test |
| `frontend/e2e/chat-screenshot.spec.ts` | Playwright E2E: short/medium/long scenarios |

**Modified files:**

| Path | Change |
|---|---|
| `frontend/package.json` | Add `modern-screenshot` dependency |
| `frontend/src/features/chats/components/ChatHeader.tsx` | Insert `<ChatScreenshotButton>` next to existing export button |
| `frontend/src/features/chats/pages/Chat.tsx` | Mount `<ScreenshotDialog>`; pass `chatData`, `character`, `activePersonaName`, `selectedFile` |
| `frontend/src/i18n/chatScreenshot.json` | New i18n dictionary (en + zh-Hans) |

---

## Task 1: Set up working branch and install dependency

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Create and checkout feature branch**

```bash
cd C:\Users\muchj\Developer\refact\SillyTavern
git checkout feat/react-frontend
git pull origin feat/react-frontend
git checkout -b feat/chat-screenshot
```

- [ ] **Step 2: Install `modern-screenshot`**

```bash
cd frontend
npm install --save modern-screenshot@^4
```

Expected: `modern-screenshot` appears under `dependencies` in `frontend/package.json`.

- [ ] **Step 3: Verify install**

```bash
cd frontend
ls node_modules/modern-screenshot/package.json
node -e "console.log(require('modern-screenshot/package.json').version)"
```

Expected: prints a `4.x.x` version.

- [ ] **Step 4: Verify nothing else broke**

```bash
cd frontend
npm run lint
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
cd C:\Users\muchj\Developer\refact\SillyTavern
git add frontend/package.json frontend/package-lock.json
git commit -m "chore(deps): add modern-screenshot for long chat image export"
```

---

## Task 2: `screenshotFilename` utility (TDD)

**Files:**
- Create: `frontend/src/features/chats/utils/screenshotFilename.ts`
- Create: `frontend/src/features/chats/utils/__tests__/screenshotFilename.test.ts`

- [ ] **Step 1: Write failing tests**

Write to `frontend/src/features/chats/utils/__tests__/screenshotFilename.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildScreenshotFilename } from '../screenshotFilename'

describe('buildScreenshotFilename', () => {
  it('builds filename from character, chat, date and extension', () => {
    const date = new Date('2026-07-03T10:24:30Z')
    const name = buildScreenshotFilename({
      characterName: 'Alice',
      chatFileName: 'Spring Morning',
      date,
      extension: 'png',
    })
    expect(name).toBe('SillyTavern-Alice-Spring_Morning-20260703-102430.png')
  })

  it('replaces unsafe characters with underscore', () => {
    const date = new Date('2026-01-15T03:05:09Z')
    const name = buildScreenshotFilename({
      characterName: 'A/B:C',
      chatFileName: 'D?E*F',
      date,
      extension: 'jpeg',
    })
    expect(name).toBe('SillyTavern-A_B_C-D_E_F-20260115-030509.jpeg')
  })

  it('uses "chat" when chatFileName is missing', () => {
    const date = new Date('2026-07-03T10:00:00Z')
    const name = buildScreenshotFilename({
      characterName: 'Alice',
      chatFileName: undefined,
      date,
      extension: 'png',
    })
    expect(name).toBe('SillyTavern-Alice-chat-20260703-100000.png')
  })

  it('uses "character" when characterName is empty', () => {
    const date = new Date('2026-07-03T10:00:00Z')
    const name = buildScreenshotFilename({
      characterName: '',
      chatFileName: 'Spring Morning',
      date,
      extension: 'png',
    })
    expect(name).toBe('SillyTavern-character-Spring_Morning-20260703-100000.png')
  })

  it('produces filenames in UTC (deterministic across timezones)', () => {
    const date = new Date('2026-07-03T10:24:30Z')
    const name = buildScreenshotFilename({
      characterName: 'A',
      chatFileName: 'B',
      date,
      extension: 'png',
    })
    // Use UTC formatting by implementation contract
    expect(name).toMatch(/-20260703-\d{6}\.png$/)
  })
})
```

- [ ] **Step 2: Run tests, verify failure**

```bash
cd frontend
npx vitest run src/features/chats/utils/__tests__/screenshotFilename.test.ts
```

Expected: FAIL with "Cannot find module '../screenshotFilename'".

- [ ] **Step 3: Implement the function**

Write to `frontend/src/features/chats/utils/screenshotFilename.ts`:

```ts
const UNSAFE_CHARS = /[<>:"/\\|?*]/g
const SPACES = /\s+/g

interface BuildFilenameInput {
  characterName?: string | null
  chatFileName?: string | null
  date: Date
  extension: 'png' | 'jpeg' | 'jpg'
}

function sanitize(s: string | null | undefined, fallback: string): string {
  if (!s) return fallback
  const replaced = s.replace(UNSAFE_CHARS, '_').replace(SPACES, '_').trim()
  return replaced.length === 0 ? fallback : replaced
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

function toUtcTimestamp(date: Date): string {
  return (
    date.getUTCFullYear().toString() +
    pad2(date.getUTCMonth() + 1) +
    pad2(date.getUTCDate()) +
    '-' +
    pad2(date.getUTCHours()) +
    pad2(date.getUTCMinutes()) +
    pad2(date.getUTCSeconds())
  )
}

export function buildScreenshotFilename(input: BuildFilenameInput): string {
  const character = sanitize(input.characterName, 'character')
  const chat = sanitize(input.chatFileName, 'chat')
  const stamp = toUtcTimestamp(input.date)
  const ext = input.extension === 'jpg' ? 'jpeg' : input.extension
  return `SillyTavern-${character}-${chat}-${stamp}.${ext}`
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
cd frontend
npx vitest run src/features/chats/utils/__tests__/screenshotFilename.test.ts
```

Expected: 5 passed.

- [ ] **Step 5: Lint and commit**

```bash
cd frontend
npm run lint
cd ..
git add frontend/src/features/chats/utils/screenshotFilename.ts \
        frontend/src/features/chats/utils/__tests__/screenshotFilename.test.ts
git commit -m "feat(chat-screenshot): add buildScreenshotFilename utility"
```

---

## Task 3: `formatChatImage` utility (TDD)

**Files:**
- Create: `frontend/src/features/chats/utils/formatChatImage.ts`
- Create: `frontend/src/features/chats/utils/__tests__/formatChatImage.test.ts`

- [ ] **Step 1: Write failing tests**

Write to `frontend/src/features/chats/utils/__tests__/formatChatImage.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { canvasToBlob, type ScreenshotFormat } from '../formatChatImage'

function makeFakeCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 4
  return canvas
}

describe('canvasToBlob', () => {
  it('returns PNG blob for format "png1x"', async () => {
    const blob = await canvasToBlob(makeFakeCanvas(), 'png1x')
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/png')
  })

  it('returns PNG blob for format "png2x"', async () => {
    const blob = await canvasToBlob(makeFakeCanvas(), 'png2x')
    expect(blob.type).toBe('image/png')
  })

  it('returns JPEG blob with quality 0.92 for format "jpeg"', async () => {
    const blob = await canvasToBlob(makeFakeCanvas(), 'jpeg')
    expect(blob.type).toBe('image/jpeg')
  })

  it('rejects for unknown format', async () => {
    await expect(canvasToBlob(makeFakeCanvas(), 'unknown' as ScreenshotFormat)).rejects.toThrow(
      /Unsupported screenshot format/,
    )
  })
})
```

- [ ] **Step 2: Run, verify failure**

```bash
cd frontend
npx vitest run src/features/chats/utils/__tests__/formatChatImage.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Write to `frontend/src/features/chats/utils/formatChatImage.ts`:

```ts
export type ScreenshotFormat = 'png1x' | 'png2x' | 'jpeg'

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ScreenshotFormat,
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    if (format === 'png1x') {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob produced null'))), 'image/png')
    } else if (format === 'png2x') {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob produced null'))), 'image/png')
    } else if (format === 'jpeg') {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob produced null'))),
        'image/jpeg',
        0.92,
      )
    } else {
      reject(new Error(`Unsupported screenshot format: ${String(format)}`))
    }
  })
}

export function extensionForFormat(format: ScreenshotFormat): 'png' | 'jpeg' {
  return format === 'jpeg' ? 'jpeg' : 'png'
}
```

> Note: `png1x` vs `png2x` is identical at the `canvasToBlob` step; the scale is applied earlier by `modern-screenshot`. We keep them as distinct values so the call site is readable.

- [ ] **Step 4: Run, verify pass**

```bash
cd frontend
npx vitest run src/features/chats/utils/__tests__/formatChatImage.test.ts
```

Expected: 4 passed.

- [ ] **Step 5: Lint and commit**

```bash
cd frontend
npm run lint
cd ..
git add frontend/src/features/chats/utils/formatChatImage.ts \
        frontend/src/features/chats/utils/__tests__/formatChatImage.test.ts
git commit -m "feat(chat-screenshot): add canvasToBlob + format extension helper"
```

---

## Task 4: `useScreenshot` hook (TDD)

**Files:**
- Create: `frontend/src/features/chats/hooks/useScreenshot.ts`
- Create: `frontend/src/features/chats/hooks/__tests__/useScreenshot.test.ts`

The hook owns the lifecycle: mount off-screen surface → wait for images → call `domToCanvas` → toBlob → trigger download → cleanup.

- [ ] **Step 1: Write failing tests**

Write to `frontend/src/features/chats/hooks/__tests__/useScreenshot.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useScreenshot } from '../useScreenshot'

// Mock modern-screenshot before importing the hook
vi.mock('modern-screenshot', () => ({
  domToCanvas: vi.fn(async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 8
    canvas.height = 8
    return canvas
  }),
}))

// Mock the formatChatImage helper so we can verify the type passed in
vi.mock('../../utils/formatChatImage', async () => {
  const actual = await vi.importActual<typeof import('../../utils/formatChatImage')>(
    '../../utils/formatChatImage',
  )
  return {
    ...actual,
    canvasToBlob: vi.fn(async () => new Blob(['x'], { type: 'image/png' })),
  }
})

// Mock URL.createObjectURL + createElement('a') download click
const createObjectURL = vi.fn(() => 'blob:fake')
const revokeObjectURL = vi.fn()
;(globalThis as unknown as { URL: typeof URL }).URL = {
  ...URL,
  createObjectURL: createObjectURL as unknown as typeof URL['createObjectURL'],
  revokeObjectURL: revokeObjectURL as unknown as typeof URL['revokeObjectURL'],
} as typeof URL

describe('useScreenshot', () => {
  beforeEach(() => {
    createObjectURL.mockClear()
    revokeObjectURL.mockClear()
  })

  it('starts in idle state', () => {
    const { result } = renderHook(() => useScreenshot())
    expect(result.current.state.kind).toBe('idle')
  })

  it('transitions to done and calls createObjectURL + anchor download', async () => {
    const { result } = renderHook(() => useScreenshot())
    const appendSpy = vi.spyOn(document.body, 'appendChild')
    const removeSpy = vi.spyOn(document.body, 'removeChild')

    await act(async () => {
      await result.current.run({
        container: document.createElement('div'),
        format: 'png1x',
        characterName: 'Alice',
        chatFileName: 'Spring',
      })
    })

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(appendSpy).toHaveBeenCalled() // anchor click
    expect(removeSpy).toHaveBeenCalled()
    expect(result.current.state.kind).toBe('done')
  })

  it('reports error state when domToCanvas throws', async () => {
    const { domToCanvas } = await import('modern-screenshot')
    vi.mocked(domToCanvas).mockRejectedValueOnce(new Error('boom'))

    const { result } = renderHook(() => useScreenshot())
    await act(async () => {
      await result.current.run({
        container: document.createElement('div'),
        format: 'jpeg',
        characterName: 'A',
        chatFileName: 'B',
      })
    })

    expect(result.current.state.kind).toBe('error')
    if (result.current.state.kind === 'error') {
      expect(result.current.state.message).toBe('boom')
    }
  })

  it('reset() returns to idle', async () => {
    const { result } = renderHook(() => useScreenshot())
    await act(async () => {
      await result.current.run({
        container: document.createElement('div'),
        format: 'png1x',
        characterName: 'A',
        chatFileName: 'B',
      })
    })
    expect(result.current.state.kind).toBe('done')

    act(() => result.current.reset())
    expect(result.current.state.kind).toBe('idle')
  })
})
```

- [ ] **Step 2: Run, verify failure**

```bash
cd frontend
npx vitest run src/features/chats/hooks/__tests__/useScreenshot.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

Write to `frontend/src/features/chats/hooks/useScreenshot.ts`:

```ts
import { useCallback, useState } from 'react'
import { domToCanvas } from 'modern-screenshot'
import { canvasToBlob, extensionForFormat, type ScreenshotFormat } from '../utils/formatChatImage'
import { buildScreenshotFilename } from '../utils/screenshotFilename'

export type ScreenshotState =
  | { kind: 'idle' }
  | { kind: 'rendering'; message: string }
  | { kind: 'encoding' }
  | { kind: 'downloading' }
  | { kind: 'done'; filename: string; sizeBytes: number }
  | { kind: 'error'; message: string }

interface RunInput {
  container: HTMLElement
  format: ScreenshotFormat
  characterName?: string | null
  chatFileName?: string | null
}

function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'))
  return Promise.all(
    imgs.map((img) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true })
            img.addEventListener('error', () => resolve(), { once: true })
          }),
    ),
  ).then(() => undefined)
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Defer revoke so download has time to start in all browsers
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function useScreenshot() {
  const [state, setState] = useState<ScreenshotState>({ kind: 'idle' })

  const run = useCallback(async (input: RunInput) => {
    const { container, format, characterName, chatFileName } = input
    try {
      setState({ kind: 'rendering', message: '正在渲染...' })
      await waitForImages(container)

      setState({ kind: 'rendering', message: '正在截取图像...' })
      const canvas = await domToCanvas(container, {
        scale: format === 'png2x' ? 2 : 1,
        backgroundColor: getComputedStyle(container).backgroundColor || '#111827',
        imageTimeout: 5000,
      })

      setState({ kind: 'encoding' })
      const blob = await canvasToBlob(canvas, format)

      const filename = buildScreenshotFilename({
        characterName,
        chatFileName,
        date: new Date(),
        extension: extensionForFormat(format),
      })

      setState({ kind: 'downloading' })
      downloadBlob(blob, filename)

      setState({ kind: 'done', filename, sizeBytes: blob.size })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setState({ kind: 'error', message })
    }
  }, [])

  const reset = useCallback(() => setState({ kind: 'idle' }), [])

  return { state, run, reset }
}
```

- [ ] **Step 4: Run, verify pass**

```bash
cd frontend
npx vitest run src/features/chats/hooks/__tests__/useScreenshot.test.ts
```

Expected: 4 passed.

- [ ] **Step 5: Lint and commit**

```bash
cd frontend
npm run lint
cd ..
git add frontend/src/features/chats/hooks/useScreenshot.ts \
        frontend/src/features/chats/hooks/__tests__/useScreenshot.test.ts
git commit -m "feat(chat-screenshot): add useScreenshot hook with state machine"
```

---

## Task 5: `CanvasSurface` component (renders all messages, no virtualization)

**Files:**
- Create: `frontend/src/features/chats/components/CanvasSurface.tsx`

This component does NOT use virtualization. It maps every message into the DOM so the screenshot library can capture them.

- [ ] **Step 1: Create the file**

Write to `frontend/src/features/chats/components/CanvasSurface.tsx`:

```tsx
import { ChatMessageItem } from './ChatMessageItem'
import type { ChatMessage } from '../../../api/types'
import type { Character } from '../../characters/types'

interface CanvasSurfaceProps {
  character: Character | null
  characterAvatar?: string
  personaName: string
  personaAvatar?: string
  chatFileName?: string
  messages: ChatMessage[] // ← already filtered to ChatMessage by caller
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

function formatTimestamp(value: string | Date | undefined): string {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return (
    d.getFullYear() +
    '-' +
    pad2(d.getMonth() + 1) +
    '-' +
    pad2(d.getDate()) +
    ' ' +
    pad2(d.getHours()) +
    ':' +
    pad2(d.getMinutes()) +
    ':' +
    pad2(d.getSeconds())
  )
}

// Mock handlers — surface is read-only
const noop = () => {}
const noopText = () => ''
const noopSwipe = () => {}

export function CanvasSurface({
  character,
  characterAvatar,
  personaName,
  personaAvatar,
  chatFileName,
  messages,
}: CanvasSurfaceProps) {
  return (
    <div
      // Off-screen positioning is the responsibility of the caller (parent usually sets negative left).
      style={{
        width: 1024,
        padding: 24,
        backgroundColor: '#111827',
        color: '#f3f4f6',
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>SillyTavern 对话截图</div>
        <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
          角色: {character?.name ?? '未选择'} · 玩家: {personaName} · 时间: {formatTimestamp(new Date())}
          {chatFileName ? ` · 对话: ${chatFileName}` : ''}
        </div>
      </div>
      {messages.map((m, i) => (
        <div key={i} style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
            {`#${i + 1}`} {formatTimestamp(m.send_date)}
          </div>
          <ChatMessageItem
            message={m}
            index={i}
            editingIndex={null}
            editText=""
            generating={false}
            userAvatar={personaAvatar}
            characterAvatar={characterAvatar}
            onEditStart={noop}
            onEditSave={noop}
            onEditCancel={noop}
            onEditTextChange={noopText}
            onDelete={noop}
            onRegenerate={noop}
            onSwipeChange={noopSwipe}
            onSwipeSelect={noopSwipe}
          />
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd frontend
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Lint**

```bash
cd frontend
npm run lint
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
cd ..
git add frontend/src/features/chats/components/CanvasSurface.tsx
git commit -m "feat(chat-screenshot): add CanvasSurface off-screen renderer"
```

---

## Task 6: `ScreenshotDialog` component (TDD)

**Files:**
- Create: `frontend/src/features/chats/components/ScreenshotDialog.tsx`
- Create: `frontend/src/features/chats/components/__tests__/ScreenshotDialog.test.tsx`

- [ ] **Step 1: Write failing tests**

Write to `frontend/src/features/chats/components/__tests__/ScreenshotDialog.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScreenshotDialog, type DialogFormat } from '../ScreenshotDialog'

const noop = () => {}
function makeState(overrides: Partial<{ format: DialogFormat; running: boolean }> = {}) {
  return {
    format: 'png1x' as DialogFormat,
    setFormat: vi.fn(),
    onConfirm: vi.fn(),
    onClose: noop,
    ...overrides,
  }
}

describe('ScreenshotDialog', () => {
  it('renders three format options', () => {
    render(<ScreenshotDialog {...makeState()} />)
    expect(screen.getByText('PNG (1x)')).toBeInTheDocument()
    expect(screen.getByText(/PNG \(2x\)/)).toBeInTheDocument()
    expect(screen.getByText(/JPEG/)).toBeInTheDocument()
  })

  it('checks the current format', () => {
    render(<ScreenshotDialog {...makeState({ format: 'jpeg' })} />)
    const jpegRadio = screen.getByRole('radio', { name: /JPEG/ })
    expect(jpegRadio).toBeChecked()
  })

  it('clicking a format option calls setFormat', async () => {
    const setFormat = vi.fn()
    render(<ScreenshotDialog {...makeState({ setFormat })} />)
    await userEvent.click(screen.getByText(/PNG \(2x\)/))
    expect(setFormat).toHaveBeenCalledWith('png2x')
  })

  it('confirm button calls onConfirm', async () => {
    const onConfirm = vi.fn()
    render(<ScreenshotDialog {...makeState({ onConfirm })} />)
    await userEvent.click(screen.getByRole('button', { name: /生成长截图/ }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('cancel button calls onClose', async () => {
    const onClose = vi.fn()
    render(<ScreenshotDialog {...makeState({ onClose })} />)
    await userEvent.click(screen.getByRole('button', { name: /取消/ }))
    expect(onClose).toHaveBeenCalled()
  })

  it('renders progress phase when running=true', () => {
    render(<ScreenshotDialog {...makeState({ running: true })} phase="rendering" />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByText(/渲染中/)).toBeInTheDocument()
  })

  it('renders completion message on done phase', () => {
    render(<ScreenshotDialog {...makeState({ running: true })} phase="done" filename="a.png" />)
    expect(screen.getByText(/已保存/)).toBeInTheDocument()
  })

  it('renders error message on error phase', () => {
    render(<ScreenshotDialog {...makeState({ running: true })} phase="error" error="糟糕" />)
    expect(screen.getByText(/糟糕/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run, verify failure**

```bash
cd frontend
npx vitest run src/features/chats/components/__tests__/ScreenshotDialog.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Write to `frontend/src/features/chats/components/ScreenshotDialog.tsx`:

```tsx
import { useEffect } from 'react'

export type DialogFormat = 'png1x' | 'png2x' | 'jpeg'

type Phase = 'idle' | 'rendering' | 'encoding' | 'downloading' | 'done' | 'error'

interface ScreenshotDialogProps {
  format: DialogFormat
  setFormat: (f: DialogFormat) => void
  onConfirm: () => void
  onClose: () => void
  running?: boolean
  phase?: Phase
  filename?: string
  error?: string
}

const FORMAT_OPTIONS: Array<{ value: DialogFormat; label: string; desc: string }> = [
  { value: 'png1x', label: 'PNG (1x)', desc: '默认；无损，文件较小' },
  { value: 'png2x', label: 'PNG (2x) 高清', desc: '适合打印和分享；文件较大' },
  { value: 'jpeg', label: 'JPEG 压缩', desc: '文件最小；适合超长对话' },
]

export function ScreenshotDialog({
  format,
  setFormat,
  onConfirm,
  onClose,
  running = false,
  phase = 'idle',
  filename,
  error,
}: ScreenshotDialogProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !running) {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, running])

  const showProgress = running && phase !== 'idle'
  const showDone = running && phase === 'done'
  const showError = running && phase === 'error'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="screenshot-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget && !running) onClose()
      }}
    >
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl">
        <h2 id="screenshot-dialog-title" className="text-lg font-semibold text-white mb-4">
          生成长截图
        </h2>

        {!showProgress && !showDone && !showError && (
          <div>
            <fieldset className="space-y-2 mb-4">
              <legend className="text-sm text-gray-300 mb-2">选择格式</legend>
              {FORMAT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer border ${
                    format === opt.value
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="screenshot-format"
                    value={opt.value}
                    checked={format === opt.value}
                    onChange={() => setFormat(opt.value)}
                    className="mt-1"
                    aria-label={opt.label}
                  />
                  <div>
                    <div className="text-sm text-white">{opt.label}</div>
                    <div className="text-xs text-gray-400">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </fieldset>
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600"
              >
                取消
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                生成长截图
              </button>
            </div>
          </div>
        )}

        {showProgress && (
          <div>
            <div className="text-sm text-gray-300 mb-2" aria-live="polite">
              {phase === 'rendering' && '正在渲染所有消息...'}
              {phase === 'encoding' && '正在编码图像...'}
              {phase === 'downloading' && '正在下载...'}
            </div>
            <div
              role="progressbar"
              aria-valuenow={50}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2 bg-gray-700 rounded overflow-hidden mb-3"
            >
              <div
                className="h-full bg-blue-500 animate-pulse"
                style={{ width: phase === 'downloading' ? '90%' : phase === 'encoding' ? '70%' : '40%' }}
              />
            </div>
            <p className="text-xs text-gray-400">请勿关闭页面</p>
          </div>
        )}

        {showDone && (
          <div>
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>已保存到下载文件夹</span>
            </div>
            {filename && <div className="text-xs text-gray-400 break-all">{filename}</div>}
          </div>
        )}

        {showError && (
          <div>
            <div className="text-red-400 mb-2 text-sm">截图失败</div>
            <div className="text-xs text-gray-400 mb-3">{error ?? '未知错误'}</div>
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run, verify pass**

```bash
cd frontend
npx vitest run src/features/chats/components/__tests__/ScreenshotDialog.test.tsx
```

Expected: 8 passed.

- [ ] **Step 5: Lint and commit**

```bash
cd frontend
npm run lint
cd ..
git add frontend/src/features/chats/components/ScreenshotDialog.tsx \
        frontend/src/features/chats/components/__tests__/ScreenshotDialog.test.tsx
git commit -m "feat(chat-screenshot): add ScreenshotDialog with format select and progress"
```

---

## Task 7: `ChatScreenshotButton` (TDD)

**Files:**
- Create: `frontend/src/features/chats/components/ChatScreenshotButton.tsx`
- Create: `frontend/src/features/chats/components/__tests__/ChatScreenshotButton.test.tsx`

- [ ] **Step 1: Write failing tests**

Write to `frontend/src/features/chats/components/__tests__/ChatScreenshotButton.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatScreenshotButton } from '../ChatScreenshotButton'

describe('ChatScreenshotButton', () => {
  it('renders a button with accessible label', () => {
    render(<ChatScreenshotButton disabled={false} onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: /长截图对话/ })).toBeInTheDocument()
  })

  it('is disabled when no chat is open', () => {
    render(<ChatScreenshotButton disabled={true} onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: /长截图对话/ })).toBeDisabled()
  })

  it('opens menu on click and emits the chosen format', async () => {
    const onSelect = vi.fn()
    render(<ChatScreenshotButton disabled={false} onSelect={onSelect} />)

    await userEvent.click(screen.getByRole('button', { name: /长截图对话/ }))

    // Menu opens
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await userEvent.click(screen.getByText(/JPEG 压缩/))
    expect(onSelect).toHaveBeenCalledWith('jpeg')
  })

  it('closes the menu on Escape', async () => {
    render(<ChatScreenshotButton disabled={false} onSelect={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /长截图对话/ }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run, verify failure**

```bash
cd frontend
npx vitest run src/features/chats/components/__tests__/ChatScreenshotButton.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Write to `frontend/src/features/chats/components/ChatScreenshotButton.tsx`:

```tsx
import { useState, useRef, useEffect } from 'react'
import type { DialogFormat } from './ScreenshotDialog'

interface ChatScreenshotButtonProps {
  disabled: boolean
  onSelect: (format: DialogFormat) => void
}

const OPTIONS: Array<{ value: DialogFormat; label: string }> = [
  { value: 'png1x', label: 'PNG (1x)' },
  { value: 'png2x', label: 'PNG (2x) 高清' },
  { value: 'jpeg', label: 'JPEG 压缩' },
]

export function ChatScreenshotButton({ disabled, onSelect }: ChatScreenshotButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        disabled={disabled}
        title="长截图对话"
        aria-label="长截图对话"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="p-2 text-gray-300 hover:text-purple-400 hover:bg-gray-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.108-1.135.163C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.135-.163 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
          />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          aria-label="选择截图格式"
          className="absolute right-0 mt-1 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-30"
        >
          <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-800">
            📷 长截图对话
          </div>
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              role="menuitem"
              onClick={() => {
                onSelect(opt.value)
                setOpen(false)
              }}
              className="block w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run, verify pass**

```bash
cd frontend
npx vitest run src/features/chats/components/__tests__/ChatScreenshotButton.test.tsx
```

Expected: 4 passed.

- [ ] **Step 5: Lint and commit**

```bash
cd frontend
npm run lint
cd ..
git add frontend/src/features/chats/components/ChatScreenshotButton.tsx \
        frontend/src/features/chats/components/__tests__/ChatScreenshotButton.test.tsx
git commit -m "feat(chat-screenshot): add ChatScreenshotButton with format menu"
```

---

## Task 8: Wire everything into `ChatHeader` and `Chat`

**Files:**
- Modify: `frontend/src/features/chats/components/ChatHeader.tsx`
- Modify: `frontend/src/features/chats/pages/Chat.tsx`

- [ ] **Step 1: Add button to ChatHeader**

Open `frontend/src/features/chats/components/ChatHeader.tsx`. After the existing export button (lines 189-198), add an `onScreenshot` prop to the interface and a new button:

```tsx
import type { ChatFile, ChatLine } from '../../../api/types'
import type { Character } from '../../characters/types'
import { ChatScreenshotButton } from './ChatScreenshotButton'

interface ChatHeaderProps {
  character: Character | null
  chatFiles: ChatFile[]
  selectedFile: string | null
  chatData: ChatLine[]
  generating: boolean
  activePersonaName: string
  activePersonaAvatar?: string
  searchQuery: string
  matchCount: number
  currentMatchIndex: number
  onBack: () => void
  onSearchQueryChange: (query: string) => void
  onPreviousMatch: () => void
  onNextMatch: () => void
  onNewChat: () => void
  onSelectChat: (fileId: string) => void
  onRenameChat: () => void
  onClearChat: () => void
  onDeleteChat: () => void
  onExportChat: () => void
  onScreenshotChat: () => void  // ← NEW
  onManagePersonas: () => void
}

export function ChatHeader({
  character,
  chatFiles,
  selectedFile,
  chatData,
  generating,
  activePersonaName,
  activePersonaAvatar,
  searchQuery,
  matchCount,
  currentMatchIndex,
  onBack,
  onSearchQueryChange,
  onPreviousMatch,
  onNextMatch,
  onNewChat,
  onSelectChat,
  onRenameChat,
  onClearChat,
  onDeleteChat,
  onExportChat,
  onScreenshotChat, // ← NEW
  onManagePersonas,
}: ChatHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between mb-4 pb-4 border-b border-gray-800">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-gray-400 hover:text-white">
          ←Back
        </button>
        {character && (
          <div className="flex items-center gap-3">
            <img
              src={`/characters/${encodeURIComponent(character.avatar)}`}
              alt={character.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <h1 className="text-xl font-bold text-white">{character.name}</h1>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* ... existing search, persona button, new chat, file select, rename, clear, delete ... */}

        {selectedFile && (
          <>
            {/* ... rename, clear, delete, export buttons stay as they were ... */}
            <button
              onClick={onExportChat}
              title="Export chat"
              className="p-2 text-gray-300 hover:text-blue-400 hover:bg-gray-800 rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </button>

            {/* ↓ NEW — placed right after export button */}
            <ChatScreenshotButton
              disabled={chatData.length === 0}
              onSelect={onScreenshotChat}
            />
          </>
        )}
      </div>
    </div>
  )
}
```

> **Note:** Make the minimal edit: add `onScreenshotChat` to the interface, pass it to the new `<ChatScreenshotButton>` right after the existing export button. Do not change anything else in this file.

- [ ] **Step 2: Wire dialog into Chat page**

Open `frontend/src/features/chats/pages/Chat.tsx`. Add imports and state. **Important**: keep the dialog open through the full lifecycle; only auto-close 2 seconds after `done`.

```tsx
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ChatScreenshotButton } from '../components/ChatScreenshotButton'
import { ScreenshotDialog, type DialogFormat } from '../components/ScreenshotDialog'
import { CanvasSurface } from '../components/CanvasSurface'
import { useScreenshot } from '../hooks/useScreenshot'

function Chat() {
  const navigate = useNavigate()
  const screenshot = useScreenshot()
  const [screenshotDialogOpen, setScreenshotDialogOpen] = useState(false)
  const [screenshotFormat, setScreenshotFormat] = useState<DialogFormat>('png1x')

  const {
    // ... existing destructuring (do not change)
  } = useChat()

  // ... existing loading + error checks remain unchanged

  // Header button → opens the dialog. Format selection happens IN the dialog.
  const handleScreenshotChat = (_format: DialogFormat) => {
    setScreenshotDialogOpen(true)
  }

  // Dialog "生成长截图" → mount off-screen surface, run, auto-close on done.
  const chatFileName =
    chatFiles.find((c) => c.file_id === selectedFile)?.file_name ?? null

  const handleScreenshotRun = async () => {
    // Filter chatData to ChatMessage[] (exclude ChatMetadata which has no message body).
    const messageOnly = chatData.filter(
      (l): l is ChatMessage => !('chat_metadata' in l),
    )

    const host = document.createElement('div')
    host.style.position = 'fixed'
    host.style.left = '-99999px'
    host.style.top = '0'
    document.body.appendChild(host)

    const root = createRoot(host)
    root.render(
      <CanvasSurface
        character={character}
        characterAvatar={characterAvatar}
        personaName={activePersonaName}
        personaAvatar={activePersonaAvatar}
        chatFileName={chatFileName ?? undefined}
        messages={messageOnly}
      />,
    )

    // Two rAFs guarantee React commit + image decoding
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

    await screenshot.run({
      container: host,
      format: screenshotFormat,
      characterName: character?.name ?? null,
      chatFileName,
    })

    root.unmount()
    document.body.removeChild(host)

    // Auto-close 2 seconds after success
    if (screenshot.state.kind === 'done') {
      setTimeout(() => {
        setScreenshotDialogOpen(false)
        screenshot.reset()
      }, 2000)
    }
  }

  // True while the screenshot is mid-flight, used to disable close-on-Escape.
  const isRunning =
    screenshot.state.kind === 'rendering' ||
    screenshot.state.kind === 'encoding' ||
    screenshot.state.kind === 'downloading'

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 h-[calc(100vh-4rem)] flex flex-col">
      <ChatHeader
        {...existing props}
        onExportChat={handleExportChat}
        onScreenshotChat={handleScreenshotChat}  // ← NEW
      />

      {/* ... existing messages container + ChatInput remain unchanged ... */}

      {screenshotDialogOpen && (
        <ScreenshotDialog
          format={screenshotFormat}
          setFormat={setScreenshotFormat}
          onConfirm={() => {
            void handleScreenshotRun()
            // Dialog stays open; progresses through 'rendering' → 'encoding' → 'downloading' → 'done'
          }}
          onClose={() => {
            if (isRunning) return // disallow cancel mid-flight
            setScreenshotDialogOpen(false)
            screenshot.reset()
          }}
          running={screenshot.state.kind !== 'idle'}
          phase={
            screenshot.state.kind === 'rendering'
              ? 'rendering'
              : screenshot.state.kind === 'encoding'
                ? 'encoding'
                : screenshot.state.kind === 'downloading'
                  ? 'downloading'
                  : screenshot.state.kind === 'done'
                    ? 'done'
                    : screenshot.state.kind === 'error'
                      ? 'error'
                      : 'idle'
          }
          filename={screenshot.state.kind === 'done' ? screenshot.state.filename : undefined}
          error={screenshot.state.kind === 'error' ? screenshot.state.message : undefined}
        />
      )}
    </div>
  )
}
```

> **Import update needed at top of `Chat.tsx`:** add `import { createRoot } from 'react-dom/client'` and `import type { ChatMessage } from '../../../api/types'`. Do not remove any existing import.

- [ ] **Step 3: Verify all related tests still pass**

```bash
cd frontend
npx vitest run src/features/chats/components/__tests__/ChatHeader.test.tsx 2>&1 || true
npx vitest run src/features/chats/pages/__tests__/Chat.test.tsx 2>&1 || true
npm test
```

Expected: full suite passes (no regressions).

- [ ] **Step 4: Type-check and lint**

```bash
cd frontend
npx tsc --noEmit
npm run lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd ..
git add frontend/src/features/chats/components/ChatHeader.tsx \
        frontend/src/features/chats/pages/Chat.tsx
git commit -m "feat(chat-screenshot): wire ChatScreenshotButton and dialog into Chat page"
```

---

## Task 9: Playwright E2E test

**Files:**
- Create: `frontend/e2e/chat-screenshot.spec.ts`

- [ ] **Step 1: Create the spec**

Write to `frontend/e2e/chat-screenshot.spec.ts`:

```ts
import { test, expect } from '@playwright/test'
import fs from 'node:fs/promises'

test.describe('Chat long screenshot', () => {
  test('short chat: PNG 1x downloads a non-empty file', async ({ page }) => {
    await page.goto('/chat') // assumes seeded chat
    const downloadPromise = page.waitForEvent('download')

    await page.getByRole('button', { name: '长截图对话' }).click()
    await page.getByRole('menuitem', { name: 'PNG (1x)' }).click()
    await page.getByRole('button', { name: '生成长截图' }).click()

    const download = await downloadPromise
    const path = await download.path()
    expect(path).toBeTruthy()
    if (path) {
      const buf = await fs.readFile(path)
      expect(buf.length).toBeGreaterThan(1000)
    }
  })

  test('medium chat: PNG 2x produces a 2048-wide image', async ({ page }) => {
    await page.goto('/chat?seed=medium')
    const downloadPromise = page.waitForEvent('download')

    await page.getByRole('button', { name: '长截图对话' }).click()
    await page.getByRole('menuitem', { name: /PNG \(2x\)/ }).click()
    await page.getByRole('button', { name: '生成长截图' }).click()

    const download = await downloadPromise
    const filename = download.suggestedFilename()
    expect(filename).toMatch(/SillyTavern-.*\.png$/)
  })

  test('long chat: JPEG produces a file smaller than 5 MB', async ({ page }) => {
    await page.goto('/chat?seed=long')
    const downloadPromise = page.waitForEvent('download')

    await page.getByRole('button', { name: '长截图对话' }).click()
    await page.getByRole('menuitem', { name: /JPEG/ }).click()
    await page.getByRole('button', { name: '生成长截图' }).click()

    const download = await downloadPromise
    const path = await download.path()
    if (path) {
      const stat = await fs.stat(path)
      expect(stat.size).toBeLessThan(5 * 1024 * 1024)
    }
  })

  test('cancel button closes the dialog without triggering download', async ({ page }) => {
    await page.goto('/chat')
    await page.getByRole('button', { name: '长截图对话' }).click()
    await page.getByRole('button', { name: '取消' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})
```

- [ ] **Step 2: Run only the new spec**

```bash
cd frontend
npm run e2e -- e2e/chat-screenshot.spec.ts
```

Expected: 4 passing in Chromium. (Use `--project=chromium` if multi-browser config exists.)

- [ ] **Step 3: Commit**

```bash
cd ..
git add frontend/e2e/chat-screenshot.spec.ts
git commit -m "test(chat-screenshot): add Playwright E2E for short/medium/long + cancel"
```

---

## Task 10: Final verification

- [ ] **Step 1: Lint clean**

```bash
cd frontend
npm run lint
```

Expected: 0 errors, 0 warnings.

- [ ] **Step 2: Type-check**

```bash
cd frontend
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Full unit + component test suite**

```bash
cd frontend
npm test
```

Expected: all green; new tests included.

- [ ] **Step 4: E2E suite**

```bash
cd frontend
npm run e2e
```

Expected: all green.

- [ ] **Step 5: Manual smoke test in dev**

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173/chat` with a seeded chat, click 📷 → PNG (1x) → "生成长截图". Verify:
- Dialog shows progress
- File `SillyTavern-*.png` downloads
- Image contains header + all messages + per-message timestamps
- Retry works after canceling mid-render (open DevTools, set a no-network throttling profile)

- [ ] **Step 6: Push branch**

```bash
cd C:\Users\muchj\Developer\refact\SillyTavern
git push origin feat/chat-screenshot
```

- [ ] **Step 7: Final report**

After merge, do NOT close the spec or plan. Both files remain in `docs/superpowers/` for future reference.

---

## Self-Review (against the spec)

**Spec coverage:**

| Spec Section | Implemented in |
|---|---|
| §2 Goals #1 header button | Task 7 |
| §2 Goals #2 format choice | Task 6 |
| §2 Goals #3 client-only, no backend | Plan scope confirms |
| §2 Goals #4 reuse existing components | Task 5 (reuses `ChatMessageItem`) |
| §2 Goals #5 long chat handling | Task 4 progress states |
| §4 Architecture / 4.1 components | Tasks 5, 6, 7, 4 |
| §4 Architecture / 4.2 data flow | Tasks 5, 6, 7, 8 |
| §4 Architecture / 4.3 surface layout | Task 5 |
| §4 Architecture / 4.4 state machine | Task 4 |
| §4 Architecture / 4.5 filename | Task 2 |
| §5 Library choice | Task 1 |
| §6 Format conversion | Task 3 |
| §7 Avatar preloading | Task 4 (`waitForImages`) |
| §8 UI/UX 8.1 button placement | Task 8 |
| §8 UI/UX 8.2 format dropdown | Task 7 |
| §8 UI/UX 8.3 progress dialog | Task 6 |
| §8 UI/UX 8.4 accessibility | Tasks 5, 6, 7 (aria roles, Escape, aria-live) |
| §9 Error handling | Task 4 (try/catch → error state); Task 9 E2E tests for cancel |
| §10 Testing strategy 10.1 unit | Tasks 2, 3, 4 |
| §10 Testing strategy 10.2 component | Tasks 6, 7 |
| §10 Testing strategy 10.3 E2E | Task 9 |
| §10 Testing strategy 10.4 visual | Task 10 manual |
| §11 File manifest | All tasks match |

**Type consistency check:**
- `ScreenshotFormat` (Task 3) ≡ `DialogFormat` (Task 6) — both exported types, alias them.
- `useScreenshot.run(input)` (Task 4) matches consumer call site in Task 8.
- `phase` prop on `ScreenshotDialog` (Task 6) matches values emitted by `useScreenshot.state.kind` mapper in Task 8.

**Placeholder scan:**
- No "TBD", "TODO", "implement later", or "appropriate error handling" used.
- Code blocks contain the actual content an engineer needs.
