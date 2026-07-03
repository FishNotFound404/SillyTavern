import { describe, it, expect } from 'vitest'
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
