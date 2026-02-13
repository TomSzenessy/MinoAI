---
title: Verify Credentials
description: Verify API key against the server.
---

# Verify Credentials

## Request

`POST /api/v1/auth/verify`

Header:

`X-Mino-Key: <API_KEY>`

## Response

```json
{
  "success": true,
  "data": {
    "valid": true,
    "serverId": "...",
    "setupComplete": false
  }
}
```
