# Agent Integrations

> Connect external coding agents to your Mino server through MCP, with ready-to-use examples for Cursor and Antigravity.

[← Back to docs](./README.md)

---

## MCP Quick Start

Mino exposes an MCP-compatible tool surface through `@mino-ink/mcp-server`.

Current auth contract:

- Header: `X-Mino-Key`
- Base API path: `/api/v1`
- Move payload: `{ "path": "new/location.md" }`

Core tool names:

- `mino_search`
- `mino_read`
- `mino_write`
- `mino_edit`
- `mino_delete`
- `mino_move`
- `mino_tree`
- `mino_list_tags`
- `mino_list_notes`

---

## Run MCP Server (Source Checkout)

```bash
# from repo root
pnpm --dir tools/mcp-server build

MINO_SERVER_URL="https://test.mino.ink" \
MINO_API_KEY="mino_sk_your_key_here" \
node tools/mcp-server/dist/cli.js
```

For local self-hosted testing:

```bash
MINO_SERVER_URL="http://localhost:3000" \
MINO_API_KEY="mino_sk_your_key_here" \
node tools/mcp-server/dist/cli.js
```

---

## Integration Examples

- Cursor rules + MCP wiring: [`docs/examples/cursor-rules.md`](./examples/cursor-rules.md)
- Antigravity skill template: [`docs/examples/antigravity-skill.md`](./examples/antigravity-skill.md)

---

## Domain Migration Notes

If you are staging on `test.mino.ink` and later moving to `mino.ink`, keep integration configs environment-driven:

1. Use `MINO_SERVER_URL` in all MCP launchers.
2. Store API keys in per-environment secrets.
3. Avoid hardcoding domain strings in prompts/rules.
