# Research record

<!-- index: launch | Sources that shaped the product and the vault work | Before changing positioning, sync or plugin compatibility. -->

Status: accepted · Owner: TomSzenzessy · 2026-10-30

What this product is built from, with the sources actually read. Anything not
listed here was not used as evidence.

## 1. Obsidian — the reference product's contract

- <https://obsidian.md> and <https://docs.obsidian.md> — the product, the vault
  model, and the plugin developer documentation.
- `obsidian` npm package, v1.14.4, **MIT**, types in `obsidian.d.ts` — the
  plugin API contract we implement against
  (<https://www.npmjs.com/package/obsidian>).
- Obsidian's developer policies on trademarks — why copy says "Obsidian vault
  compatible", never "Obsidian for the web".

Taken: the vault format (`.obsidian/*.json`, Markdown + wikilinks + embeds),
the API surface a plugin host must provide, and the legal boundary between
"compatible with" and "a copy of". Recorded in
[`docs/plan/obsidian-parity.md`](../plan/obsidian-parity.md).

## 2. linuxserver/docker-obsidian — the container operating model

- <https://github.com/linuxserver/docker-obsidian> (read 2026-10-30).

Taken: one image, one volume, a documented minimal start, healthcheck and
image metadata. Rejected: streaming a desktop through Selkies — Mino is
web-native, so "reachable from anywhere" needs no desktop pixels. Applied in
[`docker-compose.yml`](../../docker-compose.yml) and
[`docs-site/deployment/from-the-repo.md`](../../docs-site/deployment/from-the-repo.md).

## 3. Obsidian LiveSync — what users already expect from sync

- <https://github.com/oleduc/docker-obsidian-livesync-couchdb> — a CouchDB
  container configured for LiveSync, multi-arch, automated builds.
- <https://github.com/vrtmrz/obsidian-livesync> — the plugin it serves.

Taken: people will run a database beside their notes to get real sync, and they
expect multi-arch images and unattended updates. Mino's answer is the server as
the sync hub (no second database to operate), but the requirement is the same:
offline edits merge instead of overwriting. See workstream S1–S3 in
[`docs/plan/README.md`](../plan/README.md).

## 4. morluto/rea — the evidence model for agent results

- <https://github.com/morluto/rea> and `docs/mcp-contracts.md` (read 2026-10-30).

Taken: every tool result is a retained record with a stable id, a normalized
result and the raw provider result, so an answer cites what it saw. Applied to
the agent workstream (A1: evidence for agent actions). Not taken: its binary
analysis tooling, which does not apply to a Markdown vault — and deliberately
not run against Obsidian itself, to keep the implementation clean-room.

## 5. Google Search Console export — what people actually search

- Owner's export `mino.ink-Performance-on-Search-2026-10-30.zip`: 113 clicks,
  6 465 impressions over 92 days, 1.75 % CTR, average position 16.3.

Taken: brand queries dominate ("mino ai" 1 818 impressions, "mino" 1 650,
"mino app" 689), so the marketing copy leads with the product an outsider can
recognise — "open-source Obsidian alternative that runs on your own server" —
and the pages answer the brand questions directly. Analysis in
[`docs/growth.md`](../growth.md).

## 6. Mailspool — the launch-list contract

- The project's Mailspool `SKILL.md` (public API contract) plus the live form
  definition for project 5.

Taken: the public form endpoint, the honeypot, the unsubscribe requirement, and
the rule that a submission is *queued*, never "sent". Copy deck in
[`docs/copy/mailspool-form.md`](../copy/mailspool-form.md).

## Open questions the research did not settle

- How many community plugins are worth supporting before launch (a matrix is
  designed, none measured yet).
- Whether Obsidian users expect plugin *settings* to round-trip, or only notes.
- Whether the mobile client should sync through the server or peer-to-peer.
