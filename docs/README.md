# 🟣 Mino — Documentation

> A comprehensive, end-to-end blueprint for building the Mino knowledge platform.

---

## Quick Links

| Document | Contents |
|----------|----------|
| [**Design System**](./design-system.md) | Colors, typography, components, logo usage, glassmorphism effects |
| [**Architecture**](./architecture.md) | Tech stack, three-layer model, deployment, hosting, Docker, CI/CD |
| [**Relay**](./relay.md) | Managed relay design, required env vars, deployment flow, open-port fallback |
| [**Server**](./server.md) | Mino server, auto-bootstrap, REST API, built-in UI, plugins, sandbox |
| [**Frontend**](./frontend.md) | mino.ink (Cloudflare Pages), local UI, mobile apps, hybrid auth |
| [**AI Agent**](./ai-agent.md) | "The Organizer" agent, server-hosted runtime, plugin install, MCP |
| [**Integrations**](./integrations.md) | MCP setup plus Cursor and Antigravity integration examples |
| [**Security**](./security.md) | Current API-key auth model, credential flow, hardening checklist |
| [**Roadmap**](./roadmap.md) | Phased plan, deployment priorities, risk analysis, open questions |
| [**Growth**](./growth.md) | Early-access funnel, Search Console analysis, SEO changes, how to read signups |

---

## What Mino Is

Mino is an **open-source, markdown-based knowledge platform** where your notes live as plain `.md` files in folder trees, managed by a self-hosted server, accessible through beautiful interfaces (web + mobile), and maintained by AI agents.

### Three Pillars

| Pillar | Meaning |
|--------|---------|
| **Modularity** | Server, web, mobile, agent — all independent. Swap any piece. Run everything locally or split across services. |
| **Agent-Native** | The AI agent is not bolted on — it runs server-side as the primary way power users interact. The API is designed for agents first, humans second. |
| **Open-Source First** | Every component is open-source. Self-hosting is a first-class experience. One Docker Compose = fully running server. |

### Hosting Model

Mino follows a **hybrid hosting model** — the server runs on your infrastructure, and the web UI can come from anywhere:

| Mode | Description | Requires Account? |
|------|-------------|-------------------|
| **mino.ink + self-hosted server** | Use the hosted web UI at mino.ink, link your own server via credentials | No account required today (Google sign-in is planned) |
| **mino.ink free tier** | Planned managed server hosted by mino.ink — no self-hosting, no setup | Planned |
| **Fully self-hosted** | Run the Docker image, which includes the full web UI at `http://server:3000` | ❌ No account needed |
| **API / CLI / MCP only** | Talk directly to the server API using generated credentials | ❌ No account needed |

### Target Audience

1. **Primary:** Developers who use AI coding agents (Antigravity, Cursor, Claude Code, Windsurf) and want their knowledge base to be agent-accessible and agent-maintained.
2. **Secondary:** Technical knowledge workers who want a self-hosted, privacy-first alternative to Notion/Obsidian with AI superpowers.
3. **Tertiary:** Teams and organizations wanting a shared knowledge base with AI-powered organization.

### The Key Insight

Most note-taking apps treat AI as a feature. **Mino treats the AI agent as a first-class user.** The API, the file structure, the search capabilities — everything is designed so that an AI agent can efficiently navigate, understand, modify, and organize a vault of thousands of notes with minimal token usage and maximum accuracy.

---

> **This is a living blueprint.** Update individual docs as decisions are made and the project evolves.
>
> Web docs endpoint: `test.mino.ink/docs` renders the repository `/docs-site` folder.
> Internal blueprint docs remain in `/docs` for architecture and planning content.
>
> *Last updated: 2026-02-13*

## Documentation index

<!-- repoctl:index -->
### Start and operate

| Read | Owns | Reach for it when |
|---|---|---|
| [`../AGENTS.md`](../AGENTS.md) | Agent operating contract and trigger router | Any change is requested. |
| [`../VISION.md`](../VISION.md) | Accepted product direction, constraints, and success evidence | Starting a project or making a high-impact scope decision. |
| [`ADAPTATION.md`](./ADAPTATION.md) | Lean core, artifact lifecycle, packs, and capability patterns | Turning the template into a project without generating unnecessary structure. |
| [`ERROR_LOG.md`](./ERROR_LOG.md) | Solved failure signatures and permanent fixes | A recurring failure needs a durable regression/fix record. |
| [`ISSUE_TEMPLATE.md`](./ISSUE_TEMPLATE.md) | Canonical issue shape and labels | Filing or materially updating an issue. |
| [`adopt.md`](./adopt.md) | make adopt: what it merges, renames, and keeps in an existing repository | Bringing the kit into a repo that already has files. |
| [`audit.md`](./audit.md) | Whole-repository audit protocol | Finding, prioritizing, and filing improvements without implementing them. |
| [`bindings.md`](./bindings.md) | Doc-code bindings, staleness, owed docs, and the Docs-Unaffected trailer | A document and its code drift apart, or a commit must exempt a document. |
| [`building.md`](./building.md) | Product driver: feature list, research record, make next phases, product done, UI review | building or judging a product |
| [`collaboration.md`](./collaboration.md) | Sharing work: fetch, push, pull-first, CI after push, claims, issue comment types | several people or agents work on one repository |
| [`delegation.md`](./delegation.md) | Briefs, returns, verdicts | Work needs separate context or independence. |
| [`experiments.md`](./experiments.md) | Measured goals: true objective, evaluation ladder, local lab, experiment ledger | A goal is a measured score or metric, or real evaluations are slow, costly, or limited |
| [`generated-files.md`](./generated-files.md) | Derived files, host adapters, and generated blocks | A generated file looks wrong, or a new agent host is added. |
| [`hygiene.md`](./hygiene.md) | Deprecation markers, orphan files, change coupling, and product guardrails | Code or files look stale, duplicated, or ownerless. |
| [`kit-update.md`](./kit-update.md) | The kit lock, make kit-update, and the golden-path test | A kit fix must reach projects, or a project updates from the template. |
| [`operations.md`](./operations.md) | Failure loop and error ledger rules | A bug, outage, flaky test, or operational failure occurs. |
| [`production.md`](./production.md) | Production evidence and release boundary | A real project is being prepared for deployment or release. |
| [`self-healing.md`](./self-healing.md) | When a check may block, lifecycle hooks, failure output, ceremony by risk, and the gardener | A check fails, a gate blocks, or the kit itself changes. |
| [`verification.md`](./verification.md) | Evidence, quality loop | Substantial work before implementation; review or quality claim. |
| [`incidents/README.md`](./incidents/README.md) | Reviewed public incident record boundary | A public incident is promoted or a regression artifact is reviewed. |

### Design and engineering

| Read | Owns | Reach for it when |
|---|---|---|
| [`../CONTEXT.md`](../CONTEXT.md) | Project vocabulary | A term is ambiguous or a domain model changes. |
| [`../CONTRIBUTING.md`](../CONTRIBUTING.md) | Human contribution and review flow | A person or agent prepares a branch or pull request. |
| [`../SECURITY.md`](../SECURITY.md) | Vulnerability disclosure and security contact | A vulnerability or security-sensitive change is involved. |
| [`../.security/threat-model.md`](../.security/threat-model.md) | STRIDE threat model and accepted trust boundaries | A security-sensitive tool, CI path, or agent permission is reviewed. |
| [`STACK-DECISION.md`](./STACK-DECISION.md) | Chosen stack and the alternatives that lost | Adding a runtime, framework or storage layer. |
| [`ai-agent.md`](./ai-agent.md) | AI Agent ("The Organizer") | Working on ai agent ("the organizer"). |
| [`architecture.md`](./architecture.md) | Architecture | Working on architecture. |
| [`design-system.md`](./design-system.md) | Design System | Working on design system. |
| [`design.md`](./design.md) | Visual direction, tokens and UX principles | Before any UI work. |
| [`engineering.md`](./engineering.md) | Modular design, single source of truth, dependency, cleanup rules | Code changed, refactored, or reviewed; deep modules. |
| [`forms.md`](./forms.md) | Modular forms: definitions, renderer, bot-protection tiers | Adding a form, changing fields, or hardening against bots. |
| [`frontend.md`](./frontend.md) | Frontend | Working on frontend. |
| [`growth.md`](./growth.md) | Growth — launch list, search, and what to measure | Working on growth — launch list, search, and what to measure. |
| [`integrations.md`](./integrations.md) | Agent Integrations | Working on agent integrations. |
| [`model-integration.md`](./model-integration.md) | Confining a language model inside a product: code decides, the model reads and writes, votes, grounding, shadow mode, measured confidence | code calls a model at runtime or model output reaches a decision |
| [`relay.md`](./relay.md) | Relay | Working on relay. |
| [`roadmap.md`](./roadmap.md) | Roadmap | Working on roadmap. |
| [`security.md`](./security.md) | Security & Code Quality | Working on security & code quality. |
| [`server.md`](./server.md) | The Mino Server | Working on the mino server. |
| [`architecture/README.md`](./architecture/README.md) | Architecture map | How the parts of Mino fit together. |
| [`copy/launch-confirmation-email.md`](./copy/launch-confirmation-email.md) | Launch-list confirmation email — Mailspool copy and markup | Editing the signup email or its Mailspool transport. |
| [`copy/mailspool-form.md`](./copy/mailspool-form.md) | Mailspool form copy — Mino launch list | Working on mailspool form copy — mino launch list. |
| [`examples/antigravity-skill.md`](./examples/antigravity-skill.md) | Antigravity Skill Example (Mino) | Working on antigravity skill example (mino). |
| [`examples/cursor-rules.md`](./examples/cursor-rules.md) | Cursor Rules (Mino MCP) | Working on cursor rules (mino mcp). |
| [`plan/README.md`](./plan/README.md) | Plan — Mino as a self-hosted Obsidian alternative with an agent inside | Working on plan — mino as a self-hosted obsidian alternative with an agent inside. |
| [`plan/obsidian-parity.md`](./plan/obsidian-parity.md) | Obsidian parity | Working on obsidian parity. |

### Product, privacy, and launch

| Read | Owns | Reach for it when |
|---|---|---|
| [`privacy.md`](./privacy.md) | Privacy-by-design engineering and rights workflow | Personal data, telemetry, cookies, retention, or user rights exist. |
| [`legal/README.md`](./legal/README.md) | Jurisdiction and counsel gate | Public terms, privacy notice, Impressum, cookies, or launch copy is drafted. |
| [`legal/cookies.template.md`](./legal/cookies.template.md) | Browser-storage inventory scaffold | Cookies, local storage, pixels, or embeds are introduced. |
| [`legal/data-inventory.md`](./legal/data-inventory.md) | Factual data-flow inventory | A data field, vendor, retention period, or transfer is added. |
| [`legal/impressum.template.md`](./legal/impressum.template.md) | Draft provider-information scaffold | A public operator notice is required. |
| [`legal/privacy-notice.template.md`](./legal/privacy-notice.template.md) | Draft privacy-notice scaffold | A public privacy notice is prepared for factual completion and review. |
| [`legal/terms.template.md`](./legal/terms.template.md) | Draft terms scaffold | Public terms are prepared for factual completion and review. |
| [`product/research.md`](./product/research.md) | Sources that shaped the product and the vault work | Before changing positioning, sync or plugin compatibility. |

### Extensibility and evidence

| Read | Owns | Reach for it when |
|---|---|---|
| [`capabilities.md`](./capabilities.md) | How to add, find, or switch off a capability or pack, and the configuration policy | You add, find, or switch off a skill, role, doc, rule, check, command, MCP route, or pack. |
| [`evals.md`](./evals.md) | Fresh-agent navigation evals and scored build trials | AGENTS.md, the docs, a skill, or a gate changed and needs fresh-agent evidence. |
| [`resources.md`](./resources.md) | Sources and intake | Absorb notes/URLs; capability, example, docs, gate. |
| [`skills.md`](./skills.md) | Skill discovery, provenance, and overlap rules | A task needs a capability the repository does not provide. |
| [`adr/0001-issue-backed-write-ahead.md`](./adr/0001-issue-backed-write-ahead.md) | Accepted write-ahead and documentation-boundary decision | You need the rationale for issue-backed continuity. |
| [`adr/0002-one-capability-model.md`](./adr/0002-one-capability-model.md) | The capability model: kinds, declaration fields, discovery, packs, and what is out of scope | You add, find, or switch off a skill, role, doc, rule, check, command, MCP route, or pack. |
| [`adr/README.md`](./adr/README.md) | Architecture decision record rules | A hard-to-reverse, surprising trade-off is made. |
<!-- /repoctl:index -->
