---
title: Linking and Auth
description: How setup links, API key auth, and setup completion work.
---

# Linking and Auth

## Setup Endpoint

Open:

`GET http://<SERVER_IP>:3000/api/v1/system/setup`

The payload includes:

- `serverId`
- `apiKey` (redacted after setup completion)
- `pairing.mode` and relay fields
- generated `links.connect.*`

## Protected API Header

Protected endpoints require:

`X-Mino-Key: <API_KEY>`

## Link Flows

- **Relay flow:** `/link?relayCode=...` (+ optional `relayUrl`)
- **Direct flow:** `/link?serverUrl=...&apiKey=...`

The web `/link` flow performs:

1. Parse params
2. Exchange relay code when needed
3. `POST /api/v1/auth/verify`
4. `POST /api/v1/auth/link`
5. Persist linked profile locally
6. Remove sensitive URL params
7. Redirect to workspace

Detailed spec: [Link Handler Spec](/reference/link-handler-spec)

## Mark Setup Complete

```bash
curl -X POST http://<SERVER_IP>:3000/api/v1/auth/link \
  -H "X-Mino-Key: <API_KEY>"
```

After this call:

- `setupComplete=true`
- setup payload redacts API key value

## Rotate Relay Pair Code

```bash
curl -X POST http://<SERVER_IP>:3000/api/v1/auth/pair-code/rotate \
  -H "X-Mino-Key: <API_KEY>"
```

Returns:

- `relayPairCode`
- `relayPairCodeCreatedAt`
