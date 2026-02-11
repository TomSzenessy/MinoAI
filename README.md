# Mino (Portainer-First + Web Link Handler)

Deploy first, then connect from `mino.ink` / `test.mino.ink` or local UI.

## 1. Portainer Deployment (Copy/Paste Only)

You do **not** need to clone this repo to deploy.

1. Open Portainer.
2. Go to `Stacks` -> `Add stack`.
3. Paste compose from `docstart/reference/docker-compose.md`.
4. Deploy.

Default service:
- `mino-server` on port `3000`

Access modes:
- `relay` (default): no public port required, uses managed relay URL
- `open-port` (optional): direct public endpoint, local UI/dev links enabled

Mode switch variables:
- `MINO_CONNECTION_MODE=relay|open-port`
- `MINO_PORT_BIND=127.0.0.1` (relay default, local-only bind)
- `MINO_PORT_BIND=0.0.0.0` (open-port mode)
- `MINO_RELAY_URL=https://relay.mino.ink` (managed relay endpoint)

## 2. First Run: Get Auth + Links

After startup, check either:
- Portainer logs (first-run block with generated links/code)
- or setup endpoint (`http://<SERVER_IP>:3000/api/v1/system/setup`) when reachable

You get:
- `serverId`
- `apiKey` (redacted after setup completes)
- `pairing.mode` (`relay` or `open-port`)
- `pairing.relayCode` (relay mode)
- auth method (`X-Mino-Key`)
- generated connect links:
  - relay mode: `mino.ink` + `test.mino.ink` links with `relayCode`
  - open-port mode: `mino.ink` + local links with `serverUrl` + `apiKey`

## 3. Linking Flow (Now Implemented)

`/link` is implemented in `apps/web` and supports prefilled URLs:

- direct mode: `/link?serverUrl=...&apiKey=...`
- relay mode: `/link?relayCode=...&relayUrl=...`

Behavior:
1. Parse params.
2. If relay code is present, exchange code at relay.
3. Validate + normalize `serverUrl`.
4. Call `POST /api/v1/auth/verify`.
5. Call `POST /api/v1/auth/link`.
6. Persist profile locally.
7. Remove sensitive query params.
8. Redirect to `/workspace?profile=<id>`.

Manual form fallback is shown if params are missing/invalid.

Image tag note:
- default compose image tag is `main` (most reliable after pushes)
- optional override: `MINO_IMAGE_TAG=latest` or a pinned version tag

## 4. Cloudflare Pages Settings

Use two projects: one for testing, one for production.

### Test project (`test.mino.ink`) — use now
- Framework preset: `None`
- Build command: `pnpm install --no-frozen-lockfile && pnpm --filter @mino-ink/web build`
- Build output directory: `apps/web/out`
- Root directory: `/`
- Environment variables:
  - `NODE_VERSION=20`
  - `NEXT_PUBLIC_APP_ENV=test`
  - `NEXT_PUBLIC_APP_ORIGIN=https://test.mino.ink`
  - `NEXT_PUBLIC_DEFAULT_LINK_TARGET=https://test.mino.ink`
  - `NEXT_PUBLIC_RELAY_URL=https://relay.mino.ink`

### Production template (`mino.ink`) — prepare now, cut over later
- Same build settings
- Environment variables:
  - `NODE_VERSION=20`
  - `NEXT_PUBLIC_APP_ENV=production`
  - `NEXT_PUBLIC_APP_ORIGIN=https://mino.ink`
  - `NEXT_PUBLIC_DEFAULT_LINK_TARGET=https://mino.ink`
  - `NEXT_PUBLIC_RELAY_URL=https://relay.mino.ink`

## 5. Documentation Endpoint

The web `/docs` endpoint now shows **both** tracks:
- Blueprint docs from `/docs`
- Implementation docs from `/docstart`

So users can browse architecture and setup runbooks from one place (`test.mino.ink/docs`).

## 5.1 Relay Deployment (Operator)

Managed relay service source:
- app: `apps/relay`
- image: `ghcr.io/tomszenessy/mino-relay:main`

Minimal relay run:

```bash
docker run --rm -p 8787:8787 \
  -e RELAY_PUBLIC_BASE_URL=https://relay.mino.ink \
  ghcr.io/tomszenessy/mino-relay:main
```

## 6. Local Build (Contributors)

Install dependencies:

```bash
bun install
```

Run server:

```bash
cd apps/server
bun run dev
```

Run web client:

```bash
pnpm --filter @mino-ink/web dev
```

Build web static export:

```bash
pnpm --filter @mino-ink/web build
```

Run tests:

```bash
cd apps/server && bun test
cd ../../apps/web && bun test
```

## 7. Docs Policy

Docs governance is defined in `DOCS_POLICY.md`:
- `/docs` = blueprint
- `/docstart` = implementation/use

## 8. Canonical Repository

- `https://github.com/TomSzenessy/MinoAI`
