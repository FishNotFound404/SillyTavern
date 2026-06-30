import { Route } from 'react-router-dom'
import WorldInfo from '../features/world-info/pages/WorldInfo'
import WorldInfoEdit from '../features/world-info/pages/WorldInfoEdit'

export const worldInfoRoutes = (
  <>
    <Route path="/world-info" element={<WorldInfo />} />
    <Route path="/world-info/:name" element={<WorldInfoEdit />} />
  </>
)
