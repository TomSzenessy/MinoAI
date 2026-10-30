# Stack decision

<!-- index: design | Chosen stack and the alternatives that lost | Adding a runtime, framework or storage layer. -->

Status: accepted
Project: Mino
Owner: TomSzenzessy
Date: 2026-10-30

| Layer | Choice | Why | What lost |
| --- | --- | --- | --- |
| Server runtime | Bun + Hono | Fast startup, first-class SQLite and Markdown tooling, one binary to ship in the container | Node + Fastify (heavier image), Go (slower product iteration) |
| Storage | Markdown files + SQLite (FTS5) beside them | The files are the product; the index is rebuildable. A user can leave with `cp -r` | Postgres (operational weight for a single-user server), a document DB (locks notes in) |
| Web client | Next.js static export | Marketing pages, docs renderer and workspace from one codebase; deploys to any static host and is baked into the server image | Vite SPA (worse for the indexable marketing pages) |
| Mobile | Expo / React Native | Shares TypeScript and design tokens with the web client | Native Swift/Kotlin (two more codebases for one maintainer) |
| Sync | Server as hub, client revisions, CRDT merge | Works offline and never silently overwrites; no third-party sync service | Obsidian Sync (paid), Syncthing (file-level conflicts, no agent) |
| Agent | Server-side runtime, BYO key, HTTP + MCP tools | The agent works whether or not a client is open, and outside agents reach the same vault | Client-side LLM calls (key in the browser, no background work) |
| Plugin compatibility | Sandboxed iframe + `obsidian` module shim over the MIT typings | Third-party code runs untrusted, never in the API's origin | Electron sidecar (defeats the self-hosted web model) |
