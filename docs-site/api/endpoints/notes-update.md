---
title: Update Note
description: Replace full note content.
---

# Update Note

## Request

`PUT /api/v1/notes/:path`

Body:

```json
{
  "content": "# Updated title\n\nUpdated body"
}
```

## Example

```bash
curl -X PUT http://localhost:3000/api/v1/notes/notes%2Fnew-note.md \
  -H "X-Mino-Key: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"content":"# Updated\\n\\nBody"}'
```

## Move/Rename

Use dedicated route for move/rename:

`PATCH /api/v1/notes/:path/move` with body `{ "path": "notes/new-path.md" }`.
