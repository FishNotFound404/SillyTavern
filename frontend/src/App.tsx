import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { initCsrfToken } from './api/client'
import Navigation from './components/Navigation'
import Characters from './pages/Characters'
import CharacterDetail from './pages/CharacterDetail'
import CharacterEdit from './pages/CharacterEdit'
import ChatRouter from './pages/ChatRouter'
import Settings from './pages/Settings'
import Personas from './pages/Personas'
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
            <Route path="/character/new" element={<CharacterEdit />} />
            <Route path="/character/:avatar" element={<CharacterDetail />} />
            <Route path="/character/:avatar/edit" element={<CharacterEdit />} />
            <Route path="/chat" element={<ChatRouter />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/personas" element={<Personas />} />
            <Route path="/world-info" element={<WorldInfo />} />
            <Route path="/world-info/:name" element={<WorldInfoEdit />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
