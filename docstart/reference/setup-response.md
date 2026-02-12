# Setup Response Reference

[Back to DocStart](../README.md)

Endpoint:
- `GET /api/v1/system/setup`

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
      "cors": ["https://mino.ink", "https://test.mino.ink", "http://localhost:3000", "http://localhost:5173"]
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
    },
    "instructions": [
      "Open the mino.ink connect link. It uses relay code pairing by default.",
      "Open one of the connect links to prefill server details.",
      "For local development, use localDevUi (http://localhost:5173) with relay code prefill.",
      "Then call POST /api/v1/auth/link to mark setup complete."
    ]
  }
}
```

## Field Notes

- `apiKey`
  Full value only while `setupComplete=false`.
- `auth.header`
  Required header name for protected API requests.
- `server.url`
  Canonical base URL detected from request context.
- `pairing.mode`
  `relay` (default) or `open-port`.
- `pairing.relayCode`
  One-click code used by `/link` to exchange relay connection info.
- `links.connect.*`
  Prefilled URLs for production/test/local clients (includes `localDevUi`).
- Client contract for these URLs:
  `./link-handler-spec.md`
