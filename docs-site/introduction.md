---
title: Introduction
description: Mino is a self-hosted, agent-first markdown knowledge platform.
---

# Introduction

Mino is a self-hosted, agent-first markdown knowledge platform.

Your notes stay on your own server as plain `.md` files, while web/mobile clients connect using server-issued credentials.

## What Mino Includes

- `@mino-ink/server`: Bun + Hono API server with built-in web UI hosting
- `@mino-ink/web`: Next.js web client (hosted or self-hosted)
- `@mino-ink/mobile`: Expo app for iOS and Android
- `@mino-ink/relay`: optional relay for private servers without open inbound ports

## Connection Model

- **Relay mode (default):** server opens outbound connection to relay, clients pair with relay code
- **Open-port mode:** clients connect directly to your public server URL
- **Local-only:** use built-in UI at `http://localhost:3000`

## Start Here

1. [Quickstart](/quickstart)
2. [Access Modes](/guides/access-modes)
3. [Portainer Stack Deployment](/deployment/portainer-stack)
4. [Linking and Auth Flow](/guides/linking-and-auth)
