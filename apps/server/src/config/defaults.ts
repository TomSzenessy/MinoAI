/**
 * Config Defaults — Sensible default values for config.json.
 *
 * These defaults are designed to work out-of-the-box for:
 *   - Docker deployment (0.0.0.0 binding, /data paths)
 *   - Local development (localhost CORS)
 *   - mino.ink integration (CORS origins for test + prod)
 *
 * All values are overridable via the config file or environment variables.
 */

import type { ServerConfig } from "@mino-ink/shared";

export const DEFAULT_CONFIG: ServerConfig = {
  server: {
    port: 3000,
    host: "0.0.0.0",
    cors: [
      "https://mino.ink",
      "https://test.mino.ink",
      "http://localhost:3000",
      "http://localhost:5173",   // Vite dev server
    ],
  },
  auth: {
    mode: "api-key",
    allowedOrigins: [
      "https://mino.ink",
      "https://test.mino.ink",
      "http://localhost:3000",
    ],
  },
  connection: {
    mode: "relay",
    relayUrl: "https://relay.mino.ink",
    publicServerUrl: "",
  },
  agent: {
    enabled: false,             // disabled until user configures LLM provider
    provider: "",
    model: "",
    apiKey: "",
    maxTokensPerRequest: 4096,
  },
  search: {
    fts: true,
    embeddings: false,          // disabled until provider configured
    embeddingProvider: "auto",
  },
  sync: {
    websocket: true,
    fileWatcher: true,
  },
  plugins: {
    enabled: [],
    directory: "/data/plugins",
  },
  resources: {
    autoDetect: true,
    localWhisper: "auto",
    localOCR: "auto",
    localEmbeddings: "auto",
  },
};
