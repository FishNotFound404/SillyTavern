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

  const showProgress =
    running && phase !== 'idle' && phase !== 'done' && phase !== 'error'
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
              aria-valuenow={phase === 'downloading' ? 90 : phase === 'encoding' ? 70 : 40}
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