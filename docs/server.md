# The Mino Server

> Core responsibilities, REST API, MCP tools, and Agent SDK.

[← Back to docs](./README.md)

---

## Core Responsibilities

1. **File Management** — CRUD operations on `.md` files and folders
2. **Indexing** — Maintain SQLite FTS5 index of all note content, titles, tags, links
3. **Search** — Full-text search, tag search, semantic search (embeddings)
4. **Authentication** — JWT tokens, API keys, OAuth proxy
5. **Real-time Sync** — WebSocket connections for live collaboration and sync
6. **Agent Runtime** — Host the AI organizer agent (optional, can be disabled)
7. **Plugin Host** — Load and execute plugins (web search, email import, etc.)

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
// /data/config.json
{
  "server": {
    "port": 3000,
    "host": "0.0.0.0",
    "cors": ["https://mino.ink"]
  },
  "auth": {
    "mode": "jwt",                // "jwt" | "api-key" | "oauth" | "none"
    "jwtSecret": "...",
    "oauthProviders": ["google"]
  },
  "agent": {
    "enabled": true,
    "model": "anthropic/claude-sonnet-4-20250514",
    "apiKey": "...",
    "maxTokensPerRequest": 4096
  },
  "search": {
    "fts": true,
    "embeddings": true,
    "embeddingModel": "text-embedding-3-small"
  },
  "sync": {
    "websocket": true,
    "fileWatcher": true
  },
  "plugins": {
    "enabled": ["web-search", "youtube-transcript"],
    "directory": "./plugins"
  }
}
```

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

### API Endpoints

```yaml
# === NOTES ===
GET    /api/v1/notes                     # List notes (paginated, filterable)
GET    /api/v1/notes/:path               # Get note content + metadata
POST   /api/v1/notes                     # Create a new note
PUT    /api/v1/notes/:path               # Replace entire note content
PATCH  /api/v1/notes/:path               # Partial update (frontmatter, content section)
DELETE /api/v1/notes/:path               # Delete note (soft delete by default)
PATCH  /api/v1/notes/:path/move          # Move/rename note

# === SEARCH ===
GET    /api/v1/search?q=...&limit=...    # Full-text search
POST   /api/v1/search/semantic           # Semantic search (embeddings)

# === FOLDERS ===
GET    /api/v1/tree                      # Get entire folder tree (compacted)
GET    /api/v1/tree/:path                # Get subtree
POST   /api/v1/folders                   # Create folder
DELETE /api/v1/folders/:path             # Delete folder (+ contents)

# === TAGS ===
GET    /api/v1/tags                      # List all tags with counts
GET    /api/v1/tags/:tag/notes           # Get notes with specific tag

# === AGENT ===
POST   /api/v1/agent/chat               # Send message to AI agent
GET    /api/v1/agent/suggestions         # Get organization suggestions
POST   /api/v1/agent/organize            # Trigger auto-organization

# === AUTH ===
POST   /api/v1/auth/login               # Login (email/password)
POST   /api/v1/auth/register            # Register
POST   /api/v1/auth/refresh             # Refresh JWT token
POST   /api/v1/auth/api-keys            # Generate API key
DELETE /api/v1/auth/api-keys/:id        # Revoke API key
GET    /api/v1/auth/oauth/google        # Google OAuth redirect

# === SYSTEM ===
GET    /api/v1/health                    # Health check
GET    /api/v1/stats                     # Server stats (note count, storage)
GET    /api/v1/config                    # Public server config
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
