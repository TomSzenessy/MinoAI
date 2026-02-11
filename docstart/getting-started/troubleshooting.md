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
- Tunnel is optional. If you do not set `CF_TUNNEL_TOKEN`, Mino still runs in open-port mode.

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
