import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_CHARACTERS } from '../graphql/characters';

interface CharacterSelectModalProps {
  isOpen: boolean;
  onSelect: (characterId: string) => void;
  onSkip: () => void;
  onClose: () => void;
}

export default function CharacterSelectModal({ isOpen, onSelect, onSkip, onClose }: CharacterSelectModalProps) {
  const [search, setSearch] = useState('');
  const { loading, data } = useQuery(GET_CHARACTERS, {
    variables: { search: search || undefined, limit: 50 },
    skip: !isOpen,
  });

  const characters = data?.characters || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-white text-lg font-semibold">Select Character</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 border-b border-gray-700">
          <input
            type="text"
            placeholder="Search characters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-gray-400">Loading characters...</div>
          ) : characters.length === 0 ? (
            <div className="text-center text-gray-400">
              {search ? 'No characters found' : 'No characters available'}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {characters.map((character: any) => (
                <div
                  key={character.id}
                  onClick={() => onSelect(character.id)}
                  className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
                      {character.avatarUrl ? (
                        <img
                          src={character.avatarUrl}
                          alt={character.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold">
                          {character.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{character.name}</div>
                    </div>
                  </div>
                  {character.description && (
                    <p className="text-gray-300 text-sm line-clamp-2">{character.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-gray-400 hover:text-white"
          >
            跳过
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
