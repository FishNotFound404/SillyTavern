import { Route } from 'react-router-dom'
import CharacterDetail from '../features/characters/pages/CharacterDetail'
import CharacterEdit from '../features/characters/pages/CharacterEdit'

export const characterRoutes = (
  <>
    <Route path="/character/new" element={<CharacterEdit />} />
    <Route path="/character/:avatar" element={<CharacterDetail />} />
    <Route path="/character/:avatar/edit" element={<CharacterEdit />} />
  </>
)
