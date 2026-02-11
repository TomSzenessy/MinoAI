/**
 * Config types — Server configuration schema.
 *
 * The config file lives at `/data/config.json` and is auto-generated
 * on first boot. All fields are editable via the web UI.
 */

/** Top-level server configuration. */
export interface ServerConfig {
  server: ServerNetworkConfig;
  auth: AuthConfig;
  agent: AgentConfig;
  search: SearchConfig;
  sync: SyncConfig;
  plugins: PluginConfig;
  resources: ResourceConfig;
}

/** Network / HTTP settings. */
export interface ServerNetworkConfig {
  /** Port to listen on (default: 3000). */
  port: number;
  /** Host to bind to (default: "0.0.0.0"). */
  host: string;
  /**
   * Allowed CORS origins. Supports exact URLs and wildcards.
   * Automatically includes localhost and the built-in UI origin.
   * Example: ["https://mino.ink", "https://test.mino.ink"]
   */
  cors: string[];
}

/** Authentication settings. */
export interface AuthConfig {
  /** Auth mode: "api-key" (default), "jwt", or "none" (development only). */
  mode: "api-key" | "jwt" | "none";
  /**
   * Allowed origins that can connect to this server.
   * Separate from CORS — this controls which frontends can link.
   */
  allowedOrigins: string[];
}

/** AI agent configuration. */
export interface AgentConfig {
  /** Whether the agent runtime is enabled. */
  enabled: boolean;
  /** LLM provider. */
  provider: "anthropic" | "openai" | "google" | "local" | "";
  /** Model identifier. */
  model: string;
  /** LLM API key (set via UI, stored in config, never in git). */
  apiKey: string;
  /** Maximum tokens per request. */
  maxTokensPerRequest: number;
}

/** Search and indexing settings. */
export interface SearchConfig {
  /** Enable full-text search (SQLite FTS5). */
  fts: boolean;
  /** Enable semantic search (embeddings). */
  embeddings: boolean;
  /**
   * Embedding provider: "auto" uses local if resources allow,
   * falls back to cloud if API key provided.
   */
  embeddingProvider: "openai" | "local" | "auto";
}

/** Real-time sync settings. */
export interface SyncConfig {
  /** Enable WebSocket connections for real-time updates. */
  websocket: boolean;
  /** Enable file system watcher for external changes. */
  fileWatcher: boolean;
}

/** Plugin system settings. */
export interface PluginConfig {
  /** List of enabled plugin names. */
  enabled: string[];
  /** Directory where plugins are installed (default: "/data/plugins"). */
  directory: string;
}

/** Resource detection and local AI tool settings. */
export interface ResourceConfig {
  /** Auto-detect system resources on boot. */
  autoDetect: boolean;
  /** Local Whisper: "auto" | "enabled" | "disabled". */
  localWhisper: "auto" | "enabled" | "disabled";
  /** Local OCR: "auto" | "enabled" | "disabled". */
  localOCR: "auto" | "enabled" | "disabled";
  /** Local embeddings: "auto" | "enabled" | "disabled". */
  localEmbeddings: "auto" | "enabled" | "disabled";
}
