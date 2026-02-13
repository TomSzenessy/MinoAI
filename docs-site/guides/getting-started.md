---
title: Getting Started
description: End-to-end setup from deploy to linked workspace.
---

# Getting Started

Use this sequence for the least friction:

1. [Access Modes](/guides/access-modes)
2. [Portainer Stack Deployment](/deployment/portainer-stack)
3. [Linking and Auth Flow](/guides/linking-and-auth)
4. [Troubleshooting](/guides/troubleshooting)
5. [Setup Response Reference](/reference/setup-response)

## Deployment Checklist

- Docker is installed
- You can access `http://<SERVER_IP>:3000`
- You chose a connection mode:
  - `relay` (default)
  - `open-port`

## First Endpoint to Check

`GET /api/v1/system/setup`

This endpoint is public and drives first-run onboarding.

## Auth Header for Protected APIs

Use:

`X-Mino-Key: <api_key>`

Example:

```bash
curl http://<SERVER_IP>:3000/api/v1/system/capabilities \
  -H "X-Mino-Key: <API_KEY>"
```

## Local Build Path

If you are developing from source, use [Local Build](/guides/local-build).
