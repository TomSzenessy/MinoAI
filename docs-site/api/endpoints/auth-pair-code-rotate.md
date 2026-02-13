---
title: Rotate Relay Pair Code
description: Rotate one-click relay linking code.
---

# Rotate Relay Pair Code

## Request

`POST /api/v1/auth/pair-code/rotate`

Header:

`X-Mino-Key: <API_KEY>`

## Response

```json
{
  "success": true,
  "data": {
    "serverId": "...",
    "relayPairCode": "ABCD1234",
    "relayPairCodeCreatedAt": "2026-02-13T10:00:00.000Z"
  }
}
```
