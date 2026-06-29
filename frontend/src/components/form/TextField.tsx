interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
}

function fieldId(label: string) {
  return label.toLowerCase().replace(/\s+/g, '-')
}

export function TextField({ label, value, onChange, required, placeholder }: TextFieldProps) {
  const id = fieldId(label)
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-900 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
      />
    </div>
  )
}
