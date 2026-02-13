---
title: Plugins API
description: Install, list, configure, and remove plugins.
---

# Plugins API

Protected routes under `/api/v1/plugins`:

- `GET /`
- `GET /runtime`
- `GET /catalog`
- `POST /install`
- `POST /:id/toggle`
- `PUT /:id/config`
- `DELETE /:id`

Header for all:

`X-Mino-Key: <API_KEY>`
