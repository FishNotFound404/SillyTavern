import { useCallback, useState } from 'react'
import { domToCanvas } from 'modern-screenshot'
import { canvasToBlob, extensionForFormat, type ScreenshotFormat } from '../utils/formatChatImage'
import { buildScreenshotFilename } from '../utils/screenshotFilename'

export type ScreenshotState =
  | { kind: 'idle' }
  | { kind: 'rendering'; message: string }
  | { kind: 'encoding' }
  | { kind: 'downloading' }
  | { kind: 'done'; filename: string }
  | { kind: 'error'; message: string }

interface RunInput {
  container: HTMLElement
  format: ScreenshotFormat
  characterName?: string | null
  chatFileName?: string | null
}

function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'))
  const ready = (img: HTMLImageElement) =>
    img.complete || !img.getAttribute('src')

  return Promise.all(
    imgs.map((img) =>
      ready(img)
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

      setState({ kind: 'done', filename })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setState({ kind: 'error', message })
    }
  }, [])

  const reset = useCallback(() => setState({ kind: 'idle' }), [])

  return { state, run, reset }
}
