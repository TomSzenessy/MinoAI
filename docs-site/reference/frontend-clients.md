---
title: Frontend Clients Reference
description: Current frontend targets and client-server contract.
---

# Frontend Clients Reference

## Current Frontend Targets

- `https://mino.ink`
- `https://test.mino.ink`
- built-in server UI: `http://<SERVER_IP>:3000`
- local Next.js dev app: `apps/web` (default `5173`)

## Client-To-Server Contract

- setup endpoint: `GET /api/v1/system/setup`
- protected auth header: `X-Mino-Key`
- link route: `/link` (direct or relay params)

## `/link` Requirements

1. parse direct or relay params
2. exchange relay code when needed
3. verify credentials (`POST /api/v1/auth/verify`)
4. mark link complete (`POST /api/v1/auth/link`)
5. persist server profile and redirect

See [Web Link Flow](/guides/web-link-flow) and [Link Handler Spec](/reference/link-handler-spec).
