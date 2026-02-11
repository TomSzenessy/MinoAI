# Access Modes (Choose One First)

[Back to DocStart](../README.md)

## Two Different URLs (Critical)

You always have two separate things:

1. **Frontend URL** (where you open the app)
   - `https://mino.ink`
   - `https://test.mino.ink`
   - `http://localhost:3000` (built-in UI)
2. **Server URL** (where your own Mino API is reachable)
   - `https://api.yourdomain.com`
   - `https://notes.yourdomain.com`
   - `http://localhost:3000` (local-only)

The frontend can be `mino.ink`, but the server URL is still your own endpoint.

## Which Mode Should You Use?

### Mode A — Managed Relay (Default)
- Frontend: `https://mino.ink` or `https://test.mino.ink`
- Server reachability: no public port required
- Compose:
  - `MINO_CONNECTION_MODE=relay`
  - `MINO_PORT_BIND=127.0.0.1` (default)
- Setup uses relay code links (`/link?relayCode=...`)

### Mode B — Local Only
- Use when server and browser are on the same machine/LAN.
- Frontend: `http://localhost:3000`
- Server URL: `http://localhost:3000`
- Set `MINO_CONNECTION_MODE=open-port` for local links in setup payload

### Mode C — Public Server (Open Port)
- Use when your server has port forwarding / reverse proxy.
- Frontend: `https://mino.ink` or `https://test.mino.ink`
- Server URL: your public HTTPS endpoint (example `https://notes.yourdomain.com`)
- Compose:
  - `MINO_CONNECTION_MODE=open-port`
  - `MINO_PORT_BIND=0.0.0.0`
  - optional `MINO_PUBLIC_SERVER_URL=https://notes.yourdomain.com`

### Mode D — Open Port + Cloudflare Tunnel Sidecar (Optional)
- If you still want Cloudflare-managed domain routing, use `CF_TUNNEL_TOKEN`.
- This is optional and separate from managed relay mode.

## Quick Decision

- Want easiest remote setup: use **Mode A (relay default)**.
- Want full direct control or local-only UI links: use **Mode C (open-port)**.
- Need fully local dev only: use **Mode B**.
