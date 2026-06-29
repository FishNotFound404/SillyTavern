import { useRef, useState } from 'react'
import { apiPostForm } from '../api/client'
import { importCharacterFromUrl } from '../utils/character'
import { TextField } from './form/TextField'

interface CharacterImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImported: (avatar: string) => void
}

const SUPPORTED_EXTENSIONS: Record<string, string> = {
  png: 'png',
  json: 'json',
  yaml: 'yaml',
  yml: 'yml',
  charx: 'charx',
  byaf: 'byaf',
}

type ImportSource = 'file' | 'url'

function detectFileType(fileName: string): string | null {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  return SUPPORTED_EXTENSIONS[ext] || null
}

export default function CharacterImportModal({ isOpen, onClose, onImported }: CharacterImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [source, setSource] = useState<ImportSource>('file')
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const resetState = () => {
    setFile(null)
    setUrl('')
    setError(null)
    setUploading(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null
    setFile(selected)
    setError(null)
  }

  const handleFileUpload = async () => {
    if (!file) return

    const fileType = detectFileType(file.name)
    if (!fileType) {
      setError('Unsupported file format. Please use PNG, JSON, YAML, CHARX, or BYAF.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('avatar', file)
      formData.append('file_type', fileType)

      const result = await apiPostForm<{ file_name?: string; error?: boolean }>('/api/characters/import', formData)

      if (result?.error || !result?.file_name) {
        throw new Error('Import failed. The file may be corrupted or in an unsupported format.')
      }

      onImported(result.file_name)
      resetState()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setUploading(false)
    }
  }

  const handleUrlUpload = async () => {
    const trimmed = url.trim()
    if (!trimmed) {
      setError('Please enter a character URL or UUID.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const fileName = await importCharacterFromUrl(trimmed)
      onImported(fileName)
      resetState()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (uploading) return
    resetState()
    onClose()
  }

  const tabClass = (active: boolean) =>
    `flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active
        ? 'bg-blue-600 text-white'
        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
    }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4">Import Character</h2>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => {
              setSource('file')
              setError(null)
            }}
            className={tabClass(source === 'file')}
          >
            File
          </button>
          <button
            type="button"
            onClick={() => {
              setSource('url')
              setError(null)
            }}
            className={tabClass(source === 'url')}
          >
            URL / UUID
          </button>
        </div>

        {source === 'file' ? (
          <>
            <p className="text-sm text-gray-400 mb-4">
              Import an existing character card. Supported formats: PNG, JSON, YAML, CHARX, BYAF.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.json,.yaml,.yml,.charx,.byaf"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {file ? 'Choose a different file' : 'Choose file'}
            </button>

            {file && (
              <div className="mt-4 text-sm text-gray-300">
                Selected: <span className="text-white font-medium">{file.name}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-4">
              Import a character from a supported URL or UUID. Lorebook URLs are not supported here.
            </p>

            <TextField
              label="Character URL or UUID"
              value={url}
              onChange={setUrl}
              placeholder="https://chub.ai/characters/..., pygmalion UUID, etc."
            />
          </>
        )}

        {error && (
          <div className="mt-4 px-4 py-2 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            className="px-4 py-2 text-gray-300 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={source === 'file' ? handleFileUpload : handleUrlUpload}
            disabled={uploading || (source === 'file' ? !file : !url.trim())}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {uploading ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  )
}
