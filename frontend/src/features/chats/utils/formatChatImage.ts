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
