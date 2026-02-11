# Frontend

> Web app (mino.ink) and mobile apps (iOS & Android).

[← Back to docs](./README.md)

---

## The Web Interface (mino.ink)

### Page Structure

| Page | Path | Description |
|------|------|-------------|
| **Landing** | `/` | Marketing site with features, use cases, pricing |
| **Login** | `/login` | Email/password or Google OAuth |
| **Workspace** | `/w/:workspace` | Main editor + sidebar + note list |
| **Settings** | `/settings` | Server connection, theme, plugins, agent config |
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
- **Theme switching** — Dark/light mode with smooth transitions (using `next-themes`)
- **Status bar** — Sync status, word count, encoding, cursor position (inspired by VS Code)
- **Collaboration cursors** — Show other users' cursors in real-time (Yjs awareness)

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

### Multi-Server Support

The mobile app maintains a list of connected servers:

```typescript
interface ServerConfig {
  id: string;
  name: string;            // "Personal", "Work", etc.
  endpoint: string;        // "https://my-server.com"
  authToken: string;       // JWT or API key
  syncEnabled: boolean;
  lastSyncedAt: Date;
}
```

Users can switch between servers or view notes from all servers in a unified view.
