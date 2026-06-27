import { useState, useEffect } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { useParams, useNavigate } from 'react-router-dom';
import { GET_MESSAGES, SEND_MESSAGE, CREATE_CONVERSATION, MESSAGE_STREAM } from '../graphql/chat';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import ConversationSidebar from '../components/ConversationSidebar';

export default function Chat() {
  const { id: conversationId } = useParams();
  const navigate = useNavigate();
  const [isSending, setIsSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [localMessages, setLocalMessages] = useState<any[]>([]);

  const { loading, error, data, refetch } = useQuery(GET_MESSAGES, {
    variables: { conversationId, limit: 100 },
    skip: !conversationId,
  });

  const [sendMessage] = useMutation(SEND_MESSAGE);
  const [createConversation] = useMutation(CREATE_CONVERSATION);

  const { data: streamData } = useSubscription(MESSAGE_STREAM, {
    variables: { conversationId },
    skip: !conversationId || !isSending,
  });

  useEffect(() => {
    if (streamData?.messageStream) {
      const { chunk, done, message } = streamData.messageStream;
      
      if (done) {
        setStreamingContent('');
        setIsSending(false);
        refetch();
      } else if (chunk) {
        setStreamingContent(prev => prev + chunk);
      }
    }
  }, [streamData, refetch]);

  useEffect(() => {
    if (data?.messages) {
      setLocalMessages(data.messages);
    }
  }, [data]);

  const handleSend = async (content: string) => {
    setIsSending(true);
    setStreamingContent('');
    
    const userMessage = {
      id: 'temp-user',
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setLocalMessages(prev => [...prev, userMessage]);

    try {
      if (!conversationId) {
        const { data: newConv } = await createConversation({
          variables: {
            input: {
              title: content.substring(0, 50),
              model: 'MiniMax-M3',
              provider: 'openai',
            },
          },
        });
        
        if (newConv?.createConversation?.id) {
          await sendMessage({
            variables: {
              conversationId: newConv.createConversation.id,
              content,
            },
          });
          
          navigate(`/chat/${newConv.createConversation.id}`, { replace: true });
        }
      } else {
        await sendMessage({
          variables: {
            conversationId,
            content,
          },
        });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setIsSending(false);
    }
  };

  const messages = localMessages;
  const assistantMessage = streamingContent
    ? {
        id: 'streaming',
        role: 'assistant' as const,
        content: streamingContent,
        createdAt: new Date().toISOString(),
      }
    : null;

  return (
    <div className="flex h-screen bg-gray-900">
      <ConversationSidebar
        selectedId={conversationId}
        onSelect={(id) => navigate(`/chat/${id}`)}
        onNew={() => navigate('/chat')}
      />
      
      <div className="flex-1 flex flex-col">
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
              {assistantMessage && (
                <ChatMessage message={assistantMessage} isStreaming={true} />
              )}
            </div>
          )}
        </div>
        
        <ChatInput onSend={handleSend} disabled={isSending} />
      </div>
    </div>
  );
}