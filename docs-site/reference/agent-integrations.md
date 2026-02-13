---
title: Agent Integrations Runbook
description: Operational guide for MCP and external agent clients.
---

# Agent Integrations Runbook

This guide helps wire MCP/agent clients to a Mino server.

## Prerequisites

1. running Mino server (`http://localhost:3000` or remote URL)
2. admin API key from `/api/v1/system/setup`
3. MCP server build from this repo

```bash
cd tools/mcp-server
pnpm build
```

## Start MCP Bridge

```bash
MINO_SERVER_URL="https://test.mino.ink" \
MINO_API_KEY="mino_sk_your_key_here" \
node dist/cli.js
```

## Contract Checks

- auth header is `X-Mino-Key`
- note move endpoint expects `{ "path": "<target-note-path>.md" }`
- search endpoint is `GET /api/v1/search?q=...`

## Troubleshooting

- `401 UNAUTHORIZED`: invalid key or missing `X-Mino-Key`
- `404` on note path routes: URL encoding/path mismatch
- no search results: verify notes are indexed and query is valid
