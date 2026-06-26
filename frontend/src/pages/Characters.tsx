import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { GET_CHARACTERS, DELETE_CHARACTER } from '../graphql/characters';

export default function Characters() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  
  const { loading, error, data, refetch } = useQuery(GET_CHARACTERS, {
    variables: { limit: 20, offset: 0, search: search || undefined },
  });

  const [deleteCharacter] = useMutation(DELETE_CHARACTER, {
    onCompleted: () => refetch(),
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this character?')) {
      await deleteCharacter({ variables: { id } });
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error.message}</div>;

  const characters = data?.characters || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Characters</h1>
        <button
          onClick={() => navigate('/characters/new')}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Create Character
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search characters..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {characters.map((character: any) => (
          <div
            key={character.id}
            className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center mb-4">
              {character.avatarUrl ? (
                <img
                  src={character.avatarUrl}
                  alt={character.name}
                  className="w-12 h-12 rounded-full mr-4"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-600 mr-4 flex items-center justify-center">
                  <span className="text-xl text-white">{character.name[0]}</span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-white">{character.name}</h3>
                <p className="text-sm text-gray-400">
                  {character.tags.length > 0 ? character.tags.join(', ') : 'No tags'}
                </p>
              </div>
            </div>

            {character.description && (
              <p className="text-gray-300 mb-4 line-clamp-3">{character.description}</p>
            )}

            <div className="flex justify-between mt-4">
              <Link
                to={`/characters/${character.id}`}
                className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(character.id)}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {characters.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No characters found. Create your first character!
        </div>
      )}
    </div>
  );
}
