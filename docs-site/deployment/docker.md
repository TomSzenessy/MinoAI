---
title: Docker Deployment
description: Deploy Mino server with Docker Compose.
---

# Docker Deployment

## Recommended Image

`ghcr.io/tomszenessy/mino-server:${MINO_IMAGE_TAG:-main}`

## Minimal Compose

```yaml
services:
  mino:
    image: ghcr.io/tomszenessy/mino-server:${MINO_IMAGE_TAG:-main}
    container_name: mino-server
    restart: unless-stopped
    ports:
      - "${MINO_PORT_BIND:-127.0.0.1}:${MINO_PORT:-3000}:3000"
    volumes:
      - mino-data:/data
    environment:
      - NODE_ENV=production
      - MINO_DATA_DIR=/data
      - MINO_CONNECTION_MODE=${MINO_CONNECTION_MODE:-relay}
      - MINO_RELAY_URL=${MINO_RELAY_URL:-https://relay.mino.ink}
      - MINO_PUBLIC_SERVER_URL=${MINO_PUBLIC_SERVER_URL:-}

volumes:
  mino-data:
    name: mino-data
```

## Connection Modes

- `relay` (default): private server, outbound relay connection
- `open-port`: direct public access to server URL

## Important Environment Variables

- `MINO_CONNECTION_MODE` = `relay` or `open-port`
- `MINO_PORT_BIND` = `127.0.0.1` (private bind) or `0.0.0.0` (public bind)
- `MINO_RELAY_URL` (required for relay mode)
- `MINO_PUBLIC_SERVER_URL` (recommended for open-port mode)
- `MINO_CORS_ORIGINS`
- `MINO_AGENT_*` (optional AI settings)

## Health and Setup

- Health: `GET /api/v1/health`
- Setup: `GET /api/v1/system/setup`

## Full Portainer Copy Block

Use [Reference: Server Compose](/reference/docker-compose) for the full copy/paste stack with Watchtower labels and healthcheck.
