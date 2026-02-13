---
title: Cloudflare Tunnel
description: Optional tunnel sidecar for secure remote access.
---

# Cloudflare Tunnel

Cloudflare Tunnel is optional. Mino relay mode works without it.

Use tunnel when you want Cloudflare-managed domain routing to your server or relay container.

## Server Sidecar Example

```yaml
services:
  mino:
    image: ghcr.io/tomszenessy/mino-server:${MINO_IMAGE_TAG:-main}
    container_name: mino-server
    expose:
      - "3000"

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: mino-tunnel
    command: tunnel --no-autoupdate run --token ${CF_TUNNEL_TOKEN}
    depends_on:
      mino:
        condition: service_started
```

## Required Variable

- `CF_TUNNEL_TOKEN`

## Tunnel Route

Configure Cloudflare public hostname to point to:

- service type: `HTTP`
- internal URL: `http://mino:3000`

## Troubleshooting

- verify token has no extra spaces
- confirm public hostname target matches container service/port
- check logs: `docker compose logs cloudflared`
