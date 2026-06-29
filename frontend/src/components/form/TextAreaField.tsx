interface TextAreaFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}

function fieldId(label: string) {
  return label.toLowerCase().replace(/\s+/g, '-')
}

export function TextAreaField({ label, value, onChange, rows = 4, placeholder }: TextAreaFieldProps) {
  const id = fieldId(label)
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full bg-gray-900 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none resize-y"
      />
    </div>
  )
}
