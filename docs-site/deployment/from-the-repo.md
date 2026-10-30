---
title: Deploy from the repository
description: Point Portainer (or plain Docker) at the Mino repository and get the API plus the dashboard running, without writing a compose file.
---

# Deploy from the repository

There is nothing to assemble. The repository contains a `docker-compose.yml`
at its root that runs one container: the API, and the dashboard baked into the
same image. Point Portainer at the repository, or run one command.

## Portainer: stack from repository

1. **Stacks → Add stack → Repository**.
2. Repository URL: `https://github.com/TomSzenessy/MinoAI`
   (for a private fork, add the credentials in the same dialog).
3. Compose path: `docker-compose.yml`
4. Optional, under **Environment variables**: `MINO_CONNECTION_MODE`,
   `MINO_PORT`, `MINO_PORT_BIND` — the defaults work.
5. **Deploy the stack**.

Portainer clones the repository, reads the compose file, and starts
`mino-server`. The dashboard is served by that container on port `3000`.

If your instance has *automatic updates* enabled for the stack, Portainer
re-pulls the repository and redeploys when it changes; that is how you pick up
a newer `main` image without touching anything else.

## Portainer: one-click template

Portainer can install Mino from an app template, which fills in the repository
URL, the compose path and the environment variables for you.

1. **Settings → App Templates** (or **Templates** in older versions).
2. Add the template URL:
   `https://raw.githubusercontent.com/TomSzenessy/MinoAI/main/deploy/portainer-template.json`
3. **App Templates → Mino → Deploy**.

## Docker, one command

No clone, no file to keep:

```bash
curl -fsSL https://raw.githubusercontent.com/TomSzenessy/MinoAI/main/docker-compose.yml \
  | docker compose -f - up -d
```

Or, if you prefer the file on disk:

```bash
git clone --depth 1 https://github.com/TomSzenessy/MinoAI
cd MinoAI
docker compose up -d
```

## What you get

| What | Where |
| --- | --- |
| API | `http://<host>:3000/api/v1` |
| Dashboard | `http://<host>:3000/` |
| Notes and index | the `mino-data` volume, mounted at `/data` |
| Health | `GET /api/v1/health` |

The container binds to `127.0.0.1` by default. Put a reverse proxy in front of
it (see [Reverse proxy](/deployment/reverse-proxy)), or set
`MINO_PORT_BIND=0.0.0.0` when the host is already private.

## First run

The server bootstraps itself on first start and prints the setup block to the
container log: the server ID, the admin API key, the pairing mode and the
connect links.

```bash
docker logs mino-server | head -40
```

The same values are available from `GET /api/v1/system/setup` while it is
reachable, and the dashboard's **Connect** screen walks through linking a
client.

## Updating

```bash
docker compose pull && docker compose up -d
```

That is all: the data lives in the volume, the image is stateless. If you would
rather have the container update itself, use
`docker/docker-compose.yml` instead, which adds Watchtower and pins updates to
the `mino-server` label — see [Watchtower](/deployment/watchtower).

## Hosting the dashboard separately

The dashboard is a static Next.js export. If you want it on another host — a
CDN, Cloudflare Pages, or an internal web server — build it against the URL of
your Mino server:

```bash
pnpm install --frozen-lockfile
NEXT_PUBLIC_APP_ORIGIN=https://notes.example.com \
NEXT_PUBLIC_DEFAULT_LINK_TARGET=https://notes.example.com \
NEXT_PUBLIC_APP_ENV=production \
  pnpm --filter @mino-ink/web build
# output: apps/web/out
```

Serve that folder and link it to your server with `/link?serverUrl=…&apiKey=…`
(open-port mode) or `/link?relayCode=…` (relay mode). The server image already
ships the same build at `/app/apps/web/out`, which is why the single-container
path needs no extra step.
