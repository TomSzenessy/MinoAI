# Frontend

> mino.ink (Cloudflare Pages), built-in server UI, hybrid auth, and mobile apps.

[← Back to docs](./README.md)

---

## The Web Interface (mino.ink)

### Hosting: Cloudflare Pages (Free)

The mino.ink website is a **static Next.js export** deployed to Cloudflare Pages. It's a thin shell — all data processing, storage, and AI happen on the user's linked server.

```
mino.ink (Cloudflare Pages)
  ├─ Static HTML/JS/CSS (Next.js static export)
  ├─ Landing page, docs, marketing
  ├─ Auth: Google sign-in (optional) or anonymous (localStorage)
  ├─ Server linker: paste credentials or use linked account
  └─ All API calls → user's server (direct HTTPS or Cloudflare Tunnel)
```

### The Same UI, Everywhere

The exact same Next.js app is served from two places:

| Source | URL | When to use |
|--------|-----|-------------|
| **Cloudflare Pages** | `https://mino.ink/w/...` | Remote access to any linked server |
| **Built-in server UI** | `http://localhost:3000/` | Local access, air-gapped, no internet needed |

The built-in UI works identically to mino.ink — it's the same code, just served from the Docker container's static files instead of Cloudflare.

### Hybrid Auth Model

No account is ever required. Users have three options:

| Mode | How it works | Credentials stored | Multi-device? |
|------|-------------|-------------------|---------------|
| **Anonymous** | Paste server URL + API key into mino.ink | `localStorage` only | ❌ Manual per device |
| **Google sign-in** | Sign in with Google → link server(s) to account | Server-side (mino.ink DB) | ✅ Auto-syncs linked servers |
| **Local instance** | Open `http://localhost:3000` → auto-connected | Server's own credentials | ❌ One device |

**The Google account doesn't store notes.** It only stores *which servers the user has linked*. Notes always live on the user's server.

### Free Tier (No Self-Hosting Required)

When a user signs into mino.ink with Google but doesn't link a server, they get a **free managed instance**:

- Limited storage (e.g. 100MB / 1000 notes)
- Core features: notes, search, folders, tags
- AI Agent: bring your own API key (OpenAI/Anthropic)
- No local tools (Whisper, OCR) — API keys required for those
- No sandbox, no custom plugins
- Upgrade path: deploy your own server for unlimited everything

### Page Structure

| Page | Path | Description |
|------|------|-------------|
| **Landing** | `/` | Marketing site with features, use cases, pricing |
| **Login** | `/login` | Google OAuth or skip (anonymous credentials mode) |
| **Link Server** | `/link` | Paste server URL + API key, or scan QR code |
| **Workspace** | `/w/:workspace` | Main editor + sidebar + note list |
| **Settings** | `/settings` | Server config, theme, plugins, agent setup, API keys |
| **Plugin Marketplace** | `/settings/plugins` | Browse, install, configure plugins |
| **API Docs** | `/docs` | Interactive API documentation |

### Workspace Layout (from screen.png mockup)

```
┌─────────────────────────────────────────────────────────────┐
│  [≡] WORKSPACE               [👤+3] [Share] [Publish]       │
├────────────┬────────────────────────────────────────────┬────┤
│            │  Projects > Project_Alpha.md               │    │
│  📁 Projects│                                           │ [A]│
│   ├─ Project │  1  # Project Alpha: System Architecture │ [🖼]│
│   ├─ Roadmap │  2                                       │ [🔗]│
│  📁 Daily    │  3  ## Core Objectives                   │ [✏]│
│   ├─ Personal│  4  - Establish robust sync using CRDTs. │    │
│   └─ Ideas   │  5  - Implement end-to-end encryption.   │    │
│  📁 Archive  │  ...                                      │    │
│            │                                             │    │
│ [⚙] [👥]  │                                             │    │
│ Storage 42%│  ● SYNCED  UTF-8  <> MARKDOWN  1,242 WORDS │    │
└────────────┴─────────────────────────────────────────────┴────┘
```

### Key UI Features

- **Fluid navbar** — Floating, glass-effect navbar from mino.ink with pill-shaped active indicators
- **Split-pane editor** — Resizable panels (sidebar / note list / editor) using `react-resizable-panels`
- **Real-time markdown** — Live preview with syntax highlighting via `react-markdown` + `react-syntax-highlighter`
- **Command palette** — `Cmd+K` to search notes, run commands, switch servers (using `cmdk`)
- **File tree** — Collapsible folder tree with drag-and-drop reordering (using `@dnd-kit`)
- **AI chat panel** — Slide-out panel to chat with the AI organizer
- **Plugin marketplace** — Browse available plugins, one-click install, configure via UI
- **Server settings** — API keys, agent config, resource detection results — all visual, no terminal
- **Theme switching** — Dark/light mode with smooth transitions (using `next-themes`)
- **Status bar** — Sync status, word count, encoding, cursor position (inspired by VS Code)
- **Collaboration cursors** — Show other users' cursors in real-time (Yjs awareness)
- **Server picker** — Switch between multiple linked servers (for multi-server setups)

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
  name: string;            // "Personal", "Work", etc.
  endpoint: string;        // "https://my-server.com" or tunnel URL
  authToken: string;       // API key or JWT
  syncEnabled: boolean;
  lastSyncedAt: Date;
}
```

Users can switch between servers or view notes from all servers in a unified view.
