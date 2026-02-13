---
title: List Notes
description: Return note metadata for all notes.
---

# List Notes

## Request

`GET /api/v1/notes`

No query parameters are currently supported on this route.

## Example

```bash
curl http://localhost:3000/api/v1/notes \
  -H "X-Mino-Key: <API_KEY>"
```

## Response

```json
{
  "success": true,
  "data": [
    {
      "path": "notes/my-note.md",
      "title": "My Note",
      "tags": ["work"],
      "links": [],
      "backlinks": [],
      "wordCount": 42,
      "createdAt": "2026-02-13T10:00:00.000Z",
      "updatedAt": "2026-02-13T10:00:00.000Z",
      "checksum": "..."
    }
  ]
}
```
