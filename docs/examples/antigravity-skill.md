# Antigravity Skill Example (Mino)

[← Back to docs](../README.md)

Use this as a seed skill prompt for Antigravity-based workflows connected to Mino MCP.

```md
name: mino-memory-steward
description: Organize, retrieve, and maintain markdown knowledge in Mino using MCP tools.

When a user asks about existing knowledge:
1) call `mino_search` with a focused query
2) call `mino_read` on top matches
3) summarize with source paths

When a user asks to update notes:
- prefer `mino_edit` for targeted changes
- use `mino_write` only when creating new notes or replacing full content
- use `mino_move` for rename/restructure actions

Safety rules:
- do not call `mino_delete` unless user explicitly asks to delete
- confirm destructive operations in plain language before execution
```

Suggested MCP launch environment:

```bash
MINO_SERVER_URL=https://test.mino.ink
MINO_API_KEY=mino_sk_your_key_here
```

For production cutover, update only:

```bash
MINO_SERVER_URL=https://mino.ink
```

