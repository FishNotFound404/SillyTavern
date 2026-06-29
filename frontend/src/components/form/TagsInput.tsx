import { useState } from 'react'

interface TagsInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
}

export function TagsInput({ tags, onChange }: TagsInputProps) {
  const [input, setInput] = useState('')

  const addTag = (raw: string) => {
    const tag = raw.trim()
    if (!tag) return
    if (tags.includes(tag)) return
    onChange([...tags, tag])
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(input)
      setInput('')
    } else if (e.key === ',') {
      e.preventDefault()
      addTag(input)
      setInput('')
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
      <div className="flex flex-wrap items-center gap-2 bg-gray-900 rounded-lg border border-gray-700 px-3 py-2 focus-within:border-blue-500">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-900/50 text-blue-200 text-xs rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-blue-300 hover:text-white"
            >
              ×
            </button>
          </span>
        ))}
        <input
          id="character-tags"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            addTag(input)
            setInput('')
          }}
          placeholder={tags.length ? '' : 'Add tags (press Enter)'}
          aria-label="Tags"
          className="flex-1 bg-transparent text-white text-sm focus:outline-none min-w-[120px]"
        />
      </div>
    </div>
  )
}
