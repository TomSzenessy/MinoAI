---
title: Access Modes
description: Choose how clients reach your server before deployment.
---

# Access Modes

You always have two URLs:

1. **Frontend URL** (where you open the app)
2. **Server URL** (where your Mino API is reachable)

## Mode A: Managed Relay (Default)

- Frontend: `https://mino.ink` or `https://test.mino.ink`
- No public inbound port required
- Recommended env:
  - `MINO_CONNECTION_MODE=relay`
  - `MINO_PORT_BIND=127.0.0.1`

## Mode B: Local Only

- Frontend: `http://localhost:3000`
- Server URL: `http://localhost:3000`
- Useful for same-machine or same-LAN use

## Mode C: Public Server (Open Port)

- Frontend: hosted web or your own web client
- Server URL: public HTTPS endpoint (example `https://notes.example.com`)
- Recommended env:
  - `MINO_CONNECTION_MODE=open-port`
  - `MINO_PORT_BIND=0.0.0.0`
  - `MINO_PUBLIC_SERVER_URL=https://notes.example.com`

## Mode D: Open Port + Cloudflare Tunnel Sidecar

Optional if you want Cloudflare-managed routing via tunnel token.

## Quick Decision

- Want easiest remote onboarding: **Mode A**
- Want direct endpoint control: **Mode C**
- Want fully local development only: **Mode B**
