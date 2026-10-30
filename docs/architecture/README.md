# Architecture map

<!-- index: design | Architecture map | How the parts of Mino fit together. -->
<!-- covers: apps/web/** apps/server/** apps/relay/** apps/mobile/** packages/** -->

Every shipped surface, who owns it, and where its design is written down. The
long-form architecture is in [`docs/architecture.md`](../architecture.md); this
table is the map an agent reads first.

| Surface | Path | Kind | What it is | Design doc |
| --- | --- | --- | --- | --- |
| `web` | `apps/web` | web | The static Next.js client: marketing pages, docs renderer, workspace | [frontend](../frontend.md) |
| `server` | `apps/server` | api | Bun + Hono API, Markdown vault, SQLite index, relay connector, agent runtime | [server](../server.md) |
| `relay` | `apps/relay` | service | The managed relay that forwards client requests to a server with no open port | [relay](../relay.md) |
| `mobile` | `apps/mobile` | mobile | The Expo client for Android and iOS; release signing keys stay outside the repository | [frontend](../frontend.md) |
| `packages` | `packages` | code | Shared types, API client, design tokens and the plugin SDK | [frontend](../frontend.md) |

## How a request moves

1. A client (web or mobile) authenticates with `X-Mino-Key` and calls the API.
2. In **open-port** mode it calls the server directly; in **relay** mode the
   relay forwards the request over the server's outbound long-poll connection.
3. The server reads and writes Markdown files in `/data/notes`, keeps the
   SQLite index beside them, and exposes the same operations to agents over the
   HTTP API and the MCP bridge.
4. An existing Obsidian vault is read in place: `.obsidian/` configuration is
   inspected by `apps/server/src/services/obsidian-vault.ts`, and nothing in it
   is executed.

## When the map is not enough

For a large or unfamiliar tree, two pinned upstream skills are worth pulling
(`docs/resources.md#upstream-records`):

- `make upstream ID=graphify-code-graph` — a queryable knowledge graph of code,
  docs and their relationships. Pull it when `make where` cannot answer "who
  calls this" in a corner of the repository you have never opened.
- `make upstream ID=understand-anything-graph` — codebase knowledge graph,
  file explainer and diff-impact. Pull it when reviewing a change whose blast
  radius is not obvious from the diff, or when onboarding to a subsystem.
