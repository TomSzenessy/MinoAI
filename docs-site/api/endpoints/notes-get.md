---
title: Get Note
description: Fetch one note by path.
---

# Get Note

## Request

`GET /api/v1/notes/:path`

Use URL-encoded path for nested files.

## Example

```bash
curl http://localhost:3000/api/v1/notes/notes%2Fproject%2Fplan.md \
  -H "X-Mino-Key: <API_KEY>"
```

## Response

```json
{
  "success": true,
  "data": {
    "path": "notes/project/plan.md",
    "title": "Plan",
    "tags": [],
    "links": [],
    "backlinks": [],
    "wordCount": 100,
    "createdAt": "2026-02-13T10:00:00.000Z",
    "updatedAt": "2026-02-13T10:00:00.000Z",
    "checksum": "...",
    "content": "# Plan\\n\\n...",
    "frontmatter": {}
  }
}
```
