import { MessageRole } from '../graphql/chat';

interface ChatMessageProps {
  message: {
    id: string;
    role: MessageRole;
    content: string;
    createdAt: string;
  };
  isStreaming?: boolean;
}

export default function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-primary-600 text-white'
            : 'bg-gray-700 text-gray-100'
        }`}
      >
        <div className="text-sm opacity-75 mb-1">
          {isUser ? 'You' : 'Assistant'}
        </div>
        <div className="whitespace-pre-wrap">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
