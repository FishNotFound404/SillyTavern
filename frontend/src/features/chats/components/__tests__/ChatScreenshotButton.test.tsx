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