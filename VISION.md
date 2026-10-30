# Project vision

<!-- index: operate | Accepted product direction, constraints, and success evidence | Starting a project or making a high-impact scope decision. -->

Status: accepted
Project: Mino
Owner: TomSzenessy
Date: 2026-10-30

## Outcome

Mino is an open-source alternative to Obsidian that runs on a server you own.
Your notes stay a folder of plain Markdown files; Mino makes that folder
reachable from every device with sync built in, and runs an AI agent inside it
that files, tags, links, summarises and retrieves. No paid sync service, no
vendor cloud, no account, your own model key.

Success in one metric: people who join the launch list and then actually run
the container. The list is the only instrumentation — Mino ships no telemetry,
so "running instances" are counted from waitlist replies and repo activity, not
from a dashboard.

## Users and context

Developers and technical knowledge workers who already keep a Markdown vault
(Obsidian, Logseq, a folder of `.md` files) and either self-host already or want
to. They use an AI coding agent daily, are comfortable with Docker, and are
suspicious of tools that hold their notes. They search "obsidian alternative
self hosted", "self hosted notes", "mino ai".

Today they either accept Obsidian's paid Sync, bolt a Claude agent onto a local
folder and lose it on mobile, or run a notes server with no agent integration.

## Platforms and constraints

- Server: Docker on x86-64 and arm64, one container, one data volume.
- Clients: web today; Android and iOS (Expo) in early builds.
- Remote access: relay (managed) or the operator's own tunnel; never a cloud
  copy of the notes.
- AI: bring your own provider, model and key; the agent is disabled until
  configured. No model traffic leaves the operator's server except to the
  provider they chose.
- Sync: offline-first clients, server as the hub; conflicts must merge, not
  overwrite.
- Budget: self-funded, so no paid infrastructure per user.
- Licensing: only clean-room sources — the MIT `obsidian` typings, public docs,
  observed behaviour and file formats. No Obsidian code, assets or trademarks.

## Non-goals

- A hosted or paid tier of any kind in this version.
- Reimplementing Obsidian's application or its proprietary features
  (Sync, Publish).
- A plugin marketplace: Mino loads plugins the operator already installed from
  their own vault, unmodified, and never redistributes them.
- Store releases for the mobile clients before the vault layer is solid.

## Success evidence

- An existing Obsidian vault opens with wikilinks, embeds, tags and attachments
  intact (fixture vault test in `apps/server/tests/`).
- 10 000 notes / 40 MB: first usable search under 10 s, steady-state reindex
  under 2 s (benchmark harness, recorded in `docs/plan/`).
- Five MIT community plugins load in the sandboxed host (compatibility matrix,
  published even when red).
- `make check` and the product test suites are green on `main`.
- Waitlist submissions carry a `source` value, so organic search can be read
  after 90 days (`docs/growth.md`).
