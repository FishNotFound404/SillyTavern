import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_CONVERSATIONS, DELETE_CONVERSATION } from '../graphql/chat';
import CharacterSelectModal from './CharacterSelectModal';

interface ConversationSidebarProps {
  selectedId?: string;
  onSelect: (id: string) => void;
  onNew: (characterId?: string) => void;
}

export default function ConversationSidebar({ selectedId, onSelect, onNew }: ConversationSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { loading, data, refetch } = useQuery(GET_CONVERSATIONS);
  const [deleteConversation] = useMutation(DELETE_CONVERSATION);

  const conversations = data?.conversations || [];

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      await deleteConversation({ variables: { id } });
      await refetch();
      if (selectedId === id) {
        onNew();
      }
    }
  };

  const handleSelectCharacter = (characterId: string) => {
    setShowModal(false);
    onNew(characterId);
  };

  const handleSkipCharacter = () => {
    setShowModal(false);
    onNew();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 86400000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 text-gray-400 hover:text-white"
          title="Expand sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-white font-semibold">Conversations</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
              title="New conversation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
              title="Collapse sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-gray-400">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-gray-400 text-center">
              No conversations yet
            </div>
          ) : (
            conversations.map((conv: any) => (
              <div
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`p-3 cursor-pointer hover:bg-gray-700 flex justify-between items-start ${
                  selectedId === conv.id ? 'bg-gray-700' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-white truncate">
                    {conv.title || 'Untitled'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatDate(conv.updatedAt)}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(conv.id, e)}
                  className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <CharacterSelectModal
        isOpen={showModal}
        onSelect={handleSelectCharacter}
        onSkip={handleSkipCharacter}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
