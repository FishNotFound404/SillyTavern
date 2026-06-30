import { useSearchParams } from 'react-router-dom'
import Chat from './Chat'
import ChatList from './ChatList'
import GroupChat from '../../groups/pages/GroupChat'

function ChatRouter() {
  const [searchParams] = useSearchParams()
  const avatar = searchParams.get('avatar')
  const group = searchParams.get('group')

  if (avatar) {
    return <Chat />
  }

  if (group) {
    return <GroupChat />
  }

  return <ChatList />
}

export default ChatRouter
