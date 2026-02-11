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
- `CF_TUNNEL_TOKEN` missing while `tunnel` profile is enabled

Fix:
- add `CF_TUNNEL_TOKEN` in Portainer env variables
- redeploy stack

## Setup Link Works But UI Does Not Auto-Fill

Cause:
- client route does not yet parse query params

Fix:
- manually paste values from setup response:
  - `server.server.url`
  - `apiKey`
- then track implementation against:
  - `../reference/link-handler-spec.md`

## Data Missing After Redeploy

Cause:
- volume was removed or stack recreated without `mino-data`

Fix:
- keep named volume `mino-data`
- avoid deleting volumes during stack cleanup
