# The Mino Server

> Core responsibilities, auto-bootstrap, REST API, built-in UI, plugin host, sandbox, and resource detection.

[← Back to docs](./README.md)

---

## Core Responsibilities

1. **File Management** — CRUD operations on `.md` files and folders
2. **Indexing** — Maintain SQLite FTS5 index of all note content, titles, tags, links
3. **Search** — Full-text search, tag search, semantic search (embeddings)
4. **Authentication** — JWT tokens, API keys, server-link credentials
5. **Real-time Sync** — WebSocket connections for live collaboration and sync
6. **Agent Runtime** — Host the AI organizer agent (server-side, with sandbox)
7. **Plugin Host** — Install, load, update, and execute plugins at runtime
8. **Built-in Web UI** — Serve the full mino.ink interface at `/` (static files embedded in Docker image)
9. **Resource Detection** — Auto-detect CPU, RAM, GPU and enable/disable features accordingly

---

## Auto-Bootstrap (Zero Console Setup)

On first boot, the server detects `/data` is empty and bootstraps automatically:

```
First boot sequence:
  1. Detect /data is empty → enter FIRST_RUN mode
  2. Generate Admin API Key (mino_sk_xxxxxxxxxxxx)
  3. Generate Server ID (unique UUID)
  4. Generate JWT signing secret
  5. Write default config.json
  6. Create /data/notes/ folder structure
  7. Initialize SQLite index (mino.db)
  8. Write credentials to /data/credentials.json
  9. Start API + built-in UI
 10. Expose setup API at http://server:3000/api/v1/system/setup
     → JSON response with auth details and generated /link URLs
```

**No wizard. No terminal. No interactive prompts.** The user opens Portainer, deploys, then opens `/api/v1/system/setup` to copy auth details and click generated link URLs.

### Credentials File

```jsonc
// /data/credentials.json (auto-generated on first boot, never overwritten)
{
  "serverId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "adminApiKey": "mino_sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "jwtSecret": "auto-generated-secret",
  "createdAt": "2026-02-11T19:01:28Z",
  "setupComplete": false  // becomes true after first link from mino.ink
}
```

---

## Built-in Web UI

The server bundles the same web interface as mino.ink:

```
http://localhost:3000/           → Full web UI (identical to mino.ink)
http://localhost:3000/link       → Dedicated server-link handler
http://localhost:3000/workspace  → Workspace shell
http://localhost:3000/docs       → Docs explorer (repository `/docs` content)
http://localhost:3000/api/v1/system/setup → First-run setup payload
http://localhost:3000/api/v1/    → REST API
http://localhost:3000/ws         → WebSocket
```

**How it works:** GitHub Actions builds the Next.js frontend as a static export → the static files are COPY'd into the Docker image during the multi-stage build → Hono serves them at `/` as static files.

This means the server is fully self-contained: one Docker container = API + UI + Agent + Plugins. Nothing else needed.

---

## Resource Detection

The server auto-detects available system resources and enables/disables features accordingly:

```typescript
interface ResourceProfile {
  cpu: { cores: number; model: string };
  ram: { totalMB: number; availableMB: number };
  gpu: { available: boolean; name?: string; vramMB?: number };
  disk: { totalGB: number; availableGB: number };
}

// Auto-detected capabilities
interface ServerCapabilities {
  localWhisper: boolean;      // true if RAM > 4GB + model downloaded
  localOCR: boolean;          // true if Tesseract installed
  localEmbeddings: boolean;   // true if RAM > 2GB
  localLLM: boolean;          // true if GPU available + model downloaded
  sandbox: boolean;           // true if Docker-in-Docker available
  maxConcurrentRequests: number;
}
```

| Resource | Feature Enabled |
|----------|-----------------|
| **RAM > 4GB + Whisper model** | Local speech-to-text transcription (free, unlimited) |
| **Tesseract installed** | Local OCR for image text extraction (free) |
| **RAM > 2GB** | Local embedding generation (`all-MiniLM-L6-v2`) |
| **GPU + VRAM > 6GB** | Local LLM inference (Llama, Mistral, etc.) |
| **Docker socket available** | Sandbox container for code execution |

The resource profile is exposed via `GET /api/v1/system/capabilities` so the UI can show what's available and suggest local vs API options.

---

## File Watcher

The server watches the file system for changes (using `fs.watch` or `chokidar`):

```
User edits file via VS Code/git/external editor
  → File watcher detects change
    → Re-index the file in SQLite
      → Broadcast change via WebSocket to connected clients
```

This is critical: notes can be edited OUTSIDE of Mino (in any text editor, via git, via coding agents) and the server stays in sync.

---

## Configuration

```jsonc
// /data/config.json (auto-generated on first boot, editable via UI)
{
  "server": {
    "port": 3000,
    "host": "0.0.0.0",
    "cors": ["https://mino.ink", "http://localhost:3000"]
  },
  "auth": {
    "mode": "api-key",           // "api-key" | "jwt" | "none"
    "allowedOrigins": ["https://mino.ink"]
  },
  "agent": {
    "enabled": true,
    "provider": "anthropic",     // "anthropic" | "openai" | "google" | "local"
    "model": "claude-sonnet-4-20250514",
    "apiKey": "",                // set via UI, never stored in git
    "maxTokensPerRequest": 4096
  },
  "search": {
    "fts": true,
    "embeddings": true,
    "embeddingProvider": "auto"  // "openai" | "local" | "auto" (local if resources allow)
  },
  "sync": {
    "websocket": true,
    "fileWatcher": true
  },
  "plugins": {
    "enabled": ["web-search"],
    "directory": "/data/plugins"
  },
  "resources": {
    "autoDetect": true,           // auto-detect and enable local AI tools
    "localWhisper": "auto",       // "auto" | "enabled" | "disabled"
    "localOCR": "auto",
    "localEmbeddings": "auto"
  }
}
```

All configuration is editable through the web UI (**Settings** page). No need to SSH into the server or edit files manually.

---

## Plugin System

### Plugin Lifecycle (Current Implementation)

The current runtime is manifest-driven and follows the same separation model used by OpenClaw (discovery/install/registry), adapted to Mino:

```
Server startup
  → Discover bundled catalog from src/plugins/builtin/*/plugin.json
  → Read installed manifests from /data/plugins/<id>/manifest.json
  → Build runtime registry (plugins + enabled ids + diagnostics)

Install flow
  → POST /api/v1/plugins/install { id }
  → Write installed manifest to /data/plugins/<id>/manifest.json
  → Plugin is immediately visible in list/runtime endpoints
```

Bundled catalog currently includes:
- `web-search`
- `obsidian-import`
- `youtube-transcript`
- `telegram-bot`
- `whatsapp-bot`

### Plugin API (Current)

```yaml
GET    /api/v1/plugins                  # installed plugin manifests
GET    /api/v1/plugins/catalog          # bundled catalog + installed/enabled flags
GET    /api/v1/plugins/runtime          # runtime registry snapshot
POST   /api/v1/plugins/install          # install from bundled catalog by id
POST   /api/v1/plugins/:id/toggle       # enable/disable installed plugin
PUT    /api/v1/plugins/:id/config       # merge config into manifest
DELETE /api/v1/plugins/:id              # uninstall plugin (remove directory)
```

### Channel API (Current)

Telegram and WhatsApp are implemented as provider adapters with a shared registry:

```yaml
GET    /api/v1/channels                    # list channels
GET    /api/v1/channels/providers          # provider capability metadata
POST   /api/v1/channels                    # create/update channel
POST   /api/v1/channels/:id/toggle         # enable/disable channel
DELETE /api/v1/channels/:id                # delete channel
POST   /api/v1/channels/webhook/:provider  # public webhook ingestion
```

Provider adapters are responsible for:
1. credential sanitization
2. credential validation
3. inbound message extraction for agent handoff

---

## API Design

### Design Principles

1. **RESTful** for CRUD operations
2. **WebSocket** for real-time sync and collaboration
3. **OpenAPI 3.1** spec auto-generated from code (Hono + Zod)
4. **Versioned** — all routes under `/api/v1/`
5. **Consistent error format** — `{ error: { code, message, details } }`
6. **Pagination** — cursor-based for lists
7. **Rate limiting** — per-API-key, configurable

### API Endpoints (Current)

```yaml
# Public
GET    /api/v1/health
GET    /api/v1/system/setup
POST   /api/v1/channels/webhook/:provider

# Auth / setup
POST   /api/v1/auth/verify
POST   /api/v1/auth/link
POST   /api/v1/auth/pair-code/rotate

# System
GET    /api/v1/system/capabilities
GET    /api/v1/system/config

# Notes
GET    /api/v1/notes
GET    /api/v1/notes/:path
POST   /api/v1/notes
PUT    /api/v1/notes/:path
DELETE /api/v1/notes/:path

# Search + folders
GET    /api/v1/search?q=...&limit=...&folder=...
GET    /api/v1/folders/tree
GET    /api/v1/folders/tree/:path

# Agent
GET    /api/v1/agent/status
POST   /api/v1/agent/chat

# Plugins
GET    /api/v1/plugins
GET    /api/v1/plugins/catalog
GET    /api/v1/plugins/runtime
POST   /api/v1/plugins/install
POST   /api/v1/plugins/:id/toggle
PUT    /api/v1/plugins/:id/config
DELETE /api/v1/plugins/:id

# Channels (protected)
GET    /api/v1/channels
GET    /api/v1/channels/providers
POST   /api/v1/channels
POST   /api/v1/channels/:id/toggle
DELETE /api/v1/channels/:id
```

### Note Object Schema

```typescript
interface Note {
  path: string;              // "Projects/Alpha/architecture.md"
  title: string;             // "Architecture"
  content: string;           // Raw markdown content
  frontmatter: Record<string, unknown>;  // YAML frontmatter
  tags: string[];            // ["project", "architecture"]
  links: string[];           // Outgoing links to other notes
  backlinks: string[];       // Notes that link to this one
  wordCount: number;
  createdAt: string;         // ISO 8601
  updatedAt: string;
  checksum: string;          // Content hash for sync
}
```

---

## MCP Tools & Agent SDK

### MCP Server Implementation

The MCP server acts as a bridge between AI coding agents and the Mino API:

```typescript
// @mino-ink/mcp-server
import { McpServer } from '@modelcontextprotocol/sdk/server';

const server = new McpServer({
  name: 'mino',
  version: '1.0.0',
  tools: [
    {
      name: 'mino_search',
      description: 'Search notes by query. Returns snippets, not full content.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          limit: { type: 'number', default: 10 },
          folder: { type: 'string', description: 'Restrict to folder' },
        },
        required: ['query'],
      },
      handler: async ({ query, limit, folder }) => {
        // Call Mino API: GET /api/v1/search?q=...
      },
    },
    // ... more tools
  ],
  resources: [
    {
      uri: 'mino://tree',
      name: 'Mino File Tree',
      description: 'The folder structure of the notes vault',
      handler: async () => {
        // Call Mino API: GET /api/v1/tree
      },
    },
  ],
});
```

### Agent SDK for Custom Integrations

For developers who want to build their own integrations:

```typescript
import { MinoClient } from '@mino-ink/sdk';

const mino = new MinoClient({
  endpoint: 'https://my-mino.com',
  apiKey: 'mino_...',
});

// Search
const results = await mino.search('meeting notes', { limit: 5 });

// Read
const note = await mino.notes.get('Projects/Alpha/notes.md');

// Write
await mino.notes.create('Daily/2026-02-11.md', '# Today\n- Planning Mino');

// Edit (search-and-replace)
await mino.notes.edit('Projects/Alpha/notes.md', {
  find: '## Status: In Progress',
  replace: '## Status: Complete',
});
```
