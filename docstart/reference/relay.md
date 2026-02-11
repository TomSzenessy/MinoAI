# Relay Reference

[Back to DocStart](../README.md)

## Purpose

Relay provides managed connectivity for private servers (no open inbound port required).

Server flow:
1. server registers at relay (`/api/v1/relay/register`)
2. server long-polls relay queue (`/api/v1/relay/pull`)
3. server returns proxied responses (`/api/v1/relay/respond`)

Client flow:
1. `/link?relayCode=...` is opened on `mino.ink`
2. web client exchanges relay code (`/api/v1/pair/exchange`)
3. web client calls proxied API via `https://relay.../r/<serverId>/api/v1/...`

## Endpoints

- `GET /api/v1/health`
- `POST /api/v1/relay/register`
- `POST /api/v1/relay/pull`
- `POST /api/v1/relay/respond`
- `POST /api/v1/pair/exchange`
- `ALL /r/:serverId/*` (proxied API route)

## Environment Variables

- `RELAY_PORT` (default `8787`)
- `RELAY_HOST` (default `0.0.0.0`)
- `RELAY_PUBLIC_BASE_URL` (optional explicit public base URL)

## Source

- Relay app: `apps/relay`
- Relay Dockerfile: `docker/Relay.Dockerfile`
- Relay GHCR image: `ghcr.io/tomszenessy/mino-relay`
