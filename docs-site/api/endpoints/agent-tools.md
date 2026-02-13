---
title: Agent Status
description: Check if agent is enabled and which provider/model is active.
---

# Agent Status

## Request

`GET /api/v1/agent/status`

## Example

```bash
curl http://localhost:3000/api/v1/agent/status \
  -H "X-Mino-Key: <API_KEY>"
```

## Response

```json
{
  "success": true,
  "data": {
    "enabled": true,
    "provider": "openai",
    "model": "gpt-4o-mini"
  }
}
```

This endpoint replaces older docs that referenced `GET /api/v1/agent/tools`.
