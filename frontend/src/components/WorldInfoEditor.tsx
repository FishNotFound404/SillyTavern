import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { 
  GET_WORLD_INFO_ENTRIES, 
  CREATE_WORLD_INFO_ENTRY, 
  UPDATE_WORLD_INFO_ENTRY, 
  DELETE_WORLD_INFO_ENTRY 
} from '../graphql/characters';

interface WorldInfoEditorProps {
  characterId: string;
}

export default function WorldInfoEditor({ characterId }: WorldInfoEditorProps) {
  const [newEntry, setNewEntry] = useState({
    key: '',
    content: '',
    position: 'before_char',
    enabled: true,
    selective: false,
    secondaryKeys: [] as string[],
    comment: '',
  });

  const { loading, error, data, refetch } = useQuery(GET_WORLD_INFO_ENTRIES, {
    variables: { characterId },
  });

  const [createEntry] = useMutation(CREATE_WORLD_INFO_ENTRY, {
    onCompleted: () => {
      refetch();
      setNewEntry({
        key: '',
        content: '',
        position: 'before_char',
        enabled: true,
        selective: false,
        secondaryKeys: [],
        comment: '',
      });
    },
  });

  const [updateEntry] = useMutation(UPDATE_WORLD_INFO_ENTRY, {
    onCompleted: () => refetch(),
  });

  const [deleteEntry] = useMutation(DELETE_WORLD_INFO_ENTRY, {
    onCompleted: () => refetch(),
  });

  const handleCreate = async () => {
    if (!newEntry.key.trim() || !newEntry.content.trim()) return;
    
    await createEntry({
      variables: {
        characterId,
        input: {
          key: newEntry.key,
          content: newEntry.content,
          position: newEntry.position,
          enabled: newEntry.enabled,
          selective: newEntry.selective,
          secondaryKeys: newEntry.secondaryKeys,
          comment: newEntry.comment || null,
        },
      },
    });
  };

  const handleUpdate = async (id: string, field: string, value: any) => {
    const entry = data?.worldInfoEntries?.find((e: any) => e.id === id);
    if (!entry) return;

    await updateEntry({
      variables: {
        id,
        input: {
          key: field === 'key' ? value : entry.key,
          content: field === 'content' ? value : entry.content,
          position: field === 'position' ? value : entry.position,
          enabled: field === 'enabled' ? value : entry.enabled,
          selective: field === 'selective' ? value : entry.selective,
          secondaryKeys: field === 'secondaryKeys' ? value : entry.secondaryKeys,
          comment: field === 'comment' ? value : entry.comment,
        },
      },
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this world info entry?')) {
      await deleteEntry({ variables: { id } });
    }
  };

  if (loading) return <div className="text-gray-400">Loading world info...</div>;
  if (error) return <div className="text-red-500">Error: {error.message}</div>;

  const entries = data?.worldInfoEntries || [];

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">World Information</h2>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-gray-300 mb-1">Keyword</label>
          <input
            type="text"
            value={newEntry.key}
            onChange={(e) => setNewEntry(prev => ({ ...prev, key: e.target.value }))}
            placeholder="Trigger keyword..."
            className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div>
          <label className="block text-gray-300 mb-1">Content</label>
          <textarea
            value={newEntry.content}
            onChange={(e) => setNewEntry(prev => ({ ...prev, content: e.target.value }))}
            placeholder="World information content..."
            rows={4}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-gray-300 mb-1">Position</label>
            <select
              value={newEntry.position}
              onChange={(e) => setNewEntry(prev => ({ ...prev, position: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="before_char">Before Character</option>
              <option value="after_char">After Character</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={newEntry.enabled}
              onChange={(e) => setNewEntry(prev => ({ ...prev, enabled: e.target.checked }))}
              className="mr-2"
            />
            <label className="text-gray-300">Enabled</label>
          </div>
        </div>
        
        <button
          onClick={handleCreate}
          disabled={!newEntry.key.trim() || !newEntry.content.trim()}
          className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Entry
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Entries ({entries.length})</h3>
        
        {entries.map((entry: any) => (
          <div key={entry.id} className="bg-gray-700 rounded p-4">
            <div className="flex justify-between items-start mb-2">
              <input
                type="text"
                value={entry.key}
                onChange={(e) => handleUpdate(entry.id, 'key', e.target.value)}
                className="font-mono text-sm bg-gray-600 text-white px-2 py-1 rounded"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdate(entry.id, 'enabled', !entry.enabled)}
                  className={`px-2 py-1 rounded text-sm ${
                    entry.enabled ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  {entry.enabled ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="px-2 py-1 bg-red-600 text-white rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
            
            <textarea
              value={entry.content}
              onChange={(e) => handleUpdate(entry.id, 'content', e.target.value)}
              rows={3}
              className="w-full bg-gray-600 text-white rounded p-2 text-sm"
            />
            
            <div className="flex gap-4 mt-2 text-xs text-gray-400">
              <span>Position: {entry.position}</span>
              <span>Order: {entry.orderIndex}</span>
            </div>
          </div>
        ))}
        
        {entries.length === 0 && (
          <div className="text-center py-4 text-gray-400">
            No world info entries yet. Add one above.
          </div>
        )}
      </div>
    </div>
  );
}
