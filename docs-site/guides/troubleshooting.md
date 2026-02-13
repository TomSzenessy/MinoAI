---
title: Troubleshooting
description: Common deployment, linking, and connectivity issues.
---

# Troubleshooting

## Setup URL Fails

```bash
curl -f http://<SERVER_IP>:3000/api/v1/health
```

If this fails:

- verify port mapping (`3000:3000` or your chosen `MINO_PORT`)
- inspect container logs

## Relay Code Exchange Fails

Check:

- `MINO_CONNECTION_MODE=relay`
- `MINO_RELAY_URL` is correct and reachable
- server logs show relay connector started

## 401 on Protected Routes

Cause: missing/invalid `X-Mino-Key`.

Fix: use API key from `/api/v1/system/setup` (before setup completion) and send header exactly:

`X-Mino-Key: <API_KEY>`

## CORS Errors in Browser

Set:

`MINO_CORS_ORIGINS=https://mino.ink,https://test.mino.ink,http://localhost:5173`

## Setup Link Opens But Does Not Auto-Link

Check:

- URL has required params (`relayCode` or `serverUrl` + `apiKey`)
- browser can reach target server URL
- CORS allowlist includes client origin

## Data Missing After Redeploy

Cause: data volume removed.

Fix: preserve `mino-data` volume and avoid deleting volumes during stack cleanup.

## `pnpm build` Crashes in Turbo on macOS

Symptom: Turborepo exits with panic/exit code `101`.

Cause: newer Turbo binaries can crash on some macOS environments.

Fix in this repo:

- Turbo is pinned to `2.4.0` in root `package.json`.
- Reinstall lockfile deps and rerun:

```bash
pnpm install --no-frozen-lockfile
pnpm build
```
