---
title: Search Notes
description: Full-text search with optional limit/folder filters.
---

# Search Notes

## Request

`GET /api/v1/search`

Query params:

- `q` (required)
- `limit` (optional, max 100)
- `folder` (optional)

## Example

```bash
curl "http://localhost:3000/api/v1/search?q=meeting&limit=10" \
  -H "X-Mino-Key: <API_KEY>"
```

## Response

Returns snippet-based ranked results from indexed notes.
