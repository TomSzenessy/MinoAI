---
title: Relay Reference
description: Relay architecture, endpoints, and config.
---

# Relay Reference

Relay enables hosted clients to reach private servers without opening inbound ports.

## Server Flow

1. register: `POST /api/v1/relay/register`
2. pull queue: `POST /api/v1/relay/pull`
3. respond: `POST /api/v1/relay/respond`

## Client Flow

1. open `/link?relayCode=...`
2. exchange code: `POST /api/v1/pair/exchange`
3. client calls proxied API at `/r/:serverId/api/v1/...`

## Endpoints

- `GET /api/v1/health`
- `POST /api/v1/relay/register`
- `POST /api/v1/relay/pull`
- `POST /api/v1/relay/respond`
- `POST /api/v1/pair/exchange`
- `ALL /r/:serverId/*`

## Environment Variables

- `RELAY_PORT` (default `8787`)
- `RELAY_HOST` (default `0.0.0.0`)
- `RELAY_PUBLIC_BASE_URL` (recommended)

## Source

- App: `apps/relay`
- Dockerfile: `docker/Relay.Dockerfile`
- Image: `ghcr.io/tomszenessy/mino-relay`
