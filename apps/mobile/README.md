# Mino Mobile App

React Native + Expo client for Mino, built around a Google Keep-style card board and offline-first sync.

## Current Scope

- Keep-style 2-column note board (`app/index.tsx`)
- Mobile note editor with markdown preview (`app/editor.tsx`)
- Relay pairing + direct server credential connect flow (`app/connect.tsx`)
- Settings for sync, appearance, and connection state (`app/settings.tsx`)
- SQLite local storage + sync queue (`src/services/database.ts`)
- HTTP push/pull sync engine with retry queue and best-effort Yjs/WebSocket hooks (`src/services/sync.ts`)
- Single active server connection model (`serverConnection` in settings store)

Planned but not shipped:

- Google sign-in and automatic multi-server discovery
- Multi-server picker / unified cross-server view

## Run Locally

```bash
pnpm install
pnpm --filter @mino-ink/mobile start
pnpm --filter @mino-ink/mobile ios
pnpm --filter @mino-ink/mobile android
```

## Version Compatibility

Current workspace versions are intentionally split:

- Web (`apps/web`): React 19 (required by Next.js 15)
- Mobile (`apps/mobile`): React 18.3.1 (required by Expo SDK 52)

This is expected and supported in this repo. TypeScript resolution is scoped per app so React type packages do not conflict across web/mobile.

Planned convergence path:

- Upgrade mobile to Expo SDK 53+ and move mobile to React 19

## Build Android APK (Local + CI)

1. Configure signing credentials:

- Local: add to repo-root `.env`
- GitHub Actions: add repository secrets
  - `ANDROID_SIGNING_PASSWORD` (required)
  - `ANDROID_KEY_ALIAS` (optional, defaults to `mino-release`)

```bash
ANDROID_SIGNING_PASSWORD="<your-strong-password>"
ANDROID_KEY_ALIAS="mino-release"
```

2. Build both debug + release APK:

```bash
bash apps/mobile/scripts/build-android-apk.sh
```

3. CI workflow:
- GitHub Action: `.github/workflows/mobile-android-apk.yml`
- Uses GitHub Secrets for signing credentials (no hardcoded password)
- Uploads:
  - `app-debug.apk`
  - `app-release.apk`

## Project Layout

```text
apps/mobile/
  app/
    _layout.tsx
    index.tsx
    editor.tsx
    connect.tsx
    settings.tsx
  src/
    components/
    services/
    stores/
    theme/
    types/
```
