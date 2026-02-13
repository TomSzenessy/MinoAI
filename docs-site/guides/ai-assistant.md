---
title: AI Assistant
description: Configure and use the built-in server-side AI assistant.
---

# AI Assistant

Mino runs the assistant server-side and exposes it via `POST /api/v1/agent/chat`.

## Configure Agent

Set env vars (or config) on the server:

```bash
MINO_AGENT_ENABLED=true
MINO_AGENT_PROVIDER=openai
MINO_AGENT_API_KEY=sk-...
MINO_AGENT_MODEL=gpt-4o-mini
```

## Check Agent Status

```bash
curl -H "X-Mino-Key: <API_KEY>" \
  http://localhost:3000/api/v1/agent/status
```

## Chat Endpoint

```bash
curl -X POST \
  -H "X-Mino-Key: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"message":"Summarize notes about launch prep"}' \
  http://localhost:3000/api/v1/agent/chat
```

## Notes

- Agent requests are authenticated with `X-Mino-Key`
- Tool execution depends on current plugin/runtime state
- Keep prompts explicit and include note path/folder context when possible
