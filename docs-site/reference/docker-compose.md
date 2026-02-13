---
title: Server Docker Compose Reference
description: Portainer-friendly compose block for Mino server.
---

# Server Docker Compose Reference

Copy this block into Portainer -> Stacks -> Add stack.

```yaml
services:
  mino:
    image: ghcr.io/tomszenessy/mino-server:${MINO_IMAGE_TAG:-main}
    container_name: mino-server
    restart: unless-stopped
    labels:
      - "com.centurylinklabs.watchtower.enable=true"
      - "com.centurylinklabs.watchtower.scope=mino-server"
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
    healthcheck:
      test:
        [
          "CMD",
          "bun",
          "-e",
          "fetch('http://127.0.0.1:3000/api/v1/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))",
        ]
      interval: 30s
      timeout: 5s
      start_period: 10s
      retries: 3

  watchtower:
    image: containrrr/watchtower:latest
    container_name: mino-watchtower
    restart: unless-stopped
    command:
      - --label-enable
      - --scope
      - mino-server
      - --cleanup
      - --interval
      - "${WATCHTOWER_POLL_INTERVAL:-300}"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_NO_STARTUP_MESSAGE=true
      - WATCHTOWER_MONITOR_ONLY=${WATCHTOWER_MONITOR_ONLY:-false}
    depends_on:
      mino:
        condition: service_started

volumes:
  mino-data:
    name: mino-data
```

## Environment Variables

- `MINO_CONNECTION_MODE` = `relay` or `open-port`
- `MINO_RELAY_URL` = relay URL in relay mode
- `MINO_IMAGE_TAG` = image tag (`main` recommended)
- `MINO_PORT` = server port (default `3000`)
- `MINO_LOCAL_DEV_UI_ORIGIN` = local web dev origin for generated links
- `WATCHTOWER_POLL_INTERVAL` = seconds between update checks
- `WATCHTOWER_MONITOR_ONLY` = monitor without restart if `true`
