---
title: Health Check
description: Public health status endpoint.
---

# Health Check

## Request

`GET /api/v1/health`

## Example

```bash
curl http://localhost:3000/api/v1/health
```

## Response

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "version": "0.1.0",
    "uptimeSeconds": 1234,
    "noteCount": 0,
    "lastIndexedAt": null
  }
}
```

This endpoint is public and excluded from auth checks.
