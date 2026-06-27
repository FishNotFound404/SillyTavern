# SillyTavern

LLM Frontend for Power Users

## React Frontend Refactor (feat/react-frontend)

This branch adds a modern React + TypeScript + Vite + Tailwind frontend while keeping the original Node.js backend intact.

### Features

- **Character gallery** with AI-generated portraits
- **Character detail** view with description, personality, scenario, and first message
- **Chat interface** with persistent `.jsonl` chat history
- **New chat creation** from the character detail or chat header
- **Backend-proxied LLM calls** via MiniMax OpenAI-compatible API (no API key exposed to the browser)

### Screenshots

#### Character Gallery
![Characters](docs/images/characters.png)

#### Character Detail
![Character Detail](docs/images/character-detail.png)

#### Chat
![Chat](docs/images/chat.png)

#### New Chat
![New Chat](docs/images/new-chat.png)

### Development

```bash
npm install
npm run dev
```

The dev server starts both the legacy backend (`http://127.0.0.1:8000`) and the Vite frontend (`http://localhost:5173`).

### E2E Screenshot Test

```bash
python e2e_screenshot.py
```

This launches a headless browser, runs a smoke test through the main user flows, and refreshes the screenshots under `docs/images/`.

## Resources

- GitHub: <https://github.com/SillyTavern/SillyTavern>
- Docs: <https://docs.sillytavern.app/>
- Discord: <https://discord.gg/sillytavern>
- Reddit: <https://reddit.com/r/SillyTavernAI>

## License

AGPL-3.0
