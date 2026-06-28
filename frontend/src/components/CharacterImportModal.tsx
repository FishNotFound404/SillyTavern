import { useRef, useState } from 'react'
import { apiPostForm } from '../api/client'

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

function detectFileType(fileName: string): string | null {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  return SUPPORTED_EXTENSIONS[ext] || null
}

export default function CharacterImportModal({ isOpen, onClose, onImported }: CharacterImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null
    setFile(selected)
    setError(null)
  }

  const handleUpload = async () => {
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
      setFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (uploading) return
    setFile(null)
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4">Import Character</h2>

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
          className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
        >
          {file ? 'Choose a different file' : 'Choose file'}
        </button>

        {file && (
          <div className="mt-4 text-sm text-gray-300">
            Selected: <span className="text-white font-medium">{file.name}</span>
          </div>
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
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {uploading ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  )
}
