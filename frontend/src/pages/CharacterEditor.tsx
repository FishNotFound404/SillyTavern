import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GET_CHARACTER, CREATE_CHARACTER, UPDATE_CHARACTER, EXPORT_CHARACTER } from '../graphql/characters';
import WorldInfoEditor from '../components/WorldInfoEditor';

export default function CharacterEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [form, setForm] = useState({
    name: '',
    description: '',
    personality: '',
    scenario: '',
    firstMessage: '',
    avatarUrl: '',
    isPublic: false,
    tags: [] as string[],
  });

  const [tagInput, setTagInput] = useState('');

  const { loading, error, data } = useQuery(GET_CHARACTER, {
    variables: { id },
    skip: isNew,
  });

  const [createCharacter] = useMutation(CREATE_CHARACTER, {
    onCompleted: (data) => navigate(`/characters/${data.createCharacter.id}`),
  });

  const [updateCharacter] = useMutation(UPDATE_CHARACTER);

  const [exportCharacter] = useMutation(EXPORT_CHARACTER);

  useEffect(() => {
    if (data?.character) {
      const char = data.character;
      setForm({
        name: char.name || '',
        description: char.description || '',
        personality: char.personality || '',
        scenario: char.scenario || '',
        firstMessage: char.firstMessage || '',
        avatarUrl: char.avatarUrl || '',
        isPublic: char.isPublic || false,
        tags: char.tags || [],
      });
    }
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: checked }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleSave = async () => {
    const input = {
      name: form.name,
      description: form.description || null,
      personality: form.personality || null,
      scenario: form.scenario || null,
      firstMessage: form.firstMessage || null,
      avatarUrl: form.avatarUrl || null,
      isPublic: form.isPublic,
      tags: form.tags,
    };

    if (isNew) {
      await createCharacter({ variables: { input } });
    } else {
      await updateCharacter({ variables: { id, input } });
    }
  };

  const handleExport = async () => {
    const { data } = await exportCharacter({ variables: { id } });
    if (data?.exportCharacter) {
      const blob = new Blob([data.exportCharacter], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form.name || 'character'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error.message}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">
          {isNew ? 'Create Character' : 'Edit Character'}
        </h1>
        <div className="space-x-4">
          {!isNew && (
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Export
            </button>
          )}
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-gray-300 mb-2">Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Personality</label>
            <textarea
              name="personality"
              value={form.personality}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Scenario</label>
            <textarea
              name="scenario"
              value={form.scenario}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">First Message</label>
            <textarea
              name="firstMessage"
              value={form.firstMessage}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Avatar URL</label>
            <input
              type="text"
              name="avatarUrl"
              value={form.avatarUrl}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isPublic"
              checked={form.isPublic}
              onChange={handleCheckboxChange}
              className="mr-2"
            />
            <label className="text-gray-300">Public Character</label>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add tag..."
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-700 text-white rounded-full flex items-center"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div>
          {!isNew && id && (
            <WorldInfoEditor characterId={id} />
          )}
        </div>
      </div>
    </div>
  );
}
