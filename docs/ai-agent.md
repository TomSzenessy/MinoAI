# AI Agent ("The Organizer")

> Server-hosted organizer runtime for search/read/create/move workflows, with planned expansion to full LLM-powered orchestration.

[← Back to docs](./README.md)

---

## Current Implementation Snapshot (2026-02-13)

Implemented today in this repo:

- `POST /api/v1/agent/chat` and `GET /api/v1/agent/status`
- Rule-based server-side intent handling (not full external-LLM orchestration yet)
- Core action coverage: search, read (context preview), create, move, tree
- Plugin and channel endpoints are available and can be invoked by server workflows

Planned next:

- External model provider execution path (OpenAI/Anthropic/etc.)
- Richer autonomous organization and summarization loops
- Sandboxed tool execution for advanced plugin actions

---

## Vision (Planned Expansion)

The agent is a **knowledge steward**, not a general-purpose chatbot. It runs **server-side** (never in the browser) for full access to files, plugins, and local AI tools. Its job:

1. **Organize** — Auto-tag, categorize, and file notes into the right folders
2. **Connect** — Find and create links between related notes (like Obsidian's graph view, but automatic)
3. **Summarize** — Create summaries, indexes, and MOC (map of content) notes
4. **Clean** — Find duplicate notes, merge related ones, archive stale ones
5. **Answer** — When asked a question, search through all notes and synthesize an answer
6. **Import** — Process imports (web pages, emails, voice memos) into properly formatted notes
7. **Execute** — Run plugins (web search, transcription, OCR) via the sandbox

---

## Why Server-Hosted

| Reason | Details |
|--------|---------|
| **LLM API keys stay server-side** | No keys leak to the browser |
| **File system access** | Agent reads/writes `.md` files directly — no network overhead |
| **Sandbox / code execution** | Agent can run scripts, install tools, execute plugins in isolation |
| **Multi-channel** | Agent is accessible from web, mobile, CLI, MCP — all through the same server API |
| **Background processing** | Auto-organization, auto-tagging, embedding generation run asynchronously |
| **Local AI tools** | If server has resources, agent can use Whisper, OCR, local embeddings for free |
| **Token efficiency** | Agent queries local SQLite directly (zero network), reads files locally |

---

## Agent Architecture

```
┌─ Agent Runtime (server-side) ────────────────────────────┐
│                                                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │                   LLM (Claude / GPT / etc.)        │   │
│  │  System prompt + context window                    │   │
│  └──────────────────────┬────────────────────────────┘   │
│                          │                                │
│  ┌──────────────────────┴────────────────────────────┐   │
│  │                 TOOL LAYER                          │   │
│  │                                                     │   │
│  │  mino.search      — full-text + semantic search     │   │
│  │  mino.read         — read a specific note           │   │
│  │  mino.write        — create/replace a note          │   │
│  │  mino.edit         — search-and-replace in a note   │   │
│  │  mino.move         — move/rename a note             │   │
│  │  mino.delete       — delete a note (with safeguard) │   │
│  │  mino.tree         — get the folder structure       │   │
│  │  mino.tags         — list/manage tags               │   │
│  │  mino.recent       — get recently modified notes    │   │
│  │  mino.links        — find backlinks / forward links │   │
│  │                                                     │   │
│  │  --- PLUGIN TOOLS (dynamically loaded) ---          │   │
│  │  web.search        — search the web (plugin)        │   │
│  │  youtube.transcript— get video transcript (plugin)  │   │
│  │  whisper.transcribe— speech-to-text (plugin)        │   │
│  │  ocr.extract       — extract text from image        │   │
│  │  email.fetch       — fetch emails (plugin)          │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │                 CONTEXT STRATEGY                    │   │
│  │                                                     │   │
│  │  1. Always inject: folder tree (compacted)          │   │
│  │  2. Always inject: recent notes list (last 10)      │   │
│  │  3. On search: return snippets, not full files      │   │
│  │  4. On read: return full file content               │   │
│  │  5. On edit: use search-and-replace (not full file) │   │
│  │  6. Limit context to ~8K tokens per tool call       │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## Token Efficiency Strategy

| Strategy | Description | Token Savings |
|----------|-------------|---------------|
| **Compact file tree** | Send folder names + file count, not every filename. Expand on demand. | ~80% vs full tree |
| **Snippet search** | Return 200-char snippets around matches, not full files | ~90% vs full files |
| **Search-and-replace edits** | Never send the full file to modify. Use `mino.edit(path, oldText, newText)` | ~95% vs full file |
| **Embeddings pre-filter** | Use vector similarity to find the right 5 notes out of 10,000 before reading them | ~99% vs reading all |
| **Session memory** | Maintain a compact summary of what the agent already knows about the vault | Avoids re-reading |
| **Tool result caching** | Cache file tree and recent search results within a session | ~50% on repeat queries |

---

## How the Agent Should Search

A multi-phase search strategy:

1. **Phase 1: Title + Tag match** — Fast. Search note titles and tags. Costs ~0 tokens (local SQLite query).
2. **Phase 2: Full-text search** — Search note content via FTS5. Return snippets. Costs ~500 tokens.
3. **Phase 3: Semantic search** — If Phase 1+2 don't find it, use embedding similarity. Costs ~200 tokens for the query embedding.
4. **Phase 4: Read** — Only read the full file when the agent is confident it's the right one.

---

## How the Agent Should Modify

```
Agent decision tree for modifications:

1. Small edit (fix typo, add tag, update a line)?
   → Use mino.edit(path, oldText, newText)  ← PREFERRED

2. Add content to existing note?
   → Use mino.edit(path, "<!-- END -->", "new content\n<!-- END -->")

3. Create new note?
   → Use mino.write(path, content)

4. Restructure a note completely?
   → Use mino.write(path, entireNewContent)  ← EXPENSIVE, avoid

5. Delete a note?
   → Use mino.delete(path) — but ALWAYS confirm with user first
   → Unless the agent has explicit "auto-delete" permission
```

---

## File Tree Context Size

The agent always gets a **compacted** file tree:

```
📁 Projects/ (12 files)
  📁 Alpha/ (5 files)
  📁 Beta/ (3 files)
  📁 Archive/ (4 files)
📁 Daily Notes/ (89 files)
📁 References/ (23 files)
📁 Personal/ (7 files)
```

Instead of listing all 131 individual files. The agent can "drill down" by calling `mino.tree("Projects/Alpha")` to see the files in a specific folder.

---

## Agent Permissions Model

| Permission | Description | Default |
|------------|-------------|---------|
| `read` | Read any note | ✅ Enabled |
| `search` | Search across notes | ✅ Enabled |
| `write` | Create new notes | ✅ Enabled |
| `edit` | Modify existing notes | ✅ Enabled |
| `move` | Move/rename notes | ✅ Enabled |
| `delete` | Delete notes | ❌ Disabled (requires explicit enable) |
| `organize` | Auto-organize (batch operations) | ❌ Disabled |
| `plugins` | Use installed plugins | ✅ Enabled |
| `sandbox` | Execute code in sandbox | ❌ Disabled |
| `scope` | Restrict to specific folders | All folders |

---

## Plugin System (One-Click Install)

### Install Flow (from the Web UI)

Inspired by the OpenClaw plugin architecture:

```
User opens Settings → Plugins → Marketplace
  → Browses available plugins (fetched from registry)
    → Clicks "Install" on "whisper-local"
      → POST /api/v1/plugins/install { name: "whisper-local" }
        → Server downloads from npm/@mino-ink scope or GitHub
          → Extracts to /data/plugins/whisper-local/
            → Loads plugin, registers tools with Agent Runtime
              → WebSocket push: "whisper-local installed ✓"
                → Agent immediately has whisper.transcribe tool
                → Works from web, mobile, CLI, MCP — all channels
```

### Plugin Architecture

Plugins extend the agent's capabilities. Each plugin is an npm package that exports tools:

```typescript
// @mino-ink/plugin-web-search/index.ts
import { definePlugin } from '@mino-ink/plugin-sdk';

export default definePlugin({
  name: 'web-search',
  description: 'Search the web and save results as notes',
  tools: [
    {
      name: 'web_search',
      description: 'Search the web for information',
      parameters: {
        query: { type: 'string', description: 'Search query' },
        maxResults: { type: 'number', default: 5 },
      },
      execute: async ({ query, maxResults }) => {
        // ... implementation
      },
    },
  ],
});
```

### Plugin Categories

| Category | Examples | Requires |
|----------|----------|----------|
| **Core** | Web search, YouTube transcript | API key or free API |
| **Local AI** | Whisper transcription, OCR, local embeddings | Server resources (auto-detected) |
| **Import** | Email, RSS, social media, Obsidian vault | API key / OAuth |
| **Export** | Git sync, backup, static site generation | Config |
| **Integrations** | Calendar, task manager, bookmarks | API key / OAuth |

### Planned Plugins

| Plugin | Description | Priority |
|--------|-------------|----------|
| **Web Search** | Search the web via Perplexity/Google/DuckDuckGo | P0 |
| **YouTube Transcript** | Import video transcripts as notes | P1 |
| **Whisper (local)** | Local speech-to-text (if server resources allow) | P1 |
| **Whisper (API)** | Speech-to-text via OpenAI Whisper API | P1 |
| **Image OCR** | Extract text from images (local Tesseract or API) | P2 |
| **Email Import** | Import emails (Gmail API) as notes | P1 |
| **RSS/News** | Follow feeds and clip articles | P2 |
| **Social Media** | Save tweets/posts/threads | P2 |
| **Calendar** | Import calendar events as daily notes | P2 |
| **Git Integration** | Auto-commit note changes to a git repo | P1 |
| **Obsidian Import** | Import existing Obsidian vaults | P0 |

### Agent Setup Flow (via UI)

Everything is configured through the visual interface — no terminal needed:

```
Settings → Agent
  ├─ Provider: [Anthropic ▼] [OpenAI] [Google] [Local]
  ├─ Model: [claude-sonnet-4-20250514 ▼]
  ├─ API Key: [••••••••••••] [Show] [Test Connection]
  ├─ Permissions: [✓ read] [✓ write] [✓ edit] [✗ delete] [✗ organize]
  └─ Status: ● Connected — 3 tools + 2 plugins loaded

Settings → Plugins
  ├─ Installed: web-search ✓, whisper-local ✓
  ├─ [Browse Marketplace]
  └─ Plugin config: whisper-local → Language: [en ▼], Model: [base ▼]
```

---

## MCP Integration

Every Mino server can expose its API as an **MCP (Model Context Protocol) server**, so AI agents like Antigravity, Cursor, and Claude Code can directly read/write notes:

```bash
# From this repository
cd tools/mcp-server
pnpm build

MINO_SERVER_URL="https://test.mino.ink" \
MINO_API_KEY="mino_sk_your_key_here" \
node dist/cli.js
```

The MCP server exposes these tools to any connected agent:

- `mino_search` — Search notes
- `mino_read` — Read a note
- `mino_write` — Create/update a note
- `mino_edit` — Edit part of a note
- `mino_tree` — Get folder structure
- `mino_move` — Move/rename a note
- `mino_delete` — Delete a note

Detailed integration examples:

- [`docs/integrations.md`](./integrations.md)
- [`docs/examples/cursor-rules.md`](./examples/cursor-rules.md)
- [`docs/examples/antigravity-skill.md`](./examples/antigravity-skill.md)
