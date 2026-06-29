# SillyTavern

LLM Frontend for Power Users

## React Frontend Refactor (feat/react-frontend)

This branch adds a modern React + TypeScript + Vite + Tailwind frontend while keeping the original Node.js backend intact.

### Features

- **Character gallery** with AI-generated portraits
- **Character creation, editing, import & export** — build, edit, import and export PNG/JSON character cards from the React UI
- **Character detail** view with description, personality, scenario, and first message
- **Chat interface** with persistent `.jsonl` chat history, token-by-token streaming, and in-chat message search with highlight and jump
- **Group chat** — create groups of characters, chat with multiple personas in a single room, trigger member replies, and search messages
- **New chat creation** from the character detail or chat header
- **World Info / Lorebook editor** for managing character-associated knowledge
- **Persona management** with name and avatar selection
- **Connection settings & API keys** — choose provider/model and store keys server-side
- **Model list auto-fetch** — settings page loads available models from OpenAI, Google, OpenRouter, DeepSeek and MiniMax after an API key is saved
- **Backend-proxied LLM calls** via OpenAI-compatible API (no API key exposed to the browser)

### Screenshots

#### Character Gallery
![Characters](docs/images/characters.png)

#### Character Detail
![Character Detail](docs/images/character-detail.png)

#### Chat
![Chat](docs/images/chat.png)

#### Chat Search
![Chat Search](docs/images/chat-search.png)

#### New Chat
![New Chat](docs/images/new-chat.png)

#### Settings
![Settings](docs/images/settings.png)

#### Model Selection
![Model Selection](docs/images/settings-models.png)

#### Create Character
![Create Character](docs/images/character-create.png)

#### Edit Character
![Edit Character](docs/images/character-edit-updated.png)

#### Import Character
![Import Character](docs/images/character-import.png)

#### Export Character
![Export Character](docs/images/character-detail-export.png)

#### Chat List
![Chat List](docs/images/chat-list.png)

#### Group Chat
![Group Chat](docs/images/group_chat.png)

### Development

```bash
npm install
npm run dev
```

The dev server starts both the legacy backend (`http://127.0.0.1:8000`) and the Vite frontend (`http://localhost:5173`).

### E2E Screenshot Tests

```bash
python e2e_screenshot.py
python e2e_character_editor.py
python e2e_character_import.py
python e2e_character_export.py
python e2e_group_chat.py
python e2e_settings_models.py
python e2e_chat_search.py
python e2e_chat_swipes.py
```

These launch a headless browser, run smoke tests through the main user flows, and refresh the screenshots under `docs/images/`.

## Resources

- GitHub: <https://github.com/SillyTavern/SillyTavern>
- Docs: <https://docs.sillytavern.app/>
- Discord: <https://discord.gg/sillytavern>
- Reddit: <https://reddit.com/r/SillyTavernAI>

## License

AGPL-3.0
