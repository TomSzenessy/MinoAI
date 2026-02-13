---
title: API Introduction
description: Overview of Mino REST API surface.
---

# API Introduction

Base URL:

`http://<server>:3000/api/v1`

## Authentication

Protected endpoints require:

`X-Mino-Key: <API_KEY>`

Public endpoints include:

- `GET /health`
- `GET /system/setup`
- `POST /channels/webhook/:provider`

## Response Shape

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "..."
  }
}
```

## Key Endpoint Groups

- system: `/system/*`
- auth/linking: `/auth/*`
- notes: `/notes/*`
- folders: `/folders/tree*`
- search: `/search`
- plugins: `/plugins/*`
- agent: `/agent/*`
- channels: `/channels/*`
- security: `/security/*`
