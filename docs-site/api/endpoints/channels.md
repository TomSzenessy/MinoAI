---
title: Channels API
description: Channel providers, channel records, and webhook ingestion.
---

# Channels API

## Protected Routes

- `GET /api/v1/channels/providers`
- `GET /api/v1/channels`
- `POST /api/v1/channels`
- `POST /api/v1/channels/:id/toggle`
- `DELETE /api/v1/channels/:id`

## Public Webhook Route

- `POST /api/v1/channels/webhook/:provider`

Webhook can supply shared secret via `X-Mino-Channel-Secret` header or `secret` query param.
