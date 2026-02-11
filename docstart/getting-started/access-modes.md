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

### Mode A — Local Only (Easiest)
- Use when server and browser are on the same machine/LAN.
- Frontend: `http://localhost:3000`
- Server URL: `http://localhost:3000`
- Tunnel: not required

### Mode B — Public Server (Open Port)
- Use when your server has port forwarding / reverse proxy.
- Frontend: `https://mino.ink` or `https://test.mino.ink`
- Server URL: your public HTTPS endpoint (example `https://notes.yourdomain.com`)
- Tunnel: optional

### Mode C — Public Server (Cloudflare Tunnel, Recommended)
- Use when you want no open inbound ports.
- Frontend: `https://mino.ink` or `https://test.mino.ink`
- Server URL: your own tunnel hostname (example `https://api.yourdomain.com`)
- Tunnel: required (`CF_TUNNEL_TOKEN`)

## Domain Ownership Rule

Cloudflare tunnel hostname must be in a DNS zone available in **your Cloudflare account**.

- Most users: use their own domain (example `api.yourdomain.com`).
- You can use `*.mino.ink` only if you control the `mino.ink` zone in that account.

You are **not** tunneling "to mino.ink".  
You are tunneling your own server endpoint, then opening the Mino frontend.

## Quick Decision

- No domain, no tunnel knowledge: use **Mode A** first.
- Need remote access and have your own domain in Cloudflare: use **Mode C**.
- Have public HTTPS already: use **Mode B**.
