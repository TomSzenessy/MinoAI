# Cursor Rules (Mino MCP)

[← Back to docs](../README.md)

Use this as a starting point for Cursor project rules.

```md
Always use the Mino MCP tools when the user asks to read, search, or modify notes.

Before creating a new note:
1) call `mino_search` for existing related notes
2) if a likely target exists, prefer `mino_edit` over creating duplicates

When moving notes:
- use `mino_move` with explicit `fromPath` and `toPath`
- never delete source before confirming move success

When answering questions:
1) use `mino_search` first
2) use `mino_read` on the top relevant notes
3) cite note paths in the final response
```

Cursor MCP config example:

```json
{
  "mcpServers": {
    "mino": {
      "command": "node",
      "args": ["/absolute/path/to/mino/tools/mcp-server/dist/cli.js"],
      "env": {
        "MINO_SERVER_URL": "https://test.mino.ink",
        "MINO_API_KEY": "mino_sk_your_key_here"
      }
    }
  }
}
```

Switching to production later only requires changing `MINO_SERVER_URL` to `https://mino.ink`.

