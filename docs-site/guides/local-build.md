---
title: Local Build
description: Build and run Mino from source for development.
---

# Local Build

## Prerequisites

- Bun 1.x
- Node + pnpm (workspace tooling)
- Docker (optional for image testing)

## Run Server from Source

```bash
bun install
cd packages/shared && bun run build
cd ../../apps/server && bun run dev
```

Server default URL:

`http://localhost:3000`

## Run Web Client

```bash
pnpm --filter @mino-ink/web dev
```

Open:

`http://localhost:5173/link`

## Run Mobile App (Expo)

```bash
pnpm --filter @mino-ink/mobile start
pnpm --filter @mino-ink/mobile ios
pnpm --filter @mino-ink/mobile android
```

## Full Workspace Validation

Use these commands from repo root:

```bash
pnpm install --no-frozen-lockfile
pnpm build
pnpm test
pnpm typecheck
```

Notes:

- `pnpm build` is orchestrated by Turborepo pinned to `2.4.0` in `package.json`.
- Mobile tests currently run with `jest --passWithNoTests` until dedicated mobile tests are added.

## Build Docker Image Locally

```bash
docker build -f docker/Dockerfile -t mino-server .
docker run --rm -p 3000:3000 -v mino-data:/data mino-server
```

## Validate Setup Payload

`http://localhost:3000/api/v1/system/setup`
