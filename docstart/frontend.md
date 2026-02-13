# Frontend

[Back to DocStart](./README.md)

## Current Frontend Targets

- `https://mino.ink` (production client)
- `https://test.mino.ink` (test client)
- built-in server UI (`http://<SERVER_IP>:3000`)
- local prototype reference in this repo (`prototype/`)
- local Next.js dev app (`apps/web`, default port `5173`)

## Documentation Source Behavior

- Website docs route (`/docs`) now renders repository content from `/docs` only.
- `/docstart` remains an implementation/runbook track in-repo and is not rendered in the website docs index.

## Client-To-Server Contract

Clients connect to a Mino server URL and use:
- setup endpoint: `GET /api/v1/system/setup`
- auth header: `X-Mino-Key`

## Dedicated Route: `/link`

`/link` is implemented in `apps/web` and must remain available on each web client (`mino.ink`, `test.mino.ink`, built-in UI, and local dev) so setup URLs work without manual typing.

Required flow:
1. Read direct params (`serverUrl`, `apiKey`) or relay params (`relayCode`, optional `relayUrl`).
2. If relay mode, exchange code at relay to resolve `serverUrl` + `apiKey`.
3. Call `POST {serverUrl}/api/v1/auth/verify` with `X-Mino-Key`.
4. Call `POST {serverUrl}/api/v1/auth/link` with `X-Mino-Key`.
5. Persist server connection locally.
6. Remove sensitive params from URL and redirect to workspace.

Implementation spec:
- `./reference/link-handler-spec.md`

## Local Development (Prototype)

```bash
cd prototype
python3 -m http.server 5173
```

Open `http://localhost:5173`.

## Local Development (Next.js App)

```bash
pnpm --filter @mino-ink/web dev
```

Open `http://localhost:5173/link`.

## Local Server Integration

1. Run server on `http://localhost:3000`.
2. Get setup payload from `http://localhost:3000/api/v1/system/setup`.
3. Use `links.connect.localUi` or manually configure the client with:
   - `serverUrl`
   - `apiKey`

Current state:
- route is implemented and active
- URL prefill + verify/link + localStorage persistence + workspace redirect are in place
- connected users are routed to workspace directly from landing
- workspace includes inline server switcher + settings entry in the left sidebar
- note title is edited directly (Obsidian-style title field synced to markdown `#` heading)
- command palette + hotkeys are wired in workspace (`Cmd/Ctrl+K`, `N`, `J`, `,`)
- file tree supports drag-to-folder note moves (backed by `PATCH /api/v1/notes/:path/move`)
- AI chat panel is available in workspace and backed by `/api/v1/agent/chat`
- channels (Telegram/WhatsApp) and plugin install/config are available in Settings
- channel provider fields are now capability-driven from `GET /api/v1/channels/providers`
- plugin runtime state is available via `GET /api/v1/plugins/runtime`
