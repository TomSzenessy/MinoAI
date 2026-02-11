# Mino (Portainer-First + Web Link Handler)

Deploy first, then connect from `test.mino.ink` (or built-in local UI) with zero manual setup.

## 1. Portainer Deployment (Copy/Paste Only)

You do **not** need to clone this repo to deploy.

1. Open Portainer.
2. Go to `Stacks` -> `Add stack`.
3. Paste compose from `docstart/reference/docker-compose.md`.
4. Deploy.

Default service:
- `mino-server` on port `3000`

Access modes:
- Open mode (default): published host port
- Tunnel mode (safer): set `CF_TUNNEL_TOKEN` + `MINO_PORT_BIND=127.0.0.1`

## 2. First Run: Get Auth + Links

After startup, open:
- `http://<SERVER_IP>:3000/api/v1/system/setup`

You get:
- `serverId`
- `apiKey` (redacted after setup completes)
- auth method (`X-Mino-Key`)
- generated connect links:
  - `links.connect.testMinoInk`
  - `links.connect.minoInk`
  - `links.connect.localUi` (built-in UI, same server)
  - `links.connect.localDevUi` (`localhost:5173` dev client)

## 3. Linking Flow (Now Implemented)

`/link` is implemented in `apps/web` and supports prefilled URLs:

`/link?serverUrl=...&apiKey=...`

Behavior:
1. Parse params.
2. Validate + normalize `serverUrl`.
3. Call `POST /api/v1/auth/verify`.
4. Call `POST /api/v1/auth/link`.
5. Persist profile locally.
6. Remove `apiKey` from URL.
7. Redirect to `/workspace?profile=<id>`.

Manual form fallback is shown if params are missing/invalid.

## 3.1 Cloudflare Tunnel (Optional Safer Mode)

If you do not want open host ports, use tunnel mode:

1. Open `https://one.dash.cloudflare.com/`.
2. Go to `Networks` / `Connectors` -> `Add a tunnel`.
3. Choose `Cloudflared` (or `WARP connector`), name it.
4. Cloudflare shows a command like:
   `docker run cloudflare/cloudflared:latest tunnel --no-autoupdate run --token eyJ...`
5. Copy only the token value after `--token`.
6. In that tunnel, add a Public Hostname:
   - Hostname: `test.mino.ink` (or your chosen domain)
   - Service type: `HTTP`
   - URL: `http://mino:3000`
7. In Portainer stack environment vars set:
   - `CF_TUNNEL_TOKEN=<copied token>`
   - `MINO_PORT_BIND=127.0.0.1`
8. Redeploy the stack.

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

### Production template (`mino.ink`) — prepare now, cut over later
- Same build settings
- Environment variables:
  - `NODE_VERSION=20`
  - `NEXT_PUBLIC_APP_ENV=production`
  - `NEXT_PUBLIC_APP_ORIGIN=https://mino.ink`
  - `NEXT_PUBLIC_DEFAULT_LINK_TARGET=https://mino.ink`

## 5. Documentation Endpoint

The web `/docs` endpoint now shows **both** tracks:
- Blueprint docs from `/docs`
- Implementation docs from `/docstart`

So users can browse architecture and setup runbooks from one place (`test.mino.ink/docs`).

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
