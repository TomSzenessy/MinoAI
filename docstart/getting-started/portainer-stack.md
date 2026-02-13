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
   - `MINO_PORT_BIND` (default `127.0.0.1`, use `0.0.0.0` for open-port mode)
   - `MINO_IMAGE_TAG` (default `main`, optional override to `latest` or a pinned version)
   - `MINO_CONNECTION_MODE` (`relay` default, `open-port` optional)
   - `MINO_RELAY_URL` (default `https://relay.mino.ink`)
   - `MINO_PUBLIC_SERVER_URL` (optional explicit public URL for open-port mode)
   - `WATCHTOWER_POLL_INTERVAL` (optional, default `300` seconds)
   - `WATCHTOWER_MONITOR_ONLY=true` (optional; checks/logs updates but does not restart containers)
6. Deploy the stack.

## What Starts By Default

With default settings:
- `mino` service starts
- server mode is `relay`
- host bind defaults to `127.0.0.1:${MINO_PORT}` (not public)
- `watchtower` runs automatically and updates labeled containers

## Connection Modes

- Relay mode (default)
  - `MINO_CONNECTION_MODE=relay`
  - generates relay pairing links for `mino.ink`, `test.mino.ink`, local UI, and local dev UI
- Open-port mode (direct)
  - `MINO_CONNECTION_MODE=open-port`
  - `MINO_PORT_BIND=0.0.0.0`
  - optionally set `MINO_PUBLIC_SERVER_URL=https://api.yourdomain.com`
  - generates direct links for `mino.ink`, built-in UI, and local dev UI

## Automatic Updates

- Watchtower is included by default in the compose stack.
- It checks for image updates every `WATCHTOWER_POLL_INTERVAL` seconds.
- Set `WATCHTOWER_MONITOR_ONLY=true` if you want to keep visibility without auto-restarts.
- When a new image digest is published to GHCR, the container is pulled and restarted automatically.

## Verify Deployment

Use these URLs:
- Health: `http://<SERVER_IP>:3000/api/v1/health` (open-port mode or local host access)
- Setup: `http://<SERVER_IP>:3000/api/v1/system/setup` (same access rules)
- Web docs explorer: `http://<SERVER_IP>:3000/docs`

If the setup URL is not reachable (relay mode + local bind), use the first-run links printed in container logs.

Expected health response status is `200`.

## Link Output Rules

- `relay` mode:
  - generates relay-code links for `mino.ink`, `test.mino.ink`, local UI, and local dev UI
  - intended one-click flow: open link -> `/link` auto-exchanges code -> connected
- `open-port` mode:
  - generates direct `serverUrl + apiKey` links for:
    - `mino.ink`
    - built-in UI (`/link`)
    - local dev UI (`localhost:5173/link`)

## Persistent Data

Docker volume:
- `mino-data` -> mounted at `/data`

This stores:
- `credentials.json`
- `config.json`
- notes and plugin data

Re-deploying the stack does not lose data as long as the volume is kept.
