import { useEffect, useState } from 'react'

interface Character {
  name: string
  description?: string
}

function App() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/characters/all')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        setCharacters(data || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">SillyTavern React Frontend</h1>
        <p className="text-gray-400 mb-8">
          This is the new React frontend running alongside the legacy Node.js backend.
        </p>

        {loading && <p>Loading characters...</p>}
        {error && <p className="text-red-400">Error: {error}</p>}

        {!loading && !error && (
          <div className="grid gap-4">
            {characters.length === 0 && (
              <p className="text-gray-500">No characters found.</p>
            )}
            {characters.map((char, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-xl font-semibold">{char.name}</h2>
                {char.description && (
                  <p className="text-gray-400 mt-2">{char.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
