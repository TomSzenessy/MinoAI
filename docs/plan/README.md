# Plan — Mino as a self-hosted Obsidian alternative with an agent inside

> This is the working plan. `MASTER_PLAN.md` remains the long-form blueprint;
> `docs/plan/obsidian-parity.md` is the deep design for vault and plugin
> compatibility. This file sequences the work and says what "done" means.

## The vision, in one paragraph

Your notebook is a folder of Markdown files. Mino puts that folder on a server
you own, makes it reachable from every device with sync built in, and runs an AI
agent inside it — filing, tagging, linking, summarising, retrieving. No paid
sync service, no vendor cloud, no account. You bring your own model key. The app
is built around the agent, not an agent bolted onto a notes app. Mino is an
open-source alternative to Obsidian, compatible with Obsidian vaults, and it is
not affiliated with Obsidian.

## What we are not building (yet)

- A hosted plan. Deliberately out of scope; the self-hosted server is the product.
- A binary-compatible clone of Obsidian's app. We implement the *vault* and the
  *plugin API contract*, never Obsidian's code or assets
  ([parity plan §1](./obsidian-parity.md#1-legal-boundary)).
- A cloud that holds notes. The relay only forwards requests to the user's server.

## Three reference projects and what we take from each

| Source | What it is | What Mino takes | What it does not |
| --- | --- | --- | --- |
| [linuxserver/docker-obsidian](https://github.com/linuxserver/docker-obsidian) | A Selkies container that streams the Obsidian desktop app to a browser | The container *operating model*: one image, one data volume, a documented minimal start, healthcheck, image metadata, and permission guidance for bind mounts. Also the lesson that streaming a desktop is the wrong shape — Mino is web-native, so the same outcome (reachable from anywhere) needs no desktop pixels. | Their desktop streaming, their base image, their `/config` layout |
| [morluto/rea](https://github.com/morluto/rea) | An MCP server for reverse-engineering binaries and runtime behaviour | The **evidence model**: every tool result is a retained record with a stable id, a normalized result and a raw provider result, so an answer cites what it saw instead of asserting. Applied to Mino's agent tool actions, and to a compatibility lab where a proprietary behaviour needs black-box observation. | Its analysis tooling; nothing from it ships in Mino |
| [TomSzenessy/AI_TEMPLATE](https://github.com/TomSzenessy/AI_TEMPLATE) | The owner's agent-governance kit: contract, gates, delegation roles | The kit itself, adopted into this repository: `AGENTS.md` router, `project.toml`, `.agents/` skills and roles, and deterministic checks (`make check`, `make done`) so the repository stays coherent across agent sessions. | Nothing — it is the owner's own work |

## Workstreams

### 1. Vault compatibility — the reason someone switches

Deep design: [`obsidian-parity.md`](./obsidian-parity.md). Sequence:

| Phase | Scope | Done when |
| --- | --- | --- |
| P0 (shipped here) | Detect `.obsidian/`, read config, list community plugins, themes and snippets; expose `GET /api/v1/vault/obsidian` | The endpoint returns a real inventory for a fixture vault; malformed config degrades instead of throwing (`apps/server/tests/obsidian-vault.test.ts`) |
| P1 | Wikilinks, embeds, aliases, block refs, tags, callouts; attachment resolution; case-insensitive lookup | A vault of 50 real notes renders with working links in the web client; a link round-trip preserves the Obsidian syntax |
| P2 | Fast index: incremental walk, mtime+size+hash, FTS5, link graph, background queue | 10 000 notes / 50 MB: first usable search under 10 s, steady-state reindex under 2 s, no UI block |
| P3 | Plugin host v0 in a sandboxed iframe with an `obsidian` module shim | Five MIT plugins from the compatibility matrix load and work; the matrix is published |

### 2. Sync and reachability — "from anywhere, on any device"

| Phase | Scope | Done when |
| --- | --- | --- |
| S1 | Document the wire model: server is the hub, clients replicate, `ETag`/`If-Match` on writes | The API reference states the conflict rule and a test covers concurrent writes |
| S2 | Sync protocol for the web client (WebSocket + per-note revisions), offline queue | Two browsers editing the same note converge; one offline edit replays on reconnect |
| S3 | Remote access recipes: managed relay (exists) and self-hosted tunnel (Cloudflare Tunnel, WireGuard), documented as equal citizens | A server behind CGNAT is reachable from a phone through both paths |

### 3. Agent-first, not agent-added

| Phase | Scope | Done when |
| --- | --- | --- |
| A1 | **Evidence for agent actions**: every tool call returns `{id, tool, args, result, at}`; the chat cites ids | `AgentChatResult.actions` carries ids and a test asserts they are stable across replays |
| A2 | Proactive jobs: an import queue and a nightly "organize inbox" run, both visible and cancelable | A dropped PDF is filed without a chat turn; the run is listed with what it touched |
| A3 | Bring-your-own-model settings with a connection test | An operator can switch provider without editing config files |

### 4. Deployment — "paste the repo link"

| Phase | Scope | Done when |
| --- | --- | --- |
| D1 (shipped here) | Root `docker-compose.yml`, Portainer repository deploy, one-click template, `curl \| docker compose` one-liner, docs page | `docker compose config` validates; the Portainer template parses; the docs page is published at `/docs/deployment/from-the-repo` |
| D2 | Bind-mount permissions: documented UID/GID story, healthcheck and update path | A NAS user can mount an existing folder read-write without `chown` archaeology |
| D3 | Image provenance: OCI labels for revision and build date; release tags | `docker inspect` names the commit the running image was built from |

### 5. Growth — prove whether any of this is wanted

| Phase | Scope | Done when |
| --- | --- | --- |
| G1 (shipped) | Early-access waitlist on Mailspool, source attribution, `/waitlist` | A submission stores `source` and lands on the `Mino waitlist` list |
| G2 | Content that answers the queries: `/ai-notes`, `/self-hosted-notes`, `/about`, `/faq`, `llms.txt` | Indexed, canonical, with FAQ structured data |
| G3 | Read the number | 90 days of `source` values; see [`docs/growth.md`](../growth.md) for the thresholds |

## The first slice, in order

1. Commit what exists: copy, vault inspection, repository deploy.
2. Adopt the agent kit; make `make check` green.
3. P1 of vault compatibility with a real fixture vault (the one from the
   owner's own vault, sanitised).
4. P2 index benchmark on a generated 10k-note vault.
5. P3 plugin host behind a feature flag, with the compatibility matrix published
   even when it is mostly red.

## Rules that keep this honest

- A claim in copy needs a test, a fixture or a shipped route behind it.
- Anything borrowed from another project keeps its licence notice; nothing
  proprietary is decompiled into this repository.
- Numbers in the plan are acceptance targets, not marketing.
