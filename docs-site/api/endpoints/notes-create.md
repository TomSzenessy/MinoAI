---
title: Create Note
description: Create a new markdown note at a target path.
---

# Create Note

## Request

`POST /api/v1/notes`

Body:

```json
{
  "path": "notes/new-note.md",
  "content": "# New Note\n\nHello"
}
```

## Example

```bash
curl -X POST http://localhost:3000/api/v1/notes \
  -H "X-Mino-Key: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"path":"notes/new-note.md","content":"# New Note\\n\\nHello"}'
```

Returns `201` on success.
