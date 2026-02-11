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
    "server": {
      "url": "http://localhost:3000",
      "port": 3000,
      "host": "0.0.0.0",
      "cors": ["https://mino.ink", "https://test.mino.ink", "http://localhost:3000", "http://localhost:5173"]
    },
    "links": {
      "setupApi": "http://localhost:3000/api/v1/system/setup",
      "health": "http://localhost:3000/api/v1/health",
      "apiBase": "http://localhost:3000/api/v1",
      "connect": {
        "testMinoInk": "https://test.mino.ink/link?...",
        "minoInk": "https://mino.ink/link?...",
        "localUi": "http://localhost:5173/link?..."
      }
    },
    "instructions": [
      "Copy your API key — it will be redacted after setup.",
      "Open one of the connect links to prefill server details.",
      "If prefill is unavailable, paste server URL and API key manually.",
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
- `links.connect.*`
  Prefilled URLs for production/test/local clients.
- Client contract for these URLs:
  `./link-handler-spec.md`
