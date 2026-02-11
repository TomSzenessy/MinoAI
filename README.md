# Mino Server (Portainer-First Setup)

This repository is set up so users can deploy with **one copy/paste Docker Compose stack in Portainer**.

If you do not want to clone the repo, that is fine. Use the compose YAML in `docker/docker-compose.yml` (or the copy in `docs/reference/docker-compose.md`) and deploy it as a Portainer stack.

## 1. Deploy In Portainer (Copy/Paste Only)

1. Open Portainer.
2. Go to `Stacks` -> `Add stack`.
3. Name it (example: `mino`).
4. Paste the compose YAML from `docs/reference/docker-compose.md`.
5. Click `Deploy the stack`.

After deploy, Portainer will start `mino-server` (and optional sidecars if profiles are enabled).

## 2. First-Run Output (Auth + Links)

On first boot, Mino auto-generates:
- `serverId`
- `adminApiKey`
- `jwtSecret`
- `/data/config.json`
- `/data/credentials.json`

Use either of these to get setup details:
- Container logs in Portainer (`mino-server`)
- Setup endpoint: `http://<YOUR_SERVER>:3000/api/v1/system/setup`

The setup payload now includes:
- Auth method (`X-Mino-Key`)
- API key (redacted after setup is complete)
- Clickable connection links for:
  - `https://test.mino.ink`
  - `https://mino.ink`
  - local UI (`http://localhost:5173`)

## 3. Link The Server

Use one of the links returned by `/api/v1/system/setup`:
- `links.connect.testMinoInk`
- `links.connect.minoInk`
- `links.connect.localUi`

If your UI does not support prefilled query params yet, copy these manually:
- `server.server.url`
- `apiKey`

Then verify auth:

```bash
curl -X POST http://<YOUR_SERVER>:3000/api/v1/auth/verify \
  -H "X-Mino-Key: <YOUR_API_KEY>"
```

## 4. Optional Profiles

The compose file includes optional services:
- `cloudflared` (`tunnel` profile)
- `watchtower` (`autoupdate` profile)

Examples:
- Server only: default deploy (no profile)
- Server + tunnel: set `COMPOSE_PROFILES=tunnel`
- Server + auto-update: set `COMPOSE_PROFILES=autoupdate`
- Everything: set `COMPOSE_PROFILES=full`

If you enable `tunnel`, set `CF_TUNNEL_TOKEN` in Portainer environment variables.

## 5. Local Build / Development (For Contributors)

For development/customization:

```bash
bun install
cd packages/shared && bun run build
cd ../../apps/server && bun run dev
```

Run tests:

```bash
cd apps/server
bun test
```

Build Docker image locally:

```bash
docker build -f docker/Dockerfile -t mino-server .
docker run --rm -p 3000:3000 -v mino-data:/data mino-server
```

## 6. Local Interface Options

Current options:
- Hosted clients: `https://mino.ink` and `https://test.mino.ink`
- Prototype UI in this repo: `prototype/` (static frontend preview)

To run the prototype locally:

```bash
cd prototype
python3 -m http.server 5173
```

Then open `http://localhost:5173`.

## 7. Docs

Start here: `docs/README.md`

Key docs:
- Portainer deployment: `docs/getting-started/portainer-stack.md`
- Linking/auth flow: `docs/getting-started/linking-and-auth.md`
- Local build/interface: `docs/getting-started/local-build.md`
- Troubleshooting: `docs/getting-started/troubleshooting.md`
