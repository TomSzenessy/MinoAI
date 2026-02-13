---
title: Security Best Practices
description: Operational hardening checklist for Mino deployments.
---

# Security Best Practices

## Auth

- keep `MINO_AUTH_MODE=api-key`
- never expose API keys in logs
- use `X-Mino-Key` exactly

## Network

- prefer relay mode if you do not need direct ingress
- if exposing directly, use HTTPS and reverse proxy hardening
- restrict CORS origins to trusted hosts

## Ops

- monitor `/api/v1/security/audit` regularly
- keep container images updated
- preserve and secure `/data` backups
- rotate relay pair code if onboarding links are leaked
