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
5. The mobile client is built by `apps/mobile/scripts/build-android-apk.sh`,
   which restores the release keystore from `ANDROID_KEYSTORE_BASE64` after
   `expo prebuild --clean` and generates a throwaway key only when none was
   supplied.

## Static assets

`apps/web/public/` ships images that are part of the web surface, not of any
build: `email/` holds the raster mark (`mino-mark.png`, 160×160 for a 34 px
logo, because Gmail and Outlook strip inline SVG) and the vector source
(`mino-logo.svg`). They are referenced by the launch-list confirmation email
([copy](../copy/launch-confirmation-email.md)) and by the site, so a change to
either file is a change to what users receive, not only to a page.

## When the map is not enough

For a large or unfamiliar tree, two pinned upstream skills are worth pulling
(`docs/resources.md#upstream-records`):

- `make upstream ID=graphify-code-graph` — a queryable knowledge graph of code,
  docs and their relationships. Pull it when `make where` cannot answer "who
  calls this" in a corner of the repository you have never opened.
- `make upstream ID=understand-anything-graph` — codebase knowledge graph,
  file explainer and diff-impact. Pull it when reviewing a change whose blast
  radius is not obvious from the diff, or when onboarding to a subsystem.

## Copy and support channels

Visible strings are part of the `web` surface and live in
`apps/web/messages/{en,de,es}.json`, which must stay key-for-key identical.

The footer links the in-site problem-report page `/complaints`. It renders a
form definition from `apps/web/lib/forms.ts` and posts to Mailspool's *public*
form API, so a report never redirects to a provider page and never needs a
GitHub account. Neither the strings nor the form change a surface boundary; both
are recorded here so a reader of the map knows where the words and the forms
come from.

## The agent kit (`tools/kit`)

The checks, gates and generators that keep this repository coherent are
themselves code, and `make help` lists the commands they back. Grouped by job:

| Job | Modules | What they do |
| --- | --- | --- |
| Primitives | `core`, `config`, `names`, `commands`, `helptext`, `registry`, `adapters` | Manifest, path safety, tunables, one declaration per command and capability, `make help`, and the host adapter files those declarations generate |
| Checks | `checks`, `checkrun`, `gatechecks`, `risk`, `hygiene`, `structure`, `surfaces` | What blocks and why, the context a check sees, change-set rules, risk tiers, rot detectors, and the manifest and surface inventory |
| Docs | `docmeta`, `docs`, `docsync`, `coupling`, `reachability`, `derive` | The `index`/`covers` carrier, link and index checks, doc-to-code bindings, co-change signal, the reference graph, and every derived block |
| Lifecycle | `session`, `gitsync`, `bootstrap`, `adopt`, `guided`, `launch`, `product`, `trial`, `evals`, `uireview`, `ci`, `cistatus` | Start and stop hooks, fetch and push discipline, project init and adoption, launch evidence, product state, build trials, cold-agent evals, screenshot review, and the runs behind `make ci-status` |
| Support | `gitinfo`, `github`, `issues`, `garden`, `signatures`, `navigate` | Read-only git queries, issue filing and duplicate search, issue contracts, the gardener report, known failure signatures, and `make where` |
| Capabilities | `capabilities`, `skills`, `scaffold`, `kitlock`, `kitreport`, `kitupdate`, `upstream`, `semantic`, `semantic_inventory`, `semantic_transport` | What this machine can do, skill provenance, `make new`, what the kit ships into a project, template reports and updates, pinned upstream records, and consent-gated semantic similarity |
