# Roadmap

> Deployment, phased implementation, risk analysis, and open questions.

[← Back to docs](./README.md)

---

## Deployment & Self-Hosting

### Deployment Options

| Method | Complexity | Best For |
|--------|------------|----------|
| **Docker** | ⭐ Easy | Production self-hosting |
| **Single binary** | ⭐ Easy | Minimal servers, Raspberry Pi |
| **From source** | ⭐⭐ Medium | Development, customization |
| **Managed (mino.ink)** | ⭐ Easy | Users who don't want to self-host |

### Docker Compose (Recommended Self-Host)

```yaml
# docker-compose.yml
version: "3.8"
services:
  mino:
    image: ghcr.io/mino-ink/mino-server:latest
    ports:
      - "3000:3000"
    volumes:
      - ./notes:/data/notes       # Your markdown files
      - ./mino-data:/data/db      # SQLite index + config
    environment:
      - MINO_AUTH_MODE=jwt
      - MINO_JWT_SECRET=change-me-in-production
      - MINO_AGENT_ENABLED=true
      - MINO_AGENT_API_KEY=sk-...  # Your LLM API key
    restart: unless-stopped

  # Optional: reverse proxy with automatic HTTPS
  caddy:
    image: caddy:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
```

### One-Line Install

```bash
curl -fsSL https://mino.ink/install.sh | bash
```

This script:
1. Installs Docker if not present
2. Pulls the Mino server image
3. Creates the data directory
4. Starts the server
5. Prints the URL and default credentials

---

## Phased Implementation Roadmap

### Phase 0: Foundation (Weeks 1-2)

- [ ] Set up monorepo structure (pnpm + Turborepo)
- [ ] Create `@mino-ink/shared` package (types, utils)
- [ ] Create `@mino-ink/design-tokens` (CSS variables, Tailwind preset)
- [ ] Set up CI/CD pipeline
- [ ] Write `design-tokens.css` and `tailwind.preset.js`

### Phase 1: Server Core (Weeks 3-5)

- [ ] Bun + Hono server scaffolding
- [ ] File system manager (CRUD on .md files)
- [ ] SQLite index with FTS5
- [ ] REST API for notes, folders, search
- [ ] JWT authentication
- [ ] File watcher for external changes
- [ ] API key authentication
- [ ] OpenAPI spec auto-generation
- [ ] Docker image

### Phase 2: Web App (Weeks 5-8)

- [ ] Next.js app with landing page (from mino.ink design)
- [ ] Authentication flows (login, register, Google OAuth)
- [ ] Workspace layout (sidebar + note list + editor)
- [ ] Markdown editor (CodeMirror 6 or TipTap)
- [ ] File tree with drag-and-drop
- [ ] Command palette (Cmd+K)
- [ ] Theme switching (dark/light)
- [ ] Real-time sync via WebSocket

### Phase 3: AI Agent (Weeks 8-11)

- [ ] Agent runtime with tool system
- [ ] Core tools (search, read, write, edit, move, tree)
- [ ] Context strategy (compact tree, snippets, search-and-replace)
- [ ] Chat panel in web app
- [ ] Auto-organization suggestions
- [ ] Permission model

### Phase 4: MCP & Agent SDK (Weeks 11-12)

- [ ] MCP server package
- [ ] TypeScript SDK for API access
- [ ] Documentation for agent integrations
- [ ] Example: Antigravity skill/MCP for Mino
- [ ] Example: Cursor rules for Mino

### Phase 5: Mobile App (Weeks 12-16)

- [ ] React Native + Expo setup
- [ ] Local SQLite for offline storage
- [ ] Yjs sync engine
- [ ] Note editor (mobile-optimized)
- [ ] File browser
- [ ] Multi-server picker
- [ ] Push notifications

### Phase 6: Plugins (Weeks 16-20)

- [ ] Plugin SDK and registry
- [ ] Web search plugin
- [ ] YouTube transcript plugin
- [ ] Voice notes plugin (Whisper)
- [ ] Email import plugin
- [ ] Obsidian vault import tool

### Phase 7: Polish & Launch (Weeks 20-24)

- [ ] Semantic search (embeddings)
- [ ] End-to-end encryption (optional)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation site
- [ ] Open-source launch (GitHub, Product Hunt, Hacker News)

---

## Risk Analysis & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Scope creep** | Schedule delays | High | Strict phase gates. Each phase has a Definition of Done. |
| **File sync conflicts** | Data loss | Medium | CRDTs (Yjs) guarantee convergence. Soft-delete for safety. |
| **LLM token costs** | User expense | Medium | Aggressive token optimization. Local model support. Usage dashboard. |
| **Security vulnerabilities** | Trust erosion | Medium | Security audit before launch. Bug bounty program. Minimal attack surface. |
| **SQLite scaling limits** | Performance degradation at >100K notes | Low | SQLite handles millions of rows easily. Sharding/partitioning as escape hatch. |
| **Mobile offline complexity** | Bugs, data inconsistency | Medium | Extensive testing. Yjs is battle-tested. Start with read-only offline, add write later. |
| **Plugin ecosystem** | Fragmentation, quality issues | Low | Curated plugin registry. Official plugins first. Community plugins later. |
| **Competing with Obsidian** | Adoption challenges | Medium | Don't compete on features. Compete on AI-native experience. Different audience. |

---

## Open Questions & Decision Log

### Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Server language | TypeScript (Bun) | Code sharing across stack |
| Mobile framework | React Native + Expo | Code sharing with web |
| Primary database | SQLite | Portable, zero-config, fast |
| Data format | Markdown files | No lock-in, agent-compatible |
| Sync protocol | CRDTs (Yjs) | Offline-first, conflict-free |
| CSS framework | Tailwind CSS | Consistent design tokens |
| Component library | shadcn/ui | Accessible, customizable |

### Open Questions for Discussion

1. **Markdown editor choice:** CodeMirror 6 (more control, better for code) vs TipTap (better WYSIWYG, extensions)? Recommendation: **CodeMirror 6** for the developer audience.

2. **Embedding model:** Cloud (OpenAI `text-embedding-3-small`, fast but costs money) vs local (`all-MiniLM-L6-v2`, free but slower)? Recommendation: **Support both**, default to cloud if API key provided.

3. **Monetization for mino.ink hosted service:** Freemium (free up to X notes, pay for more)? Or free with paid AI features? Open question.

4. **Graph view:** Should Mino have an Obsidian-like graph view showing connections between notes? If yes, use D3.js or react-force-graph. Recommendation: **Yes, Phase 3+ feature.**

5. **Collaboration:** Real-time multi-user editing (Google Docs style) vs single-user with sharing? Recommendation: **Start single-user, add collaboration in Phase 7+.**

6. **Server-to-server sync:** Should it be possible to sync notes between two Mino servers? Recommendation: **Yes, via git or rsync. Built-in P2P sync is Phase 8+.**
