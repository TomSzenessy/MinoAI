# Troubleshooting

[Back to DocStart](../README.md)

## Stack Deploys But Setup URL Fails

Check container is healthy:

```bash
curl -f http://<SERVER_IP>:3000/api/v1/health
```

If not healthy:
- confirm Portainer mapped port `3000:3000` (or your `MINO_PORT`)
- check container logs for startup errors

## `container mino-server is unhealthy` During Stack Deploy

Cause:
- healthcheck command failed inside container (older image used `curl` check)
- cloudflared dependency waited for healthy status and blocked stack

Fix:
- make sure stack uses current compose from `../reference/docker-compose.md`
- set `MINO_IMAGE_TAG=main` in Portainer env vars
- redeploy stack

If still unhealthy:
- inspect logs in Portainer for `mino-server`
- verify app health directly:
  `http://<SERVER_IP>:3000/api/v1/health`

## Relay Mode Link Fails (`relayCode` invalid / not found)

Cause:
- relay service cannot see active server connector
- server is not in relay mode or relay URL is incorrect

Fix:
- confirm env vars:
  - `MINO_CONNECTION_MODE=relay`
  - `MINO_RELAY_URL=https://relay.mino.ink` (or your relay URL)
- inspect container logs for `Relay connector started`
- verify relay health endpoint (`/api/v1/health`) if self-hosting relay

## `401 UNAUTHORIZED` On Protected Routes

Cause:
- missing or invalid `X-Mino-Key`

Fix:
- fetch latest key from `/api/v1/system/setup` (before setup completion)
- send header exactly as `X-Mino-Key`

## CORS Errors In Browser

Cause:
- origin not in server CORS allowlist

Fix:
- set `MINO_CORS_ORIGINS` in compose env
- include your UI origin (example: `http://localhost:5173`)

## Cloudflare Tunnel Service Won't Start

Cause:
- `CF_TUNNEL_TOKEN` missing, invalid, or copied with extra spaces

Fix:
- add `CF_TUNNEL_TOKEN` in Portainer env variables
- copy only the raw value after `--token` from Cloudflare
- redeploy stack

Note:
- Tunnel sidecar is optional. If you do not set `CF_TUNNEL_TOKEN`, Mino still runs in its configured connection mode (`relay` by default).

## Tunnel Runs But Domain Does Not Reach Mino

Cause:
- tunnel has no Public Hostname route to the Mino container

Fix:
- open Cloudflare Tunnel dashboard for your tunnel
- add Public Hostname with:
  - Service type `HTTP`
  - URL `http://mino:3000`
- redeploy stack after saving tunnel changes

## `manifest unknown` During Stack Deploy

Cause:
- container tag does not exist in GHCR (`latest` may lag or be missing)

Fix:
- use the default compose setting `MINO_IMAGE_TAG=main`
- or set a known version tag in Portainer (example: `MINO_IMAGE_TAG=v0.1.0`)
- redeploy stack

## Setup Link Opens But Does Not Auto-Link

Cause:
- stale web client build or blocked API call (CORS/network)

Fix:
- ensure URL has both params: `serverUrl` and `apiKey`
- confirm browser can reach `serverUrl` and CORS allows the UI origin
- update to latest web build and retry the `/link` URL

## Data Missing After Redeploy

Cause:
- volume was removed or stack recreated without `mino-data`

Fix:
- keep named volume `mino-data`
- avoid deleting volumes during stack cleanup
