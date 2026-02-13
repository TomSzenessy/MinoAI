---
title: Web Link Flow
description: Frontend `/link` route behavior and client-to-server contract.
---

# Web Link Flow

This runbook describes the implemented `/link` flow in `apps/web`.

## Supported Inputs

- direct: `serverUrl` + `apiKey`
- relay: `relayCode` + optional `relayUrl`

## Behavior

1. Parse URL params
2. Exchange relay code when provided
3. Normalize `serverUrl`
4. Verify key via `POST /api/v1/auth/verify`
5. Mark setup complete via `POST /api/v1/auth/link`
6. Persist linked server profile (`mino.linkedServers.v1`)
7. Remove sensitive params from URL
8. Redirect to workspace

## Security Requirements

- do not log raw API keys
- redact key material in errors/telemetry
- remove `apiKey`, `relayCode`, and `relayUrl` from URL after processing

## Reference Spec

- [Link Handler Spec](/reference/link-handler-spec)
