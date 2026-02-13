---
title: Security Overview
description: Security model and operational checklist.
---

# Security Overview

## Core Controls

- API key authentication (`X-Mino-Key`)
- rate limiting middleware on `/api/*`
- CORS allowlist configuration
- optional HTTPS via tunnel/reverse proxy
- security audit endpoints

## Quick Audit

```bash
curl http://localhost:3000/api/v1/security/audit \
  -H "X-Mino-Key: <API_KEY>"
```

## Recommended Baseline

- keep `MINO_AUTH_MODE=api-key`
- restrict `MINO_CORS_ORIGINS`
- use HTTPS for remote access
- rotate relay pair codes when needed
- keep images updated (`MINO_IMAGE_TAG` + Watchtower strategy)
