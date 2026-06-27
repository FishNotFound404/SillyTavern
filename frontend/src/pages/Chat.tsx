import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { GET_MESSAGES, SEND_MESSAGE, CREATE_CONVERSATION } from '../graphql/chat';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';

export default function Chat() {
  const { id: conversationId } = useParams();
  const [isSending, setIsSending] = useState(false);

  const { loading, error, data, refetch } = useQuery(GET_MESSAGES, {
    variables: { conversationId, limit: 100 },
    skip: !conversationId,
  });

  const [sendMessage] = useMutation(SEND_MESSAGE);
  const [createConversation] = useMutation(CREATE_CONVERSATION);

  const handleSend = async (content: string) => {
    setIsSending(true);
    
    try {
      if (!conversationId) {
        // Create new conversation
        const { data: newConv } = await createConversation({
          variables: {
            input: {
              title: content.substring(0, 50),
              model: 'gpt-4',
              provider: 'openai',
            },
          },
        });
        
        if (newConv?.createConversation?.id) {
          // Send message to new conversation
          await sendMessage({
            variables: {
              conversationId: newConv.createConversation.id,
              content,
            },
          });
          
          // Navigate to new conversation
          window.location.href = `/chat/${newConv.createConversation.id}`;
        }
      } else {
        // Send message to existing conversation
        await sendMessage({
          variables: {
            conversationId,
            content,
          },
        });
        
        // Refetch messages
        await refetch();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const messages = data?.messages || [];

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <div className="flex-1 overflow-y-auto p-4">
        {!conversationId ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <h2 className="text-2xl mb-4">Start a New Chat</h2>
              <p>Send a message to begin a conversation</p>
            </div>
          </div>
        ) : loading ? (
          <div className="text-center text-gray-400">Loading messages...</div>
        ) : error ? (
          <div className="text-center text-red-500">Error: {error.message}</div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {messages.map((message: any) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>
      
      <ChatInput onSend={handleSend} disabled={isSending} />
    </div>
  );
}
