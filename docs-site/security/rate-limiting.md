---
title: Rate Limiting
description: Current defaults and tuning options.
---

# Rate Limiting

Rate limiting applies to `/api/*` routes except `GET /api/v1/health` and `OPTIONS`.

## Default Limits

- per-IP window max: `240`
- per-API-key window max: `480`
- per-IP concurrent max: `48`
- window: `60000ms`

## Headers

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- `Retry-After` (on 429)

## Env Overrides

- `MINO_RATE_LIMIT_ENABLED`
- `MINO_RATE_LIMIT_WINDOW_MS`
- `MINO_RATE_LIMIT_IP_MAX`
- `MINO_RATE_LIMIT_KEY_MAX`
- `MINO_RATE_LIMIT_CONCURRENT_IP`
