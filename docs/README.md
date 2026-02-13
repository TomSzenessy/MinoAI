# 🟣 Mino — Documentation

> A comprehensive, end-to-end blueprint for building the Mino knowledge platform.

---

## Quick Links

| Document | Contents |
|----------|----------|
| [**Design System**](./design-system.md) | Colors, typography, components, logo usage, glassmorphism effects |
| [**Architecture**](./architecture.md) | Tech stack, three-layer model, deployment, hosting, Docker, CI/CD |
| [**Relay**](./relay.md) | Managed relay design, required env vars, deployment flow, open-port fallback |
| [**Server**](./server.md) | Mino server, auto-bootstrap, REST API, built-in UI, plugins, sandbox |
| [**Frontend**](./frontend.md) | mino.ink (Cloudflare Pages), local UI, mobile apps, hybrid auth |
| [**AI Agent**](./ai-agent.md) | "The Organizer" agent, server-hosted runtime, plugin install, MCP |
| [**Integrations**](./integrations.md) | MCP setup plus Cursor and Antigravity integration examples |
| [**Security**](./security.md) | Hybrid auth, credential flow, Cloudflare Tunnel, security hardening |
| [**Roadmap**](./roadmap.md) | Phased plan, deployment priorities, risk analysis, open questions |

---

## What Mino Is

Mino is an **open-source, markdown-based knowledge platform** where your notes live as plain `.md` files in folder trees, managed by a self-hosted server, accessible through beautiful interfaces (web + mobile), and maintained by AI agents.

### Three Pillars

| Pillar | Meaning |
|--------|---------|
| **Modularity** | Server, web, mobile, agent — all independent. Swap any piece. Run everything locally or split across services. |
| **Agent-Native** | The AI agent is not bolted on — it runs server-side as the primary way power users interact. The API is designed for agents first, humans second. |
| **Open-Source First** | Every component is open-source. Self-hosting is a first-class experience. One Docker Compose = fully running server. |

### Hosting Model

Mino follows a **hybrid hosting model** — the server runs on your infrastructure, and the web UI can come from anywhere:

| Mode | Description | Requires Account? |
|------|-------------|-------------------|
| **mino.ink + self-hosted server** | Use the hosted web UI at mino.ink, link your own server via credentials | Optional (Google sign-in to persist across devices, or just localStorage) |
| **mino.ink free tier** | Use a limited managed server hosted by mino.ink — no self-hosting, no setup | Optional (Google sign-in for persistence) |
| **Fully self-hosted** | Run the Docker image, which includes the full web UI at `http://server:3000` | ❌ No account needed |
| **API / CLI / MCP only** | Talk directly to the server API using generated credentials | ❌ No account needed |

### Target Audience

1. **Primary:** Developers who use AI coding agents (Antigravity, Cursor, Claude Code, Windsurf) and want their knowledge base to be agent-accessible and agent-maintained.
2. **Secondary:** Technical knowledge workers who want a self-hosted, privacy-first alternative to Notion/Obsidian with AI superpowers.
3. **Tertiary:** Teams and organizations wanting a shared knowledge base with AI-powered organization.

### The Key Insight

Most note-taking apps treat AI as a feature. **Mino treats the AI agent as a first-class user.** The API, the file structure, the search capabilities — everything is designed so that an AI agent can efficiently navigate, understand, modify, and organize a vault of thousands of notes with minimal token usage and maximum accuracy.

---

> **This is a living blueprint.** Update individual docs as decisions are made and the project evolves.
>
> Web docs endpoint: `test.mino.ink/docs` renders the repository `/docs` folder only.
> Implementation runbooks remain in `/docstart` for repo-local/operator use.
>
> *Last updated: 2026-02-13*
