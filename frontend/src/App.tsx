import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { initCsrfToken } from './api/client'
import Navigation from './components/Navigation'
import Characters from './features/characters/pages/Characters'
import CharacterDetail from './features/characters/pages/CharacterDetail'
import CharacterEdit from './features/characters/pages/CharacterEdit'
import ChatRouter from './pages/ChatRouter'
import Groups from './pages/Groups'
import GroupEdit from './pages/GroupEdit'
import Settings from './features/settings/pages/Settings'
import Personas from './features/personas/pages/Personas'
import WorldInfo from './features/world-info/pages/WorldInfo'
import WorldInfoEdit from './features/world-info/pages/WorldInfoEdit'

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
            <Route path="/groups" element={<Groups />} />
            <Route path="/groups/new" element={<GroupEdit />} />
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
