---
title: Authentication
description: Current auth behavior and header requirements.
---

# Authentication

## Current Production Path

Use API-key mode with header:

`X-Mino-Key: <API_KEY>`

You can fetch first-run key from `GET /api/v1/system/setup` until setup is completed.

## Auth Modes in Config

- `api-key` (fully supported)
- `none` (development only)
- `jwt` (declared in config schema, not fully implemented in middleware)

If bearer auth is attempted now, server responds with unsupported JWT message.

## Example

```bash
curl http://localhost:3000/api/v1/notes \
  -H "X-Mino-Key: <API_KEY>"
```

## Related

- [Linking and Auth](/guides/linking-and-auth)
- [Setup Endpoint](/api/endpoints/setup)
