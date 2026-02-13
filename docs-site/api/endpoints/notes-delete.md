---
title: Delete Note
description: Permanently delete a note.
---

# Delete Note

## Request

`DELETE /api/v1/notes/:path`

## Example

```bash
curl -X DELETE http://localhost:3000/api/v1/notes/notes%2Fold.md \
  -H "X-Mino-Key: <API_KEY>"
```

## Response

```json
{
  "success": true,
  "data": {
    "deleted": "notes/old.md"
  }
}
```

Deletion is permanent.
