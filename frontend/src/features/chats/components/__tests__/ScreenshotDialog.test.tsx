import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScreenshotDialog, type DialogFormat } from '../ScreenshotDialog'

const noop = () => {}
type Phase = 'idle' | 'rendering' | 'encoding' | 'downloading' | 'done' | 'error'

interface FakeState {
  format: DialogFormat
  setFormat: (f: DialogFormat) => void
  onConfirm: () => void
  onClose: () => void
  running?: boolean
  phase?: Phase
  filename?: string
  error?: string
}

function makeState(overrides: Partial<FakeState> = {}): FakeState {
  return {
    format: 'png1x',
    setFormat: vi.fn() as unknown as (f: DialogFormat) => void,
    onConfirm: vi.fn() as unknown as () => void,
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
    const setFormat = vi.fn() as unknown as (f: DialogFormat) => void
    render(<ScreenshotDialog {...makeState({ setFormat })} />)
    await userEvent.click(screen.getByText(/PNG \(2x\)/))
    expect(setFormat).toHaveBeenCalledWith('png2x')
  })

  it('confirm button calls onConfirm', async () => {
    const onConfirm = vi.fn() as unknown as () => void
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
    expect(screen.getByText(/渲染/)).toBeInTheDocument()
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
