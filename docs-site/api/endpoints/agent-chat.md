---
title: Agent Chat
description: Send prompt to server-side AI assistant.
---

# Agent Chat

## Request

`POST /api/v1/agent/chat`

Body:

```json
{
  "message": "Summarize launch notes",
  "notePath": "notes/launch.md",
  "channel": "web"
}
```

Fields:

- `message` (required)
- `notePath` (optional)
- `channel` (optional: `telegram`, `whatsapp`, `web`)

## Example

```bash
curl -X POST http://localhost:3000/api/v1/agent/chat \
  -H "X-Mino-Key: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"message":"What changed this week?"}'
```
