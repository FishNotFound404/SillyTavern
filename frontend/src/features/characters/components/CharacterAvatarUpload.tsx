import { useRef } from 'react'

interface CharacterAvatarUploadProps {
  currentAvatarUrl: string | null
  hasNewFile: boolean
  onFileSelect: (file: File | null) => void
}

export function CharacterAvatarUpload({
  currentAvatarUrl,
  hasNewFile,
  onFileSelect,
}: CharacterAvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files?.[0] || null)
  }

  return (
    <div className="md:w-64 flex flex-col items-center">
      <div className="w-64 h-64 rounded-xl bg-gray-700 overflow-hidden flex items-center justify-center border border-gray-600">
        {currentAvatarUrl ? (
          <img
            src={currentAvatarUrl}
            alt="Avatar preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-gray-400 text-sm">No avatar selected</span>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm font-medium"
      >
        {hasNewFile ? 'Change Avatar' : 'Upload Avatar'}
      </button>
      {hasNewFile && fileInputRef.current?.files?.[0] && (
        <p className="mt-2 text-xs text-gray-400 truncate max-w-full">{fileInputRef.current.files[0].name}</p>
      )}
    </div>
  )
}
