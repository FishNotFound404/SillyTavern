import { useSearchParams } from 'react-router-dom'
import Chat from './Chat'
import ChatList from './ChatList'

function ChatRouter() {
  const [searchParams] = useSearchParams()
  const avatar = searchParams.get('avatar')

  if (avatar) {
    return <Chat />
  }

  return <ChatList />
}

export default ChatRouter
