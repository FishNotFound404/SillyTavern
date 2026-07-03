# Long Conversation Screenshot Design

## 1. Background

The React chat page (`features/chats/pages/Chat.tsx`) renders conversations inside a virtualized list (`@tanstack/react-virtual`). A user with a long chat (hundreds of messages) cannot take a native OS screenshot of the entire conversation because:
- Native OS screenshots only capture the current viewport
- The browser's "Save full page" feature (e.g., Chrome's "Capture full size") is hidden, varies by browser, and produces HTML, not an image
- Existing export button in `ChatHeader.tsx:189-198` only exports JSON / text format

Users want to generate a single tall image that contains the **entire conversation**, header info, timestamps, and a top title — for the purposes of sharing, archiving, or printing. Existing screenshot libraries (`html2canvas`, `html2canvas-pro`, `modern-screenshot`) can render DOM into canvas, but virtualization renders only visible items, so they cannot capture the full conversation directly.

This feature adds a "Screenshot" button that captures the entire conversation as a single tall PNG/JPEG image, entirely client-side, with no backend changes.

## 2. Goals

1. Provide a one-click "Screenshot" button in `ChatHeader` that captures the **entire current chat** (all messages, regardless of virtualization) plus a header block (character name, persona name, chat file name, date) and timestamps per message.
2. Let the user choose output format and resolution: PNG 1x (default), PNG 2x (Retina), JPEG 0.92.
3. Generate the image purely on the client using a maintained screenshot library; do not modify backend, do not add a new server endpoint.
4. Reuse existing components (`ChatMessageItem`, `ChatMessageBubble`) so visual fidelity matches what the user sees on screen.
5. Handle long conversations gracefully: show progress, finish in under a few seconds for typical chats (< 200 messages), and degrade gracefully for very long ones (> 500 messages).

## 3. Non-Goals

1. No backend changes (no new endpoints, no server-side rendering, no Puppeteer/Playwright).
2. No full visual editor (cropping, annotation, text overlay).
3. No bulk screenshots across multiple chats (only the currently open chat).
4. No video / GIF / scrolling animation — still images only.
5. No new chat features beyond screenshot; the existing in-place edit / regenerate / delete flows are unaffected.

## 4. Architecture

### 4.1 Components

| Component | Location | Responsibility |
|---|---|---|
| `ChatScreenshotButton` | `frontend/src/features/chats/components/ChatScreenshotButton.tsx` | Header button + format dropdown menu |
| `ScreenshotDialog` | `frontend/src/features/chats/components/ScreenshotDialog.tsx` | Modal with format selection, progress UI, completion toast |
| `CanvasSurface` | `frontend/src/features/chats/components/CanvasSurface.tsx` | Off-screen DOM container that renders all messages without virtualization |
| `useScreenshot` | `frontend/src/features/chats/hooks/useScreenshot.ts` | Encapsulates screenshot lifecycle: avatar preloading, render, encode, download, cleanup |
| `screenshotFilename` | `frontend/src/features/chats/utils/screenshotFilename.ts` | Pure function building `<character>-<chat>-<YYYYMMDD-HHmmss>.<ext>` |
| `formatChatImage` | `frontend/src/features/chats/utils/formatChatImage.ts` | Pure function converting canvas to blob with chosen format |

### 4.2 Data Flow

```
ChatHeader
   └── ChatScreenshotButton ──onClick──▶ open dialog
        └── ScreenshotDialog
             ├── user selects [PNG 1x | PNG 2x | JPEG 0.92]
             ├── onConfirm ──▶ useScreenshot.run(format)
             │                  ├── 1. Mount <CanvasSurface> offscreen
             │                  ├── 2. Wait for <img> avatars to load
             │                  ├── 3. Call modern-screenshot on the surface
             │                  ├── 4. canvas.toBlob(format) → ObjectURL
             │                  ├── 5. Trigger <a download={filename}>
             │                  └── 6. Unmount <CanvasSurface>
             └── onProgress(state) ──▶ progress bar in dialog
```

### 4.3 Layout of the Off-Screen Surface

```
┌────────────────────────────────────────────────────────┐
│ SillyTavern 对话截图                           (标题)     │
│ 角色: Alice · 玩家: Bob · 时间: 2026-07-03 10:24       │
├────────────────────────────────────────────────────────┤
│ 10:21:33                                                │
│ ╭──────────╮                                            │
│ │ (avatar) │  Alice: 你好！                             │
│ ╰──────────╯                                            │
│                                       ╭──────────╮      │
│                                       │ (avatar) │      │
│           Bob: 你好呀                  ╰──────────╯      │
│ 10:21:50                                                │
│ ... (every message)                                     │
└────────────────────────────────────────────────────────┘
   Width: 1024px (fixed, matches max-w-5xl)
   Padding: 24px, background: #111827 (gray-900)
```

Key rules:
- `CanvasSurface` is a flat `<div>` (no virtualization, no scroll container) with explicit fixed `width: 1024px`.
- Messages are rendered with the **existing** `ChatMessageItem` to preserve styling.
- Edits and regenerate actions are **disabled** while the surface is mounted (re-use existing props).
- Hover overlays, search highlights, and on-hover buttons in `ChatMessageItem` are not visible because they require user interaction; screenshot captures the resting state only.

### 4.4 State

`useScreenshot` is a small state machine. State is local to the dialog and not stored globally.

```ts
type ScreenshotState =
  | { kind: 'idle' }
  | { kind: 'rendering'; message: string }
  | { kind: 'encoding' }
  | { kind: 'downloading' }
  | { kind: 'done'; filename: string }
  | { kind: 'error'; message: string };
```

The state transitions drive the dialog UI and decide when to unmount the surface. The implementation combines `mounting`/`loadingImages`/`capturing` into a single `rendering` state with a free-form `message` field. Progress counters (e.g., "67%") are not yet shown; the dialog currently displays phase label only. This is suitable for v1; a future iteration can re-introduce per-phase progress if needed.

### 4.5 Filename Convention

```
SillyTavern-<safeCharacterName>-<safeChatFileName|chat>-<YYYYMMDD>-<HHmmss>.<ext>
```

`safeX` strips characters that are unsafe in filenames: `< > : " / \ | ? *` and replaces spaces with `_`. Example:

```
SillyTavern-Alice-Spring_Morning-20260703-102430.png
```

## 5. Library Choice

Use [`modern-screenshot`](https://github.com/qq15725/modern-screenshot) (npm: `modern-screenshot`), not `html2canvas`.

| Library | Maintained | TS first | Modern CSS (oklch, color-mix) | Size |
|---|---|---|---|---|
| `html2canvas` | Stale (last meaningful release 2022) | No | Poor | ~50 KB |
| `html2canvas-pro` | Active fork | Partial | Good | ~80 KB |
| `modern-screenshot` | Active | Yes | Good | ~25 KB |

Reasoning: this project already uses Tailwind utilities and modern CSS; `modern-screenshot` is smaller, TypeScript-first, and handles CORS images more reliably. If a future incompatibility appears, swap is localized to one utility.

API usage in `useScreenshot`:

```ts
import { domToCanvas } from 'modern-screenshot'

const canvas = await domToCanvas(surfaceElement, {
  scale: format === 'png2x' ? 2 : 1,
  backgroundColor: '#111827',
  imageTimeout: 5000,
})
```

## 6. Format Conversion

| User choice | Library call | MIME | Quality |
|---|---|---|---|
| PNG 1x (default) | `domToCanvas(el, { scale: 1 })` then `canvas.toBlob(cb, 'image/png')` | `image/png` | lossless |
| PNG 2x (Retina) | `domToCanvas(el, { scale: 2 })` then `canvas.toBlob(cb, 'image/png')` | `image/png` | lossless |
| JPEG 0.92 | `domToCanvas(el, { scale: 1 })` then `canvas.toBlob(cb, 'image/jpeg', 0.92)` | `image/jpeg` | 0.92 |

PNG 2x produces a 2048px-wide image for a 1024px design surface; on a 400-message chat this is roughly 10–25 MB. We surface a size warning for outputs > 25 MB and suggest JPEG.

## 7. Avatar / Image Preloading

Modern browsers paint `<img>` even when not yet loaded; `modern-screenshot` waits for them up to `imageTimeout` but may still capture broken states. Before calling `domToCanvas` we explicitly wait:

```ts
function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'))
  return Promise.all(
    imgs.map(img =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>(resolve => {
            img.addEventListener('load', () => resolve(), { once: true })
            img.addEventListener('error', () => resolve(), { once: true })
          }),
    ),
  ).then(() => undefined)
}
```

`error` resolves (not rejects) so a broken avatar becomes a styled placeholder rather than blocking the whole screenshot.

## 8. UI / UX

### 8.1 Header Button Placement

In `ChatHeader.tsx`, immediately after the existing export button (currently at line 189-198), add a sibling:

```tsx
<button onClick={onScreenshot} title="长截图对话" className="p-2 ...">
  <CameraIcon />
</button>
```

`onScreenshot` toggles a `screenshotOpen` boolean in `useChat` or in a local `ScreenshotDialog` controlled state in the `Chat.tsx` page.

### 8.2 Format Dropdown

On click of the screenshot icon, a small popover appears beneath the icon:

```
┌──────────────────────┐
│ 📷 长截图对话        │
├──────────────────────┤
│ ● PNG (1x)           │ ← default
│ ○ PNG (2x) 高清      │
│ ○ JPEG 压缩          │
└──────────────────────┘
```

Implemented as a controlled `<div role="menu">`; closes on outside click or `Escape`.

### 8.3 Progress Dialog

While rendering, a centered modal shows the current phase label (no progress count in v1):

```
┌────────────────────────────────────┐
│  生成长截图                         │
│                                    │
│  正在渲染...                        │
│                                    │
│  请勿关闭页面                       │
└────────────────────────────────────┘
```

On success, it briefly flips to:

```
┌────────────────────────────────────┐
│  ✓ 已保存到下载文件夹              │
│  SillyTavern-Alice-...-20260703... │
└────────────────────────────────────┘
```

…then auto-closes after 2 seconds. On error, the dialog shows the error and a `Retry` button.

### 8.4 Accessibility

- Button has `aria-label="长截图对话"`.
- Format options are `<button role="menuitem">` with `aria-checked`.
- Modal uses `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.
- Progress bar has `role="progressbar"` with `aria-valuenow / valuemin / valuemax`.
- Completion / error messages are announced via `aria-live="polite"`.
- Dialog traps focus and closes on `Escape`.

## 9. Error Handling

| Failure | Behavior |
|---|---|
| No character / chat selected | Button is disabled (existing buttons use this pattern) |
| Zero messages in chat | Button is disabled |
| Avatar `<img>` fails to load | Continues with grey placeholder block; logs `console.warn` |
| `domToCanvas` rejects (e.g., tainted canvas from cross-origin image) | Toast + dialog shows error with `Retry` |
| Output blob > 25 MB | Toast warning recommending JPEG; still downloads |
| User closes dialog mid-render | Cancel promise via `AbortController`; unmount surface cleanly |
| Browser blocks download (popup blocker, permissions) | Surface: "下载失败，请检查浏览器下载权限" |

## 10. Testing Strategy

### 10.1 Unit (`vitest`)

| File | Covers |
|---|---|
| `screenshotFilename.test.ts` | Filename building (safe chars, fallback names, format string) |
| `formatChatImage.test.ts` | MIME type, quality param selection by format |
| `useScreenshot.test.ts` | State machine transitions; mocked `domToCanvas` |

### 10.2 Component (`@testing-library/react`)

| File | Covers |
|---|---|
| `ChatScreenshotButton.test.tsx` | Click opens dropdown, Escape closes it, choosing a format invokes onConfirm |
| `ScreenshotDialog.test.tsx` | Renders progress at given %, shows completion message, retries on error |

### 10.3 E2E (`playwright`)

Three scenarios run against a seeded local chat:

| Scenario | Chat length | Format | Assert |
|---|---|---|---|
| Short | 5 messages | PNG 1x | File downloaded; image height ≥ expected; non-zero width |
| Medium | 50 messages | PNG 2x | File downloaded; image is 2048px wide (2x of 1024) |
| Long | 250 messages | JPEG | File downloaded; size ≤ 5 MB |

E2E uses Playwright's `page.waitForEvent('download')` to verify the download happens.

### 10.4 Visual Regression (manual)

For one canonical chat (Alice / Spring Morning), generate PNG 1x and visually compare against a stored baseline. Stored under `frontend/src/features/chats/__snapshots__/alice-spring-morning.png` (committed for local review only; not auto-asserted in CI to avoid flakiness).

## 11. File Manifest

**New files:**
- `frontend/src/features/chats/components/ChatScreenshotButton.tsx`
- `frontend/src/features/chats/components/ScreenshotDialog.tsx`
- `frontend/src/features/chats/components/CanvasSurface.tsx`
- `frontend/src/features/chats/components/__tests__/ChatScreenshotButton.test.tsx`
- `frontend/src/features/chats/components/__tests__/ScreenshotDialog.test.tsx`
- `frontend/src/features/chats/hooks/useScreenshot.ts`
- `frontend/src/features/chats/hooks/__tests__/useScreenshot.test.ts`
- `frontend/src/features/chats/utils/screenshotFilename.ts`
- `frontend/src/features/chats/utils/__tests__/screenshotFilename.test.ts`
- `frontend/src/features/chats/utils/formatChatImage.ts`
- `frontend/src/features/chats/utils/__tests__/formatChatImage.test.ts`
- `frontend/e2e/chat-screenshot.spec.ts`

**Modified files:**
- `frontend/src/features/chats/components/ChatHeader.tsx` — render `ChatScreenshotButton`
- `frontend/src/features/chats/pages/Chat.tsx` — mount `ScreenshotDialog`, pass `chatData`, `character`, `activePersonaName`, `selectedFile`
- `frontend/package.json` — add `modern-screenshot` dependency

**No backend changes**: no files under `src/`, `public/`, or anywhere outside `frontend/`.

## 12. Open Questions / Trade-offs

1. **Where to mount the off-screen surface.** Default: append directly to `document.body` with `position: fixed; left: -100000px`. Alternative: React portal to a top-level div. Either works; choose portal for consistency with existing modals.
2. **Image cap.** If a chat has > 500 messages, do we cap? For v1 we just warn and let the user retry with JPEG. A future iteration could split into A4-sized pages.
3. **Selection of swipes.** Currently screenshots the `swipe_id` of the message being displayed. A future option could let the user screenshot all swipes side-by-side.
4. **i18n.** All user-facing strings live in one new dictionary `frontend/src/i18n/chatScreenshot.json`. English and Simplified Chinese translations are added in this PR; other locales fall back to English.
