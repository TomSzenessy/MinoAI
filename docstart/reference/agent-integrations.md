# Agent Integrations Runbook

Operational guide for wiring MCP clients against a Mino server.

## Prerequisites

1. Running Mino server (`http://localhost:3000` or your remote domain).
2. Admin API key from `/api/v1/system/setup`.
3. Built MCP server from this repository:

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

- API auth header must be `X-Mino-Key`.
- Note move endpoint expects `{ "path": "<target-note-path>.md" }`.
- Search endpoint is `/api/v1/search?q=...`.

## Staging -> Production Switch

For a domain cutover from `test.mino.ink` to `mino.ink`:

1. Keep launcher configs using `MINO_SERVER_URL`.
2. Rotate API keys after cutover.
3. Re-run a smoke check:
   - `mino_list_notes`
   - `mino_search`
   - `mino_read`

## Troubleshooting

- `401 UNAUTHORIZED`: wrong key or missing `X-Mino-Key` mapping.
- `404` on note paths: URL encoding issue, especially nested paths.
- MCP connects but no results: verify server has indexed notes (`/api/v1/search` manually).

