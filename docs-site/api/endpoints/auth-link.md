---
title: Mark Linked
description: Mark setup as complete after successful client link.
---

# Mark Linked

## Request

`POST /api/v1/auth/link`

Header:

`X-Mino-Key: <API_KEY>`

## Behavior

- marks setup complete in credentials
- subsequent setup payloads redact API key

## Response

```json
{
  "success": true,
  "data": {
    "serverId": "...",
    "setupComplete": true,
    "message": "Server successfully linked."
  }
}
```
