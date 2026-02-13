---
title: Authentication Security
description: Practical auth guidance for production and development.
---

# Authentication Security

## Use API Key Mode

Production recommendation:

`MINO_AUTH_MODE=api-key`

Protected routes require:

`X-Mino-Key: <API_KEY>`

## Setup Key Lifecycle

- first key is visible from `GET /api/v1/system/setup`
- after `POST /api/v1/auth/link`, setup is marked complete and key is redacted in setup payload

## Mode Notes

- `none`: development only
- `jwt`: currently not fully implemented in middleware

## Example

```bash
curl http://localhost:3000/api/v1/system/info \
  -H "X-Mino-Key: <API_KEY>"
```
