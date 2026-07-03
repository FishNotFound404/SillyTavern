import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useScreenshot } from '../useScreenshot'

vi.mock('modern-screenshot', () => ({
  domToCanvas: vi.fn(async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 8
    canvas.height = 8
    return canvas
  }),
}))

vi.mock('../../utils/formatChatImage', async () => {
  const actual = await vi.importActual<typeof import('../../utils/formatChatImage')>(
    '../../utils/formatChatImage',
  )
  return {
    ...actual,
    canvasToBlob: vi.fn(async () => new Blob(['x'], { type: 'image/png' })),
  }
})

describe('useScreenshot', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob:fake')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
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

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
    expect(appendSpy).toHaveBeenCalled()
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
