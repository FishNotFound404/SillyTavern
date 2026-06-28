import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { initCsrfToken } from './api/client'
import Navigation from './components/Navigation'
import Characters from './pages/Characters'
import CharacterDetail from './pages/CharacterDetail'
import Chat from './pages/Chat'
import Settings from './pages/Settings'
import WorldInfo from './pages/WorldInfo'
import WorldInfoEdit from './pages/WorldInfoEdit'

function App() {
  useEffect(() => {
    initCsrfToken()
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<Characters />} />
            <Route path="/character/:avatar" element={<CharacterDetail />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/world-info" element={<WorldInfo />} />
            <Route path="/world-info/:name" element={<WorldInfoEdit />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
