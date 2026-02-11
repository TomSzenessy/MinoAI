# Security & Code Quality

> Hybrid authentication, credential flow, Cloudflare Tunnel, security hardening, testing, and CI/CD.

[← Back to docs](./README.md)

---

## Hybrid Authentication Model

Mino uses a three-tier auth model — **no account is ever required**:

```
┌─ Auth Decision Flow ────────────────────────────────────────┐
│                                                              │
│  User accesses mino.ink or localhost:3000                    │
│    │                                                         │
│    ├─ Has Google account linked?                             │
│    │   YES → auto-discover linked servers → JWT session      │
│    │                                                         │
│    ├─ Has server credentials in localStorage?                │
│    │   YES → connect directly → API key auth                 │
│    │                                                         │
│    └─ Neither?                                               │
│        → Show server-link page (paste URL + API key)         │
│        → OR sign in with Google for convenience              │
│        → OR use the free managed instance                    │
│                                                              │
│  Auth Methods by Context:                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. API Key (header: X-Mino-Key)                       │   │
│  │    → Machine access, CLI, MCP, scripts                 │   │
│  │    → Generated on server first boot                    │   │
│  │                                                        │   │
│  │ 2. JWT Bearer Token                                    │   │
│  │    → Web/mobile sessions after credential exchange     │   │
│  │    → Short-lived (15min) + refresh tokens (7 days)     │   │
│  │                                                        │   │
│  │ 3. Google OAuth (mino.ink only)                        │   │
│  │    → Links server credentials to Google account        │   │
│  │    → Enables multi-device server discovery             │   │
│  │    → Google never sees or stores notes                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Each auth method resolves to a User + Permission Set        │
└──────────────────────────────────────────────────────────────┘
```

### Server-Link Credential Flow

```
1. Deploy Docker → server auto-bootstraps
2. Server generates: API Key + Server ID + JWT Secret
3. Credentials shown at http://server:3000/setup
   (visual card + QR code + copy button)

4. User goes to mino.ink (or localhost:3000)
5. Enters Server URL + API Key
   → Option A: stored in localStorage (no account needed)
   → Option B: linked to Google account (multi-device sync)

6. mino.ink calls POST /api/v1/auth/link
   { serverUrl, apiKey }
   → Server validates → returns JWT session token
   → Server marks setupComplete: true

7. All subsequent requests use JWT
   → Auto-refreshed via refresh token
   → If JWT expires and refresh fails → re-enter API key
```

### What Google Sign-In Stores

| Stored in Google Account | NOT stored |
|--------------------------|------------|
| List of linked server URLs | Notes content |
| Server names ("Personal", "Work") | API keys (encrypted at rest) |
| Last used server | File system data |
| User preferences (theme, etc.) | LLM API keys |

---

## Cloudflare Tunnel (Secure Remote Access)

For servers behind NAT / closed ports, Cloudflare Tunnel provides **free, zero-port-exposure** remote access:

```
┌─ Your Network ──────────────────────────────────────────────┐
│                                                              │
│  ┌─ mino-server ─┐  ┌─ cloudflared ──────────────────────┐ │
│  │  :3000         │  │  Outbound-only connection           │ │
│  │  (no exposed   │──│  to Cloudflare edge                 │ │
│  │   ports)       │  │  TLS 1.3 encrypted                  │ │
│  └────────────────┘  └──────────┬────────────────────────┘ │
│                                  │                           │
│  NO INBOUND PORTS OPEN           │ outbound :443 only        │
└──────────────────────────────────┼───────────────────────────┘
                                   │
                                   ▼
┌─ Cloudflare Edge ────────────────────────────────────────────┐
│  https://your-mino.cfargotunnel.com                          │
│  → Proxied to your mino-server via the persistent tunnel     │
│  → DDoS protection, rate limiting, WAF included (free)       │
└──────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─ mino.ink (browser) ────────────────────────────────────────┐
│  API calls → https://your-mino.cfargotunnel.com/api/v1/     │
└──────────────────────────────────────────────────────────────┘
```

**Setup (via UI):**
1. User creates a free Cloudflare Tunnel in their dashboard
2. Gets a tunnel token
3. Adds it to docker-compose: `CF_TUNNEL_TOKEN=xxx`
4. Starts `cloudflared` sidecar with `--profile tunnel`
5. Server is accessible at `https://slug.cfargotunnel.com`

**Security properties:**
- Zero inbound ports — only outbound connections
- Traffic encrypted end-to-end (TLS 1.3)
- Cloudflare's WAF and DDoS protection (free tier)
- No IP address exposure
- Token-revocable — delete the tunnel = instant cutoff

---

## Security Hardening Checklist

| Measure | Implementation |
|---------|---------------|
| **Transport encryption** | HTTPS everywhere (TLS 1.3). No plain HTTP in production. Cloudflare Tunnel for zero-port exposure. |
| **Authentication** | API keys (server-generated, bcrypt-hashed). JWT with short expiry (15min) + refresh tokens (7 days). |
| **Authorization** | Role-based: `owner`, `editor`, `viewer`, `agent`. Folder-level permissions. |
| **Input validation** | All inputs validated via Zod schemas. Markdown content sanitized on render (not on store). |
| **Path traversal** | All file paths normalized and validated against the data directory. No `../` escapes. |
| **Rate limiting** | Per-IP and per-API-key rate limits. Configurable. |
| **CORS** | Strict origin allowlist (`mino.ink` + `localhost`). No `*` in production. |
| **Content Security Policy** | Strict CSP headers on the web app. |
| **Dependency security** | Automated dependency scanning (Dependabot/Renovate). Minimal dependency tree. |
| **Secrets management** | API keys hashed (bcrypt). JWT secrets auto-generated per server. No secrets in git. Credentials in `/data/credentials.json`. |
| **Audit logging** | Log all write operations with timestamp, user, and action. |
| **End-to-end encryption** | Optional client-side encryption for sensitive notes (using Web Crypto API). |
| **SQL injection** | Parameterized queries only (enforced by drizzle-orm/Bun SQLite API). |
| **XSS** | Markdown rendered safely via `react-markdown` with sanitization. No `dangerouslySetInnerHTML`. |
| **Plugin sandboxing** | Plugins run in isolated contexts. No access to server filesystem outside `/data/plugins/`. |
| **Credential isolation** | Google account stores only server URLs (encrypted). Notes and API keys never leave the server. |

### Self-Hosted Security

For self-hosted instances:

1. **Network:** Bind to `127.0.0.1` by default. Use Cloudflare Tunnel (recommended) or a reverse proxy (Caddy/nginx) for HTTPS.
2. **Firewall:** Zero exposed ports with Cloudflare Tunnel. Or expose only port 443 (HTTPS) if using a reverse proxy.
3. **Updates:** Watchtower auto-pulls new images from GHCR. One-step updates.
4. **Backups:** Built-in backup command or just `tar -czf backup.tar.gz /data` — it's all files + one SQLite DB.
5. **Credentials:** Auto-generated on first boot. Stored in `/data/credentials.json`. Server never needs manual secret configuration.

---

## Code Organization & Quality

### Consistency Guarantees

| Mechanism | Purpose |
|-----------|---------|
| **Shared types package** | `@mino-ink/shared` — all TypeScript interfaces shared between server, web, and mobile |
| **Shared API client** | Type-safe API client generated from OpenAPI spec, used by all clients |
| **Design tokens** | Single source of truth for colors, spacing, typography in `@mino-ink/design-tokens` |
| **Component library** | Shared React components in `@mino-ink/ui` |
| **Linting** | ESLint + Prettier + Oxlint with strict rules |
| **Formatting** | Automated via Prettier (enforced in CI) |

### DRY & Modular Code Practices

1. **No duplicate logic:** All markdown parsing, API calls, and validation logic lives in shared packages.
2. **Composable services:** The server uses a dependency injection pattern — services are composable and testable.
3. **Feature modules:** Each feature (notes, search, agent, plugins) is a self-contained module with its own routes, services, and tests.
4. **No God files:** Maximum 500 LOC per file. Split into focused modules.

---

## Testing Strategy

| Layer | Tool | What's Tested |
|-------|------|---------------|
| **Unit** | Vitest | Service logic, utilities, validation, markdown parsing |
| **Integration** | Vitest + Supertest | API endpoints, database operations, file operations |
| **E2E** | Playwright | Full user flows in the web app |
| **Mobile E2E** | Detox (or Maestro) | Full user flows in the mobile app |
| **Contract** | OpenAPI validator | API responses match the spec |
| **Performance** | k6 | API throughput, search latency |

---

## CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]

jobs:
  lint:       # ESLint + Prettier + Oxlint
  typecheck:  # tsc --noEmit
  test:       # vitest run
  e2e:        # playwright test
  build:      # Build all packages

  docker:
    # Build multi-arch Docker image (amd64 + arm64)
    # Embed Next.js static export into server image
    # Push to ghcr.io/mino-ink/server:latest + :vX.Y.Z

  deploy-web:
    # Cloudflare Pages auto-deploy (mino.ink frontend)

# Users: Watchtower on their server auto-pulls new images
```

**Total cost: $0** — GHCR free for public images, GitHub Actions free for open-source, Cloudflare Pages free tier.
