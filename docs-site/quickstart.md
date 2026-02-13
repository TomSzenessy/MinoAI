---
title: Quickstart
description: Fastest path to deploy Mino and link a client.
---

# Quickstart

## 1. Deploy with Docker/Portainer

Use the server compose from:

- [Deployment: Docker](/deployment/docker)
- [Reference: Server Compose](/reference/docker-compose)

Recommended defaults:

- `MINO_CONNECTION_MODE=relay`
- `MINO_PORT_BIND=127.0.0.1`
- `MINO_IMAGE_TAG=main`

## 2. Read Setup Payload

Open:

`http://<SERVER_IP>:3000/api/v1/system/setup`

You will get:

- `serverId`
- `apiKey` (full value until setup is marked complete)
- `pairing.mode` (`relay` or `open-port`)
- one-click `links.connect.*` URLs

## 3. Link a Client

Open one of the generated connect links, for example:

- `https://mino.ink/link?relayCode=...`
- `https://test.mino.ink/link?relayCode=...`

The `/link` route verifies credentials, marks setup complete, stores the server profile locally, and redirects to the workspace.

## 4. Verify Health

```bash
curl http://<SERVER_IP>:3000/api/v1/health
```

Expected: HTTP 200 and `data.status` is `ok` or `degraded`.

## Next

- [Access Modes](/guides/access-modes)
- [Linking and Auth Flow](/guides/linking-and-auth)
- [Troubleshooting](/guides/troubleshooting)
