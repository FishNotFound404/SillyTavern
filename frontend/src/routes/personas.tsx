import { Route } from 'react-router-dom'
import Personas from '../features/personas/pages/Personas'

export const personaRoutes = (
  <Route path="/personas" element={<Personas />} />
)