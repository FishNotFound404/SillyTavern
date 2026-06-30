import { Route, Routes } from 'react-router-dom'
import Characters from '../features/characters/pages/Characters'
import { characterRoutes } from './characters'
import { chatRoutes } from './chat'
import { groupRoutes } from './groups'
import { settingsRoutes } from './settings'
import { personaRoutes } from './personas'
import { worldInfoRoutes } from './world-info'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Characters />} />
      {characterRoutes}
      {chatRoutes}
      {groupRoutes}
      {settingsRoutes}
      {personaRoutes}
      {worldInfoRoutes}
    </Routes>
  )
}