# Roadmap

> Deployment priorities, phased implementation, risk analysis, and open questions.

[← Back to docs](./README.md)

---

## Deployment & Self-Hosting

### Deployment Options

| Method | Complexity | Best For |
|--------|------------|----------|
| **Docker Compose (Portainer)** | ⭐ Easy | Copy-paste → deploy → running in 10s |
| **Docker CLI** | ⭐ Easy | `docker compose up -d` on any server |
| **Single binary** | ⭐ Easy | Minimal servers, Raspberry Pi, NAS |
| **From source (git clone)** | ⭐⭐ Medium | Development, customization, local UI only |
| **npm / curl** | ⭐⭐ Medium | Quick local install for development |
| **Free tier (mino.ink)** | ⭐ Easy | No self-hosting, limited features |

### Installation Methods

```bash
# Method 1: Docker Compose (recommended — paste into Portainer or run manually)
curl -fsSL https://mino.ink/docker-compose.yml -o docker-compose.yml
docker compose up -d

# Method 2: One-line install script
curl -fsSL https://mino.ink/install.sh | bash

# Method 3: npm global install (for development / local use)
npm install -g @mino-ink/server
mino start

# Method 4: Git clone (for development / running your own UI)
git clone https://github.com/mino-ink/mino.git
cd mino && pnpm install && pnpm dev
```

All methods result in:
1. Server running at `http://localhost:3000`
2. Built-in web UI accessible immediately
3. Credentials auto-generated and exposed via `/api/v1/system/setup`
4. Ready to link with mino.ink or use directly

---

## Phased Implementation Roadmap

### Phase 0: Foundation (Weeks 1-2)

- [ ] Set up monorepo structure (pnpm + Turborepo)
- [ ] Create `@mino-ink/shared` package (types, utils)
- [ ] Create `@mino-ink/design-tokens` (CSS variables, Tailwind preset)
- [ ] Set up CI/CD pipeline (GitHub Actions → GHCR + Cloudflare Pages)
- [ ] Write `design-tokens.css` and `tailwind.preset.js`
- [ ] Create Dockerfile (multi-stage: build web → embed in server)

### Phase 1: Server Core (Weeks 3-5)

- [ ] Bun + Hono server scaffolding
- [ ] Auto-bootstrap on first run (credentials, config, folder structure)
- [ ] File system manager (CRUD on .md files)
- [ ] SQLite index with FTS5
- [ ] REST API for notes, folders, search
- [ ] API key authentication (from auto-generated credentials)
- [ ] Server-link endpoint (`POST /api/v1/auth/link`)
- [ ] File watcher for external changes
- [ ] Resource detection (CPU/RAM/GPU/disk)
- [ ] Plugin loader (discovery, install, load, registry)
- [ ] OpenAPI spec auto-generation
- [ ] Docker image with multi-arch support (amd64 + arm64)
- [ ] Publish to `ghcr.io/tomszenessy/mino-server`

### Phase 2: Web App + Built-in UI (Weeks 5-8)

- [ ] Next.js app with landing page (from mino.ink design)
- [ ] Deploy to Cloudflare Pages (mino.ink)
- [ ] Hybrid auth: Google sign-in + anonymous localStorage mode
- [ ] Server-link page (paste URL + API key, or sign in with Google)
- [ ] Free tier managed instance for non-self-hosters
- [ ] Workspace layout (sidebar + note list + editor)
- [ ] Markdown editor (CodeMirror 6 or TipTap)
- [ ] File tree with drag-and-drop
- [ ] Command palette (Cmd+K)
- [ ] Theme switching (dark/light)
- [ ] Settings UI (agent config, API keys, server info — all visual)
- [ ] Plugin marketplace UI (browse, install, configure)
- [ ] Bundle static export into Docker image (built-in UI)
- [ ] Real-time sync via WebSocket

### Phase 3: AI Agent (Weeks 8-11)

- [ ] Agent runtime with tool system (server-side)
- [ ] Core tools (search, read, write, edit, move, tree)
- [ ] Context strategy (compact tree, snippets, search-and-replace)
- [ ] Chat panel in web app (slide-out)
- [ ] Auto-organization suggestions
- [ ] Permission model (visual config in Settings)
- [ ] Sandbox container for code execution (optional Docker sidecar)

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
- [ ] Mobile auth: Google sign-in or manual server credentials
- [ ] Note editor (mobile-optimized)
- [ ] File browser
- [ ] Multi-server picker (auto-discovered if Google linked)
- [ ] Push notifications

### Phase 6: Plugins (Weeks 16-20)

- [ ] Plugin SDK (`definePlugin()` API)
- [ ] Plugin marketplace / registry
- [ ] One-click install from web UI
- [ ] Resource-aware plugins (auto-detect local capabilities)
- [ ] Web search plugin
- [ ] YouTube transcript plugin
- [ ] Whisper plugin (local + API versions)
- [ ] OCR plugin (local Tesseract + API versions)
- [ ] Email import plugin
- [ ] Obsidian vault import tool

### Phase 7: Infrastructure & Polish (Weeks 20-24)

- [ ] Cloudflare Tunnel sidecar integration + setup UI
- [ ] Watchtower auto-update documentation
- [ ] Semantic search (embeddings — local + cloud)
- [ ] End-to-end encryption (optional)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation site (Mintlify/Starlight)
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
| **Free tier abuse** | Resource costs | Medium | Rate limits, storage caps, require Google sign-in for free tier. |
| **Cloudflare Tunnel reliability** | Remote access downtime | Low | Tunnel auto-reconnects. Fallback to direct access if available. |

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
| **Container registry** | **GitHub Container Registry (ghcr.io)** | No pull limits, native Actions integration, free |
| **Web hosting** | **Cloudflare Pages** | Free, global CDN, static export |
| **Auth model** | **Hybrid (API key + Google OAuth + localStorage)** | No account required, multi-device optional |
| **Server deployment** | **Docker Compose (Portainer-friendly)** | One-paste deploy, auto-bootstrap, zero config |
| **Remote access** | **Cloudflare Tunnel (free, optional)** | Zero ports, encrypted, DDoS protection |
| **Auto-updates** | **Watchtower** | Watches GHCR for new tags, zero-downtime |
| **Agent hosting** | **Server-side** | File access, sandbox, multi-channel, security |
| **Plugin install** | **One-click from web UI** | npm/GitHub download, hot-load, no restart |
| **Free tier** | **Limited managed instance on mino.ink** | No self-hosting needed, upgrade path to self-hosted |

### Open Questions for Discussion

1. **Markdown editor choice:** CodeMirror 6 (more control, better for code) vs TipTap (better WYSIWYG, extensions)? Recommendation: **CodeMirror 6** for the developer audience.

2. **Embedding model:** Cloud (OpenAI `text-embedding-3-small`, fast but costs money) vs local (`all-MiniLM-L6-v2`, free but slower)? Recommendation: **Support both**, default to local if resources allow, cloud if API key provided.

3. **Free tier limits:** What's the right storage cap? 100MB? 1000 notes? How to prevent abuse? Need to define pricing tiers.

4. **Graph view:** Should Mino have an Obsidian-like graph view showing connections between notes? If yes, use D3.js or react-force-graph. Recommendation: **Yes, Phase 3+ feature.**

5. **Collaboration:** Real-time multi-user editing (Google Docs style) vs single-user with sharing? Recommendation: **Start single-user, add collaboration in Phase 7+.**

6. **Server-to-server sync:** Should it be possible to sync notes between two Mino servers? Recommendation: **Yes, via git or rsync. Built-in P2P sync is Phase 8+.**
