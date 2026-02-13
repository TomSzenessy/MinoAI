---
title: Setup Payload
description: First-run onboarding endpoint.
---

# Setup Payload

## Request

`GET /api/v1/system/setup`

## Purpose

Returns first-run bootstrap data:

- server identity
- API key (redacted after setup completion)
- pairing mode and relay code
- generated connect links

## Response Reference

See [Setup Response Reference](/reference/setup-response).
