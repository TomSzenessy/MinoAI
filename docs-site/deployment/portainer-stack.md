---
title: Portainer Stack
description: Copy/paste deployment workflow for operators.
---

# Portainer Stack Deployment

## Goal

Deploy Mino from a single compose block in Portainer.

## Steps

1. Open Portainer
2. Go to `Stacks` -> `Add stack`
3. Name stack (example: `mino`)
4. Paste YAML from [Reference: Server Compose](/reference/docker-compose)
5. Set optional env vars in Portainer
6. Deploy

## Common Env Vars

- `MINO_IMAGE_TAG` (default `main`)
- `MINO_PORT` (default `3000`)
- `MINO_PORT_BIND` (`127.0.0.1` default)
- `MINO_CONNECTION_MODE` (`relay` default)
- `MINO_RELAY_URL` (default `https://relay.mino.ink`)
- `MINO_PUBLIC_SERVER_URL` (optional)
- `WATCHTOWER_POLL_INTERVAL` (optional)
- `WATCHTOWER_MONITOR_ONLY=true` (optional)

## Verify Deployment

- `GET /api/v1/health`
- `GET /api/v1/system/setup`

In relay mode, if setup endpoint is not directly reachable from your machine, use startup logs for quick-connect links.
