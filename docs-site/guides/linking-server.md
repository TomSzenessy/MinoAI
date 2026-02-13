---
title: Linking Server
description: Connect web/mobile clients to your server using setup links.
---

# Linking Server

The canonical onboarding entrypoint is:

`GET /api/v1/system/setup`

Use `data.links.connect.*` URLs from that payload for one-click linking.

## Client Types

- Hosted web client: `https://mino.ink`
- Hosted test client: `https://test.mino.ink`
- Built-in UI: `http://<SERVER_IP>:3000`
- Local web dev UI: `http://localhost:5173`
- Mobile app: Expo-based client using direct credentials flow

## Required Verify Step

Before storing a server profile, clients should verify:

`POST /api/v1/auth/verify` with `X-Mino-Key`

## Required Link Step

To complete first-run setup:

`POST /api/v1/auth/link` with `X-Mino-Key`

## Manual Fallback

If URL prefill is unavailable, enter:

- `serverUrl`
- `apiKey`

## Related

- [Linking and Auth](/guides/linking-and-auth)
- [Link Handler Spec](/reference/link-handler-spec)
