# 🟣 Mino — Documentation

> A comprehensive, end-to-end blueprint for building the Mino knowledge platform.

---

## Quick Links

| Document | Contents |
|----------|----------|
| [**Design System**](./design-system.md) | Colors, typography, components, logo usage, glassmorphism effects |
| [**Architecture**](./architecture.md) | Tech stack, three-layer model, data storage, sync strategy |
| [**Server**](./server.md) | Mino server, REST API, MCP tools, Agent SDK |
| [**Frontend**](./frontend.md) | Web app (mino.ink) and mobile apps (iOS & Android) |
| [**AI Agent**](./ai-agent.md) | "The Organizer" agent, plugins, integrations, token strategy |
| [**Security**](./security.md) | Authentication, security hardening, code quality, CI/CD |
| [**Roadmap**](./roadmap.md) | Phased plan, deployment, risk analysis, open questions |

---

## What Mino Is

Mino is an **open-source, markdown-based knowledge platform** where your notes live as plain `.md` files in folder trees, managed by a server, accessible through beautiful interfaces, and maintained by AI agents.

### Three Pillars

| Pillar | Meaning |
|--------|---------|
| **Modularity** | Server, web, mobile, agent — all independent. Swap any piece. |
| **Agent-Native** | The AI coding agent is not bolted on — it's the primary way power users interact. The API is designed for agents first, humans second. |
| **Open-Source First** | Every component is open-source. Documentation is a first-class product. Self-hosting is trivially easy. |

### Target Audience

1. **Primary:** Developers who use AI coding agents (Antigravity, Cursor, Claude Code, Windsurf) and want their knowledge base to be agent-accessible and agent-maintained.
2. **Secondary:** Technical knowledge workers who want a self-hosted, privacy-first alternative to Notion/Obsidian with AI superpowers.
3. **Tertiary:** Teams and organizations wanting a shared knowledge base with AI-powered organization.

### The Key Insight

Most note-taking apps treat AI as a feature. **Mino treats the AI agent as a first-class user.** The API, the file structure, the search capabilities — everything is designed so that an AI agent can efficiently navigate, understand, modify, and organize a vault of thousands of notes with minimal token usage and maximum accuracy.

---

> **This is a living blueprint.** Update individual docs as decisions are made and the project evolves.
>
> *Last updated: 2026-02-11*
