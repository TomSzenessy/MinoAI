# AI Agent ("The Organizer")

> The killer feature of Mino — an AI knowledge steward with plugins and integrations.

[← Back to docs](./README.md)

---

## What the Agent Does

The agent is a **knowledge steward**, not a general-purpose chatbot. Its job:

1. **Organize** — Auto-tag, categorize, and file notes into the right folders
2. **Connect** — Find and create links between related notes (like Obsidian's graph view, but automatic)
3. **Summarize** — Create summaries, indexes, and MOC (map of content) notes
4. **Clean** — Find duplicate notes, merge related ones, archive stale ones
5. **Answer** — When asked a question, search through all notes and synthesize an answer
6. **Import** — Process imports (web pages, emails, voice memos) into properly formatted notes

---

## Agent Architecture (from OpenClaw learnings)

```
┌─ Agent Runtime ──────────────────────────────────────────┐
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
│  │  web.search        — search the web (plugin)        │   │
│  │  youtube.transcript— get video transcript (plugin)  │   │
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
| `scope` | Restrict to specific folders | All folders |

---

## Plugins & Integrations

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

### Planned Plugins

| Plugin | Description | Priority |
|--------|-------------|----------|
| **Web Search** | Search the web via Perplexity/Google/DuckDuckGo | P0 |
| **YouTube Transcript** | Import video transcripts as notes | P1 |
| **Email Import** | Import emails (Gmail API) as notes | P1 |
| **Voice Notes** | Speech-to-text via Whisper | P1 |
| **Image OCR** | Extract text from images | P2 |
| **RSS/News** | Follow feeds and clip articles | P2 |
| **Social Media** | Save tweets/posts/threads | P2 |
| **Calendar** | Import calendar events as daily notes | P2 |
| **Git Integration** | Auto-commit note changes to a git repo | P1 |
| **Obsidian Import** | Import existing Obsidian vaults | P0 |

### MCP Integration

Every Mino server can expose its API as an **MCP (Model Context Protocol) server**, so AI agents like Antigravity, Cursor, and Claude Code can directly read/write notes:

```bash
# Start the MCP server
npx @mino-ink/mcp-server \
  --endpoint https://your-server.com \
  --api-key YOUR_KEY
```

The MCP server exposes these tools to any connected agent:

- `mino_search` — Search notes
- `mino_read` — Read a note
- `mino_write` — Create/update a note
- `mino_edit` — Edit part of a note
- `mino_tree` — Get folder structure
- `mino_move` — Move/rename a note
- `mino_delete` — Delete a note
