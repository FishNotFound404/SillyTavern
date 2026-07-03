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