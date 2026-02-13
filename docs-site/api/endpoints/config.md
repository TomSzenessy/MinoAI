---
title: System Configuration
description: Read current public runtime configuration.
---

# System Configuration

## Request

`GET /api/v1/system/config`

Header:

`X-Mino-Key: <API_KEY>`

## Response

Returns non-secret runtime config including:

- `server.port`, `server.cors`
- `auth.mode`
- `connection.*`
- `agent` (without API key)
- `search`, `sync`, `plugins`

## Example

```bash
curl http://localhost:3000/api/v1/system/config \
  -H "X-Mino-Key: <API_KEY>"
```

`PATCH /api/v1/system/config` is not currently exposed.
