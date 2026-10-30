# Obsidian parity

> Open an existing Obsidian vault — notes, configuration, community plugins — inside Mino, without Obsidian installed.

Status: written against `cd5ec0a`. A server-side first slice is **already uncommitted in the working tree** (`apps/server/src/services/obsidian-vault.ts`, `routes/vault.ts`, `tests/obsidian-vault.test.ts`, mounted at `apps/server/src/server.ts:140`), so §6 is "finish and verify", not "start". Nothing here authorises executing third-party plugin code: §2 designs that, §5 schedules it as P3.

## 1. Legal boundary

Four different things get conflated in "Obsidian compatibility"; only one is a licensing hazard.

| Component | Status | What Mino may do |
|---|---|---|
| Obsidian application | Proprietary, closed source, licence-gated | Observe behaviour black-box (run it on a licensed machine, inspect the files it writes). Never decompile into Mino. |
| Vault format + `.obsidian/*.json` | De facto public: plain files, documented in the user help | Implement freely; the JSON shapes are facts, not protectable expression. |
| `obsidian` npm typings | **MIT** — `obsidian` package v1.14.4, `"license": "MIT"`, types in `obsidian.d.ts` | Vendor as a dev dependency, compile against it, copy declarations provided the MIT notice travels with them. |
| Community plugins (`manifest.json` + `main.js`) | Each under its **own** licence — MIT, GPL, or "all rights reserved" | Load the user's own copy from the user's own vault, unmodified, on the user's request. Never bundle, mirror, or ship one. |

**The clean-room rule.** Mino may rely on (a) the MIT typings — every signature we implement is checkable against `obsidian.d.ts`; (b) the published developer docs; (c) observed behaviour of the running app; (d) file formats; (e) plugin source read *for compatibility analysis only* (to learn which API members a plugin touches, so we can widen the shim). It must not: unpickle the AppImage/asar and port its code; copy assets — `app.css`, the icon font, bundled themes, the logo; ship Obsidian trademarks or a product name implying affiliation (Obsidian's own developer policy says "Don't use the 'Obsidian' trademark in a way that could confuse users into thinking your plugin or theme is a first-party creation"); or redistribute any plugin.

**Contributor rule:** *every line must be traceable to `obsidian.d.ts`, the public docs, a fixture vault, or your own head — if it came from reading Obsidian's minified JS, it does not go in the repo.* A PR touching `obsidian-vault.ts` or the plugin host answers three questions: which public signature does this implement; does it add any file we do not own; does any user-visible string imply Obsidian made this? Product copy says "Obsidian vault compatible", never "Obsidian for the web".

## 2. Plugin hosting architecture

A plugin is a CommonJS bundle that calls `require("obsidian")` and expects a real DOM. That rules out a Worker, and rules out Mino's own window: plugin code is arbitrary JavaScript from the internet and that page holds the API key.

**Decision: one sandboxed iframe per plugin instance, in a host-owned pane. The host owns the app model; the frame owns the plugin's DOM and globals.**

```
apps/web/public/vault-host/host.html      shell: CSP, <script src="runtime.js">
apps/web/public/vault-host/runtime.js     built by bun build --format=iife (no ES modules)
apps/web/vault-host/loader.ts             CJS loader + require() shim map
apps/web/vault-host/rpc.ts                postMessage protocol: {id, method, args} / {id, ok, value|error}
apps/web/vault-host/app-core.ts           host side: vault model, workspace, commands, settings, audit
apps/web/vault-host/shims/*.ts            obsidian, moment, requestUrl, Platform, process
apps/server/src/routes/vault-host.ts      static host assets + scoped plugin token issuance
```

Not a Worker because `ItemView`, `Setting`, `Modal`, `Notice` and `MarkdownRenderer.render(app, markdown, el, …)` (`obsidian.d.ts:6079`) all take or return `HTMLElement`, which `postMessage` cannot carry — the shim must live *inside* the frame.

The frame is `sandbox="allow-scripts allow-forms allow-popups"`, **never** `allow-same-origin`: with it, plugin code reads `window.parent.document` and the sandbox is decorative. The cost is an opaque origin — no `localStorage`, cookies, `import()` or same-origin `fetch`. Three consequences, accepted deliberately:

1. Host runtime is loaded with classic `<script>` tags (no CORS needed for classic scripts), hence the IIFE build.
2. `loadData`/`saveData` cannot use `localStorage`; they RPC to the host, which reads and writes `<configDir>/plugins/<id>/data.json` — the file Obsidian uses, so settings round-trip. Writing inside `.obsidian/` is a compat requirement: log it, keep one backup per write.
3. A plugin calling `localStorage` or `fetch` directly gets an in-frame in-memory shim, and for network an explicit permission prompt (`requestUrl`, below).

The loader is small and loud:

```ts
const module = { exports: {} as any };
const req = (id: string) => {
  if (id === "obsidian") return obsidianShim;
  if (id in shims) return shims[id];
  throw new UnsupportedModuleError(id); // surfaced as a tier-C diagnosis, not a stack trace
};
new Function("module", "exports", "require", "window", "document", code)
  (module, module.exports, req, frameWindow, frameDocument);
```

This requires `script-src 'unsafe-eval'` **inside the frame only**; the parent page keeps its strict CSP. Say so in the security docs rather than pretending otherwise.

### API surface that must exist before a real plugin is useful

| Member (`obsidian.d.ts`) | Minimum semantics | Backing |
|---|---|---|
| `Plugin.onload/onunload`, `manifest`, `app` (`:7120`), `loadData`/`saveData` (`:7338`) | lifecycle, settings | host calls `onload`, then `unload` on disable; settings → `data.json` |
| `Component.registerEvent/registerDomEvent/registerInterval` (`:3038`) | auto-cleanup | frame-side registry, torn down on unload |
| `addCommand` (`:7189`), `removeCommand` | command registry | host palette dispatches `{type:"command", id}` |
| `addRibbonIcon` (`:7163`) | icon button | host chrome; Lucide icon names (MIT) |
| `addSettingTab` (`:7205`), `Setting` (`:8209`) | settings DOM | in-frame; persisted via `data.json` |
| `registerView` (`:7219`), `ItemView` (`:5391`) | pane per view type | host creates pane + iframe, `onOpen(container)` |
| `Notice` (`:6728`), `Modal` (`:6540`) | transient UI | in-frame, clipped to the pane (accepted divergence) |
| `Vault`/`TFile`/`TAbstractFile` (`:10182`, `:9926`) | `read`, `cachedRead`, `modify`, `create`, `getMarkdownFiles`, `getAbstractFileByPath` | index + `FileManager`; `cachedRead` served from `notes.body` |
| `MetadataCache` (`:6446`) | `getCache`, `resolvedLinks`, `unresolvedLinks`, `getFirstLinkpathDest`, `fileToLinktext` | §3 link tables |
| `Workspace` (`:10659`) | `getActiveFile`, leaves, `onLayoutReady`, `file-open`/`active-leaf-change` events | host layout model, persisted to `.mino/workspace.json` — **never** `.obsidian/workspace.json` |
| `requestUrl` (`:7841`) | CORS-free HTTP | `POST /api/v1/vault/request-url` proxy, per-plugin allowlist + audit line |
| `MarkdownRenderer.render` (`:6079`) | markdown → DOM | RPC to `POST /api/v1/vault/render` so plugin output matches Mino's renderer, sanitised before `innerHTML` |
| `Platform`, `moment`, `process`, `window.require` | globals | `moment` real dependency; `require` throws `UnsupportedNativeModule` |

### Compatibility tiers

| Tier | Definition | Representative | Policy |
|---|---|---|---|
| **A** | Shipped API surface above is enough | our fixture plugin, Tag Wrangler, Style Settings, Calendar | support, test in CI with fixtures we own |
| **B** | Works once a named gap is filled | Dataview (block refs + `MarkdownRenderer`), Tasks (post-processors + `MetadataCache`), Templater (`create`/`process` + `Notice`) | support; expose a per-plugin `compatibility.json` listing the gap |
| **C** | Needs Node/Electron at runtime | `require("fs")`/`child_process`, `electron.remote`, bundled native binaries, local-LLM plugins, git-backed sync, "local REST API" | install listed but disabled, one sentence why, never a silent failure |
| **D** | Impossible without the proprietary app | Sync/Publish clients, anything reading Obsidian's IndexedDB or licence state, mobile-only plugins | refuse at install; explain |

Tier is computed, not asserted: a static scan of `main.js` for `require(...)` targets and `obsidian` members gives the first guess (§8); a load failure upgrades a plugin to C.

Plugins never receive the Mino API key: the host exchanges its session for a scoped per-plugin token (read/write limited to the vault root) and writes to `security/audit` (`apps/server/src/routes/security.ts`). `requestUrl` is off by default; Obsidian grants it silently, we do not.

## 3. Fast indexing

Today the index is correct but slow in ways that bite at 10k notes:

- every request builds a fresh connection — `new NoteService(...)` per handler (`apps/server/src/routes/notes.ts:22`), `new IndexDB(dataDir)` in its constructor (`apps/server/src/services/note-service.ts:27`);
- the first request triggers a full rebuild when `notes` is empty (`index-db.ts:210`, `:231`), reading every file sequentially (`:271`) after a sequential directory walk (`file-manager.ts:101`);
- `listNotes()` issues one metadata query per file (N+1);
- FTS is `tokenize='porter unicode61'` (`index-db.ts:114`) — no CJK segmentation, so Chinese/Japanese vaults are unsearchable beyond whole-token luck; and wikilink targets are stored raw, alias and heading attached (`utils/markdown.ts:79`), so backlinks to `[[Note#H|A]]` never resolve.

**Target pipeline** (all in `apps/server/src/services/index-db.ts`, plus a new `vault-scanner.ts`):

1. **Walk** — `readdir({withFileTypes:true})`, 16 dirs in flight, skipping `.obsidian`, `.trash`, `node_modules`, dot-dirs; collect `{path, size, mtimeMs}`.
2. **Diff** — one `Map` from `files`; compare `size` + `mtimeMs` + `parse_ver`, so a warm pass reads zero contents.
3. **Parse** — pool of `min(availableParallelism(), 8)`, `Bun.file().text()`, one regex pass for frontmatter, wikilinks/embeds, tags, headings, block ids, inline fields; `sha256` only on files already being read, so a cloud-sync `mtime` bump with identical bytes is a no-op.
4. **Write** — prepared statements, transactions of 500, `journal_mode=WAL`, `synchronous=NORMAL`; FTS `optimize` once per full build.
5. **Watch** — recursive `fs.watch` (already in `file-watcher.ts`), 250 ms per-path debounce with 2 s max-wait; `sync.watcherMode: "inotify" | "poll" | "off"`, since recursive watch is unreliable on SMB/NFS and inotify limits are the classic self-hoster failure.

Schema v2 (`index_meta.schemaVersion` gates the migration):

```sql
CREATE TABLE files (
  path TEXT PRIMARY KEY,          -- vault-relative, NFC-normalised, forward slashes
  path_norm TEXT NOT NULL,        -- lower(path): case-insensitive resolution
  size INTEGER NOT NULL, mtime_ms INTEGER NOT NULL,
  content_hash TEXT, parse_ver INTEGER NOT NULL DEFAULT 0,
  indexed_at INTEGER, status TEXT NOT NULL DEFAULT 'pending');
CREATE INDEX files_norm ON files(path_norm);
CREATE INDEX files_status ON files(status, indexed_at);

CREATE TABLE notes (path TEXT PRIMARY KEY REFERENCES files(path) ON DELETE CASCADE,
  title TEXT, body TEXT, word_count INTEGER, frontmatter_json TEXT, updated_at INTEGER);
CREATE VIRTUAL TABLE notes_fts USING fts5(title, body, tags, path UNINDEXED,
  content='notes', content_rowid='rowid', tokenize='porter unicode61');
CREATE VIRTUAL TABLE notes_fts_cjk USING fts5(title, body, tags, path UNINDEXED,
  content='', contentless_delete=1, tokenize='trigram');   -- verified: trigram needs ≥3 chars

CREATE TABLE links (source TEXT, target_raw TEXT, target_path TEXT,
  kind TEXT,                      -- wikilink | embed | markdown
  heading TEXT, block TEXT, alias TEXT);
CREATE TABLE tags  (tag TEXT, tag_norm TEXT, path TEXT, source TEXT);
CREATE TABLE properties (path TEXT, key TEXT, key_norm TEXT, value TEXT,
  kind TEXT,                      -- frontmatter | inline (Dataview-style), never executed
  line INTEGER);
CREATE TABLE headings (path TEXT, level INTEGER, text TEXT, slug TEXT, line INTEGER);
CREATE TABLE blocks   (path TEXT, block_id TEXT, line INTEGER);
```

**Background queue.** Single-flight scheduler with three priorities: the file just opened, phase-1 metadata (path, filename-as-title, folder) for everything, then phase-2 bodies. Search is served the moment phase 1 lands, so a 10k-note vault is name-searchable in about a second — the difference between opening a vault and watching a spinner. `GET /api/v1/index/status` returns `{phase, done, total, etaMs}`; the shell shows a progress strip rather than blocking. `routes/health.ts:34` still hardcodes `noteCount: 0` — wire it up.

**Targets** (10k notes, 50 MB, 4 vCPU, warm cache), each with its measurement method:

| Metric | Target | How |
|---|---|---|
| walk + diff, cold | ≤ 250 ms | `bun scripts/bench-index.ts` on the synthetic vault |
| walk + diff, warm (no changes) | ≤ 100 ms | same, second pass |
| phase 1 complete (searchable by name) | ≤ 1.5 s | timestamp at first `index/status.phase === "metadata"` |
| full cold index | ≤ 6 s | end-to-end, fresh DB |
| single-file incremental (fs event → searchable) | p95 ≤ 30 ms | 200 edits, loop timer |
| FTS query, selective term | p50 ≤ 5 ms | 100 queries, `performance.now()` |
| FTS query, term matching every note | p95 ≤ 100 ms | worst case, unavoidable bm25 |
| RSS during index | ≤ 300 MB | `/proc/self/status` sampling |

Sanity floor, measured here against a 40 MB / 10 000-file synthetic vault (Node 24 + `node:sqlite`, same SQLite C library Bun links): walk 37 ms, read all 195 ms, regex link extraction 14 ms, 10k inserts with FTS trigger 1 079 ms, selective FTS query < 1 ms, all-rows-match 73 ms — ~4× headroom for cold cache. CI fails past a 2× regression; results in `bench/results/*.json` (gitignored), `--quick` 2k mode for CI.

## 4. Vault conformance

`.obsidian` is plain JSON whose *name is configurable* ("Override config folder", e.g. `.obsidian-awesome`), so detection globs `.obsidian*` and accepts `MINO_OBSIDIAN_VAULT_CONFIG_DIR`; never hardcode the string.

| File | Contents | Mino behaviour |
|---|---|---|
| `app.json` | `attachmentFolderPath`, `newFileLocation`, `newLinkFormat`, `useMarkdownLinks`, `alwaysUpdateLinks`, `showUnsupportedFiles`, `trashOption`, `userIgnoreFilters` | honour for new files, attachments and link generation; ignore keys with no Mino equivalent (e.g. `legacyEditor`) |
| `appearance.json` | `theme`, `cssTheme`, `baseFontSize`, `enabledCssSnippets`, font families, `accentColor` | map to Mino theme tokens; load selected theme + enabled snippets |
| `workspace.json`, `workspaces.json` | open panes, `lastOpenFiles` | **read-only**. These change on every file open; two writers corrupt the user's layout. Persist Mino layout to `.mino/workspace.json`. |
| `community-plugins.json` | enabled plugin ids — array in current builds, `{id: bool}` in old ones | accept both; absence is not an error |
| `core-plugins.json` | same two shapes; a *disabled* core plugin is a feature Mino should hide | accept both, map to Mino capabilities |
| `hotkeys.json` | `{"<command-id>": [{modifiers:["Mod","Shift"], key:"T"}]}` | surface as command-palette hints; `Mod` = Cmd/Ctrl |
| `themes/<name>/theme.css`, `manifest.json` | theme CSS | serve as CSS variables/scoped styles; never copy into the image |
| `snippets/*.css` | user CSS | serve when `appearance.enabledCssSnippets` lists it |
| `plugins/<id>/{manifest.json,main.js,styles.css,data.json}` | plugin bundle | inventory (§6), execute only via §2 |

**Never point Mino's plugin loader at `.obsidian/plugins`.** `apps/server/src/plugins/registry.ts:167` reads `manifest.json` from `dataDir/plugins` and would happily list community plugins as enabled Mino server plugins, with none of their code running. The two plugin systems must stay in separate roots.

Markdown semantics to implement, in one pass per file:

| Syntax | Example | Rule |
|---|---|---|
| Wikilink | `[[Target]]`, `[[Target\|alias]]`, `[[Target#Heading]]`, `[[Target#^block]]`, `[[#Heading]]` | split alias → heading → block, in that order; `[[#H]]` is same-file |
| Embed | `![[Note]]`, `![[Note#H]]`, `![[img.png\|300]]` | kind `embed`; numeric alias is a width, not a link text |
| Markdown link | `[x](../a/b.md)`, `<…>` paths | resolve relative to the source file's folder |
| Tag | `#nested/tag`, frontmatter `tags:` / `tag:` | skip inside code fences and inline code; skip `#` in URLs and headings; index `tag_norm` lowercased, display original |
| Callout | `> [!warning] Title`, `> [!note]-` folded | parse type/title/fold; render, do not execute |
| Frontmatter properties | `status: done`, `tags: [a, b]` | typed into `properties` |
| Dataview inline field | `key:: value`, `[key:: value]`, `(key:: value)` | **recognise, never execute**. Store `kind='inline'`; a dataview fenced block renders as code plus a "requires the Dataview plugin" note |
| Block id | trailing `^abc123` | into `blocks`; duplicate ids in one file → warn, keep first |

Resolution order for `[[X]]` must match `MetadataCache.getFirstLinkpathDest` (`obsidian.d.ts:6460`): exact vault path → path relative to the source folder → unique filename anywhere → case-insensitive repeat of all three → unresolved (kept in `unresolvedLinks`, which ghost-link UIs need). Two hard-won details: normalise to **NFC** on read (macOS hands you NFD, so `é` in a link and in a filename are different bytes), and detect case-insensitive path collisions — on a case-sensitive filesystem those are two notes, in Obsidian one, and silently picking one is a data-loss bug.

`.trash/` holds Obsidian's local deletions (`trashOption: "local"`): exclude from the index, keep restorable. Attachments live where `attachmentFolderPath` says (`./`, a folder, or `/`) — index as `files`, never parse as notes. `.canvas` is JSON, out of scope, but must survive a round-trip untouched.

## 5. Phased delivery

One session per phase, one risk retired each. Work items live beside the code: briefs under `docs/plan/phases/` (this file is the index), API docs under `docs-site/api/endpoints/*.md` plus `docs-site/mint.json` nav, per `DOCS_POLICY.md`. If AI_TEMPLATE gates are adopted here, briefs become `KIND=task` capability files under `.agents/` and each acceptance criterion a `project.toml` check; until then `bun test` plus typecheck are the deterministic gate.

| Phase | Goal | Files | Acceptance | Risk retired |
|---|---|---|---|---|
| **P0** | Walking skeleton: detect vault, inspect config, inventory plugins, show it | `apps/server/src/services/obsidian-vault.ts`, `apps/server/src/routes/vault.ts`, `apps/server/tests/obsidian-vault.test.ts`, `apps/web/app/settings/vault/page.tsx`, `apps/web/lib/vault.ts` | `bun test apps/server/tests/obsidian-vault.test.ts`; `curl -H "X-Mino-Key: $KEY" localhost:3000/api/v1/vault/obsidian \| jq .data.counts` on the fixture | "we cannot even see a vault" |
| **P1** | Read path correctness: wikilinks/embeds/tags/callouts, case-insensitive resolution, `.trash`, attachments | `apps/server/src/utils/markdown.ts`, `apps/server/src/services/index-db.ts`, new `apps/server/tests/vault-conformance.test.ts` | fixture vault with 30 known links: `bun test vault-conformance`; backlinks for `[[Note#H\|A]]` resolve to one target | silent link/backlink corruption |
| **P2** | Index speed: schema v2, scanner, queue, benchmark | `apps/server/src/services/index-db.ts`, new `vault-scanner.ts`, `apps/server/src/routes/index-status.ts`, `scripts/bench-index.ts` | `bun scripts/bench-index.ts --notes 10000` prints a table within §3 targets; `/api/v1/index/status` reaches `phase:"done"` | "10k notes makes the app unusable" |
| **P3** | Plugin host, tier A: loader, RPC, core shims, one fixture plugin we wrote | `apps/web/vault-host/*`, `apps/server/src/routes/vault-host.ts`, `apps/server/tests/plugin-host.test.ts`, `apps/server/tests/fixtures/plugins/hello-world/*` | fixture plugin loads, registers a command, opens a pane, writes `data.json`; `bun test plugin-host`; e2e smoke in `apps/web/tests` | arbitrary code execution escapes the sandbox |
| **P4** | Compatibility breadth: Dataview/Tasks/Templater gaps, `requestUrl` proxy, per-plugin compatibility report | `apps/web/vault-host/shims/*`, `apps/server/src/routes/vault.ts` (+`/request-url`, `/render`) | manual matrix of 10 real plugins recorded in `docs/plugin-compat.md`; tier shown per plugin in the UI | "it only runs our demo plugin" |
| **P5** | Packaging + hardening: vault volume, uid mapping, healthcheck covers index, docs | `docker/docker-compose.yml`, `docker/Dockerfile`, `apps/server/src/routes/health.ts`, `docs-site/deployment/*` | container starts against a bind-mounted vault, `HEALTHCHECK` green during a cold index, `docs-site` build passes | self-hosters can't mount a vault |

From `docker-obsidian` (`/tmp/explore/docker-obsidian/README.md:14-15,156-160`) take one image and a single volume, not s6: mount the vault (`-v /srv/vault:/vault`), resolve it with `MINO_OBSIDIAN_VAULT=/vault`, and document `user:` for UID alignment — a root-owned index against a user-owned vault produces permission errors that read as bugs.

## 6. First slice (next week)

The server half is in the working tree; done means a fixture vault, an API call and a screen that agree.

1. **Service** — `obsidian-vault.ts`: detection (`.obsidian*` glob, `MINO_OBSIDIAN_VAULT`), `app.json`/`appearance.json` parsing, `community-plugins.json` in both shapes, per-plugin `manifest.json` inventory with `isDesktopOnly`/`hasMain`, themes and snippets, warnings for enabled-but-missing and manifest-without-`main.js`.
2. **Route** — `GET /api/v1/vault/obsidian` → `{detected, root, config, plugins[], themes[], snippets[], counts, warnings[]}`; `detected:false` with HTTP 200 when there is no vault.
3. **Fixture** — move the inline builder in the test to `apps/server/tests/fixtures/obsidian-vault/` so web tests and conformance tests share one reviewable vault (notes, nested folder, the four config JSON files, two plugins with `main.js`, one without, one `isDesktopOnly`, a theme, a snippet, one unknown key to prove forward-compatibility).
4. **UI** — `apps/web/lib/vault.ts` (typed fetch, following `apps/web/lib/api.ts`), `components/vault/vault-summary.tsx` (counts, plugin table with tier/enabled/desktop-only badges, warnings), `app/settings/vault/page.tsx`, wired into `buildSettingsTabs`; strings in `apps/web/messages/{en,de,es}.json` (`i18n-coverage.test.ts` fails on a missing key).
5. **Docs** — `docs-site/api/endpoints/vault-inspect.md` plus a `docs-site/mint.json` nav entry.

**Demo:** a real vault in `data/notes` (or `MINO_OBSIDIAN_VAULT`) → `bun run dev` in `apps/server` → `curl /api/v1/vault/obsidian` returns `detected:true` with real plugin counts → Settings → Vault shows plugins, enabled/desktop-only counts, warnings → toggling a plugin in Mino leaves `.obsidian/community-plugins.json` **unwritten** (asserted in the test).

Acceptance: `bun test apps/server/tests/obsidian-vault.test.ts`, `bun run typecheck`, `pnpm --filter @mino-ink/web test` (i18n coverage included), one curl, one screenshot. Nothing here executes plugin code, so no host is required.

## 7. Risks and non-goals

| Risk | Impact | Mitigation |
|---|---|---|
| Plugin sandbox escape | full account compromise via a malicious plugin | opaque-origin iframe, no API key in frame, scoped token, audit log, `requestUrl` denied by default |
| Writing `.obsidian/workspace.json` / `hotkeys.json` corrupts a live Obsidian session | user data loss | read-only except `plugins/<id>/data.json`; assert in tests |
| Community plugin licence forbids redistribution | legal exposure | never bundle; load from user's vault only; document it |
| Index churn on huge vaults (100k notes) | OOM, thrash | hard cap + explicit "large vault" mode, streaming writes |
| CJK vaults unsearchable | product is useless in a large market | trigram FTS verified (queries need ≥3 characters: `双向链接` matches, `双向` does not) + Chinese fixtures in CI |
| Plugin API drift (Obsidian ships often) | shims rot | pin compatibility to `obsidian.d.ts` version in `package.json`, CI job diffs the next release |
| Scope creep into "run Obsidian" | infinite project | the non-goals below |

**Non-goals.** Mobile/Electron-only plugins (tier C/D). Sync and Publish protocol clients. Any use of Obsidian's licence, account or paid features. Canvas, Bases, Excalidraw. A pixel-perfect Obsidian UI. Binary compatibility with its IndexedDB cache. Reading outside the vault root.

**Do not do this.** Do not unpackage or port the Obsidian app. Do not ship its `app.css`, icon font or bundled themes. Do not mirror the community plugin directory or auto-update plugins (Obsidian's developer policy forbids self-updating plugins; ours should too). Do not present `.obsidian` writes as normal operation — a compat exception, with backup. Do not let a plugin reach the network without an explicit grant. Do not claim "runs your Obsidian plugins" without the tier table; that sentence is a support contract.

## 8. What REA can and cannot contribute

REA analyses shipped artifacts — native binaries, APK/IPA, firmware, ASAR, and `analyze_javascript_application` on extracted JS trees (`/tmp/explore/rea/.agents/skills/reverse-engineer-anything/SKILL.md:86-87`). Its own first instruction is to skip it "for ordinary source-repository architecture analysis" (`:3`), which is most of this document.

**Can contribute, narrowly:** one static pass over each plugin's `main.js` to inventory `require(...)` targets and `obsidian` members used — the histogram that turns §2's tier table from a guess into data. That is also ~100 lines of AST scanning in `scripts/plugin-api-usage.ts`, runnable in CI and reviewable as JSON, so REA is optional and its evidence workflow is heavier than the problem.

**Cannot contribute:** a licence or legal cover; API semantics (the MIT `.d.ts` is authoritative and cheaper); validation that our shims behave like Obsidian; parity (only fixtures and a licensed Obsidian install do that); anything about future plugin formats. Analysing the Obsidian AppImage yields knowledge we may not port — observation is legal, contamination is not, and the boundary is unenforceable once decompiled output sits in an agent's context. **Do not run REA against Obsidian itself.** If ever, only on a specific plugin blocking a tier-B fix, and never paste its output into the repo.

## References

Read in this repo: `apps/server/src/services/index-db.ts`, `note-service.ts`, `file-manager.ts`, `file-watcher.ts`, `apps/server/src/utils/markdown.ts`, `paths.ts`, `apps/server/src/plugins/{types,registry}.ts`, `apps/server/src/plugins/builtin/obsidian-import/plugin.json`, `apps/server/src/routes/{notes,search,plugins,health,system}.ts`, `apps/server/src/server.ts`, `config/schema.ts`, `tests/{helpers/setup,notes,obsidian-vault}.test.ts`, `apps/web/lib/plugins.ts`, `apps/web/app/settings/plugins/page.tsx`, `docker/docker-compose.yml`, `docs/architecture.md`, `DOCS_POLICY.md`.

External: [`obsidian.d.ts` (MIT, v1.14.4)](https://github.com/obsidianmd/obsidian-api/blob/master/obsidian.d.ts) and its [`package.json`](https://raw.githubusercontent.com/obsidianmd/obsidian-api/master/package.json) · [Developer policies](https://github.com/obsidianmd/obsidian-developer-docs/blob/main/en/Community%20directory/Developer%20policies.md) · [Build a plugin](https://github.com/obsidianmd/obsidian-developer-docs/blob/main/en/Plugins/Getting%20started/Build%20a%20plugin.md) · [How Obsidian stores data](https://github.com/obsidianmd/obsidian-help/blob/master/en/Files%20and%20folders/How%20Obsidian%20stores%20data.md) · [Configuration folder](https://github.com/obsidianmd/obsidian-help/blob/master/en/Files%20and%20folders/Configuration%20folder.md) · [LinuxServer.io Obsidian image](https://github.com/linuxserver/docker-obsidian) · [REA `SKILL.md`](https://github.com/morluto/rea/blob/main/.agents/skills/reverse-engineer-anything/SKILL.md).
