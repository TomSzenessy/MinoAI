---
title: Reverse Proxy
description: Put Mino behind nginx, caddy, or Traefik.
---

# Reverse Proxy

Use reverse proxy when running in open-port mode and exposing a public HTTPS domain.

## Server Requirements

- upstream target: `http://mino:3000`
- preserve `Host` and forwarding headers
- support WebSocket upgrade headers

## Nginx Example

```nginx
server {
  listen 443 ssl http2;
  server_name notes.example.com;

  location / {
    proxy_pass http://mino:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

## Caddy Example

```text
notes.example.com {
  reverse_proxy mino:3000
}
```

## Mino Config Pairing

When using reverse proxy, set:

- `MINO_CONNECTION_MODE=open-port`
- `MINO_PUBLIC_SERVER_URL=https://notes.example.com`
