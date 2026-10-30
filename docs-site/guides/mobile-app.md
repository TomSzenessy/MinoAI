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

### Release signing

`apps/mobile/scripts/build-android-apk.sh` generates a release keystore at build
time and writes the `MYAPP_UPLOAD_*` gradle properties into
`android/gradle.properties`. Neither the keystore nor those properties are
committed: both are gitignored, because a signing key in a public repository is
a compromised signing key.

Every generated key is a different signing identity, so a build signed with one
cannot be installed as an update over a build signed with another. For anything
you distribute, supply a stable keystore instead:

1. Generate it once, offline, and keep it out of the repository.
2. Put `MYAPP_UPLOAD_STORE_FILE`, `MYAPP_UPLOAD_KEY_ALIAS`,
   `MYAPP_UPLOAD_STORE_PASSWORD` and `MYAPP_UPLOAD_KEY_PASSWORD` in
   `~/.gradle/gradle.properties` (or as CI secrets), not in the project.
3. Keep the keystore and its password in two different places, and back the
   keystore up — losing it means a new package identity.
4. In CI, store it base64-encoded as `ANDROID_KEYSTORE_BASE64` next to
   `ANDROID_SIGNING_PASSWORD`; the build script restores it after
   `expo prebuild --clean` and reuses it instead of generating a new one.

If a key was ever committed, rotate it: generate a new keystore, update the
secret, and rebuild. On Google Play, reset the upload key for the app rather
than reusing the exposed one.
