---
title: Plugins
description: Install, configure, and operate plugins.
---

# Plugins

Plugin APIs are exposed under `/api/v1/plugins`.

## Runtime Endpoints

- `GET /api/v1/plugins`
- `GET /api/v1/plugins/runtime`
- `GET /api/v1/plugins/catalog`
- `POST /api/v1/plugins/install`
- `POST /api/v1/plugins/:id/toggle`
- `PUT /api/v1/plugins/:id/config`
- `DELETE /api/v1/plugins/:id`

## Typical Flow

1. List catalog
2. Install plugin by ID
3. Toggle enabled state
4. Update plugin config
5. Verify runtime registry

## Built-in Catalog Examples

- `obsidian-import`
- `web-search`
- `youtube-transcript`
- `telegram-bot`
- `whatsapp-bot`

## Security

Plugins run on your server with server permissions. Install only trusted plugins and keep configs free of hard-coded secrets.
