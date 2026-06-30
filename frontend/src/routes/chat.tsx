import { Route } from 'react-router-dom'
import ChatRouter from '../features/chats/pages/ChatRouter'

export const chatRoutes = (
  <Route path="/chat" element={<ChatRouter />} />
)