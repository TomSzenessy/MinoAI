# 🟣 Mino — Mind Notes

<p align="center">
  <strong>Your Mind, Organized. Agent-First.</strong>
</p>

<p align="center">
  <em>An open-source, markdown-based knowledge platform designed for developers who want AI agents to organize their notes for them.</em>
</p>

<p align="center">
  <a href="https://mino.ink">Website</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="MASTER_PLAN.md">Master Plan</a> ·
  <a href="#self-hosting">Self-Hosting</a> ·
  <a href="#api-reference">API</a> ·
  <a href="#contributing">Contributing</a>
</p>

---

## What is Mino?

**Mino** is an open-source notes and knowledge management platform built around three core principles:

1. **Markdown-first** — Your notes are plain `.md` files in a folder tree. No vendor lock-in. No proprietary formats. You always own your data.
2. **Agent-native** — Built from the ground up so AI coding agents (Antigravity, Cursor, Claude Code, etc.) can seamlessly read, write, organize, and maintain your notes via a clean API and MCP tools.
3. **Modular architecture** — The server, web interface, mobile apps, and AI agent are completely independent. Swap, host, or extend any piece without touching the others.

Think of it as **Obsidian meets an AI coding agent**, designed for developers who want their knowledge base to be a living, AI-maintained system rather than a static vault.

## Why Mino?

| Problem | Mino's Answer |
|---------|---------------|
| Notes apps lock you into proprietary formats | Plain markdown files in folders — `git clone` and you're done |
| No native AI agent integration | First-class API + MCP tools purpose-built for coding agents |
| Can't self-host with full control | One-command Docker/binary deploy; point any client to your server |
| Note organization is manual busywork | AI agent auto-organizes, tags, links, and maintains your notes |
| Mobile apps don't work offline | Full offline-first sync with CRDT conflict resolution |

## Architecture

Mino is built as a set of independent, modular services:

```
┌─────────────────────────────────────────────────────┐
│                    INTERFACES                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Web App  │  │ Mobile   │  │  Agent / MCP     │  │
│  │ (mino.ink)│  │ (iOS/    │  │  (Antigravity,   │  │
│  │          │  │  Android) │  │   Cursor, etc.)  │  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│       └──────────────┼─────────────────┘             │
└──────────────────────┼──────────────────────────────┘
                       │  REST / WebSocket / MCP
                       ▼
┌──────────────────────────────────────────────────────┐
│                  MINO SERVER                          │
│  ┌────────┐ ┌──────────┐ ┌───────┐ ┌─────────────┐ │
│  │REST API │ │WebSocket │ │ Auth  │ │  Agent      │ │
│  │        │ │(realtime)│ │(JWT/  │ │  Runtime    │ │
│  │        │ │          │ │OAuth) │ │  (AI brain) │ │
│  └────┬───┘ └────┬─────┘ └───┬───┘ └──────┬──────┘ │
│       └──────────┼───────────┼─────────────┘         │
│                  ▼                                    │
│  ┌──────────────────────────────────────────────┐    │
│  │           FILE SYSTEM + INDEX                 │    │
│  │  📁 Markdown files  │  🔍 SQLite FTS index   │    │
│  │  📁 Folder tree     │  📊 Embedding vectors   │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

> **Key insight:** The server manages the files and exposes the API. Every interface — web, mobile, or AI agent — is just a client. You can swap, duplicate, or skip any client you don't need.

## Quick Start

### Option 1: Use the hosted service (mino.ink)

1. Go to [mino.ink](https://mino.ink)
2. Sign up / sign in
3. Start writing

### Option 2: Self-host

```bash
# Docker (recommended)
docker run -d \
  -p 3000:3000 \
  -v ~/mino-notes:/data \
  ghcr.io/mino-ink/mino-server:latest

# Or from source
git clone https://github.com/mino-ink/mino.git
cd mino/server
cp .env.example .env
bun install
bun run start
```

### Option 3: Connect an AI agent

```bash
# Install the Mino MCP tool for your agent
npx @mino-ink/mcp-server --endpoint https://your-server.com --api-key YOUR_KEY
```

Then in your agent, you can:
- `mino.search("meeting notes from last week")`
- `mino.create("/Projects/Alpha/notes.md", content)`
- `mino.organize()` — let the agent reorganize your vault

## Self-Hosting

Mino is designed to be self-hosted as easily as possible:

| Method | Command | Best for |
|--------|---------|----------|
| **Docker** | `docker run ghcr.io/mino-ink/mino-server` | Production |
| **Binary** | `./mino-server --data ~/notes` | Single machine |
| **From source** | `bun run start` | Development |

Once your server is running, point any Mino client (web, mobile, agent) to it by setting the endpoint URL.

**Multi-server support:** You can run multiple Mino servers managing different note collections and switch between them in any client.

## API Reference

The API is RESTful with optional WebSocket for real-time sync:

```
# Notes
GET    /api/v1/notes                    # List all notes
GET    /api/v1/notes/:path              # Get note by path
POST   /api/v1/notes                    # Create note
PUT    /api/v1/notes/:path              # Update note
DELETE /api/v1/notes/:path              # Delete note
PATCH  /api/v1/notes/:path/move         # Move/rename note

# Search
GET    /api/v1/search?q=...             # Full-text search
POST   /api/v1/search/semantic          # Semantic/embedding search

# Folders
GET    /api/v1/tree                     # Get folder tree
POST   /api/v1/folders                  # Create folder
DELETE /api/v1/folders/:path            # Delete folder

# Agent
POST   /api/v1/agent/chat              # Chat with the AI agent
GET    /api/v1/agent/suggestions        # Get organization suggestions

# Auth
POST   /api/v1/auth/login              # Get JWT token
POST   /api/v1/auth/refresh            # Refresh token
```

> Full OpenAPI spec available at `GET /api/v1/docs`

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Server** | TypeScript + Bun + Hono | Fast, modern, excellent DX |
| **Database** | SQLite (index) + File system (data) | Portable, zero-config, fast |
| **Web App** | Next.js 15 + React + Tailwind CSS | SSR, great ecosystem |
| **Mobile** | React Native + Expo | Cross-platform, offline-first |
| **AI Agent** | LLM API + MCP tools | Model-agnostic, extensible |
| **Search** | SQLite FTS5 + vector embeddings | Fast full-text + semantic search |
| **Auth** | JWT + OAuth 2.0 (Google) | Standard, secure |
| **Sync** | CRDTs (Yjs) | Offline-first conflict resolution |

## Plugins & Integrations

Mino supports plugins for extending the agent's capabilities:

- 🌐 **Web Search** — Search the web and save results as notes
- 📧 **Email Import** — Auto-import emails as notes
- 📺 **YouTube Transcripts** — Save video transcripts
- 🎙️ **Voice Notes** — Speech-to-text note creation
- 🖼️ **Image OCR** — Extract text from images
- 📰 **News & RSS** — Follow feeds and clip articles
- 🐦 **Social Media** — Save tweets/posts as notes

## Contributing

Mino is open-source and community-driven. We welcome contributions!

```bash
git clone https://github.com/mino-ink/mino.git
cd mino
bun install
bun run dev
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT — [LICENSE](LICENSE)

---

<p align="center">
  Built with 💜 for developers who think in markdown.
</p>
