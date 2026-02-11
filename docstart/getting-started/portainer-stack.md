# Portainer Stack Deployment

[Back to DocStart](../README.md)

## Goal

Deploy Mino by pasting one compose file in Portainer. No repository clone is required.

## Step-by-Step

1. Open Portainer.
2. Go to `Stacks` -> `Add stack`.
3. Set stack name (example: `mino`).
4. Paste YAML from `../reference/docker-compose.md`.
5. (Optional) Add environment variables in Portainer:
   - `MINO_PORT` (default `3000`)
   - `CF_TUNNEL_TOKEN` (required only if tunnel profile is enabled)
   - `COMPOSE_PROFILES` (`tunnel`, `autoupdate`, or `full`)
6. Deploy the stack.

## What Starts By Default

With no profile configured:
- `mino` service starts
- `cloudflared` and `watchtower` stay disabled

## Optional Modes

- `COMPOSE_PROFILES=tunnel`
  Starts `cloudflared` + `mino`
- `COMPOSE_PROFILES=autoupdate`
  Starts `watchtower` + `mino`
- `COMPOSE_PROFILES=full`
  Starts all services

## Verify Deployment

Use these URLs:
- Health: `http://<SERVER_IP>:3000/api/v1/health`
- Setup: `http://<SERVER_IP>:3000/api/v1/system/setup`
- Web docs explorer: `http://<SERVER_IP>:3000/docs` (includes blueprint + docstart docs)

From setup response, `links.connect.*` are intended to open a frontend `/link` handler for zero-manual linking (see `../reference/link-handler-spec.md`).

Expected health response status is `200`.

## Persistent Data

Docker volume:
- `mino-data` -> mounted at `/data`

This stores:
- `credentials.json`
- `config.json`
- notes and plugin data

Re-deploying the stack does not lose data as long as the volume is kept.
