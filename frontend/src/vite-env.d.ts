/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MINIMAX_API_KEY: string
  readonly VITE_MINIMAX_BASE_URL: string
  readonly VITE_MINIMAX_MODEL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
