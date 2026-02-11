# Relay

> Managed relay deployment for seamless `mino.ink` connectivity without requiring user-owned domains or open inbound ports.

[← Back to docs](./README.md)

---

## Why Relay Exists

Relay is the default connectivity mode for Mino:

- User deploys server stack.
- Server opens outbound connector to relay.
- User opens generated `mino.ink` `/link?relayCode=...` URL.
- Web client exchanges relay code, then talks to server through relay proxy routes.

No inbound port forwarding is required for the default flow.

---

## Required Variables

### Relay service (`apps/relay`)

| Variable | Required | Default | Example |
|----------|----------|---------|---------|
| `RELAY_HOST` | No | `0.0.0.0` | `0.0.0.0` |
| `RELAY_PORT` | No | `8787` | `8787` |
| `RELAY_PUBLIC_BASE_URL` | **Yes (recommended)** | none | `https://relay.test.mino.ink` |

### Server stack (`apps/server`) in relay mode

| Variable | Required | Default | Example |
|----------|----------|---------|---------|
| `MINO_CONNECTION_MODE` | Yes | `relay` | `relay` |
| `MINO_RELAY_URL` | Yes | `https://relay.mino.ink` | `https://relay.test.mino.ink` |
| `MINO_PORT_BIND` | Recommended | `127.0.0.1` | `127.0.0.1` |
| `MINO_PUBLIC_SERVER_URL` | No | empty | `https://api.example.com` |

### Web (Cloudflare Pages for `test.mino.ink` / `mino.ink`)

| Variable | Required | Example |
|----------|----------|---------|
| `NEXT_PUBLIC_RELAY_URL` | **Yes** | `https://relay.test.mino.ink` |
| `NEXT_PUBLIC_APP_ORIGIN` | Yes | `https://test.mino.ink` |
| `NEXT_PUBLIC_DEFAULT_LINK_TARGET` | Yes | `https://test.mino.ink` |
| `NEXT_PUBLIC_APP_ENV` | Yes | `test` / `production` |

---

## Deployment Steps (Test Domain)

### 1. Deploy relay backend

Deploy `ghcr.io/tomszenessy/mino-relay:main` with:

- `RELAY_PUBLIC_BASE_URL=https://relay.test.mino.ink`

Then verify:

- `GET https://relay.test.mino.ink/api/v1/health`

### 2. Route relay hostname in Cloudflare Tunnel

If using cloudflared for relay exposure, add a published application route:

- Subdomain: `relay.test`
- Domain: `mino.ink`
- Type: `HTTP`
- URL: `relay:8787`

### 3. Update Cloudflare Pages (`test.mino.ink`)

Set:

- `NEXT_PUBLIC_RELAY_URL=https://relay.test.mino.ink`

Redeploy Pages.

### 4. Update Mino server stack

Set:

- `MINO_CONNECTION_MODE=relay`
- `MINO_RELAY_URL=https://relay.test.mino.ink`
- `MINO_PORT_BIND=127.0.0.1`

Redeploy server stack.

### 5. Connect

Use setup-generated links (logs or `/api/v1/system/setup`) and open:

- `https://test.mino.ink/link?relayCode=...&relayUrl=...`

The link flow auto-exchanges pairing code and connects without manual `serverUrl` input.

---

## First Deployment Checklist (From Zero)

Use this when only `test.mino.ink` (frontend) is running and relay/server are not deployed yet.

### 1. Start relay container

```bash
docker run -d --name mino-relay --restart unless-stopped \
  -p 8787:8787 \
  -e RELAY_PUBLIC_BASE_URL=https://relay.test.mino.ink \
  ghcr.io/tomszenessy/mino-relay:main
```

Expected:

- container `mino-relay` is running

### 2. Expose `relay.test.mino.ink` to relay

Pick one:

- Cloudflare Tunnel route to relay service (`HTTP`, URL `relay:8787`)
- Reverse proxy / DNS to host port `8787`

Expected:

- `https://relay.test.mino.ink/api/v1/health` responds successfully

### 3. Configure Cloudflare Pages for `test.mino.ink`

Set build env variable:

- `NEXT_PUBLIC_RELAY_URL=https://relay.test.mino.ink`

Then redeploy Pages.

### 4. Deploy one Mino server stack (relay mode)

In Portainer stack env vars:

- `MINO_CONNECTION_MODE=relay`
- `MINO_RELAY_URL=https://relay.test.mino.ink`
- `MINO_PORT_BIND=127.0.0.1`

Deploy / redeploy stack.

### 5. Run the link flow

Open the setup link from server logs or setup endpoint:

- `https://test.mino.ink/link?relayCode=...&relayUrl=https://relay.test.mino.ink`

Expected:

- `/link` auto-connects
- workspace opens without manual `serverUrl` entry

### 6. Quick failure checklist

- If relay health fails: check relay container logs and route target.
- If `/link` fails: verify `NEXT_PUBLIC_RELAY_URL` and `MINO_RELAY_URL` match.
- If server does not appear online: verify server stack uses `MINO_CONNECTION_MODE=relay`.

---

## Open-Port Fallback

For direct connectivity mode:

- `MINO_CONNECTION_MODE=open-port`
- `MINO_PORT_BIND=0.0.0.0`
- optional `MINO_PUBLIC_SERVER_URL=https://api.yourdomain.com`

This enables direct `serverUrl + apiKey` links for `mino.ink` and local UI endpoints.
