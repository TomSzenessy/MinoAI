---
title: Relay Docker Compose Reference
description: Portainer-friendly compose block for Mino relay.
---

# Relay Docker Compose Reference

Copy this block into Portainer -> Stacks -> Add stack.

```yaml
services:
  relay:
    image: ghcr.io/tomszenessy/mino-relay:${RELAY_IMAGE_TAG:-main}
    container_name: mino-relay
    restart: unless-stopped
    labels:
      - "com.centurylinklabs.watchtower.enable=true"
      - "com.centurylinklabs.watchtower.scope=mino-relay"
    ports:
      - "${RELAY_PORT_BIND:-127.0.0.1}:${RELAY_PORT:-8787}:8787"
    environment:
      - NODE_ENV=production
      - RELAY_PORT=8787
      - RELAY_HOST=0.0.0.0
      - RELAY_PUBLIC_BASE_URL=${RELAY_PUBLIC_BASE_URL:-https://relay.mino.ink}
    healthcheck:
      test:
        [
          "CMD",
          "bun",
          "-e",
          "fetch('http://127.0.0.1:8787/api/v1/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))",
        ]
      interval: 30s
      timeout: 5s
      start_period: 10s
      retries: 3

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: mino-relay-tunnel
    restart: unless-stopped
    labels:
      - "com.centurylinklabs.watchtower.enable=true"
      - "com.centurylinklabs.watchtower.scope=mino-relay"
    command: tunnel --no-autoupdate run --token ${CF_TUNNEL_TOKEN}
    depends_on:
      relay:
        condition: service_started

  watchtower:
    image: containrrr/watchtower:latest
    container_name: mino-relay-watchtower
    restart: unless-stopped
    command:
      - --label-enable
      - --scope
      - mino-relay
      - --cleanup
      - --interval
      - "${WATCHTOWER_POLL_INTERVAL:-300}"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_NO_STARTUP_MESSAGE=true
      - WATCHTOWER_MONITOR_ONLY=${WATCHTOWER_MONITOR_ONLY:-false}
    depends_on:
      relay:
        condition: service_started
```

## Variables

- `CF_TUNNEL_TOKEN` (required for tunnel sidecar)
- `RELAY_PUBLIC_BASE_URL` (required)
- `RELAY_IMAGE_TAG` (default `main`)
- `RELAY_PORT` (default `8787`)
- `RELAY_PORT_BIND` (default `127.0.0.1`)
- `WATCHTOWER_POLL_INTERVAL`
- `WATCHTOWER_MONITOR_ONLY`
