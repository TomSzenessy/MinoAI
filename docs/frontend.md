# Frontend

> mino.ink (Cloudflare Pages), built-in server UI, hybrid auth, and mobile apps.

[← Back to docs](./README.md)

---

## The Web Interface (mino.ink)

### Hosting: Cloudflare Pages (Free)

The mino.ink website is a **static Next.js export** deployed to Cloudflare Pages. It's a thin shell — all data processing, storage, and AI happen on the user's linked server.

```
mino.ink / test.mino.ink (Cloudflare Pages)
  ├─ Static HTML/JS/CSS (Next.js static export)
  ├─ Landing page + workspace shell
  ├─ Dedicated /link handler (prefilled URL support)
  ├─ Local profile auth (API key in localStorage)
  ├─ Docs explorer (reads /docs)
  └─ All API calls → user's server (direct HTTPS or Cloudflare Tunnel)
```

### The Same UI, Everywhere

The exact same Next.js app is served from two places:

| Source                 | URL                                          | When to use                                  |
| ---------------------- | -------------------------------------------- | -------------------------------------------- |
| **Cloudflare Pages**   | `https://test.mino.ink` / `https://mino.ink` | Remote access to any linked server           |
| **Built-in server UI** | `http://localhost:3000/`                     | Local access, air-gapped, no internet needed |

The built-in UI works identically to mino.ink — it's the same code, just served from the Docker container's static files instead of Cloudflare.

### Current Auth Model

Current implementation is API-key profile linking with local persistence:

| Mode | How it works | Credentials stored | Multi-device? |
| --- | --- | --- | --- |
| **Linked profile** | Open `/link` (prefilled URL or manual), verify, link, and store profile | `localStorage` | ❌ Manual per browser/device |
| **Local demo mode** | Open `/workspace?mode=local` for a no-server walkthrough | in-memory/local | ❌ Local only |

Planned but not yet shipped in this repo:
1. Google account sync for linked server profiles.
2. Managed free-tier hosted vaults.

### Page Structure

| Page              | Path                      | Description                                                                                          |
| ----------------- | ------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Landing**       | `/`                       | Marketing + onboarding entrypoint                                                                    |
| **Link Server**   | `/link`                   | Dedicated handler that parses `serverUrl` + `apiKey`, verifies, links, stores profile, and redirects |
| **Workspace**     | `/workspace?profile=<id>` | Main shell with linked-server status and authenticated note list                                     |
| **Docs Explorer** | `/docs`                   | Serves documentation from the repository `/docs` folder                                                |

### `/link` Handler Contract

Flow for `GET /link?serverUrl=...&apiKey=...`:

1. Parse query params.
2. Normalize and validate `serverUrl`.
3. Call `POST /api/v1/auth/verify` using `X-Mino-Key`.
4. Call `POST /api/v1/auth/link`.
5. Persist linked server profile in localStorage.
6. Remove `apiKey` from browser URL (`history.replaceState`).
7. Redirect to `/workspace?profile=<id>`.

If params are missing or invalid, `/link` shows a manual fallback form.

### Cloudflare Pages Build Settings

Use two Pages projects (test + production) with the same build pipeline.

Relay note:

- The `/link?relayCode=...` flow depends on a running relay backend.
- See `docs/relay.md` for relay deployment and required server variables.

#### Test project (`test.mino.ink`)

- Framework preset: `None`
- Build command: `pnpm install --no-frozen-lockfile && pnpm --filter @mino-ink/web build`
- Build output directory: `apps/web/out`
- Root directory: `/`
- Environment variables:
    - `NODE_VERSION=20`
    - `NEXT_PUBLIC_APP_ENV=test`
    - `NEXT_PUBLIC_APP_ORIGIN=https://test.mino.ink`
    - `NEXT_PUBLIC_DEFAULT_LINK_TARGET=https://test.mino.ink`
    - `NEXT_PUBLIC_RELAY_URL=https://relay.mino.ink`

#### Production project (`mino.ink`)

- Same build settings as test
- Environment variables:
    - `NODE_VERSION=20`
    - `NEXT_PUBLIC_APP_ENV=production`
    - `NEXT_PUBLIC_APP_ORIGIN=https://mino.ink`
    - `NEXT_PUBLIC_DEFAULT_LINK_TARGET=https://mino.ink`
    - `NEXT_PUBLIC_RELAY_URL=https://relay.mino.ink`

### Current Workspace Features

- Left sidebar with file tree, server picker dropdown, and inline settings entry.
- Note list with real filtering (title/path/tags) and controlled search input.
- Obsidian-style title editing (`h1` title field directly updates markdown content).
- Command palette (`Cmd/Ctrl+K`) with note search + workspace actions.
- Hotkeys: `Cmd/Ctrl+N` (new note), `Cmd/Ctrl+J` (toggle agent panel), `Cmd/Ctrl+,` (settings).
- Agent chat slide-out panel backed by `/api/v1/agent/chat`.
- Settings tabs for Server, Agent, Channels (Telegram/WhatsApp), and Plugins.
- Landing behavior for linked users: "Get Started" resumes workspace; "My Relays" shortcut opens server settings.

### Landing Page Design

Keep the existing mino.ink design language, updated with logo-derived brand colors:

- Deep dark background (`#121212` base, `#1E1E1E` surfaces)
- `#BB86FC` purple gradient orbs with blur effects
- Grid pattern overlay with faint purple tint
- Mouse-reactive parallax elements
- Feature cards with glass effect and purple-tinted borders
- The Mino logo (three vertical pills + "ino" text) from `logo.svg`

---

## Mobile Apps (iOS & Android)

### Technology Choice: React Native + Expo

**Why not Flutter?** React Native + Expo enables:

- Shared TypeScript types with the server
- Shared API client with the web app
- Shared markdown parsing logic
- Shared React components (via `react-native-web` bridge)
- OTA updates without app store review
- Single codebase for iOS + Android

### Mobile Architecture

```
┌─ Mobile App ──────────────────────────────────────────┐
│                                                        │
│  ┌──────────────────────────────────────────────┐     │
│  │           UI Layer (React Native)             │     │
│  │  NoteList │ Editor │ Search │ Settings │ Chat │     │
│  └──────────────────┬───────────────────────────┘     │
│                      │                                 │
│  ┌──────────────────┴───────────────────────────┐     │
│  │           State (Zustand + Yjs)               │     │
│  └──────────────────┬───────────────────────────┘     │
│                      │                                 │
│  ┌──────────────────┴───────────────────────────┐     │
│  │           Local Storage (SQLite via expo)     │     │
│  │  Full offline copy of all notes + index       │     │
│  └──────────────────┬───────────────────────────┘     │
│                      │                                 │
│  ┌──────────────────┴───────────────────────────┐     │
│  │           Sync Engine (Yjs + WebSocket)        │     │
│  │  Offline queue → sync when online              │     │
│  └──────────────────────────────────────────────┘     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Offline-First

- All notes are stored locally in SQLite on the device
- Edits are queued when offline and synced via CRDTs when reconnected
- Conflict resolution is automatic (Yjs CRDT)
- Server selector in settings lets users point to ANY Mino server

### Mobile Auth & Server Setup

```
1. Open Mino app
2. Option A: Sign in with Google → auto-discovers all linked servers
3. Option B: Enter server URL + API key manually (no Google needed)
4. Select a server → app syncs notes to local SQLite
5. Works fully offline after first sync
```

### Multi-Server Support

The mobile app maintains a list of connected servers:

```typescript
interface ServerConfig {
	id: string;
	name: string; // "Personal", "Work", etc.
	endpoint: string; // "https://my-server.com" or tunnel URL
	authToken: string; // API key or JWT
	syncEnabled: boolean;
	lastSyncedAt: Date;
}
```

Users can switch between servers or view notes from all servers in a unified view.
