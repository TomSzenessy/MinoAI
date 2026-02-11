# Security & Code Quality

> Authentication, security hardening, testing, and CI/CD.

[← Back to docs](./README.md)

---

## Authentication Layers

```
┌─ Request Flow ──────────────────────────────────────────────┐
│                                                              │
│  Client → HTTPS → Rate Limiter → Auth Middleware → Router   │
│                                                              │
│  Auth Methods:                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. JWT Bearer Token (web/mobile sessions)             │   │
│  │ 2. API Key (header: X-Mino-Key, for agents/scripts)  │   │
│  │ 3. OAuth 2.0 (Google, for managed mino.ink service)   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Each auth method resolves to a User + Permission Set        │
└──────────────────────────────────────────────────────────────┘
```

---

## Security Hardening Checklist

| Measure | Implementation |
|---------|---------------|
| **Transport encryption** | HTTPS everywhere (TLS 1.3). No plain HTTP in production. |
| **Authentication** | JWT with short expiry (15min) + refresh tokens (7 days). API keys for machine access. |
| **Authorization** | Role-based: `owner`, `editor`, `viewer`, `agent`. Folder-level permissions. |
| **Input validation** | All inputs validated via Zod schemas. Markdown content sanitized on render (not on store). |
| **Path traversal** | All file paths normalized and validated against the data directory. No `../` escapes. |
| **Rate limiting** | Per-IP and per-API-key rate limits. Configurable. |
| **CORS** | Strict origin allowlist. No `*` in production. |
| **Content Security Policy** | Strict CSP headers on the web app. |
| **Dependency security** | Automated dependency scanning (Dependabot/Renovate). Minimal dependency tree. |
| **Secrets management** | API keys hashed (bcrypt). JWT secrets rotatable. No secrets in git. |
| **Audit logging** | Log all write operations with timestamp, user, and action. |
| **End-to-end encryption** | Optional client-side encryption for sensitive notes (using Web Crypto API). |
| **SQL injection** | Parameterized queries only (enforced by drizzle-orm/Bun SQLite API). |
| **XSS** | Markdown rendered safely via `react-markdown` with sanitization. No `dangerouslySetInnerHTML`. |

### Self-Hosted Security

For self-hosted instances:

1. **Network:** Bind to `127.0.0.1` by default. Use a reverse proxy (Caddy/nginx) for HTTPS.
2. **Firewall:** Only expose port 443 (HTTPS). Everything else behind firewall.
3. **Updates:** Automated update check. One-command updates (`mino update`).
4. **Backups:** Built-in backup command (`mino backup`) that creates a `.tar.gz` of all data.

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
  lint:     # ESLint + Prettier + Oxlint
  typecheck: # tsc --noEmit
  test:     # vitest run
  e2e:      # playwright test
  build:    # Build all packages
  docker:   # Build Docker image
  deploy:   # Deploy to staging (on main)
```
