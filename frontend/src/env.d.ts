/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_MANAGEMENT_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Runtime environment variables injected by Docker
interface WindowEnv {
  VITE_API_URL?: string;
  VITE_MANAGEMENT_API_URL?: string;
}

interface Window {
  ENV?: WindowEnv;
}
