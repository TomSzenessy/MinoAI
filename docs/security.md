# Security & Code Quality

> Current security model and hardening posture for this repository.

[← Back to docs](./README.md)

---

## Authentication (Current)

Mino currently uses API-key authentication for protected endpoints.

- Header: `X-Mino-Key`
- Public endpoints:
  - `GET /api/v1/health`
  - `GET /api/v1/system/setup`
  - `POST /api/v1/channels/webhook/:provider`
- Protected endpoints: all other `/api/v1/*` routes

Current middleware behavior:

1. If `X-Mino-Key` is present, it is validated with constant-time comparison.
2. If `Authorization: Bearer ...` is present, server returns `401` with “JWT authentication not yet supported”.
3. If no credentials are provided, server returns `401`.

Planned:

- JWT session auth for browser/mobile convenience.
- Account-backed linked profile sync across devices.

---

## Bootstrap Credential Flow

On first boot, server generates and persists:

- `serverId`
- `adminApiKey`
- `jwtSecret` (reserved for future JWT auth)
- `relaySecret`
- `relayPairCode`

Stored in:

- `/data/credentials.json` (with best-effort restrictive chmod in Unix environments)

Setup endpoint:

- `GET /api/v1/system/setup`

Behavior:

- Before setup completion, full API key is returned.
- After `POST /api/v1/auth/link`, setup is marked complete and API key is redacted in setup responses.

---

## Network Security Model

### Relay Mode (Default)

- `MINO_CONNECTION_MODE=relay`
- Server keeps outbound connection to relay service.
- Browser/mobile can connect via relay pairing code exchange.
- No mandatory inbound port exposure for the common flow.

### Open-Port Mode (Optional)

- `MINO_CONNECTION_MODE=open-port`
- Direct browser/client access to server URL with API key.
- Should be deployed behind HTTPS reverse proxy or tunnel.

### Tunnel (Optional)

Cloudflare Tunnel sidecar is supported in deployment docs as an optional zero-port-exposure pattern.

---

## Hardening Checklist (Current)

| Area | Current State |
|------|---------------|
| **Transport** | HTTPS recommended for all remote connections; relay URLs should be HTTPS |
| **Auth** | API key required for protected routes (`X-Mino-Key`) |
| **Rate limiting** | API rate-limit middleware in server + per-endpoint/IP limits in relay |
| **CORS** | Configurable allowlist defaults include mino/test/local origins |
| **Path safety** | Static file serving sanitizes/normalizes paths to block traversal |
| **Secrets in repo** | Credentials generated at runtime and stored under `/data`, not in git |
| **Relay pairing abuse** | Relay tracks pair-code failures and temporary IP blocks |
| **Error handling** | Structured JSON API errors with code/message fields |

---

## Code Quality Baseline

Current quality gates are script-driven per package:

- Type checking: `tsc --noEmit` (`pnpm typecheck` at workspace level)
- Tests:
  - `apps/server`: `bun test`
  - `apps/web`: `bun test`
  - `apps/relay`: `bun test`
  - `apps/mobile`: `jest`
- Build orchestration: Turborepo (`pnpm build`)

Planned quality/security upgrades:

1. JWT auth test coverage once JWT support ships.
2. Expanded integration/E2E automation for relay + link flows.
3. Optional security audit endpoints exposure in main server route graph.
4. Additional dependency and container scanning in CI.
