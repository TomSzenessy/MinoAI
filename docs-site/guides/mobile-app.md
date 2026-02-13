---
title: Mobile App
description: Current mobile app capabilities and setup.
---

# Mobile App

The mobile client lives in `apps/mobile` and is built with React Native + Expo.

## Current Scope

- Keep-style card board home view
- Markdown note editor with preview
- Connect flow for relay pairing and direct credentials
- Local SQLite storage + sync queue
- Sync service with retry and best-effort Yjs/WebSocket hooks
- Settings for sync, appearance, and connection status

## Not Shipped Yet

- App Store / Play Store distribution
- Google sign-in
- Automatic multi-server discovery
- Full multi-server picker UX

## Run Locally

```bash
pnpm --filter @mino-ink/mobile start
pnpm --filter @mino-ink/mobile ios
pnpm --filter @mino-ink/mobile android
```

## React Version Strategy

Mino currently uses a deliberate split because of upstream platform requirements:

- Web (`apps/web`): React 19 (`Next.js 15`)
- Mobile (`apps/mobile`): React 18.3.1 (`Expo SDK 52`)

The workspace is configured so web and mobile React type packages are isolated from each other.

Future path:

- Upgrade mobile to Expo SDK 53+ and align both apps on React 19.

## Android APK Build

See:

- `apps/mobile/README.md`
- `.github/workflows/mobile-android-apk.yml`

Required env values include signing credentials, e.g.:

- `ANDROID_SIGNING_PASSWORD`
- `ANDROID_KEY_ALIAS`
