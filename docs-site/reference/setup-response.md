---
title: Setup Response Reference
description: Response schema and behavior of GET /api/v1/system/setup.
---

# Setup Response Reference

Endpoint:

`GET /api/v1/system/setup`

## Example

```json
{
  "success": true,
  "data": {
    "serverId": "...",
    "apiKey": "mino_sk_...",
    "setupComplete": false,
    "version": "0.1.0",
    "auth": {
      "method": "api-key",
      "header": "X-Mino-Key",
      "note": "Use this header for all protected API endpoints"
    },
    "pairing": {
      "mode": "relay",
      "relayCode": "ABCD1234",
      "relayUrl": "https://relay.mino.ink"
    },
    "server": {
      "url": "http://localhost:3000",
      "port": 3000,
      "host": "0.0.0.0",
      "cors": [
        "https://mino.ink",
        "https://test.mino.ink",
        "http://localhost:3000",
        "http://localhost:5173"
      ]
    },
    "links": {
      "setupApi": "http://localhost:3000/api/v1/system/setup",
      "health": "http://localhost:3000/api/v1/health",
      "apiBase": "https://relay.mino.ink/r/<serverId>/api/v1",
      "directApiBase": "http://localhost:3000/api/v1",
      "relayApiBase": "https://relay.mino.ink/r/<serverId>/api/v1",
      "connect": {
        "testMinoInk": "https://test.mino.ink/link?relayCode=...",
        "minoInk": "https://mino.ink/link?relayCode=...",
        "localDevUi": "http://localhost:5173/link?relayCode=...&relayUrl=..."
      }
    }
  }
}
```

## Field Notes

- `apiKey` is full value only while `setupComplete=false`
- `pairing.mode` is `relay` or `open-port`
- `links.connect.*` provides one-click onboarding URLs
- `auth.header` is the canonical protected API header name
